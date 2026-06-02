from django.db.models import F
from django.utils import timezone
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated

from apps.medicines.models import Medicine


class NotificationListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        today         = timezone.now().date()
        expiry_cutoff = today + timezone.timedelta(days=30)

        low_stock = list(
            Medicine.objects.filter(
                is_active=True,
                stock_quantity__gt=0,
                stock_quantity__lte=F('reorder_level'),
            ).values('id', 'name', 'stock_quantity', 'reorder_level', 'unit')
             .order_by('stock_quantity')[:20]
        )

        out_of_stock = list(
            Medicine.objects.filter(is_active=True, stock_quantity=0)
            .values('id', 'name', 'unit')
            .order_by('name')[:20]
        )

        expiring_soon = list(
            Medicine.objects.filter(
                is_active=True,
                stock_quantity__gt=0,
                expiry_date__isnull=False,
                expiry_date__gte=today,
                expiry_date__lte=expiry_cutoff,
            ).values('id', 'name', 'expiry_date', 'stock_quantity', 'unit')
             .order_by('expiry_date')[:20]
        )

        expired = list(
            Medicine.objects.filter(
                is_active=True,
                stock_quantity__gt=0,
                expiry_date__isnull=False,
                expiry_date__lt=today,
            ).values('id', 'name', 'expiry_date', 'stock_quantity', 'unit')
             .order_by('expiry_date')[:20]
        )

        total_count = len(low_stock) + len(out_of_stock) + len(expiring_soon) + len(expired)

        return Response({
            'success': True,
            'data': {
                'total_count': total_count,
                'low_stock': [dict(r, id=str(r['id'])) for r in low_stock],
                'out_of_stock': [dict(r, id=str(r['id'])) for r in out_of_stock],
                'expiring_soon': [
                    dict(r, id=str(r['id']), expiry_date=str(r['expiry_date']))
                    for r in expiring_soon
                ],
                'expired': [
                    dict(r, id=str(r['id']), expiry_date=str(r['expiry_date']))
                    for r in expired
                ],
            },
        })
