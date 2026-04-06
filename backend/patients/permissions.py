from rest_framework.permissions import BasePermission, SAFE_METHODS

class IsAdmin(BasePermission):
    def has_permission(self, request, view):
        return hasattr(request.user, "userprofile") and request.user.userprofile.role == "ADMIN"

class IsGP(BasePermission):
    def has_permission(self, request, view):
        return hasattr(request.user, "userprofile") and request.user.userprofile.role == "GP"

class IsNurseReadOnly(BasePermission):
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return hasattr(request.user, "userprofile") and request.user.userprofile.role == "NURSE"
        return False