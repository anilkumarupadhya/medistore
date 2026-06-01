from rest_framework import serializers
from .models import Supplier


class SupplierListSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Supplier
        fields = [
            'id', 'name', 'contact_person', 'mobile', 'email',
            'city', 'state', 'gst_number', 'payment_terms',
            'opening_balance', 'is_active', 'created_at',
        ]


class SupplierDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Supplier
        fields = '__all__'


class SupplierWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Supplier
        fields = [
            'name', 'contact_person', 'mobile', 'email',
            'address', 'city', 'state', 'pincode',
            'gst_number', 'payment_terms', 'opening_balance',
            'is_active', 'notes',
        ]

    def validate_mobile(self, value: str) -> str:
        qs = Supplier.objects.filter(mobile=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError('A supplier with this mobile already exists.')
        return value
