from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
	AuditLogViewSet,
	SecurityAnalysisView,
	UserManagementView,
	UserManagementDetailView,
	CurrentUserView,
	DoctorListView,
	LogAnomalyView,
	UnlockAccountRequestView,
	VerifyUnlockTokenView,
	ResendUnlockTokenView,
)

router = DefaultRouter()
router.register(r"", AuditLogViewSet, basename="audit")
urlpatterns = [
	path("me/", CurrentUserView.as_view(), name="audit_me"),
	path("doctors/", DoctorListView.as_view(), name="audit_doctors"),
	path("security/", SecurityAnalysisView.as_view(), name="audit_security"),
	path("anomalies/", LogAnomalyView.as_view(), name="audit_anomalies"),
	path("users/", UserManagementView.as_view(), name="audit_users"),
	path("users/<int:user_id>/", UserManagementDetailView.as_view(), name="audit_user_detail"),
	path("unlock/request/", UnlockAccountRequestView.as_view(), name="audit_unlock_request"),
	path("unlock/verify/", VerifyUnlockTokenView.as_view(), name="audit_unlock_verify"),
	path("unlock/resend/", ResendUnlockTokenView.as_view(), name="audit_unlock_resend"),
	path("", include(router.urls)),
]
