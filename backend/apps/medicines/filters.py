import django_filters
from django.db.models import F
from .models import Medicine


class MedicineFilter(django_filters.FilterSet):
    name            = django_filters.CharFilter(lookup_expr="icontains")
    generic_name    = django_filters.CharFilter(lookup_expr="icontains")
    manufacturer    = django_filters.CharFilter(lookup_expr="icontains")
    category        = django_filters.CharFilter(lookup_expr="exact")
    is_active       = django_filters.BooleanFilter()
    is_prescription = django_filters.BooleanFilter()
    low_stock       = django_filters.BooleanFilter(method="filter_low_stock")
    expiry_before   = django_filters.DateFilter(field_name="expiry_date", lookup_expr="lte")
    expiry_after    = django_filters.DateFilter(field_name="expiry_date", lookup_expr="gte")

    class Meta:
        model = Medicine
        fields = [
            "name", "generic_name", "manufacturer", "category",
            "is_active", "is_prescription", "low_stock",
            "expiry_before", "expiry_after",
        ]

    def filter_low_stock(self, queryset, name, value):
        if value:
            return queryset.filter(stock_quantity__lte=F("reorder_level"))
        return queryset.exclude(stock_quantity__lte=F("reorder_level"))
