from django.utils import timezone
from django.http import HttpResponse
from rest_framework import viewsets, permissions
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.response import Response
from .models import Invoice
from .serializers import InvoiceSerializer


def infer_role(user):
    group = user.groups.first()
    if group:
        role = group.name.lower()
        if role in ["gp", "nurse", "admin", "superadmin", "patient"]:
            return role
    username = (user.username or "").lower()
    if username == "superadmin":
        return "superadmin"
    if username.startswith("admin"):
        return "admin"
    if username.startswith("nurse"):
        return "nurse"
    if hasattr(user, "patient_profile") and user.patient_profile is not None:
        return "patient"
    return "gp"


def _format_invoice_datetime(value):
    if not value:
        return "-"
    if timezone.is_naive(value):
        return value.strftime("%Y-%m-%d %H:%M")
    return timezone.localtime(value).strftime("%Y-%m-%d %H:%M")

class InvoiceViewSet(viewsets.ModelViewSet):
    queryset = Invoice.objects.all()
    serializer_class = InvoiceSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        role = infer_role(self.request.user)
        qs = Invoice.objects.select_related("patient").all()
        if role == "patient":
            qs = qs.filter(patient__user=self.request.user)
        return qs

    @action(detail=True, methods=["post"])
    def mark_paid(self, request, pk=None):
        invoice = self.get_object()
        role = infer_role(request.user)
        if role == "patient" and invoice.patient.user_id != request.user.id:
            raise PermissionDenied("You can only pay your own invoices.")
        invoice.status = "paid"
        invoice.paid_at = timezone.now()
        invoice.save()
        return Response({"status": "paid"})

    @action(detail=True, methods=["get"], url_path="download")
    def download(self, request, pk=None):
        invoice = self.get_object()
        role = infer_role(request.user)
        if role == "patient" and invoice.patient.user_id != request.user.id:
            raise PermissionDenied("You can only download your own invoices.")

        issued = _format_invoice_datetime(invoice.issued_at)
        paid = _format_invoice_datetime(invoice.paid_at)
        patient_name = f"{invoice.patient.first_name} {invoice.patient.last_name}".strip()
        content = (
            "SHMS Invoice Summary\n"
            "=====================\n"
            f"Invoice ID: {invoice.id}\n"
            f"Patient: {patient_name}\n"
            f"Description: {invoice.description}\n"
            f"Amount: ${invoice.amount}\n"
            f"Status: {invoice.status}\n"
            f"Issued At: {issued}\n"
            f"Paid At: {paid}\n"
        )

        response = HttpResponse(content, content_type="text/plain; charset=utf-8")
        response["Content-Disposition"] = f'attachment; filename="invoice-{invoice.id}.txt"'
        return response
