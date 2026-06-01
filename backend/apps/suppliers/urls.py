from django.urls import path
from .views import SupplierListCreateView, SupplierDetailView

app_name = 'suppliers'

urlpatterns = [
    path('',       SupplierListCreateView.as_view(), name='list-create'),
    path('<uuid:pk>/', SupplierDetailView.as_view(),  name='detail'),
]
