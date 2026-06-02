from django.urls import path
from .views import SalesReportView, InventoryReportView, PurchaseReportView

app_name = 'reports'

urlpatterns = [
    path('sales/',     SalesReportView.as_view(),     name='sales'),
    path('inventory/', InventoryReportView.as_view(), name='inventory'),
    path('purchases/', PurchaseReportView.as_view(),  name='purchases'),
]
