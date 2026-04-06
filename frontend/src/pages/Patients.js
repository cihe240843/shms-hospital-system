import React, { useEffect, useState } from "react";
import api from "../api/api";
import AddPatient from "./AddPatient";
import EditPatient from "./EditPatient";

export default function Patients() {
  const [patients, setPatients] = useState([]);
  const [editingId, setEditingId] = useState(null);

  const loadPatients = () => {
    api.get("patients/")
      .then(res => setPatients(res.data.results))
      .catch(() => alert("Access denied"));
  };

  useEffect(() => {
    loadPatients();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.reload();
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this patient record?")) return;
    try {
      await api.delete(`patients/${id}/`);
      loadPatients();
    } catch {
      alert("Not authorised");
    }
  };

  return (
    <div style={page}>
      <header style={header}>
        <h2>🏥 Patient Management</h2>
        <button onClick={handleLogout}>Logout</button>
      </header>

      <div style={content}>
        <AddPatient onCreated={loadPatients} />

        <table style={table}>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {patients.map(p => (
              <tr key={p.id}>
                <td>{p.first_name} {p.last_name}</td>
                <td>{p.email}</td>
                <td>
                  <button onClick={() => setEditingId(p.id)}>Edit</button>
                  <button onClick={() => handleDelete(p.id)}>Delete</button>

                  {editingId === p.id && (
                    <EditPatient
                      patient={p}
                      onUpdated={() => {
                        setEditingId(null);
                        loadPatients();
                      }}
                    />
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* Styles */
const page = {
  background: "#f4f8fb",
  minHeight: "100vh",
};

const header = {
  background: "#1976d2",
  color: "white",
  padding: "16px 24px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
};

const content = {
  maxWidth: "1000px",
  margin: "30px auto",
  background: "white",
  padding: "20px",
  borderRadius: "8px",
};

const table = {
  width: "100%",
  borderCollapse: "collapse",
};