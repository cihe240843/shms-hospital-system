from .models import AuditLog


METHOD_TO_ACTION = {
    'POST': 'CREATE',
    'PUT': 'UPDATE',
    'PATCH': 'UPDATE',
    'DELETE': 'DELETE',
}


def _client_ip(request):
    forwarded = request.META.get('HTTP_X_FORWARDED_FOR')
    if forwarded:
        return forwarded.split(',')[0].strip()
    return request.META.get('REMOTE_ADDR')


def _infer_role(user):
    group = user.groups.first()
    if group:
        role = (group.name or '').lower()
        if role in ['gp', 'nurse', 'admin', 'superadmin', 'patient']:
            return role

    username = (getattr(user, 'username', '') or '').lower()
    if username == 'superadmin':
        return 'superadmin'
    if username.startswith('admin'):
        return 'admin'
    if username.startswith('nurse'):
        return 'nurse'
    if hasattr(user, 'patient_profile') and user.patient_profile is not None:
        return 'patient'
    return 'gp'


def _resolve_action(request, default_action):
    parts = [p for p in request.path.strip('/').split('/') if p]
    resource = parts[1] if len(parts) > 1 else 'api'

    # Explicitly identify superadmin-driven patient record creation for compliance reporting.
    if request.method.upper() == 'POST' and resource == 'patients' and _infer_role(request.user) == 'superadmin':
        return 'SUPADMIN_PAT_CREATE'
    return default_action


class AuditRequestMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        try:
            if request.path.startswith('/api/') and getattr(request, 'user', None) and request.user.is_authenticated:
                method = request.method.upper()
                action = METHOD_TO_ACTION.get(method)
                if not action:
                    return response
                parts = [p for p in request.path.strip('/').split('/') if p]
                resource = parts[1] if len(parts) > 1 else 'api'
                resource_id = parts[2] if len(parts) > 2 else ''
                action = _resolve_action(request, action)

                AuditLog.objects.create(
                    user=request.user,
                    action=action,
                    resource=resource,
                    resource_id=resource_id,
                    ip_address=_client_ip(request),
                )
        except Exception:
            pass

        return response
