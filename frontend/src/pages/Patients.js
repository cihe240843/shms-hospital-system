import React, { useEffect, useState } from "react";
import api from "../api/api";

export default function Patients({ onLogout }) {
  const [patients, setPatients] = useState([]);

  useEffect(() => {
    api.get("patients/")
      .then(res => setPatients(res.data.results))
      .catch(() => alert("Access denied"));
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.reload(); // simplest and safe
  };

  return (
    <div style={{ padding: "40px" }}>
      <header style={{ display: "flex", justifyContent: "space-between" }}>
        <h2>Patients</h2>
        <button onClick={handleLogout}>Logout</button>
      </header>

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