import React, { useEffect, useState } from "react";
import api from "../api/api";
import BookAppointment from "./BookAppointment";
import PatientReports from "./PatientReports";


/* =========================
   Styles
   ========================= */

const page = { minHeight: "100vh", background: "#f4f8fb" };
const header = {
  background: "#1976d2",
  color: "white",
  padding: "16px 24px",
  display: "flex",
  justifyContent: "space-between",
};
const content = {
  maxWidth: "800px",
  margin: "30px auto",
  background: "white",
  padding: "24px",
  borderRadius: "8px",
};
const button = { marginRight: "8px" };

/* =========================
   Component
   ========================= */

export default function PatientDashboard() {
  const [appointments, setAppointments] = useState([]);
  const [newTime, setNewTime] = useState("");

  const loadAppointments = () => {
    api.get("appointments/")
      .then(res => {
        if (Array.isArray(res.data.results)) {
          setAppointments(res.data.results);
        } else {
          setAppointments([]);
        }
      })
      .catch(() => setAppointments([]));
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  const logout = () => {
    localStorage.removeItem("token");
    window.location.reload();
  };

  const reschedule = async (id) => {
    if (!newTime) {
      alert("Select a new date/time first.");
      return;
    }

const isoTime = new Date(newTime).toISOString();

await api.patch(`appointments/${id}/reschedule/`, {
  appointment_time: isoTime,
});
    setNewTime("");
    loadAppointments();
  };

  const cancel = async (id) => {
    if (!window.confirm("Cancel this appointment?")) return;

    await api.patch(`appointments/${id}/cancel/`);
    loadAppointments();
  };

  return (
    <div style={page}>
      <header style={header}>
        <h2>🏥 Patient Portal</h2>
        <button onClick={logout}>Logout</button>
      </header>

      <div style={content}>
        <BookAppointment onBooked={loadAppointments} />
<hr />
<PatientReports />


        
        <h3>Your Appointments</h3>

        <input
          type="datetime-local"
          value={newTime}
          onChange={(e) => setNewTime(e.target.value)}
        />

        <ul>
          {appointments.map(a => (
            <li key={a.id}>
              <strong>
                {new Date(a.appointment_time).toLocaleString()}
              </strong>
              {" "}— <em>{a.status}</em>
              <br />

              {a.status !== "CANCELLED" && (
                <>
                  <button
                    style={button}
                    onClick={() => reschedule(a.id)}
                  >
                    Reschedule
                  </button>
                  <button onClick={() => cancel(a.id)}>
                    Cancel
                  </button>
                </>
              )}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
