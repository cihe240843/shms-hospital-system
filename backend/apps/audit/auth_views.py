import hashlib
import secrets
from datetime import timedelta
from django.conf import settings
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.core.mail import send_mail
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.tokens import RefreshToken
from .models import AuditLog, LoginSecurityState, MFAChallenge


def _hash_value(value):
    return hashlib.sha256(value.encode('utf-8')).hexdigest()


def _client_ip(request):
    forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
    if forwarded:
        return forwarded.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR')


def _audit(user, action, resource, resource_id, ip):
    try:
        AuditLog.objects.create(
            user=user,
            action=action,
            resource=resource,
            resource_id=resource_id,
            ip_address=ip,
        )
    except Exception:
        pass


class LoginInitiateView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        username = (request.data.get('username') or '').strip()
        password = request.data.get('password') or ''
        ip = _client_ip(request)

        if not username or not password:
            return Response({'detail': 'Username and password are required.'}, status=400)

        user = User.objects.filter(username=username).first()
        state = None
        if user:
            state, _ = LoginSecurityState.objects.get_or_create(user=user)
            if state.is_locked():
                _audit(user, 'LOGIN_LOCKED', 'auth', username, ip)
                return Response(
                    {
                        'detail': 'Account is temporarily locked due to failed login attempts.',
                        'locked_until': state.locked_until,
                    },
                    status=423,
                )

        authed_user = authenticate(request=request, username=username, password=password)
        if not authed_user:
            if state:
                state.failed_attempts += 1
                max_attempts = getattr(settings, 'AUTH_MAX_FAILED_ATTEMPTS', 5)
                if state.failed_attempts >= max_attempts:
                    lock_minutes = getattr(settings, 'AUTH_LOCKOUT_MINUTES', 15)
                    state.locked_until = timezone.now() + timedelta(minutes=lock_minutes)
                state.save(update_fields=['failed_attempts', 'locked_until', 'updated_at'])
            _audit(user, 'LOGIN_FAIL', 'auth', username, ip)
            return Response({'detail': 'Invalid credentials.'}, status=401)

        if not authed_user.is_active:
            _audit(authed_user, 'LOGIN_FAIL', 'auth', username, ip)
            return Response({'detail': 'Account is inactive.'}, status=403)

        state, _ = LoginSecurityState.objects.get_or_create(user=authed_user)
        state.failed_attempts = 0
        state.locked_until = None
        state.save(update_fields=['failed_attempts', 'locked_until', 'updated_at'])

        if not authed_user.email:
            return Response({'detail': 'Email is not configured for MFA.'}, status=400)

        otp_length = int(getattr(settings, 'AUTH_OTP_LENGTH', 6))
        otp = ''.join(str(secrets.randbelow(10)) for _ in range(otp_length))
        challenge_token = secrets.token_urlsafe(32)
        expires_minutes = int(getattr(settings, 'AUTH_OTP_EXPIRY_MINUTES', 5))

        MFAChallenge.objects.create(
            user=authed_user,
            token_hash=_hash_value(challenge_token),
            otp_hash=_hash_value(otp),
            ip_address=ip,
            expires_at=timezone.now() + timedelta(minutes=expires_minutes),
        )

        send_mail(
            subject='Your SHMS MFA code',
            message=f'Your verification code is: {otp}. It expires in {expires_minutes} minutes.',
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[authed_user.email],
            fail_silently=False,
        )

        _audit(authed_user, 'LOGIN_MFA_SENT', 'auth', username, ip)
        return Response({'status': 'mfa_required', 'challenge_token': challenge_token, 'expires_in': expires_minutes * 60})


class LoginVerifyView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        username = (request.data.get('username') or '').strip()
        challenge_token = (request.data.get('challenge_token') or '').strip()
        otp = (request.data.get('otp') or '').strip()
        ip = _client_ip(request)

        if not username or not challenge_token or not otp:
            return Response({'detail': 'Username, challenge token and OTP are required.'}, status=400)

        user = User.objects.filter(username=username).first()
        if not user:
            return Response({'detail': 'Invalid MFA verification request.'}, status=401)

        challenge = MFAChallenge.objects.filter(
            user=user,
            token_hash=_hash_value(challenge_token),
            used_at__isnull=True,
        ).first()

        if not challenge:
            _audit(user, 'LOGIN_MFA_FAIL', 'auth', username, ip)
            return Response({'detail': 'Invalid MFA challenge.'}, status=401)

        if challenge.expires_at < timezone.now():
            _audit(user, 'LOGIN_MFA_FAIL', 'auth', username, ip)
            return Response({'detail': 'MFA code expired.'}, status=401)

        if challenge.otp_hash != _hash_value(otp):
            _audit(user, 'LOGIN_MFA_FAIL', 'auth', username, ip)
            return Response({'detail': 'Invalid MFA code.'}, status=401)

        challenge.used_at = timezone.now()
        challenge.save(update_fields=['used_at'])

        refresh = RefreshToken.for_user(user)
        _audit(user, 'LOGIN_SUCCESS', 'auth', username, ip)
        return Response({'access': str(refresh.access_token), 'refresh': str(refresh)}, status=status.HTTP_200_OK)
