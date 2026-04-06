import React, { useEffect, useState } from "react";
import api from "../api/api";

export default function PatientReports() {
  const [reports, setReports] = useState([]);

  useEffect(() => {
    api.get("reports/")
      .then(res => {
        if (Array.isArray(res.data.results)) {
          setReports(res.data.results);
        } else {
          setReports([]);
        }
      })
      .catch(() => setReports([]));
  }, []);

  return (
    <div>
      <h3>Your Medical Reports</h3>
      {reports.length === 0 ? (
        <p>No reports available.</p>
      ) : (
        <ul>
          {reports.map(r => (
            <li key={r.id}>
              <strong>{new Date(r.created_at).toLocaleString()}</strong>
              <p>{r.report_text}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}