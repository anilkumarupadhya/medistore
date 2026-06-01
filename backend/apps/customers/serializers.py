from rest_framework import serializers
from .models import Customer


class CustomerListSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Customer
        fields = [
            'id', 'name', 'mobile', 'email',
            'loyalty_points', 'opening_balance', 'is_active', 'created_at',
        ]


class CustomerDetailSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Customer
        fields = '__all__'


class CustomerWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model  = Customer
        fields = [
            'name', 'mobile', 'email', 'address',
            'date_of_birth', 'opening_balance', 'is_active', 'notes',
        ]

    def validate_mobile(self, value):
        qs = Customer.objects.filter(mobile=value)
        if self.instance:
            qs = qs.exclude(pk=self.instance.pk)
        if qs.exists():
            raise serializers.ValidationError('A customer with this mobile number already exists.')
        return value
