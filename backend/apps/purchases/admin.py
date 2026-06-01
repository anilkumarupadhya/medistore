from django.contrib import admin
from .models import PurchaseOrder, PurchaseItem


class PurchaseItemInline(admin.TabularInline):
    model       = PurchaseItem
    extra       = 0
    fields      = ('medicine', 'quantity', 'free_quantity', 'purchase_price', 'selling_price', 'mrp', 'total_amount')
    readonly_fields = ('total_amount',)


@admin.register(PurchaseOrder)
class PurchaseOrderAdmin(admin.ModelAdmin):
    list_display    = ('po_number', 'supplier', 'status', 'total_amount', 'payment_status', 'created_at')
    list_filter     = ('status', 'payment_status')
    search_fields   = ('po_number', 'supplier__name', 'invoice_number')
    inlines         = [PurchaseItemInline]
    readonly_fields = ('po_number', 'created_at', 'updated_at')
