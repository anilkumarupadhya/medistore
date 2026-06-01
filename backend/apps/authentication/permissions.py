"""
Custom DRF permission classes for role-based access control.

Usage:
    from apps.authentication.permissions import IsAdmin, IsPharmacist, IsAdminOrInventoryManager

    class MyView(APIView):
        permission_classes = [IsAuthenticated, IsAdmin]
"""
from rest_framework.permissions import BasePermission
from .models import Role


class IsAdmin(BasePermission):
    """Only ADMIN role can access."""
    message = "Admin access required."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == Role.ADMIN
        )


class IsPharmacist(BasePermission):
    """Only PHARMACIST role can access."""
    message = "Pharmacist access required."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == Role.PHARMACIST
        )


class IsCashier(BasePermission):
    """Only CASHIER role can access."""
    message = "Cashier access required."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == Role.CASHIER
        )


class IsInventoryManager(BasePermission):
    """Only INVENTORY_MANAGER role can access."""
    message = "Inventory Manager access required."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role == Role.INVENTORY_MANAGER
        )


class IsAdminOrPharmacist(BasePermission):
    """Admin or Pharmacist can access."""
    message = "Admin or Pharmacist access required."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role in (Role.ADMIN, Role.PHARMACIST)
        )


class IsAdminOrInventoryManager(BasePermission):
    """Admin or Inventory Manager can access."""
    message = "Admin or Inventory Manager access required."

    def has_permission(self, request, view):
        return bool(
            request.user
            and request.user.is_authenticated
            and request.user.role in (Role.ADMIN, Role.INVENTORY_MANAGER)
        )


class IsAdminOrReadOnly(BasePermission):
    """Admin can write; any authenticated user can read."""

    def has_permission(self, request, view):
        if not request.user or not request.user.is_authenticated:
            return False
        if request.method in ("GET", "HEAD", "OPTIONS"):
            return True
        return request.user.role == Role.ADMIN
