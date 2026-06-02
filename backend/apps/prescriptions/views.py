from django.db.models import Q
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import IsAuthenticated

from .models import Prescription
from .serializers import PrescriptionSerializer, PrescriptionWriteSerializer


def _err(code, message, details=None):
    return {'success': False, 'error': {'code': code, 'message': message, 'details': details or {}}}


class PrescriptionListCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        qs = Prescription.objects.select_related('customer', 'uploaded_by').all()

        search = request.query_params.get('search', '').strip()
        if search:
            qs = qs.filter(
                Q(customer__name__icontains=search) |
                Q(customer__mobile__icontains=search) |
                Q(doctor_name__icontains=search) |
                Q(doctor_reg_no__icontains=search)
            )

        customer_id = request.query_params.get('customer_id')
        if customer_id:
            qs = qs.filter(customer_id=customer_id)

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
                'results':   PrescriptionSerializer(page_qs, many=True).data,
            },
        })

    def post(self, request):
        serializer = PrescriptionWriteSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(_err('VALIDATION_ERROR', 'Invalid data.', serializer.errors),
                            status=status.HTTP_400_BAD_REQUEST)

        prescription = serializer.save(uploaded_by=request.user)
        return Response(
            {'success': True, 'data': PrescriptionSerializer(prescription).data},
            status=status.HTTP_201_CREATED,
        )


class PrescriptionDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def _get(self, pk):
        try:
            return Prescription.objects.select_related('customer', 'uploaded_by').get(pk=pk)
        except Prescription.DoesNotExist:
            return None

    def get(self, request, pk):
        rx = self._get(pk)
        if not rx:
            return Response(_err('NOT_FOUND', 'Prescription not found.'), status=status.HTTP_404_NOT_FOUND)
        return Response({'success': True, 'data': PrescriptionSerializer(rx).data})

    def put(self, request, pk):
        rx = self._get(pk)
        if not rx:
            return Response(_err('NOT_FOUND', 'Prescription not found.'), status=status.HTTP_404_NOT_FOUND)

        serializer = PrescriptionWriteSerializer(rx, data=request.data, partial=True)
        if not serializer.is_valid():
            return Response(_err('VALIDATION_ERROR', 'Invalid data.', serializer.errors),
                            status=status.HTTP_400_BAD_REQUEST)

        rx = serializer.save()
        return Response({'success': True, 'data': PrescriptionSerializer(rx).data})

    def delete(self, request, pk):
        rx = self._get(pk)
        if not rx:
            return Response(_err('NOT_FOUND', 'Prescription not found.'), status=status.HTTP_404_NOT_FOUND)
        rx.delete()
        return Response({'success': True, 'data': {'message': 'Deleted.'}})
