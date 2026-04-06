from django.urls import path
from rest_framework.routers import DefaultRouter
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from .views import (
    AppointmentViewSet,
    reschedule_appointment,
    cancel_appointment,
)

router = DefaultRouter()
router.register(r"", AppointmentViewSet, basename="appointments")

urlpatterns = [
    # Router URLs:
    *router.urls,

    # ✅ Explicit action URLs (NO router magic)
    path("<uuid:pk>/reschedule/", api_view(["PATCH"])(permission_classes([IsAuthenticated])(reschedule_appointment))),
    path("<uuid:pk>/cancel/", api_view(["PATCH"])(permission_classes([IsAuthenticated])(cancel_appointment))),
]