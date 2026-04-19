from django.db import migrations
from apps.common.fields import _encrypt


def encrypt_existing_sensitive_data(apps, schema_editor):
    Patient = apps.get_model("patients", "Patient")
    for patient in Patient.objects.all().iterator():
        changed = False
        for field in ["fhir_id", "medicare_number", "phone", "address"]:
            value = getattr(patient, field)
            encrypted = _encrypt(value)
            if encrypted != value:
                setattr(patient, field, encrypted)
                changed = True
        if changed:
            Patient.objects.filter(pk=patient.pk).update(
                fhir_id=patient.fhir_id,
                medicare_number=patient.medicare_number,
                phone=patient.phone,
                address=patient.address,
            )


class Migration(migrations.Migration):

    dependencies = [
        ("patients", "0005_encrypt_sensitive_fields"),
    ]

    operations = [
        migrations.RunPython(encrypt_existing_sensitive_data, migrations.RunPython.noop),
    ]
