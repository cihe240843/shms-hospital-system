from django.urls import include, path
from rest_framework.routers import DefaultRouter
from .views import VitalObservationViewSet

router = DefaultRouter()
router.register(r"", VitalObservationViewSet, basename="vital")

urlpatterns = [path("", include(router.urls))]
