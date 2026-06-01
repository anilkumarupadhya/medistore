from django.contrib import admin
from .models import Medicine


@admin.register(Medicine)
class MedicineAdmin(admin.ModelAdmin):
    list_display  = [
        "name", "generic_name", "category", "manufacturer",
        "stock_quantity", "reorder_level", "selling_price",
        "expiry_date", "is_active", "is_prescription",
    ]
    list_filter   = ["category", "is_active", "is_prescription", "manufacturer"]
    search_fields = ["name", "generic_name", "brand_name", "barcode", "batch_number"]
    readonly_fields = ["id", "created_at", "updated_at"]
    ordering      = ["name"]

    fieldsets = (
        ("Basic Info",   {"fields": ("id", "name", "generic_name", "brand_name", "category", "manufacturer")}),
        ("Identification", {"fields": ("barcode", "batch_number", "hsn_code")}),
        ("Pricing",      {"fields": ("purchase_price", "selling_price", "mrp", "gst_percentage")}),
        ("Stock",        {"fields": ("stock_quantity", "reorder_level", "unit")}),
        ("Dates",        {"fields": ("manufacturing_date", "expiry_date")}),
        ("Status",       {"fields": ("is_active", "is_prescription", "notes")}),
        ("Audit",        {"fields": ("created_by", "created_at", "updated_at")}),
    )
