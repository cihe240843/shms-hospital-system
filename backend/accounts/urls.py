from django.urls import path
from .views import MeView, GPListView

urlpatterns = [
    path("me/", MeView.as_view(), name="me"),
    path("gps/", GPListView.as_view(), name="gp-list"),
]