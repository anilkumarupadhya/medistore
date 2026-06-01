from django.db import transaction
from django.db.models import Q, Sum
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from apps.medicines.models import Medicine
from apps.inventory.models import InventoryTransaction, TxType
from apps.customers.models import Customer
from .models import Sale, SaleItem, PaymentStatus
from .serializers import (
    SaleListSerializer, SaleDetailSerializer, SaleCreateSerializer,
)

WRITE_ROLES = ('ADMIN', 'PHARMACIST', 'CASHIER', 'INVENTORY_MANAGER')


def _err(code, message, details=None):
    return {'success': False, 'error': {'code': code, 'message': message, 'details': details or {}}}


@transaction.atomic
def _create_sale(data: dict, user) -> Sale:
    """Atomically create sale + STOCK_OUT transactions for each item."""

    # Resolve customer
    customer = None
    cid = data.get('customer_id')
    if cid:
        try:
            customer = Customer.objects.get(pk=cid, is_active=True)
        except Customer.DoesNotExist:
            raise ValueError('Customer not found or inactive.')

    # Validate + lock all medicines up-front
    item_data_list = data['items']
    medicine_map = {}
    for item in item_data_list:
        mid = str(item['medicine_id'])
        if mid not in medicine_map:
            try:
                med = Medicine.objects.select_for_update().get(pk=mid)
            except Medicine.DoesNotExist:
                raise ValueError(f'Medicine {mid} not found.')
            if not med.is_active:
                raise ValueError(f'"{med.name}" is inactive and cannot be sold.')
            medicine_map[mid] = med

    # Check stock for aggregated quantities
    qty_needed = {}
    for item in item_data_list:
        mid = str(item['medicine_id'])
        qty_needed[mid] = qty_needed.get(mid, 0) + item['quantity']

    for mid, qty in qty_needed.items():
        med = medicine_map[mid]
        if med.stock_quantity < qty:
            raise ValueError(
                f'Insufficient stock for "{med.name}". '
                f'Available: {med.stock_quantity}, Requested: {qty}.'
            )

    # Create Sale header
    sale = Sale.objects.create(
        customer=customer,
        discount_amount=data.get('discount_amount', 0),
        amount_paid=data['amount_paid'],
        payment_method=data.get('payment_method', 'CASH'),
        notes=data.get('notes', ''),
        created_by=user,
    )

    subtotal   = 0.0
    tax_total  = 0.0

    # Create items + STOCK_OUT transactions
    for item in item_data_list:
        mid        = str(item['medicine_id'])
        med        = medicine_map[mid]
        qty        = item['quantity']
        disc_pct   = float(item.get('discount_pct', 0))
        unit_price = float(item.get('unit_price') or med.selling_price)
        gst_pct    = float(med.gst_percentage)

        base_price     = unit_price * qty
        disc_amt       = round(base_price * disc_pct / 100, 2)
        taxable        = base_price - disc_amt
        gst_amt        = round(taxable * gst_pct / 100, 2)
        total_amt      = round(taxable + gst_amt, 2)

        subtotal  += taxable
        tax_total += gst_amt

        SaleItem.objects.create(
            sale=sale,
            medicine=med,
            batch_number=med.batch_number,
            expiry_date=med.expiry_date,
            quantity=qty,
            unit_price=unit_price,
            mrp=float(med.mrp),
            discount_pct=disc_pct,
            discount_amount=disc_amt,
            gst_percentage=gst_pct,
            gst_amount=gst_amt,
            total_amount=total_amt,
        )

        # STOCK_OUT transaction
        qty_before = med.stock_quantity
        qty_after  = qty_before - qty
        InventoryTransaction.objects.create(
            medicine=med,
            tx_type=TxType.STOCK_OUT,
            quantity=qty,
            quantity_before=qty_before,
            quantity_after=qty_after,
            batch_number=med.batch_number or '',
            expiry_date=med.expiry_date,
            selling_price=unit_price,
            reference_type='SALE',
            reference_id=sale.id,
            reason=f'Sale {sale.invoice_number}',
            created_by=user,
        )

        med.stock_quantity = qty_after
        med.save(update_fields=['stock_quantity', 'updated_at'])

    # Recalculate sale totals
    subtotal       = round(subtotal, 2)
    tax_total      = round(tax_total, 2)
    disc_order     = float(data.get('discount_amount', 0))
    total_amount   = round(subtotal + tax_total - disc_order, 2)
    amount_paid    = float(data['amount_paid'])
    change_amount  = round(max(0, amount_paid - total_amount), 2)

    # Payment status
    if amount_paid <= 0:
        pay_status = PaymentStatus.PENDING
    elif amount_paid < total_amount:
        pay_status = PaymentStatus.PARTIAL
    else:
        pay_status = PaymentStatus.PAID

    sale.subtotal       = subtotal
    sale.tax_amount     = tax_total
    sale.total_amount   = total_amount
    sale.change_amount  = change_amount
    sale.payment_status = pay_status
    sale.save(update_fields=[
        'subtotal', 'tax_amount', 'total_amount',
        'change_amount', 'payment_status', 'updated_at',
    ])

    return sale


class SaleListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = Sale.objects.select_related('customer', 'created_by').prefetch_related('items')

        search = request.query_params.get('search', '').strip()
        if search:
            qs = qs.filter(
                Q(invoice_number__icontains=search) |
                Q(customer__name__icontains=search) |
                Q(customer__mobile__icontains=search)
            )

        sale_status = request.query_params.get('status')
        if sale_status:
            qs = qs.filter(status=sale_status)

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
        page_qs = qs[offset: offset + page_size]

        return Response({
            'success': True,
            'data': {
                'count':     total,
                'page':      page,
                'page_size': page_size,
                'results':   SaleListSerializer(page_qs, many=True).data,
            },
        })

    def post(self, request):
        if request.user.role not in WRITE_ROLES:
            return Response(_err('FORBIDDEN', 'Insufficient permissions.'), status=status.HTTP_403_FORBIDDEN)

        serializer = SaleCreateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(_err('VALIDATION_ERROR', 'Invalid data.', serializer.errors),
                            status=status.HTTP_400_BAD_REQUEST)

        try:
            sale = _create_sale(serializer.validated_data, request.user)
        except ValueError as e:
            return Response(_err('BAD_REQUEST', str(e)), status=status.HTTP_400_BAD_REQUEST)

        return Response(
            {'success': True, 'data': SaleDetailSerializer(sale).data},
            status=status.HTTP_201_CREATED,
        )


class SaleDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        try:
            sale = Sale.objects.select_related('customer', 'created_by').prefetch_related(
                'items__medicine'
            ).get(pk=pk)
        except Sale.DoesNotExist:
            return Response(_err('NOT_FOUND', 'Sale not found.'), status=status.HTTP_404_NOT_FOUND)

        return Response({'success': True, 'data': SaleDetailSerializer(sale).data})


class SaleSummaryView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        now      = timezone.now()
        today    = now.date()
        month_start = today.replace(day=1)

        completed_qs = Sale.objects.filter(status='COMPLETED')

        today_qs  = completed_qs.filter(created_at__date=today)
        month_qs  = completed_qs.filter(created_at__date__gte=month_start)

        today_revenue = today_qs.aggregate(t=Sum('total_amount'))['t'] or 0
        month_revenue = month_qs.aggregate(t=Sum('total_amount'))['t'] or 0
        total_revenue = completed_qs.aggregate(t=Sum('total_amount'))['t'] or 0

        return Response({
            'success': True,
            'data': {
                'today_count':   today_qs.count(),
                'today_revenue': float(today_revenue),
                'month_count':   month_qs.count(),
                'month_revenue': float(month_revenue),
                'total_count':   completed_qs.count(),
                'total_revenue': float(total_revenue),
            },
        })
