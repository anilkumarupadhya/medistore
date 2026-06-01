from django.contrib import admin
from .models import Supplier

@admin.register(Supplier)
class SupplierAdmin(admin.ModelAdmin):
    list_display  = ('name', 'mobile', 'email', 'city', 'gst_number', 'payment_terms', 'is_active')
    list_filter   = ('is_active', 'state')
    search_fields = ('name', 'mobile', 'email', 'gst_number')
