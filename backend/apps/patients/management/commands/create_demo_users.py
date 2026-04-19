from django.core.management.base import BaseCommand
from django.contrib.auth.models import Group, User
from apps.patients.models import Patient
from apps.inventory.models import InventoryItem
from apps.billing.models import Invoice
import datetime

class Command(BaseCommand):
    help = "Create demo users and seed data"

    def handle(self, *args, **kwargs):
        # Users
        users = [
            ("dr.smith", "Smith", "John", "password123"),
            ("nurse.jones", "Jones", "Mary", "password123"),
            ("admin.lee", "Lee", "Tom", "password123"),
            ("superadmin", "Admin", "Super", "password123"),
        ]
        roles = {
            "dr.smith": "gp",
            "nurse.jones": "nurse",
            "admin.lee": "admin",
            "superadmin": "superadmin",
        }
        for username, last, first, pw in users:
            if not User.objects.filter(username=username).exists():
                u = User.objects.create_user(username=username, password=pw,
                    first_name=first, last_name=last,
                    email=f"{username}@hospital.com")
                self.stdout.write(f"Created user: {username}")
            else:
                u = User.objects.get(username=username)

            role = roles.get(username, "gp")
            group, _ = Group.objects.get_or_create(name=role)
            u.groups.clear()
            u.groups.add(group)

        # Patients
        if Patient.objects.count() == 0:
            gp = User.objects.filter(username="dr.smith").first()
            patients_data = [
                ("Jane", "Cooper", "1985-03-12", "2234567890"),
                ("Robert", "Fox", "1972-09-03", "3345678901"),
                ("Emily", "Walsh", "1990-07-27", "4456789012"),
                ("Mark", "Johnson", "1968-01-15", "5567890123"),
                ("Sara", "Lee", "1995-11-09", "6678901234"),
            ]
            for fn, ln, dob, mc in patients_data:
                Patient.objects.create(first_name=fn, last_name=ln,
                    dob=dob, medicare_number=mc, primary_doctor=gp)
            self.stdout.write("Created demo patients")

        # Inventory
        if InventoryItem.objects.count() == 0:
            items = [
                ("Paracetamol 500mg", "Medication", 1200, 200, "tablet"),
                ("Disposable Gloves (M)", "PPE", 45, 50, "box"),
                ("Insulin (Rapid)", "Medication", 30, 40, "vial"),
                ("Surgical Masks", "PPE", 500, 100, "units"),
                ("Blood Pressure Monitor", "Equipment", 8, 5, "units"),
            ]
            for name, cat, qty, thresh, unit in items:
                InventoryItem.objects.create(name=name, category=cat,
                    quantity=qty, low_stock_threshold=thresh, unit=unit)
            self.stdout.write("Created demo inventory")

        # Invoices
        if Invoice.objects.count() == 0:
            patient = Patient.objects.first()
            if patient:
                Invoice.objects.create(patient=patient, description="GP Consultation",
                    amount=85.00, status="paid")
                Invoice.objects.create(patient=patient, description="Blood Test Panel",
                    amount=220.00, status="unpaid")
            self.stdout.write("Created demo invoices")

        self.stdout.write(self.style.SUCCESS("Demo data ready!"))
