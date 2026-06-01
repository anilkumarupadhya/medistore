from django.urls import path
from .views import (
    TransactionListCreateView,
    TransactionDetailView,
    MedicineHistoryView,
    InventorySummaryView,
)

app_name = "inventory"

urlpatterns = [
    path("transactions/",                              TransactionListCreateView.as_view(), name="transaction_list_create"),
    path("transactions/<int:pk>/",                     TransactionDetailView.as_view(),     name="transaction_detail"),
    path("medicine/<uuid:medicine_id>/history/",       MedicineHistoryView.as_view(),        name="medicine_history"),
    path("summary/",                                   InventorySummaryView.as_view(),       name="summary"),
]
