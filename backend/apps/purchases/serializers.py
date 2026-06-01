from rest_framework import serializers
from .models import PurchaseOrder, PurchaseItem
from apps.medicines.models import Medicine


class PurchaseItemSerializer(serializers.ModelSerializer):
    medicine_name     = serializers.CharField(source='medicine.name', read_only=True)
    medicine_category = serializers.CharField(source='medicine.category', read_only=True)

    class Meta:
        model  = PurchaseItem
        fields = [
            'id', 'medicine', 'medicine_name', 'medicine_category',
            'batch_number', 'expiry_date',
            'quantity', 'free_quantity',
            'purchase_price', 'selling_price', 'mrp',
            'discount_pct', 'gst_percentage', 'gst_amount', 'total_amount',
        ]


class PurchaseItemWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model  = PurchaseItem
        fields = [
            'medicine', 'batch_number', 'expiry_date',
            'quantity', 'free_quantity',
            'purchase_price', 'selling_price', 'mrp',
            'discount_pct', 'gst_percentage',
        ]

    def validate_quantity(self, value):
        if value < 1:
            raise serializers.ValidationError('Quantity must be at least 1.')
        return value

    def compute_amounts(self, data: dict) -> dict:
        qty   = data.get('quantity', 1)
        price = float(data.get('purchase_price', 0))
        disc  = float(data.get('discount_pct', 0))
        gst   = float(data.get('gst_percentage', 0))

        base       = qty * price * (1 - disc / 100)
        gst_amount = round(base * gst / 100, 2)
        total      = round(base + gst_amount, 2)
        data['gst_amount']   = gst_amount
        data['total_amount'] = total
        return data


class PurchaseOrderListSerializer(serializers.ModelSerializer):
    supplier_name = serializers.CharField(source='supplier.name', read_only=True)
    item_count    = serializers.SerializerMethodField()

    class Meta:
        model  = PurchaseOrder
        fields = [
            'id', 'po_number', 'supplier', 'supplier_name',
            'status', 'invoice_number', 'invoice_date',
            'subtotal', 'discount_amount', 'tax_amount', 'total_amount',
            'amount_paid', 'payment_status', 'payment_method',
            'received_at', 'created_at', 'item_count',
        ]

    def get_item_count(self, obj):
        return obj.items.count()


class PurchaseOrderDetailSerializer(serializers.ModelSerializer):
    supplier_name  = serializers.CharField(source='supplier.name', read_only=True)
    created_by_name = serializers.SerializerMethodField()
    items          = PurchaseItemSerializer(many=True, read_only=True)

    class Meta:
        model  = PurchaseOrder
        fields = [
            'id', 'po_number', 'supplier', 'supplier_name',
            'status', 'invoice_number', 'invoice_date',
            'subtotal', 'discount_amount', 'tax_amount', 'total_amount',
            'amount_paid', 'payment_status', 'payment_method',
            'notes', 'received_at',
            'created_by', 'created_by_name', 'created_at', 'updated_at',
            'items',
        ]

    def get_created_by_name(self, obj):
        if obj.created_by:
            return obj.created_by.full_name or obj.created_by.email
        return None


class PurchaseOrderWriteSerializer(serializers.ModelSerializer):
    items = PurchaseItemWriteSerializer(many=True)

    class Meta:
        model  = PurchaseOrder
        fields = [
            'supplier', 'invoice_number', 'invoice_date',
            'discount_amount', 'amount_paid', 'payment_method',
            'notes', 'items',
        ]

    def validate_items(self, value):
        if not value:
            raise serializers.ValidationError('At least one item is required.')
        return value

    def create(self, validated_data):
        items_data     = validated_data.pop('items')
        validated_data['created_by'] = self.context['request'].user
        po = PurchaseOrder.objects.create(**validated_data)
        item_writer = PurchaseItemWriteSerializer()
        for item_data in items_data:
            item_data = item_writer.compute_amounts(item_data)
            PurchaseItem.objects.create(purchase=po, **item_data)
        po.recalculate_totals()
        return po

    def update(self, instance, validated_data):
        items_data = validated_data.pop('items', None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()
        if items_data is not None:
            instance.items.all().delete()
            item_writer = PurchaseItemWriteSerializer()
            for item_data in items_data:
                item_data = item_writer.compute_amounts(item_data)
                PurchaseItem.objects.create(purchase=instance, **item_data)
            instance.recalculate_totals()
        return instance


class GRNReceiveSerializer(serializers.Serializer):
    """Payload for marking a PO as received (GRN)."""
    invoice_number = serializers.CharField(required=False, allow_blank=True)
    invoice_date   = serializers.DateField(required=False, allow_null=True)
    amount_paid    = serializers.DecimalField(max_digits=14, decimal_places=2, required=False)
    payment_method = serializers.ChoiceField(
        choices=['CASH', 'CARD', 'UPI', 'NETBANKING', 'CHEQUE', 'CREDIT'],
        required=False, allow_null=True,
    )
    notes          = serializers.CharField(required=False, allow_blank=True)
