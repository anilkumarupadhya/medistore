"""
Authentication API views:
  POST /auth/login/           → obtain access + refresh tokens
  POST /auth/token/refresh/   → rotate refresh token
  POST /auth/logout/          → blacklist refresh token
  GET  /auth/me/              → current user profile
  PUT  /auth/me/              → update profile
  POST /auth/change-password/ → change own password
  GET  /auth/users/           → list users (Admin only)
  POST /auth/users/           → create user (Admin only)
  GET  /auth/users/{id}/      → get user (Admin only)
  PUT  /auth/users/{id}/      → update user (Admin only)
  DEL  /auth/users/{id}/      → deactivate user (Admin only)
  GET  /auth/audit-logs/      → audit trail (Admin only)
"""
import logging
from django.utils import timezone
from rest_framework import status, generics
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.tokens import RefreshToken
from rest_framework_simplejwt.exceptions import TokenError
from drf_spectacular.utils import extend_schema, OpenApiExample

from .models import User, AuditLog
from .serializers import (
    UserSerializer,
    UserCreateSerializer,
    UserUpdateSerializer,
    ChangePasswordSerializer,
    AuditLogSerializer,
    CustomTokenObtainPairSerializer,
)
from .permissions import IsAdmin

logger = logging.getLogger(__name__)


def _get_client_ip(request) -> str:
    x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
    if x_forwarded_for:
        return x_forwarded_for.split(",")[0].strip()
    return request.META.get("REMOTE_ADDR", "")


def _log_action(user, action, request, resource="", resource_id="", success=True, extra=None):
    AuditLog.objects.create(
        user=user,
        action=action,
        resource=resource,
        resource_id=str(resource_id),
        ip_address=_get_client_ip(request),
        user_agent=request.META.get("HTTP_USER_AGENT", "")[:500],
        success=success,
        extra_data=extra or {},
    )


# ---------------------------------------------------------------------------
# Login
# ---------------------------------------------------------------------------

class LoginView(TokenObtainPairView):
    """
    Authenticate with email + password. Returns access and refresh JWT tokens
    along with the authenticated user's profile.
    """

    serializer_class = CustomTokenObtainPairSerializer
    permission_classes = [AllowAny]

    @extend_schema(
        summary="Login",
        description="Obtain JWT access and refresh tokens using email and password.",
        examples=[
            OpenApiExample(
                "Admin login",
                value={"email": "admin@medistore.com", "password": "Admin@1234"},
                request_only=True,
            )
        ],
    )
    def post(self, request, *args, **kwargs):
        email = request.data.get("email", "")
        response = super().post(request, *args, **kwargs)

        if response.status_code == status.HTTP_200_OK:
            user = User.objects.filter(email=email).first()
            if user:
                user.last_login_ip = _get_client_ip(request)
                user.save(update_fields=["last_login_ip"])
                _log_action(user, AuditLog.Action.LOGIN, request, resource="auth")
            return Response(
                {"success": True, "data": response.data},
                status=status.HTTP_200_OK,
            )

        # Failed login
        _log_action(
            None,
            AuditLog.Action.LOGIN_FAILED,
            request,
            resource="auth",
            success=False,
            extra={"email": email},
        )
        return Response(
            {
                "success": False,
                "error": {
                    "code": "INVALID_CREDENTIALS",
                    "message": "Invalid email or password.",
                    "details": {},
                },
            },
            status=status.HTTP_401_UNAUTHORIZED,
        )


# ---------------------------------------------------------------------------
# Logout
# ---------------------------------------------------------------------------

class LogoutView(APIView):
    """
    Blacklist the provided refresh token to invalidate the session.
    """

    permission_classes = [IsAuthenticated]

    @extend_schema(
        summary="Logout",
        description="Blacklist the refresh token to log the user out.",
        request={"application/json": {"type": "object", "properties": {"refresh": {"type": "string"}}}},
    )
    def post(self, request):
        refresh_token = request.data.get("refresh")
        if not refresh_token:
            return Response(
                {"success": False, "error": {"code": "BAD_REQUEST", "message": "Refresh token required.", "details": {}}},
                status=status.HTTP_400_BAD_REQUEST,
            )
        try:
            token = RefreshToken(refresh_token)
            token.blacklist()
            _log_action(request.user, AuditLog.Action.LOGOUT, request, resource="auth")
            return Response({"success": True, "message": "Logged out successfully."}, status=status.HTTP_200_OK)
        except TokenError:
            return Response(
                {"success": False, "error": {"code": "BAD_REQUEST", "message": "Invalid or expired token.", "details": {}}},
                status=status.HTTP_400_BAD_REQUEST,
            )


