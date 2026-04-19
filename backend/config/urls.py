from django.contrib import admin
from django.urls import path, include
from rest_framework_simplejwt.views import TokenRefreshView

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    path("api/auth/", include("apps.audit.auth_urls")),
    path("api/patients/", include("apps.patients.urls")),
    path("api/appointments/", include("apps.appointments.urls")),
    path("api/inventory/", include("apps.inventory.urls")),
    path("api/billing/", include("apps.billing.urls")),
    path("api/audit/", include("apps.audit.urls")),
    path("api/vitals/", include("apps.vitals.urls")),
]
