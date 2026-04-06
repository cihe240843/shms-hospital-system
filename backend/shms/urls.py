from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import (
    TokenObtainPairView,
    TokenRefreshView,
)
from accounts.views import MeView

urlpatterns = [
    path("admin/", admin.site.urls),

    # JWT authentication
    path("api/token/", TokenObtainPairView.as_view(), name="token"),
    path("api/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),

    # ✅ WHO AM I — DIRECT (NO include)
    path("api/me/", MeView.as_view(), name="me"),

    # Staff patient management
    path("api/patients/", include("patients.urls")),

    # Appointments
    path("api/appointments/", include("appointments.urls")),
    path("api/reports/", include("reports.urls")),

]