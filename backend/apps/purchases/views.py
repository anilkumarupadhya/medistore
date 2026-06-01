from django.db import transaction
from django.db.models import Q
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from apps.medicines.models import Medicine
from apps.inventory.models import InventoryTransaction, TxType
from .models import PurchaseOrder, PurchaseStatus, PaymentStatus
from .serializers import (
    PurchaseOrderListSerializer,
    PurchaseOrderDetailSerializer,
    PurchaseOrderWriteSerializer,
    GRNReceiveSerializer,
)

WRITE_ROLES = ('ADMIN', 'INVENTORY_MANAGER')


def _err(code, message, details=None):
    body = {'success': False, 'error': {'code': code, 'message': message}}
    if details:
        body['error']['details'] = details
    return body


class PurchaseOrderListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = PurchaseOrder.objects.select_related('supplier').prefetch_related('items')

        search = request.query_params.get('search', '').strip()
        if search:
            qs = qs.filter(
                Q(po_number__icontains=search) |
                Q(supplier__name__icontains=search) |
                Q(invoice_number__icontains=search)
            )

        po_status = request.query_params.get('status')
        if po_status:
            qs = qs.filter(status=po_status)

        supplier_id = request.query_params.get('supplier_id')
        if supplier_id:
            qs = qs.filter(supplier_id=supplier_id)

        date_from = request.query_params.get('date_from')
        date_to   = request.query_params.get('date_to')
        if date_from:
            qs = qs.filter(created_at__date__gte=date_from)
        if date_to:
            qs = qs.filter(created_at__date__lte=date_to)

        try:
            page      = max(1, int(request.query_params.get('page', 1)))
            page_size = min(100, int(request.query_params.get('page_size', 20)))
        except ValueError:
            page, page_size = 1, 20

        total  = qs.count()
        offset = (page - 1) * page_size

        return Response({'success': True, 'data': {
            'count':     total,
            'page':      page,
            'page_size': page_size,
            'results':   PurchaseOrderListSerializer(qs[offset: offset + page_size], many=True).data,
        }})

    def post(self, request):
        if request.user.role not in WRITE_ROLES:
            return Response(_err('FORBIDDEN', 'Insufficient permissions'), status=403)
        serializer = PurchaseOrderWriteSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            po = serializer.save()
            return Response(
                {'success': True, 'data': PurchaseOrderDetailSerializer(po).data},
                status=status.HTTP_201_CREATED,
            )
        return Response(_err('VALIDATION_ERROR', 'Invalid data', serializer.errors), status=400)


class PurchaseOrderDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def _get_po(self, pk):
        try:
            return PurchaseOrder.objects.select_related('supplier', 'created_by').prefetch_related(
                'items__medicine'
            ).get(pk=pk)
        except PurchaseOrder.DoesNotExist:
            return None

    def get(self, request, pk):
        po = self._get_po(pk)
        if not po:
            return Response(_err('NOT_FOUND', 'Purchase order not found'), status=404)
        return Response({'success': True, 'data': PurchaseOrderDetailSerializer(po).data})

    def put(self, request, pk):
        return self._update(request, pk, partial=False)

    def patch(self, request, pk):
        return self._update(request, pk, partial=True)

    def _update(self, request, pk, partial):
        if request.user.role not in WRITE_ROLES:
            return Response(_err('FORBIDDEN', 'Insufficient permissions'), status=403)
        po = self._get_po(pk)
        if not po:
            return Response(_err('NOT_FOUND', 'Purchase order not found'), status=404)
        if po.status in (PurchaseStatus.RECEIVED, PurchaseStatus.CANCELLED):
            return Response(_err('CONFLICT', f'Cannot edit a {po.status.lower()} order'), status=409)
        serializer = PurchaseOrderWriteSerializer(po, data=request.data, partial=partial, context={'request': request})
        if serializer.is_valid():
            po = serializer.save()
            return Response({'success': True, 'data': PurchaseOrderDetailSerializer(po).data})
        return Response(_err('VALIDATION_ERROR', 'Invalid data', serializer.errors), status=400)

    def delete(self, request, pk):
        if request.user.role not in WRITE_ROLES:
            return Response(_err('FORBIDDEN', 'Insufficient permissions'), status=403)
        po = self._get_po(pk)
        if not po:
            return Response(_err('NOT_FOUND', 'Purchase order not found'), status=404)
        if po.status == PurchaseStatus.RECEIVED:
            return Response(_err('CONFLICT', 'Cannot cancel a received order'), status=409)
        po.status = PurchaseStatus.CANCELLED
        po.save(update_fields=['status', 'updated_at'])
        return Response({'success': True, 'data': {'detail': 'Purchase order cancelled'}})


