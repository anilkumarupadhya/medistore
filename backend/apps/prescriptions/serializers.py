from rest_framework import serializers
from .models import Prescription


class PrescriptionSerializer(serializers.ModelSerializer):
    customer_name    = serializers.SerializerMethodField()
    uploaded_by_name = serializers.SerializerMethodField()

    class Meta:
        model  = Prescription
        fields = [
            'id', 'customer', 'customer_name',
            'doctor_name', 'doctor_reg_no', 'file_url',
            'notes', 'uploaded_by_name', 'created_at',
        ]

    def get_customer_name(self, obj):
        return obj.customer.name if obj.customer else None

    def get_uploaded_by_name(self, obj):
        return obj.uploaded_by.full_name if obj.uploaded_by else None


class PrescriptionWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Prescription
        fields = ['customer', 'doctor_name', 'doctor_reg_no', 'file_url', 'notes']
