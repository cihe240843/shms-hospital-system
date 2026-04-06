import React, { useState } from "react";
import api from "../api/api";

/* =========================
   Styles
   ========================= */

const boxStyle = {
  marginBottom: "20px",
  padding: "16px",
  border: "1px solid #ddd",
  borderRadius: "6px",
  background: "#f9fbfd",
};

const inputStyle = {
  width: "100%",
  padding: "8px",
  marginBottom: "10px",
};

/* =========================
   Component
   ========================= */

export default function BookAppointment({ onBooked }) {
  const [gpId, setGpId] = useState("");
  const [time, setTime] = useState("");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      await api.post("appointments/", {
        gp: gpId,
        appointment_time: time,
      });

      setMessage("✅ Appointment booked successfully");

      setGpId("");
      setTime("");

      // ✅ IMPORTANT: reload appointments list
      if (onBooked) {
        onBooked();
      }
    } catch {
      setMessage("❌ Unable to book appointment");
    }
  };

  return (
    <div style={boxStyle}>
      <h3>Book Appointment</h3>

      <form onSubmit={handleSubmit}>
        <input
          style={inputStyle}
          placeholder="GP User ID"
          value={gpId}
          onChange={(e) => setGpId(e.target.value)}
          required
        />

        <input
          style={inputStyle}
          type="datetime-local"
          value={time}
          onChange={(e) => setTime(e.target.value)}
          required
        />

        <button type="submit">Book</button>
      </form>

      {message && <p>{message}</p>}
    </div>
  );
}
