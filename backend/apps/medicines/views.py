"""
Medicine API views.

Endpoints (all under /api/v1/medicines/):
  GET    /                   → list (search, filter, paginate)
  POST   /                   → create
  GET    /{id}/              → detail
  PUT    /{id}/              → full update
  PATCH  /{id}/              → partial update
  DELETE /{id}/              → soft-delete (is_active=False)
  GET    /low-stock/         → medicines at or below reorder level
  GET    /expiring/          → medicines expiring within 30 days
  GET    /barcode/{barcode}/ → lookup by barcode
  POST   /bulk-import/       → import from Excel file
"""
import io
import logging
from decimal import Decimal, InvalidOperation

from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import status, filters
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.viewsets import ViewSet
from django_filters.rest_framework import DjangoFilterBackend

from apps.authentication.permissions import IsAdminOrInventoryManager, IsAdminOrPharmacist
from utils.pagination import StandardResultsSetPagination
from .filters import MedicineFilter
from .models import Medicine
from .serializers import (
    MedicineListSerializer,
    MedicineDetailSerializer,
    MedicineWriteSerializer,
    MedicineBulkImportSerializer,
)

logger = logging.getLogger(__name__)

EXCEL_COLUMNS = [
    "name", "generic_name", "brand_name", "category", "manufacturer",
    "barcode", "batch_number", "purchase_price", "selling_price", "mrp",
    "gst_percentage", "hsn_code", "reorder_level", "unit",
    "manufacturing_date", "expiry_date", "is_prescription", "notes",
]


