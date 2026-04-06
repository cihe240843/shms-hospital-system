import React, { useState } from "react";
import api, { setAuthToken } from "../api/api";

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post("token/", { username, password });
      const token = res.data.access;

      localStorage.setItem("token", token);
      setAuthToken(token);
      onLogin();
    } catch {
      setError("Invalid username or password");
    }
  };

  return (
    <div style={container}>
      <div style={card}>
        <h1>🏥 Secure Hospital System</h1>
        <p style={{ color: "#666" }}>
          Authorized staff login only
        </p>

        {error && <p style={{ color: "red" }}>{error}</p>}

        <form onSubmit={handleSubmit}>
          <input
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <button style={{ width: "100%", marginTop: "10px" }}>
            Login
          </button>
        </form>
      </div>
    </div>
  );
}

/* Inline styles */
const container = {
  display: "flex",
  height: "100vh",
  justifyContent: "center",
  alignItems: "center",
};

const card = {
  background: "white",
  padding: "40px",
  borderRadius: "8px",
  width: "360px",
  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
  textAlign: "center",
};