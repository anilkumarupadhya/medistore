from django.urls import path
from .views import SaleListCreateView, SaleDetailView, SaleSummaryView

app_name = 'sales'

urlpatterns = [
    path('',           SaleListCreateView.as_view(), name='list-create'),
    path('summary/',   SaleSummaryView.as_view(),    name='summary'),
    path('<uuid:pk>/', SaleDetailView.as_view(),     name='detail'),
]