class MedicineViewSet(ViewSet):
    """
    Full CRUD + utility actions for the Medicine resource.
    Uses manual dispatch so each action can have its own permission set.
    """

    pagination_class = StandardResultsSetPagination

    def _paginate(self, request, queryset, serializer_class):
        paginator = self.pagination_class()
        page = paginator.paginate_queryset(queryset, request)
        if page is not None:
            data = serializer_class(page, many=True).data
            return paginator.get_paginated_response(data)
        return Response({"success": True, "data": serializer_class(queryset, many=True).data})

    # ── LIST ──────────────────────────────────────────────────────────────────
    def list(self, request):
        self.permission_classes = [IsAuthenticated]
        self.check_permissions(request)

        qs = Medicine.objects.all()

        # Search
        search = request.query_params.get("search", "")
        if search:
            from django.db.models import Q
            qs = qs.filter(
                Q(name__icontains=search) |
                Q(generic_name__icontains=search) |
                Q(brand_name__icontains=search) |
                Q(barcode__icontains=search) |
                Q(manufacturer__icontains=search)
            )

        # Filters
        filterset = MedicineFilter(request.query_params, queryset=qs)
        if filterset.is_valid():
            qs = filterset.qs

        # Ordering
        ordering = request.query_params.get("ordering", "name")
        allowed_orderings = {
            "name", "-name", "expiry_date", "-expiry_date",
            "stock_quantity", "-stock_quantity", "selling_price", "-selling_price",
            "created_at", "-created_at",
        }
        if ordering in allowed_orderings:
            qs = qs.order_by(ordering)

        return self._paginate(request, qs, MedicineListSerializer)

    # ── CREATE ────────────────────────────────────────────────────────────────
    def create(self, request):
        self.permission_classes = [IsAuthenticated, IsAdminOrInventoryManager]
        self.check_permissions(request)

        serializer = MedicineWriteSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        medicine = serializer.save()
        return Response(
            {"success": True, "data": MedicineDetailSerializer(medicine).data},
            status=status.HTTP_201_CREATED,
        )

    # ── RETRIEVE ──────────────────────────────────────────────────────────────
    def retrieve(self, request, pk=None):
        self.permission_classes = [IsAuthenticated]
        self.check_permissions(request)
        medicine = get_object_or_404(Medicine, pk=pk)
        return Response({"success": True, "data": MedicineDetailSerializer(medicine).data})

    # ── UPDATE ────────────────────────────────────────────────────────────────
    def update(self, request, pk=None):
        self.permission_classes = [IsAuthenticated, IsAdminOrInventoryManager]
        self.check_permissions(request)
        medicine = get_object_or_404(Medicine, pk=pk)
        serializer = MedicineWriteSerializer(medicine, data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"success": True, "data": MedicineDetailSerializer(medicine).data})

    def partial_update(self, request, pk=None):
        self.permission_classes = [IsAuthenticated, IsAdminOrInventoryManager]
        self.check_permissions(request)
        medicine = get_object_or_404(Medicine, pk=pk)
        serializer = MedicineWriteSerializer(medicine, data=request.data, partial=True, context={"request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"success": True, "data": MedicineDetailSerializer(medicine).data})

    # ── SOFT DELETE ───────────────────────────────────────────────────────────
    def destroy(self, request, pk=None):
        self.permission_classes = [IsAuthenticated, IsAdminOrInventoryManager]
        self.check_permissions(request)
        medicine = get_object_or_404(Medicine, pk=pk)
        medicine.is_active = False
        medicine.save(update_fields=["is_active", "updated_at"])
        return Response({"success": True, "message": "Medicine deactivated."})

    # ── LOW STOCK ─────────────────────────────────────────────────────────────
    @action(detail=False, methods=["get"], url_path="low-stock")
    def low_stock(self, request):
        self.permission_classes = [IsAuthenticated]
        self.check_permissions(request)
        qs = Medicine.objects.low_stock()
        return self._paginate(request, qs, MedicineListSerializer)

    # ── EXPIRING SOON ─────────────────────────────────────────────────────────
    @action(detail=False, methods=["get"], url_path="expiring")
    def expiring(self, request):
        self.permission_classes = [IsAuthenticated]
        self.check_permissions(request)
        days = int(request.query_params.get("days", 30))
        qs = Medicine.objects.expiring_soon(days=days)
        return self._paginate(request, qs, MedicineListSerializer)

    # ── BARCODE LOOKUP ────────────────────────────────────────────────────────
    @action(detail=False, methods=["get"], url_path="barcode/(?P<barcode>[^/.]+)")
    def barcode_lookup(self, request, barcode=None):
        self.permission_classes = [IsAuthenticated]
        self.check_permissions(request)
        medicine = get_object_or_404(Medicine, barcode=barcode, is_active=True)
        return Response({"success": True, "data": MedicineDetailSerializer(medicine).data})

    # ── BULK IMPORT ───────────────────────────────────────────────────────────
    @action(
        detail=False,
        methods=["post"],
        url_path="bulk-import",
        parser_classes=[MultiPartParser, FormParser],
    )
    def bulk_import(self, request):
        self.permission_classes = [IsAuthenticated, IsAdminOrInventoryManager]
        self.check_permissions(request)

        serializer = MedicineBulkImportSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        file = serializer.validated_data["file"]

        try:
            import openpyxl
            wb = openpyxl.load_workbook(io.BytesIO(file.read()), read_only=True, data_only=True)
            ws = wb.active

            rows = list(ws.iter_rows(values_only=True))
            if not rows:
                return Response(
                    {"success": False, "error": {"code": "BAD_REQUEST", "message": "Empty file.", "details": {}}},
                    status=status.HTTP_400_BAD_REQUEST,
                )

            # Detect header row
            header = [str(c).strip().lower().replace(" ", "_") if c else "" for c in rows[0]]
            data_rows = rows[1:]

            created, skipped, errors = [], [], []

            with transaction.atomic():
                for idx, row in enumerate(data_rows, start=2):
                    row_data = dict(zip(header, row))
                    try:
                        medicine_data = {
                            "name":               str(row_data.get("name", "") or "").strip(),
                            "generic_name":       str(row_data.get("generic_name", "") or "").strip(),
                            "brand_name":         str(row_data.get("brand_name", "") or "").strip(),
                            "category":           str(row_data.get("category", "OTHER") or "OTHER").upper(),
                            "manufacturer":       str(row_data.get("manufacturer", "") or "").strip(),
                            "barcode":            str(row_data.get("barcode", "") or "").strip() or None,
                            "batch_number":       str(row_data.get("batch_number", "") or "").strip(),
                            "purchase_price":     Decimal(str(row_data.get("purchase_price", 0) or 0)),
                            "selling_price":      Decimal(str(row_data.get("selling_price", 0) or 0)),
                            "mrp":                Decimal(str(row_data.get("mrp", 0) or 0)),
                            "gst_percentage":     Decimal(str(row_data.get("gst_percentage", 0) or 0)),
                            "hsn_code":           str(row_data.get("hsn_code", "") or "").strip(),
                            "reorder_level":      int(row_data.get("reorder_level", 10) or 10),
                            "unit":               str(row_data.get("unit", "Strip") or "Strip").strip(),
                            "is_prescription":    str(row_data.get("is_prescription", "")).lower() in ("yes", "true", "1"),
                            "notes":              str(row_data.get("notes", "") or "").strip(),
                            "created_by":         request.user,
                        }

                        if not medicine_data["name"]:
                            errors.append({"row": idx, "error": "Name is required."})
                            continue

                        # Handle dates
                        for date_field in ("manufacturing_date", "expiry_date"):
                            val = row_data.get(date_field)
                            if val:
                                from datetime import date
                                if isinstance(val, date):
                                    medicine_data[date_field] = val
                                else:
                                    from dateutil.parser import parse as parse_date
                                    medicine_data[date_field] = parse_date(str(val)).date()

                        # Skip duplicates by barcode
                        barcode = medicine_data.get("barcode")
                        if barcode and Medicine.objects.filter(barcode=barcode).exists():
                            skipped.append({"row": idx, "name": medicine_data["name"], "reason": "Duplicate barcode"})
                            continue

                        med = Medicine.objects.create(**medicine_data)
                        created.append(med.name)

                    except (InvalidOperation, ValueError, Exception) as e:
                        errors.append({"row": idx, "error": str(e)})

            return Response({
                "success": True,
                "data": {
                    "created": len(created),
                    "skipped": len(skipped),
                    "errors":  len(errors),
                    "error_details": errors[:20],
                },
            }, status=status.HTTP_200_OK)

        except Exception as e:
            logger.exception("Bulk import failed")
            return Response(
                {"success": False, "error": {"code": "BAD_REQUEST", "message": str(e), "details": {}}},
                status=status.HTTP_400_BAD_REQUEST,
            )
