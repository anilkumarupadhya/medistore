from django.urls import path
from .views import (
    PurchaseOrderListCreateView,
    PurchaseOrderDetailView,
    PurchaseOrderReceiveView,
    PurchaseOrderSummaryView,
)

app_name = 'purchases'

urlpatterns = [
    path('',                       PurchaseOrderListCreateView.as_view(), name='list-create'),
    path('summary/',               PurchaseOrderSummaryView.as_view(),    name='summary'),
    path('<uuid:pk>/',             PurchaseOrderDetailView.as_view(),     name='detail'),
    path('<uuid:pk>/receive/',     PurchaseOrderReceiveView.as_view(),    name='receive'),
]
