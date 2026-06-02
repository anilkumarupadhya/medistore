from django.db.models import Sum, Count, F
from django.db.models.functions import TruncDate
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from apps.medicines.models import Medicine
from apps.sales.models import Sale, SaleItem
from apps.purchases.models import PurchaseOrder, PurchaseItem


class SalesReportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        date_from = request.query_params.get('date_from')
        date_to   = request.query_params.get('date_to')

        qs = Sale.objects.filter(status='COMPLETED')
        if date_from:
            qs = qs.filter(created_at__date__gte=date_from)
        if date_to:
            qs = qs.filter(created_at__date__lte=date_to)

        # Daily breakdown
        daily = (
            qs.annotate(date=TruncDate('created_at'))
              .values('date')
              .annotate(count=Count('id'), revenue=Sum('total_amount'), paid=Sum('amount_paid'))
              .order_by('date')
        )

        # Top 10 medicines by qty sold
        item_filter = {}
        if date_from:
            item_filter['sale__created_at__date__gte'] = date_from
        if date_to:
            item_filter['sale__created_at__date__lte'] = date_to

        top_medicines = (
            SaleItem.objects.filter(sale__status='COMPLETED', **item_filter)
            .values('medicine__name', 'medicine__category')
            .annotate(total_qty=Sum('quantity'), total_revenue=Sum('total_amount'))
            .order_by('-total_qty')[:10]
        )

        # Payment method breakdown
        payment_breakdown = (
            qs.values('payment_method')
              .annotate(count=Count('id'), total=Sum('total_amount'))
              .order_by('-total')
        )

        totals = qs.aggregate(
            total_count=Count('id'),
            total_revenue=Sum('total_amount'),
            total_paid=Sum('amount_paid'),
        )

        return Response({
            'success': True,
            'data': {
                'totals': {
                    'total_count':   totals['total_count'] or 0,
                    'total_revenue': float(totals['total_revenue'] or 0),
                    'total_paid':    float(totals['total_paid']    or 0),
                },
                'daily': [
                    {'date': str(r['date']), 'count': r['count'],
                     'revenue': float(r['revenue'] or 0), 'paid': float(r['paid'] or 0)}
                    for r in daily
                ],
                'top_medicines': [
                    {'name': r['medicine__name'], 'category': r['medicine__category'],
                     'total_qty': r['total_qty'], 'total_revenue': float(r['total_revenue'] or 0)}
                    for r in top_medicines
                ],
                'payment_breakdown': [
                    {'method': r['payment_method'], 'count': r['count'], 'total': float(r['total'] or 0)}
                    for r in payment_breakdown
                ],
            },
        })


class InventoryReportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        medicines = Medicine.objects.filter(is_active=True)
        today         = timezone.now().date()
        expiry_cutoff = today + timezone.timedelta(days=30)

        # Stock valuation (computed in Python to avoid DB-level multiplication)
        all_meds     = list(medicines.values('stock_quantity', 'purchase_price', 'selling_price'))
        total_value   = sum(m['stock_quantity'] * float(m['purchase_price']) for m in all_meds)
        selling_value = sum(m['stock_quantity'] * float(m['selling_price'])  for m in all_meds)

        # Counts
        total_count      = medicines.count()
        low_stock_count  = medicines.filter(stock_quantity__gt=0, stock_quantity__lte=F('reorder_level')).count()
        out_of_stock     = medicines.filter(stock_quantity=0).count()
        expiring_count   = medicines.filter(expiry_date__isnull=False, expiry_date__lte=expiry_cutoff, expiry_date__gte=today).count()
        expired_count    = medicines.filter(expiry_date__isnull=False, expiry_date__lt=today, stock_quantity__gt=0).count()

        # Category breakdown
        category_breakdown = list(
            medicines.values('category')
                     .annotate(count=Count('id'), total_stock=Sum('stock_quantity'))
                     .order_by('category')
        )

        # Low stock list
        low_stock = list(
            medicines.filter(stock_quantity__lte=F('reorder_level'))
                     .values('id', 'name', 'category', 'stock_quantity', 'reorder_level', 'unit')
                     .order_by('stock_quantity')[:20]
        )

        # Expiring soon
        expiring = [
            dict(r, id=str(r['id']), expiry_date=str(r['expiry_date']))
            for r in medicines.filter(
                expiry_date__isnull=False, expiry_date__lte=expiry_cutoff, expiry_date__gte=today
            ).values('id', 'name', 'expiry_date', 'stock_quantity', 'unit').order_by('expiry_date')[:20]
        ]

        # Expired with stock
        expired = [
            dict(r, id=str(r['id']), expiry_date=str(r['expiry_date']))
            for r in medicines.filter(
                expiry_date__isnull=False, expiry_date__lt=today, stock_quantity__gt=0
            ).values('id', 'name', 'expiry_date', 'stock_quantity', 'unit').order_by('expiry_date')[:20]
        ]

        return Response({
            'success': True,
            'data': {
                'summary': {
                    'total_medicines':     total_count,
                    'total_stock_value':   round(total_value,   2),
                    'selling_stock_value': round(selling_value, 2),
                    'potential_profit':    round(selling_value - total_value, 2),
                    'low_stock_count':     low_stock_count,
                    'out_of_stock_count':  out_of_stock,
                    'expiring_soon_count': expiring_count,
                    'expired_count':       expired_count,
                },
                'category_breakdown': category_breakdown,
                'low_stock':          [dict(r, id=str(r['id'])) for r in low_stock],
                'expiring':           expiring,
                'expired':            expired,
            },
        })


class PurchaseReportView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        date_from = request.query_params.get('date_from')
        date_to   = request.query_params.get('date_to')

        qs = PurchaseOrder.objects.select_related('supplier')
        if date_from:
            qs = qs.filter(created_at__date__gte=date_from)
        if date_to:
            qs = qs.filter(created_at__date__lte=date_to)

        totals = qs.aggregate(
            total_orders=Count('id'),
            total_value=Sum('total_amount'),
            total_paid=Sum('amount_paid'),
        )

        by_supplier = [
            {'supplier': r['supplier__name'], 'orders': r['orders'],
             'total': float(r['total'] or 0), 'paid': float(r['paid'] or 0)}
            for r in qs.values('supplier__name')
                       .annotate(orders=Count('id'), total=Sum('total_amount'), paid=Sum('amount_paid'))
                       .order_by('-total')[:10]
        ]

        by_status = [
            {'status': r['status'], 'count': r['count'], 'total': float(r['total'] or 0)}
            for r in qs.values('status').annotate(count=Count('id'), total=Sum('total_amount')).order_by('status')
        ]

        item_filter = {}
        if date_from:
            item_filter['purchase__created_at__date__gte'] = date_from
        if date_to:
            item_filter['purchase__created_at__date__lte'] = date_to

        top_medicines = [
            {'name': r['medicine__name'], 'total_qty': r['total_qty'],
             'total_value': float(r['total_value'] or 0)}
            for r in PurchaseItem.objects.filter(**item_filter)
                                         .values('medicine__name')
                                         .annotate(total_qty=Sum('quantity'), total_value=Sum('total_amount'))
                                         .order_by('-total_value')[:10]
        ]

        return Response({
            'success': True,
            'data': {
                'totals': {
                    'total_orders': totals['total_orders'] or 0,
                    'total_value':  float(totals['total_value']  or 0),
                    'total_paid':   float(totals['total_paid']   or 0),
                    'outstanding':  float((totals['total_value'] or 0) - (totals['total_paid'] or 0)),
                },
                'by_supplier':   by_supplier,
                'by_status':     by_status,
                'top_medicines': top_medicines,
            },
        })
