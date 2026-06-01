from django.db.models import Q
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from .models import Customer
from .serializers import CustomerListSerializer, CustomerDetailSerializer, CustomerWriteSerializer

WRITE_ROLES = ('ADMIN', 'PHARMACIST', 'CASHIER', 'INVENTORY_MANAGER')


def _err(code, message, details=None):
    body = {'success': False, 'error': {'code': code, 'message': message, 'details': details or {}}}
    return body


class CustomerListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = Customer.objects.all()

        search = request.query_params.get('search', '').strip()
        if search:
            qs = qs.filter(
                Q(name__icontains=search) |
                Q(mobile__icontains=search) |
                Q(email__icontains=search)
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
        qs     = qs[offset: offset + page_size]

        return Response({
            'success':   True,
            'data': {
                'count':     total,
                'page':      page,
                'page_size': page_size,
                'results':   CustomerListSerializer(qs, many=True).data,
            },
        })

    def post(self, request):
        if request.user.role not in WRITE_ROLES:
            return Response(_err('FORBIDDEN', 'Insufficient permissions.'), status=status.HTTP_403_FORBIDDEN)

        serializer = CustomerWriteSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(_err('VALIDATION_ERROR', 'Invalid data.', serializer.errors),
                            status=status.HTTP_400_BAD_REQUEST)

        customer = serializer.save()
        return Response(
            {'success': True, 'data': CustomerDetailSerializer(customer).data},
            status=status.HTTP_201_CREATED,
        )


class CustomerDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def _get_object(self, pk):
        try:
            return Customer.objects.get(pk=pk)
        except Customer.DoesNotExist:
            return None

    def get(self, request, pk):
        customer = self._get_object(pk)
        if not customer:
            return Response(_err('NOT_FOUND', 'Customer not found.'), status=status.HTTP_404_NOT_FOUND)
        return Response({'success': True, 'data': CustomerDetailSerializer(customer).data})

    def put(self, request, pk):
        if request.user.role not in WRITE_ROLES:
            return Response(_err('FORBIDDEN', 'Insufficient permissions.'), status=status.HTTP_403_FORBIDDEN)

        customer = self._get_object(pk)
        if not customer:
            return Response(_err('NOT_FOUND', 'Customer not found.'), status=status.HTTP_404_NOT_FOUND)

        serializer = CustomerWriteSerializer(customer, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(_err('VALIDATION_ERROR', 'Invalid data.', serializer.errors),
                            status=status.HTTP_400_BAD_REQUEST)

        customer = serializer.save()
        return Response({'success': True, 'data': CustomerDetailSerializer(customer).data})
