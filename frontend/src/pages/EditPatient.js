import React, { useState } from "react";
import api from "../api/api";

export default function EditPatient({ patient, onUpdated }) {
  const [form, setForm] = useState(patient);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.put(`patients/${patient.id}/`, form);
      onUpdated();
    } catch {
      setError("You are not allowed to update this patient.");
    }
  };

  return (
    <div style={{ marginLeft: "20px" }}>
      <h4>Edit</h4>
      {error && <p style={{ color: "red" }}>{error}</p>}

      <form onSubmit={handleSubmit}>
        <input name="first_name" value={form.first_name} onChange={handleChange} />
        <input name="last_name" value={form.last_name} onChange={handleChange} />
        <input name="email" value={form.email} onChange={handleChange} />
        <button type="submit">Save</button>
      </form>
    </div>
  );
}