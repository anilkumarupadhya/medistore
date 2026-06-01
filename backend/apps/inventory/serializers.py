from rest_framework import serializers
from .models import InventoryTransaction, TxType
from apps.medicines.serializers import MedicineListSerializer


class InventoryTransactionSerializer(serializers.ModelSerializer):
    medicine_name     = serializers.CharField(source="medicine.name", read_only=True)
    medicine_category = serializers.CharField(source="medicine.category", read_only=True)
    created_by_name   = serializers.CharField(source="created_by.full_name", read_only=True)

    class Meta:
        model = InventoryTransaction
        fields = [
            "id", "medicine", "medicine_name", "medicine_category",
            "tx_type", "quantity", "quantity_before", "quantity_after",
            "batch_number", "expiry_date",
            "purchase_price", "selling_price",
            "reference_type", "reference_id",
            "reason", "created_by", "created_by_name", "created_at",
        ]
        read_only_fields = [
            "id", "quantity_before", "quantity_after",
            "created_by", "created_by_name", "created_at",
        ]


class StockTransactionCreateSerializer(serializers.Serializer):
    """
    Input serializer for creating a stock transaction.
    The view handles atomic medicine stock update + transaction record creation.
    """
    medicine_id    = serializers.UUIDField()
    tx_type        = serializers.ChoiceField(choices=TxType.choices)
    quantity       = serializers.IntegerField(min_value=1)
    batch_number   = serializers.CharField(max_length=100, required=False, allow_blank=True, default="")
    expiry_date    = serializers.DateField(required=False, allow_null=True)
    purchase_price = serializers.DecimalField(max_digits=12, decimal_places=2, required=False, allow_null=True)
    selling_price  = serializers.DecimalField(max_digits=12, decimal_places=2, required=False, allow_null=True)
    reason         = serializers.CharField(max_length=500, required=False, allow_blank=True, default="")

    def validate(self, attrs):
        tx_type = attrs["tx_type"]
        # Stock-out movements need a non-empty reason
        if tx_type in (TxType.STOCK_OUT, TxType.ADJUSTMENT, TxType.EXPIRED, TxType.DAMAGED):
            if not attrs.get("reason", "").strip():
                raise serializers.ValidationError({"reason": "Reason is required for this transaction type."})
        return attrs
