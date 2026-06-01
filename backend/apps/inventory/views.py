"""
Inventory API views.

Endpoints (all under /api/v1/inventory/):
  GET  /transactions/              → list all transactions (paginated, filterable)
  POST /transactions/              → create stock-in / stock-out / adjustment
  GET  /transactions/{id}/        → detail
  GET  /medicine/{medicine_id}/history/ → all transactions for one medicine
  GET  /summary/                  → stock summary stats
"""
import logging
from django.db import transaction
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework.generics import ListAPIView, RetrieveAPIView

from apps.authentication.permissions import IsAdminOrInventoryManager
from apps.medicines.models import Medicine
from apps.medicines.serializers import MedicineListSerializer
from utils.pagination import StandardResultsSetPagination
from .models import InventoryTransaction, TxType
from .serializers import InventoryTransactionSerializer, StockTransactionCreateSerializer

logger = logging.getLogger(__name__)

# tx_types that INCREASE stock
STOCK_IN_TYPES  = {TxType.STOCK_IN, TxType.RETURN}
# tx_types that DECREASE stock
STOCK_OUT_TYPES = {TxType.STOCK_OUT, TxType.EXPIRED, TxType.DAMAGED}


class TransactionListCreateView(APIView):
    """
    GET  → List inventory transactions (with filters).
    POST → Create a new transaction (atomically updates medicine stock).
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = InventoryTransaction.objects.select_related("medicine", "created_by").all()

        # Filters
        tx_type     = request.query_params.get("tx_type")
        medicine_id = request.query_params.get("medicine_id")
        date_from   = request.query_params.get("date_from")
        date_to     = request.query_params.get("date_to")

        if tx_type:
            qs = qs.filter(tx_type=tx_type)
        if medicine_id:
            qs = qs.filter(medicine_id=medicine_id)
        if date_from:
            qs = qs.filter(created_at__date__gte=date_from)
        if date_to:
            qs = qs.filter(created_at__date__lte=date_to)

        paginator = StandardResultsSetPagination()
        page = paginator.paginate_queryset(qs, request)
        if page is not None:
            data = InventoryTransactionSerializer(page, many=True).data
            return paginator.get_paginated_response(data)
        return Response({"success": True, "data": InventoryTransactionSerializer(qs, many=True).data})

    def post(self, request):
        # Inventory writes require Admin or Inventory Manager
        if not (request.user.role in ("ADMIN", "INVENTORY_MANAGER")):
            return Response(
                {"success": False, "error": {"code": "FORBIDDEN", "message": "Insufficient permissions.", "details": {}}},
                status=status.HTTP_403_FORBIDDEN,
            )

        serializer = StockTransactionCreateSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data

        try:
            tx = _create_transaction(data, request.user)
        except ValueError as e:
            return Response(
                {"success": False, "error": {"code": "BAD_REQUEST", "message": str(e), "details": {}}},
                status=status.HTTP_400_BAD_REQUEST,
            )

        return Response(
            {"success": True, "data": InventoryTransactionSerializer(tx).data},
            status=status.HTTP_201_CREATED,
        )


class TransactionDetailView(RetrieveAPIView):
    permission_classes = [IsAuthenticated]
    serializer_class   = InventoryTransactionSerializer
    queryset           = InventoryTransaction.objects.select_related("medicine", "created_by")

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        return Response({"success": True, "data": self.get_serializer(instance).data})


class MedicineHistoryView(APIView):
    """All transactions for a single medicine, newest first."""
    permission_classes = [IsAuthenticated]

    def get(self, request, medicine_id):
        medicine = get_object_or_404(Medicine, pk=medicine_id)
        qs = InventoryTransaction.objects.filter(medicine=medicine).select_related("created_by")

        paginator = StandardResultsSetPagination()
        page = paginator.paginate_queryset(qs, request)
        if page is not None:
            data = InventoryTransactionSerializer(page, many=True).data
            return paginator.get_paginated_response(data)
        return Response({
            "success": True,
            "medicine": MedicineListSerializer(medicine).data,
            "data": InventoryTransactionSerializer(qs, many=True).data,
        })


class InventorySummaryView(APIView):
    """Dashboard-style inventory stats."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from django.db.models import Sum, Count, F

        total_medicines  = Medicine.objects.active().count()
        low_stock_count  = Medicine.objects.low_stock().count()
        expiring_count   = Medicine.objects.expiring_soon(30).count()
        out_of_stock     = Medicine.objects.active().filter(stock_quantity=0).count()

        # Total stock value = sum(stock_quantity * purchase_price)
        stock_value = Medicine.objects.active().aggregate(
            value=Sum(F("stock_quantity") * F("purchase_price"))
        )["value"] or 0

        low_stock_medicines = MedicineListSerializer(
            Medicine.objects.low_stock()[:10], many=True
        ).data

        expiring_medicines = MedicineListSerializer(
            Medicine.objects.expiring_soon(30).order_by("expiry_date")[:10], many=True
        ).data

        return Response({
            "success": True,
            "data": {
                "total_medicines":     total_medicines,
                "low_stock_count":     low_stock_count,
                "expiring_soon_count": expiring_count,
                "out_of_stock_count":  out_of_stock,
                "total_stock_value":   round(float(stock_value), 2),
                "low_stock_medicines": low_stock_medicines,
                "expiring_medicines":  expiring_medicines,
            },
        })


# ─── Atomic stock helper ──────────────────────────────────────────────────────

@transaction.atomic
def _create_transaction(data: dict, user) -> InventoryTransaction:
    """
    Atomically:
      1. Lock the medicine row (SELECT FOR UPDATE)
      2. Validate sufficient stock for outbound movements
      3. Calculate new stock quantity
      4. Create the InventoryTransaction record
      5. Update medicine.stock_quantity
    """
    medicine = Medicine.objects.select_for_update().get(pk=data["medicine_id"])

    if not medicine.is_active:
        raise ValueError("Cannot transact on an inactive medicine.")

    tx_type  = data["tx_type"]
    quantity = data["quantity"]
    qty_before = medicine.stock_quantity

    if tx_type in STOCK_IN_TYPES:
        qty_after = qty_before + quantity
    elif tx_type in STOCK_OUT_TYPES:
        if qty_before < quantity:
            raise ValueError(
                f"Insufficient stock. Available: {qty_before}, Requested: {quantity}."
            )
        qty_after = qty_before - quantity
    elif tx_type == TxType.ADJUSTMENT:
        # For ADJUSTMENT, quantity can be +ve or -ve; we store abs and tx_type
        # Here quantity is always positive; direction implied by reason/context
        # We treat ADJUSTMENT as setting a new absolute value if quantity is provided
        # Convention: positive quantity = add, negative reason = reduce
        qty_after = max(0, qty_before + quantity)
    else:
        qty_after = qty_before

    tx = InventoryTransaction.objects.create(
        medicine        = medicine,
        tx_type         = tx_type,
        quantity        = quantity,
        quantity_before = qty_before,
        quantity_after  = qty_after,
        batch_number    = data.get("batch_number", ""),
        expiry_date     = data.get("expiry_date"),
        purchase_price  = data.get("purchase_price"),
        selling_price   = data.get("selling_price"),
        reason          = data.get("reason", ""),
        created_by      = user,
    )

    medicine.stock_quantity = qty_after
    medicine.save(update_fields=["stock_quantity", "updated_at"])

    return tx
