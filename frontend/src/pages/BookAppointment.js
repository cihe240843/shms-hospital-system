import { useEffect, useState } from "react";
import api from "../api/api";

export default function BookAppointment({ onBooked }) {
  const [gps, setGps] = useState([]);
  const [selectedGp, setSelectedGp] = useState("");
  const [time, setTime] = useState("");
  const [message, setMessage] = useState("");

  // Load GP list
  useEffect(() => {
    api.get("gps/")
      .then((res) => setGps(res.data))
      .catch(() => setGps([]));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");

    try {
      await api.post("appointments/", {
        gp: selectedGp,
        appointment_time: new Date(time).toISOString(),
      });

      setMessage("✅ Appointment booked successfully");
      setSelectedGp("");
      setTime("");

      if (onBooked) onBooked();
    } catch (err) {
      setMessage("❌ Unable to book appointment");
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <label><strong>Select GP</strong></label>
      <select
        value={selectedGp}
        onChange={(e) => setSelectedGp(e.target.value)}
        required
      >
        <option value="">-- Select a GP --</option>
        {gps.map((gp) => (
          <option key={gp.id} value={gp.id}>
            Dr. {gp.first_name} {gp.last_name}
          </option>
        ))}
      </select>

      <br /><br />

      <label><strong>Appointment Date &amp; Time</strong></label>
      <input
        type="datetime-local"
        value={time}
        onChange={(e) => setTime(e.target.value)}
        required
      />

      <br /><br />

      <button type="submit">Book Appointment</button>

      {message && <p>{message}</p>}
    </form>
  );
}
