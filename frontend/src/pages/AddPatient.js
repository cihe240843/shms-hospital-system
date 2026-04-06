import React, { useState } from "react";
import api from "../api/api";

export default function AddPatient({ onCreated }) {
  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    date_of_birth: "",
    email: "",
    phone: "",
    address: "",
  });

  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await api.post("patients/", form);
      onCreated();   // refresh patients list
    } catch (err) {
      setError("You are not allowed to create patients.");
    }
  };

  return (
    <div style={{ marginBottom: "20px" }}>
      <h3>Add Patient</h3>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <form onSubmit={handleSubmit}>
        <input name="first_name" placeholder="First name" onChange={handleChange} />
        <input name="last_name" placeholder="Last name" onChange={handleChange} />
        <input name="date_of_birth" type="date" onChange={handleChange} />
        <input name="email" placeholder="Email" onChange={handleChange} />
        <input name="phone" placeholder="Phone" onChange={handleChange} />
        <input name="address" placeholder="Address" onChange={handleChange} />
        <br />
        <button type="submit">Create Patient</button>
      </form>
    </div>
  );
}