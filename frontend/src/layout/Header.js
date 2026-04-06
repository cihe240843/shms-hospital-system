import { useEffect, useState } from "react";
import api from "../api/api";

export default function Header({ onLogout }) {
  const [username, setUsername] = useState("");

  useEffect(() => {
    api.get("me/")
      .then(res => setUsername(res.data.username))
      .catch(() => setUsername(""));
  }, []);

  return (
    <header className="header">
      <div>🏥 Secure Hospital Management System</div>

      <div style={{ display: "flex", alignItems: "center" }}>
        <span style={{ marginRight: "15px", fontWeight: 500 }}>
          {username}
        </span>
        <button onClick={onLogout}>Logout</button>
      </div>
    </header>
  );
}
