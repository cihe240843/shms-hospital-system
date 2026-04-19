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
