from django.db import migrations
from apps.common.fields import _encrypt


def encrypt_existing_triage_data(apps, schema_editor):
    VitalObservation = apps.get_model("vitals", "VitalObservation")
    for vital in VitalObservation.objects.all().iterator():
        values = {
            "chief_complaint": _encrypt(vital.chief_complaint),
            "allergy_notes": _encrypt(vital.allergy_notes),
            "triage_notes": _encrypt(vital.triage_notes),
        }
        if (
            values["chief_complaint"] != vital.chief_complaint
            or values["allergy_notes"] != vital.allergy_notes
            or values["triage_notes"] != vital.triage_notes
        ):
            VitalObservation.objects.filter(pk=vital.pk).update(**values)


class Migration(migrations.Migration):

    dependencies = [
        ("vitals", "0003_encrypt_triage_fields"),
    ]

    operations = [
        migrations.RunPython(encrypt_existing_triage_data, migrations.RunPython.noop),
    ]
