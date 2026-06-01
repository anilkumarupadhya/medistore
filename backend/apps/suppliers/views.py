from django.db.models import Q
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from .models import Supplier
from .serializers import SupplierListSerializer, SupplierDetailSerializer, SupplierWriteSerializer

WRITE_ROLES = ('ADMIN', 'INVENTORY_MANAGER')


def _err(code, message, details=None):
    body = {'success': False, 'error': {'code': code, 'message': message}}
    if details:
        body['error']['details'] = details
    return body


class SupplierListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = Supplier.objects.all()

        search = request.query_params.get('search', '').strip()
        if search:
            qs = qs.filter(
                Q(name__icontains=search) |
                Q(mobile__icontains=search) |
                Q(email__icontains=search) |
                Q(gst_number__icontains=search)
            )

        is_active = request.query_params.get('is_active')
        if is_active in ('true', 'false'):
            qs = qs.filter(is_active=is_active == 'true')

        try:
            page      = max(1, int(request.query_params.get('page', 1)))
            page_size = min(100, int(request.query_params.get('page_size', 20)))
        except ValueError:
            page, page_size = 1, 20

        total  = qs.count()
        offset = (page - 1) * page_size
        data   = SupplierListSerializer(qs[offset: offset + page_size], many=True).data

        return Response({'success': True, 'data': {
            'count': total, 'page': page, 'page_size': page_size, 'results': data,
        }})

    def post(self, request):
        if request.user.role not in WRITE_ROLES:
            return Response(_err('FORBIDDEN', 'Insufficient permissions'), status=403)
        serializer = SupplierWriteSerializer(data=request.data)
        if serializer.is_valid():
            supplier = serializer.save()
            return Response(
                {'success': True, 'data': SupplierDetailSerializer(supplier).data},
                status=status.HTTP_201_CREATED,
            )
        return Response(_err('VALIDATION_ERROR', 'Invalid data', serializer.errors), status=400)


class SupplierDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def _get(self, pk):
        try:
            return Supplier.objects.get(pk=pk)
        except Supplier.DoesNotExist:
            return None

    def get(self, request, pk):
        obj = self._get(pk)
        if not obj:
            return Response(_err('NOT_FOUND', 'Supplier not found'), status=404)
        return Response({'success': True, 'data': SupplierDetailSerializer(obj).data})

    def put(self, request, pk):
        return self._update(request, pk, partial=False)

    def patch(self, request, pk):
        return self._update(request, pk, partial=True)

    def _update(self, request, pk, partial):
        if request.user.role not in WRITE_ROLES:
            return Response(_err('FORBIDDEN', 'Insufficient permissions'), status=403)
        obj = self._get(pk)
        if not obj:
            return Response(_err('NOT_FOUND', 'Supplier not found'), status=404)
        serializer = SupplierWriteSerializer(obj, data=request.data, partial=partial)
        if serializer.is_valid():
            obj = serializer.save()
            return Response({'success': True, 'data': SupplierDetailSerializer(obj).data})
        return Response(_err('VALIDATION_ERROR', 'Invalid data', serializer.errors), status=400)

    def delete(self, request, pk):
        if request.user.role != 'ADMIN':
            return Response(_err('FORBIDDEN', 'Insufficient permissions'), status=403)
        obj = self._get(pk)
        if not obj:
            return Response(_err('NOT_FOUND', 'Supplier not found'), status=404)
        obj.is_active = False
        obj.save(update_fields=['is_active', 'updated_at'])
        return Response({'success': True, 'data': {'detail': 'Supplier deactivated'}})
