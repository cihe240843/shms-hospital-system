from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)

urlpatterns = [
    path("admin/", admin.site.urls),

    # JWT authentication
    path("api/token/", TokenObtainPairView.as_view(), name="token"),
    path("api/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),

    # ✅ ACCOUNTS (me + gps)
    path("api/", include("accounts.urls")),

    # Patients (staff-only)
    path("api/patients/", include("patients.urls")),

    # Appointments
    path("api/appointments/", include("appointments.urls")),

    # Reports
    path("api/reports/", include("reports.urls")),
]