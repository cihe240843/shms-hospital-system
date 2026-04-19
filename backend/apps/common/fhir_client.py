import requests
from django.conf import settings


class FHIRSyncError(Exception):
    pass


def _base_url():
    return str(getattr(settings, "FHIR_BASE_URL", "http://localhost:8090/fhir")).rstrip("/")


def _enabled():
    return bool(getattr(settings, "FHIR_SYNC_ENABLED", True))


def _timeout_seconds():
    return int(getattr(settings, "FHIR_SYNC_TIMEOUT_SECONDS", 10))


def build_patient_resource(patient):
    resource = {
        "resourceType": "Patient",
        "active": bool(patient.is_active),
        "identifier": [
            {
                "system": "urn:shms:patient-id",
                "value": str(patient.id),
            }
        ],
        "name": [
            {
                "use": "official",
                "family": patient.last_name or "",
                "given": [patient.first_name or ""],
            }
        ],
    }

    if patient.dob:
        resource["birthDate"] = patient.dob.isoformat()

    telecom = []
    if patient.phone:
        telecom.append({"system": "phone", "value": patient.phone, "use": "mobile"})
    if patient.email:
        telecom.append({"system": "email", "value": patient.email, "use": "home"})
    if telecom:
        resource["telecom"] = telecom

    if patient.address:
        resource["address"] = [{"text": patient.address, "use": "home"}]

    return resource


def sync_patient(patient):
    """
    Upsert a patient in HAPI FHIR.
    Returns FHIR id if sync succeeds, else returns existing patient.fhir_id when sync is disabled.
    Raises FHIRSyncError only on actual sync failures.
    """
    if not _enabled():
        return patient.fhir_id

    resource = build_patient_resource(patient)
    headers = {"Content-Type": "application/fhir+json", "Accept": "application/fhir+json"}

    try:
        if patient.fhir_id:
            url = f"{_base_url()}/Patient/{patient.fhir_id}"
            response = requests.put(url, json=resource, headers=headers, timeout=_timeout_seconds())
        else:
            url = f"{_base_url()}/Patient"
            response = requests.post(url, json=resource, headers=headers, timeout=_timeout_seconds())

        if response.status_code not in (200, 201):
            raise FHIRSyncError(f"FHIR Patient sync failed ({response.status_code}): {response.text[:300]}")

        data = response.json() if response.content else {}
        fhir_id = data.get("id")

        if not fhir_id:
            location = response.headers.get("Location", "")
            if "/Patient/" in location:
                fhir_id = location.rstrip("/").split("/")[-1]

        if not fhir_id:
            raise FHIRSyncError("FHIR Patient sync succeeded but no Patient id was returned")

        return fhir_id
    except requests.RequestException as exc:
        raise FHIRSyncError(f"FHIR Patient sync connection error: {exc}") from exc
