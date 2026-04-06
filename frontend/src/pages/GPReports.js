import React, { useState } from "react";
import api from "../api/api";

export default function GPReports() {
  const [patientId, setPatientId] = useState("");
  const [text, setText] = useState("");
  const [msg, setMsg] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    try {
      await api.post("reports/", {
        patient: patientId,
        report_text: text,
      });
      setMsg("✅ Report created");
      setPatientId("");
      setText("");
    } catch {
      setMsg("❌ Unable to create report");
    }
  };

  return (
    <div>
      <h3>Create Medical Report</h3>
      <form onSubmit={submit}>
        <input
          placeholder="Patient ID"
          value={patientId}
          onChange={(e) => setPatientId(e.target.value)}
          required
        />
        <textarea
          placeholder="Report details"
          value={text}
          onChange={(e) => setText(e.target.value)}
          required
        />
        <button type="submit">Create Report</button>
      </form>
      {msg && <p>{msg}</p>}
    </div>
  );
}