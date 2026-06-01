from rest_framework import serializers
from .models import Sale, SaleItem, PaymentMethod


class SaleItemSerializer(serializers.ModelSerializer):
    medicine_name     = serializers.CharField(source='medicine.name', read_only=True)
    medicine_category = serializers.CharField(source='medicine.category', read_only=True)

    class Meta:
        model  = SaleItem
        fields = [
            'id', 'medicine', 'medicine_name', 'medicine_category',
            'batch_number', 'expiry_date',
            'quantity', 'unit_price', 'mrp',
            'discount_pct', 'discount_amount',
            'gst_percentage', 'gst_amount', 'total_amount',
        ]


class SaleListSerializer(serializers.ModelSerializer):
    customer_name   = serializers.SerializerMethodField()
    created_by_name = serializers.SerializerMethodField()
    item_count      = serializers.SerializerMethodField()

    class Meta:
        model  = Sale
        fields = [
            'id', 'invoice_number', 'customer', 'customer_name',
            'status', 'subtotal', 'discount_amount', 'tax_amount', 'total_amount',
            'amount_paid', 'change_amount', 'payment_method', 'payment_status',
            'item_count', 'created_by_name', 'created_at',
        ]

    def get_customer_name(self, obj):
        return obj.customer.name if obj.customer else None

    def get_created_by_name(self, obj):
        return obj.created_by.full_name if obj.created_by else None

    def get_item_count(self, obj):
        return obj.items.count()


class SaleDetailSerializer(serializers.ModelSerializer):
    customer_name   = serializers.SerializerMethodField()
    created_by_name = serializers.SerializerMethodField()
    items           = SaleItemSerializer(many=True, read_only=True)

    class Meta:
        model  = Sale
        fields = [
            'id', 'invoice_number', 'customer', 'customer_name',
            'status', 'subtotal', 'discount_amount', 'tax_amount', 'total_amount',
            'amount_paid', 'change_amount', 'payment_method', 'payment_status',
            'loyalty_points_used', 'loyalty_points_earned',
            'notes', 'items', 'created_by_name', 'created_at', 'updated_at',
        ]

    def get_customer_name(self, obj):
        return obj.customer.name if obj.customer else None

    def get_created_by_name(self, obj):
        return obj.created_by.full_name if obj.created_by else None


# ── Write ─────────────────────────────────────────────────────────────────────

class SaleItemWriteSerializer(serializers.Serializer):
    medicine_id  = serializers.UUIDField()
    quantity     = serializers.IntegerField(min_value=1)
    unit_price   = serializers.DecimalField(max_digits=12, decimal_places=2, required=False)
    discount_pct = serializers.DecimalField(max_digits=5, decimal_places=2, default=0)


class SaleCreateSerializer(serializers.Serializer):
    customer_id     = serializers.UUIDField(required=False, allow_null=True)
    items           = SaleItemWriteSerializer(many=True)
    discount_amount = serializers.DecimalField(max_digits=14, decimal_places=2, default=0)
    amount_paid     = serializers.DecimalField(max_digits=14, decimal_places=2)
    payment_method  = serializers.ChoiceField(choices=PaymentMethod.choices, default='CASH')
    notes           = serializers.CharField(required=False, allow_blank=True, default='')

    def validate_items(self, value):
        if not value:
            raise serializers.ValidationError('At least one item is required.')
        return value
