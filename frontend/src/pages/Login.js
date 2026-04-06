import { useState } from "react";
import api, { setAuthToken } from "../api/api";
import "../layout/hospital.css";

export default function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      const res = await api.post("token/", {
        username,
        password,
      });

      const token = res.data.access;
      localStorage.setItem("token", token);
      setAuthToken(token);
      onLogin();
    } catch {
      setError("Invalid username or password");
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1>🏥 Secure Hospital System</h1>
        <div className="login-subtitle">
          Patient & Staff Secure Login
        </div>

        {error && (
          <p style={{ color: "red", marginBottom: "10px" }}>
            {error}
          </p>
        )}

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Username or Email"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />

          <button type="submit">Login Securely</button>
        </form>

        <div className="login-footer">
          © 2026 Secure Hospital System <br />
          Authorized access only
        </div>
      </div>
    </div>
  );
}