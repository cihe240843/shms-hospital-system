from django.core.management.base import BaseCommand

from apps.appointments.models import Appointment
from apps.patients.models import Patient
from apps.vitals.models import VitalObservation


class Command(BaseCommand):
    help = "Re-encrypt sensitive SHMS fields using the current primary field encryption key."

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Show how many rows would be rewritten without saving anything.",
        )

    def handle(self, *args, **options):
        dry_run = options["dry_run"]
        counters = {
            "patients": 0,
            "appointments": 0,
            "vitals": 0,
        }

        patients = Patient.objects.all().iterator()
        for patient in patients:
            if dry_run:
                counters["patients"] += 1
            else:
                patient.save(update_fields=["fhir_id", "medicare_number", "phone", "address"])
                counters["patients"] += 1

        appointments = Appointment.objects.all().iterator()
        for appointment in appointments:
            if dry_run:
                counters["appointments"] += 1
            else:
                appointment.save(update_fields=["notes"])
                counters["appointments"] += 1

        vitals = VitalObservation.objects.all().iterator()
        for vital in vitals:
            if dry_run:
                counters["vitals"] += 1
            else:
                vital.save(update_fields=["chief_complaint", "allergy_notes", "triage_notes"])
                counters["vitals"] += 1

        mode = "would be rotated" if dry_run else "rotated"
        self.stdout.write(
            self.style.SUCCESS(
                f"Encryption key rotation complete: {counters['patients']} patient rows {mode}, "
                f"{counters['appointments']} appointment rows {mode}, "
                f"{counters['vitals']} vitals rows {mode}."
            )
        )
