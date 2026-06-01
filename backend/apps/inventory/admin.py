from django.contrib import admin
from .models import InventoryTransaction


@admin.register(InventoryTransaction)
class InventoryTransactionAdmin(admin.ModelAdmin):
    list_display  = ["medicine", "tx_type", "quantity", "quantity_before", "quantity_after", "created_by", "created_at"]
    list_filter   = ["tx_type", "created_at"]
    search_fields = ["medicine__name", "batch_number", "reason"]
    readonly_fields = [f.name for f in InventoryTransaction._meta.fields]

    def has_add_permission(self, request):
        return False  # Use the API, not Django admin, to create transactions

    def has_change_permission(self, request, obj=None):
        return False  # Transactions are immutable
