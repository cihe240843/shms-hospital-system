import React, { useEffect, useState } from "react";
import api from "../api/api";
import AddPatient from "./AddPatient";

export default function Patients() {
  const [patients, setPatients] = useState([]);

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

  return (
    <div style={{ padding: "40px" }}>
      <header style={{ display: "flex", justifyContent: "space-between" }}>
        <h2>Patients</h2>
        <button onClick={handleLogout}>Logout</button>
      </header>

      {/* CREATE PATIENT FORM */}
      <AddPatient onCreated={loadPatients} />

      {/* PATIENT LIST */}
      <ul>
        {patients.map(p => (
          <li key={p.id}>
            {p.first_name} {p.last_name}
          </li>
        ))}
      </ul>
    </div>
  );
}
