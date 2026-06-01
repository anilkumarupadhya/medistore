"""
Authentication URL patterns.

All prefixed with /api/v1/auth/ by the root URLconf.
"""
from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    LoginView,
    LogoutView,
    MeView,
    ChangePasswordView,
    UserListCreateView,
    UserDetailView,
    AuditLogListView,
)

app_name = "auth"

urlpatterns = [
    # Token management
    path("login/", LoginView.as_view(), name="login"),
    path("logout/", LogoutView.as_view(), name="logout"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),

    # Current user
    path("me/", MeView.as_view(), name="me"),
    path("change-password/", ChangePasswordView.as_view(), name="change_password"),

    # User management (Admin only)
    path("users/", UserListCreateView.as_view(), name="user_list_create"),
    path("users/<uuid:pk>/", UserDetailView.as_view(), name="user_detail"),

    # Audit
    path("audit-logs/", AuditLogListView.as_view(), name="audit_logs"),
]
