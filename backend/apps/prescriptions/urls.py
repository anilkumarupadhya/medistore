from django.urls import path
from .views import PrescriptionListCreateView, PrescriptionDetailView

app_name = 'prescriptions'

urlpatterns = [
    path('',           PrescriptionListCreateView.as_view(), name='list-create'),
    path('<uuid:pk>/', PrescriptionDetailView.as_view(),     name='detail'),
]