# ---------------------------------------------------------------------------
# Current user profile
# ---------------------------------------------------------------------------

class MeView(APIView):
    """
    GET  → Return the authenticated user's profile.
    PUT  → Update first_name, last_name, phone, avatar.
    """

    permission_classes = [IsAuthenticated]

    @extend_schema(summary="Get my profile", responses={200: UserSerializer})
    def get(self, request):
        return Response(
            {"success": True, "data": UserSerializer(request.user).data}
        )

    @extend_schema(summary="Update my profile", request=UserUpdateSerializer, responses={200: UserSerializer})
    def put(self, request):
        serializer = UserUpdateSerializer(request.user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        _log_action(request.user, AuditLog.Action.UPDATE, request, resource="user", resource_id=request.user.id)
        return Response({"success": True, "data": UserSerializer(request.user).data})


# ---------------------------------------------------------------------------
# Change password
# ---------------------------------------------------------------------------

class ChangePasswordView(APIView):
    """Change the authenticated user's password."""

    permission_classes = [IsAuthenticated]

    @extend_schema(summary="Change password", request=ChangePasswordSerializer)
    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        request.user.set_password(serializer.validated_data["new_password"])
        request.user.save(update_fields=["password"])
        _log_action(request.user, AuditLog.Action.PASSWORD_CHANGE, request, resource="user", resource_id=request.user.id)
        return Response({"success": True, "message": "Password changed successfully."})


# ---------------------------------------------------------------------------
# User management (Admin only)
# ---------------------------------------------------------------------------

class UserListCreateView(generics.ListCreateAPIView):
    """
    GET  → List all users (Admin only).
    POST → Create a new user (Admin only).
    """

    permission_classes = [IsAuthenticated, IsAdmin]
    queryset = User.objects.all().order_by("-created_at")
    filterset_fields = ["role", "is_active"]
    search_fields = ["email", "first_name", "last_name", "phone"]

    def get_serializer_class(self):
        if self.request.method == "POST":
            return UserCreateSerializer
        return UserSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        _log_action(request.user, AuditLog.Action.CREATE, request, resource="user", resource_id=user.id)
        return Response(
            {"success": True, "data": UserSerializer(user).data},
            status=status.HTTP_201_CREATED,
        )

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        page = self.paginate_queryset(queryset)
        if page is not None:
            return self.get_paginated_response(UserSerializer(page, many=True).data)
        return Response({"success": True, "data": UserSerializer(queryset, many=True).data})


class UserDetailView(generics.RetrieveUpdateDestroyAPIView):
    """
    GET    → Retrieve user (Admin only).
    PUT    → Update user role / active status (Admin only).
    DELETE → Soft-deactivate user (Admin only).
    """

    permission_classes = [IsAuthenticated, IsAdmin]
    queryset = User.objects.all()
    serializer_class = UserSerializer

    def update(self, request, *args, **kwargs):
        user = self.get_object()
        serializer = UserCreateSerializer(user, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        _log_action(request.user, AuditLog.Action.UPDATE, request, resource="user", resource_id=user.id)
        return Response({"success": True, "data": UserSerializer(user).data})

    def destroy(self, request, *args, **kwargs):
        user = self.get_object()
        user.is_active = False
        user.save(update_fields=["is_active"])
        _log_action(request.user, AuditLog.Action.DELETE, request, resource="user", resource_id=user.id)
        return Response({"success": True, "message": "User deactivated."}, status=status.HTTP_200_OK)


# ---------------------------------------------------------------------------
# Audit logs (Admin only)
# ---------------------------------------------------------------------------

class AuditLogListView(generics.ListAPIView):
    """List audit log entries. Admin only."""

    permission_classes = [IsAuthenticated, IsAdmin]
    serializer_class = AuditLogSerializer
    queryset = AuditLog.objects.select_related("user").order_by("-created_at")
    filterset_fields = ["action", "success"]
    search_fields = ["user__email", "resource", "resource_id"]
