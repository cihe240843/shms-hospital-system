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
      setError("Invalid login credentials");
    }
  };

  return (
    <div style={container}>
      <div style={card}>
        <h1>🏥 Secure Hospital System</h1>
        <p>Staff & Patient Login</p>

        {error && <p style={{ color: "red" }}>{error}</p>}

        <form onSubmit={handleSubmit}>
          <input
            placeholder="Username / Email"
            onChange={(e) => setUsername(e.target.value)}
          />

          <input
            type="password"
            placeholder="Password"
            onChange={(e) => setPassword(e.target.value)}
          />

          <button style={{ width: "100%" }}>Login</button>
        </form>
      </div>
    </div>
  );
}

const container = {
  display: "flex",
  justifyContent: "center",
  alignItems: "center",
  height: "100vh",
  background: "#f4f8fb",
};

const card = {
  background: "white",
  padding: "40px",
  borderRadius: "8px",
  width: "360px",
  boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
};
