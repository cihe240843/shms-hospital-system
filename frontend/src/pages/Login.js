import React, { useState } from "react";
import api, { setAuthToken } from "../api/api";

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post("token/", {
        username,
        password,
      });

      const token = response.data.access;
      localStorage.setItem("token", token);
      setAuthToken(token);
      onLogin();
    } catch {
      setError("Invalid credentials");
    }
  };

  return (
    <div style={{ padding: "40px" }}>
      <h2>Login</h2>

      {error && <p style={{ color: "red" }}>{error}</p>}

      <form onSubmit={handleSubmit}>
        <div>
          <input
            placeholder="Username"
            onChange={(e) => setUsername(e.target.value)}
          />
        </div>

        <div>
          <input
            type="password"
            placeholder="Password"
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <button type="submit">Login</button>
      </form>
    </div>
  );
}