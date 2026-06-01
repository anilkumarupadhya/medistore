from django.urls import path
from .views import CustomerListCreateView, CustomerDetailView

app_name = 'customers'

urlpatterns = [
    path('',          CustomerListCreateView.as_view(), name='list-create'),
    path('<uuid:pk>/', CustomerDetailView.as_view(),    name='detail'),
]
