from rest_framework import serializers
from .models import Medicine


class MedicineListSerializer(serializers.ModelSerializer):
    is_low_stock = serializers.SerializerMethodField()
    is_expired   = serializers.SerializerMethodField()

    class Meta:
        model = Medicine
        fields = [
            "id", "name", "generic_name", "brand_name", "category",
            "manufacturer", "barcode", "batch_number",
            "selling_price", "mrp", "gst_percentage",
            "stock_quantity", "reorder_level", "unit",
            "expiry_date", "is_prescription", "is_active",
            "is_low_stock", "is_expired",
            "created_at",
        ]

    def get_is_low_stock(self, obj):
        return obj.is_low_stock

    def get_is_expired(self, obj):
        return obj.is_expired


class MedicineDetailSerializer(serializers.ModelSerializer):
    is_low_stock = serializers.SerializerMethodField()
    is_expired   = serializers.SerializerMethodField()

    class Meta:
        model = Medicine
        fields = [
            "id", "name", "generic_name", "brand_name", "category",
            "manufacturer", "barcode", "batch_number",
            "purchase_price", "selling_price", "mrp", "gst_percentage",
            "hsn_code", "stock_quantity", "reorder_level", "unit",
            "manufacturing_date", "expiry_date",
            "is_prescription", "is_active", "notes",
            "is_low_stock", "is_expired",
            "created_by", "created_at", "updated_at",
        ]

    def get_is_low_stock(self, obj):
        return obj.is_low_stock

    def get_is_expired(self, obj):
        return obj.is_expired


class MedicineWriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = Medicine
        fields = [
            "name", "generic_name", "brand_name", "category",
            "manufacturer", "barcode", "batch_number",
            "purchase_price", "selling_price", "mrp", "gst_percentage",
            "hsn_code", "reorder_level", "unit",
            "manufacturing_date", "expiry_date",
            "is_prescription", "is_active", "notes",
        ]

    def validate_selling_price(self, value):
        if value < 0:
            raise serializers.ValidationError("Selling price cannot be negative.")
        return value

    def validate_purchase_price(self, value):
        if value < 0:
            raise serializers.ValidationError("Purchase price cannot be negative.")
        return value

    def validate(self, attrs):
        mfg = attrs.get("manufacturing_date")
        exp = attrs.get("expiry_date")
        if mfg and exp and exp <= mfg:
            raise serializers.ValidationError(
                {"expiry_date": "Expiry date must be after manufacturing date."}
            )
        return attrs

    def create(self, validated_data):
        request = self.context.get("request")
        if request and request.user.is_authenticated:
            validated_data["created_by"] = request.user
        return super().create(validated_data)


class MedicineBulkImportSerializer(serializers.Serializer):
    file = serializers.FileField()

    def validate_file(self, value):
        ext = value.name.rsplit(".", 1)[-1].lower()
        if ext not in ("xlsx", "xls"):
            raise serializers.ValidationError("Only .xlsx or .xls files are accepted.")
        if value.size > 5 * 1024 * 1024:
            raise serializers.ValidationError("File size must not exceed 5 MB.")
        return value
