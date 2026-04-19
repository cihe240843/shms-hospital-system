from django.urls import path
from .auth_views import LoginInitiateView, LoginVerifyView

urlpatterns = [
    path('login/initiate/', LoginInitiateView.as_view(), name='auth_login_initiate'),
    path('login/verify/', LoginVerifyView.as_view(), name='auth_login_verify'),
]
