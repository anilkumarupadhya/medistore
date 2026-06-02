"""
Root URL configuration.
"""
from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularSwaggerView,
    SpectacularRedocView,
)

API_V1 = "api/v1/"

urlpatterns = [
    path("admin/", admin.site.urls),
    # API v1
    path(API_V1 + "auth/", include("apps.authentication.urls", namespace="auth")),
    path(API_V1 + "medicines/", include("apps.medicines.urls", namespace="medicines")),
    path(API_V1 + "inventory/", include("apps.inventory.urls", namespace="inventory")),
    path(API_V1 + "suppliers/", include("apps.suppliers.urls", namespace="suppliers")),
    path(API_V1 + "customers/", include("apps.customers.urls", namespace="customers")),
    path(API_V1 + "sales/", include("apps.sales.urls", namespace="sales")),
    path(API_V1 + "purchases/", include("apps.purchases.urls", namespace="purchases")),
    path(API_V1 + "prescriptions/", include("apps.prescriptions.urls", namespace="prescriptions")),
    path(API_V1 + "reports/", include("apps.reports.urls", namespace="reports")),
    path(API_V1 + "notifications/", include("apps.notifications.urls", namespace="notifications")),
    # API Schema & Docs
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="swagger-ui"),
    path("api/redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
