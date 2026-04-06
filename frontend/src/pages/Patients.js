import React, { useEffect, useState } from "react";
import api from "../api/api";
import AddPatient from "./AddPatient";
import EditPatient from "./EditPatient";

export default function Patients() {
  const [patients, setPatients] = useState([]);
  const [editingId, setEditingId] = useState(null);

  // Load patients from API
  const loadPatients = () => {
    api
      .get("patients/")
      .then((res) => setPatients(res.data.results))
      .catch(() => alert("Access denied"));
  };

  useEffect(() => {
    loadPatients();
  }, []);

  // Logout
  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.reload();
  };

  // Delete patient (Admin only – backend enforced)
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this patient?")) return;

    try {
      await api.delete(`patients/${id}/`);
      loadPatients();
    } catch {
      alert("You are not allowed to delete this patient.");
    }
  };

  return (
    <div style={{ padding: "40px", maxWidth: "800px", margin: "auto" }}>
      {/* Header */}
      <header style={{ display: "flex", justifyContent: "space-between" }}>
        <h2>Patients</h2>
        <button onClick={handleLogout}>Logout</button>
      </header>

      <hr />

      {/* Create Patient (Admin / GP allowed) */}
      <AddPatient onCreated={loadPatients} />

      <hr />

      {/* Patients List */}
      <ul>
        {patients.map((p) => (
          <li key={p.id} style={{ marginBottom: "10px" }}>
            <strong>
              {p.first_name} {p.last_name}
            </strong>

            <button
              style={{ marginLeft: "10px" }}
              onClick={() => setEditingId(p.id)}
            >
              Edit
            </button>

            <button
              style={{ marginLeft: "5px" }}
              onClick={() => handleDelete(p.id)}
            >
              Delete
            </button>

            {/* Edit Form */}
            {editingId === p.id && (
              <EditPatient
                patient={p}
                onUpdated={() => {
                  setEditingId(null);
                  loadPatients();
                }}
              />
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}