class PurchaseOrderReceiveView(APIView):
    """POST /purchases/{id}/receive/ — GRN: stock-in all items atomically."""
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        if request.user.role not in WRITE_ROLES:
            return Response(_err('FORBIDDEN', 'Insufficient permissions'), status=403)

        try:
            po = PurchaseOrder.objects.select_related('supplier').prefetch_related(
                'items__medicine'
            ).get(pk=pk)
        except PurchaseOrder.DoesNotExist:
            return Response(_err('NOT_FOUND', 'Purchase order not found'), status=404)

        if po.status in (PurchaseStatus.RECEIVED, PurchaseStatus.CANCELLED):
            return Response(_err('CONFLICT', f'Order is already {po.status.lower()}'), status=409)

        serializer = GRNReceiveSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(_err('VALIDATION_ERROR', 'Invalid data', serializer.errors), status=400)

        data = serializer.validated_data

        with transaction.atomic():
            for item in po.items.select_related('medicine').all():
                medicine = Medicine.objects.select_for_update().get(pk=item.medicine_id)

                qty_before = medicine.stock_quantity
                qty_after  = qty_before + item.quantity + item.free_quantity

                InventoryTransaction.objects.create(
                    medicine        = medicine,
                    tx_type         = TxType.STOCK_IN,
                    quantity        = item.quantity + item.free_quantity,
                    quantity_before = qty_before,
                    quantity_after  = qty_after,
                    batch_number    = item.batch_number,
                    expiry_date     = item.expiry_date,
                    purchase_price  = item.purchase_price,
                    selling_price   = item.selling_price,
                    reference_type  = 'PURCHASE',
                    reference_id    = po.id,
                    reason          = f'GRN against {po.po_number}',
                    created_by      = request.user,
                )

                medicine.stock_quantity = qty_after
                medicine.purchase_price = item.purchase_price
                medicine.selling_price  = item.selling_price
                medicine.mrp            = item.mrp
                if item.batch_number:
                    medicine.batch_number = item.batch_number
                if item.expiry_date:
                    medicine.expiry_date = item.expiry_date
                medicine.save(update_fields=[
                    'stock_quantity', 'purchase_price', 'selling_price', 'mrp',
                    'batch_number', 'expiry_date', 'updated_at',
                ])

            if data.get('invoice_number'):
                po.invoice_number = data['invoice_number']
            if data.get('invoice_date'):
                po.invoice_date = data['invoice_date']
            if data.get('amount_paid') is not None:
                po.amount_paid = data['amount_paid']
            if data.get('payment_method'):
                po.payment_method = data['payment_method']
            if data.get('notes'):
                po.notes = data['notes']

            po.status      = PurchaseStatus.RECEIVED
            po.received_at = timezone.now()

            paid  = float(po.amount_paid)
            total = float(po.total_amount)
            if paid <= 0:
                po.payment_status = PaymentStatus.PENDING
            elif paid < total:
                po.payment_status = PaymentStatus.PARTIAL
            else:
                po.payment_status = PaymentStatus.PAID

            po.save()

        po.refresh_from_db()
        return Response({'success': True, 'data': PurchaseOrderDetailSerializer(po).data})


class PurchaseOrderSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        from django.db.models import Count, Sum
        qs  = PurchaseOrder.objects.all()
        agg = qs.aggregate(total_orders=Count('id'), total_value=Sum('total_amount'))
        by_status = {
            s: qs.filter(status=s).count()
            for s in ('DRAFT', 'ORDERED', 'PARTIALLY_RECEIVED', 'RECEIVED', 'CANCELLED')
        }
        return Response({'success': True, 'data': {
            'total_orders':  agg['total_orders'] or 0,
            'total_value':   float(agg['total_value'] or 0),
            'by_status':     by_status,
            'pending_count': by_status['DRAFT'] + by_status['ORDERED'] + by_status['PARTIALLY_RECEIVED'],
        }})
