import { useEffect, useState } from "react";
import api from "../api/api";
import HospitalLayout from "../layout/hospitalLayout";
import BookAppointment from "./BookAppointment";
import PatientReports from "./PatientReports";

export default function PatientDashboard() {
  const [page, setPage] = useState("dashboard");
  const [appointments, setAppointments] = useState([]);

  const loadAppointments = () => {
    api
      .get("appointments/")
      .then((res) => setAppointments(res.data.results || []))
      .catch(() => setAppointments([]));
  };

  useEffect(() => {
    loadAppointments();
  }, []);

  const reschedule = async (id) => {
    const input = prompt("Enter new date & time (YYYY-MM-DD HH:MM)");
    if (!input) return;

    await api.patch(`appointments/${id}/reschedule/`, {
      appointment_time: new Date(input).toISOString(),
    });

    loadAppointments();
  };

  const cancel = async (id) => {
    if (!window.confirm("Cancel this appointment?")) return;

    await api.patch(`appointments/${id}/cancel/`);
    loadAppointments();
  };

  const logout = () => {
    localStorage.removeItem("token");
    window.location.reload();
  };

  return (
    <HospitalLayout setPage={setPage} onLogout={logout}>
      {page === "dashboard" && (
        <>
          <div className="card">
            <h3>Book Appointment</h3>
            <BookAppointment onBooked={loadAppointments} />
          </div>

          <div className="card">
            <h3>Your Appointments</h3>

            {appointments.length === 0 ? (
              <p>No appointments found.</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Date & Time</th>
                    <th>Doctor</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {appointments.map((a) => (
                    <tr key={a.id}>
                      <td>
                        {new Date(a.appointment_time).toLocaleString()}
                      </td>
                      <td>{a.doctor_name}</td>
                      <td>{a.status}</td>
                      <td>
                        {a.status !== "CANCELLED" && (
                          <>
                            <button onClick={() => reschedule(a.id)}>
                              Reschedule
                            </button>{" "}
                            <button onClick={() => cancel(a.id)}>
                              Cancel
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {page === "reports" && (
        <div className="card">
          <h3>Your Medical Reports</h3>
          <PatientReports />
        </div>
      )}

      {page === "profile" && (
        <div className="card">
          <h3>Your Profile</h3>
          <p>{/* future profile info */}</p>
        </div>
      )}
    </HospitalLayout>
  );
}
