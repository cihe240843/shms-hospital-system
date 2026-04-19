import requests
from django.conf import settings
from django.utils import timezone


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


def _observation_resource(vital, patient_fhir_id, *, code_system, code, display, value, unit, unit_system, unit_code):
    effective_at = vital.created_at or timezone.now()
    resource = {
        "resourceType": "Observation",
        "status": "final",
        "category": [
            {
                "coding": [
                    {
                        "system": "http://terminology.hl7.org/CodeSystem/observation-category",
                        "code": "vital-signs",
                        "display": "Vital Signs",
                    }
                ]
            }
        ],
        "code": {
            "coding": [
                {
                    "system": code_system,
                    "code": code,
                    "display": display,
                }
            ],
            "text": display,
        },
        "subject": {"reference": f"Patient/{patient_fhir_id}"},
        "effectiveDateTime": effective_at.isoformat(),
        "valueQuantity": {
            "value": float(value),
            "unit": unit,
            "system": unit_system,
            "code": unit_code,
        },
    }

    if vital.recorded_by:
        resource["performer"] = [
            {
                "display": vital.recorded_by.get_full_name() or vital.recorded_by.username,
            }
        ]

    return resource


def build_vital_observation_resources(vital, patient_fhir_id):
    observations = []

    observations.append(
        _observation_resource(
            vital,
            patient_fhir_id,
            code_system="http://loinc.org",
            code="8480-6",
            display="Systolic blood pressure",
            value=vital.bp_systolic,
            unit="mmHg",
            unit_system="http://unitsofmeasure.org",
            unit_code="mm[Hg]",
        )
    )

    observations.append(
        _observation_resource(
            vital,
            patient_fhir_id,
            code_system="http://loinc.org",
            code="8462-4",
            display="Diastolic blood pressure",
            value=vital.bp_diastolic,
            unit="mmHg",
            unit_system="http://unitsofmeasure.org",
            unit_code="mm[Hg]",
        )
    )

    observations.append(
        _observation_resource(
            vital,
            patient_fhir_id,
            code_system="http://loinc.org",
            code="8867-4",
            display="Heart rate",
            value=vital.heart_rate,
            unit="beats/minute",
            unit_system="http://unitsofmeasure.org",
            unit_code="/min",
        )
    )

    observations.append(
        _observation_resource(
            vital,
            patient_fhir_id,
            code_system="http://loinc.org",
            code="8310-5",
            display="Body temperature",
            value=vital.temperature,
            unit="degrees C",
            unit_system="http://unitsofmeasure.org",
            unit_code="Cel",
        )
    )

    if vital.height_cm is not None:
        observations.append(
            _observation_resource(
                vital,
                patient_fhir_id,
                code_system="http://loinc.org",
                code="8302-2",
                display="Body height",
                value=vital.height_cm,
                unit="cm",
                unit_system="http://unitsofmeasure.org",
                unit_code="cm",
            )
        )

    if vital.weight_kg is not None:
        observations.append(
            _observation_resource(
                vital,
                patient_fhir_id,
                code_system="http://loinc.org",
                code="29463-7",
                display="Body weight",
                value=vital.weight_kg,
                unit="kg",
                unit_system="http://unitsofmeasure.org",
                unit_code="kg",
            )
        )

    if vital.pain_score is not None:
        observations.append(
            _observation_resource(
                vital,
                patient_fhir_id,
                code_system="http://loinc.org",
                code="72514-3",
                display="Pain severity",
                value=vital.pain_score,
                unit="score",
                unit_system="http://unitsofmeasure.org",
                unit_code="{score}",
            )
        )

    return observations


def sync_vitals(vital):
    """
    Send vitals to HAPI as FHIR Observation resources.
    Ensures patient has a FHIR id first.
    Returns number of Observation resources sent.
    """
    if not _enabled():
        return 0

    patient = vital.patient
    patient_fhir_id = patient.fhir_id
    if not patient_fhir_id:
        patient_fhir_id = sync_patient(patient)
        if patient_fhir_id and patient.fhir_id != patient_fhir_id:
            patient.fhir_id = patient_fhir_id
            patient.save(update_fields=["fhir_id"])

    observations = build_vital_observation_resources(vital, patient_fhir_id)
    headers = {"Content-Type": "application/fhir+json", "Accept": "application/fhir+json"}

    try:
        for resource in observations:
            url = f"{_base_url()}/Observation"
            response = requests.post(url, json=resource, headers=headers, timeout=_timeout_seconds())
            if response.status_code not in (200, 201):
                raise FHIRSyncError(f"FHIR Observation sync failed ({response.status_code}): {response.text[:300]}")
    except requests.RequestException as exc:
        raise FHIRSyncError(f"FHIR Observation sync connection error: {exc}") from exc

    return len(observations)
