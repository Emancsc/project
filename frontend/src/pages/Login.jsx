// src/pages/Login.jsx
import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import { apiPost } from "../api/client";
import { saveAuth } from "../utils/auth";

export default function Login() {
  const nav = useNavigate();
  const [mode, setMode] = useState("citizen"); // citizen | staff
  const [form, setForm] = useState({ email: "", password: "" });
  const [err, setErr] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");

    try {
      // Based on your Swagger:
      // Citizen login endpoint = POST /auth/login
      // Staff login endpoint   = POST /auth/staff/login
      const path = mode === "staff" ? "/auth/staff/login" : "/auth/login";
      const res = await apiPost(path, form);

      saveAuth(res.access_token, mode);
      nav(mode === "staff" ? "/staff/requests" : "/citizen");
    } catch (e2) {
      setErr(e2.message || "Login failed");
    }
  }

  return (
    <div>
      <PageHeader title="Login" subtitle="Choose account type and continue" />

      <div style={{ display: "flex", gap: 8, margin: "10px 0 14px" }}>
        <button
          type="button"
          className={mode === "citizen" ? "btn" : "btn-ghost"}
          onClick={() => setMode("citizen")}
        >
          Citizen
        </button>
        <button
          type="button"
          className={mode === "staff" ? "btn" : "btn-ghost"}
          onClick={() => setMode("staff")}
        >
          Staff
        </button>
      </div>

      <form onSubmit={onSubmit} className="grid" style={{ gap: 12 }}>
        <div>
          <label>Email</label>
          <input
            className="input"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
          />
        </div>

        <div>
          <label>Password</label>
          <input
            className="input"
            type="password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
            required
          />
        </div>

        {err && <div style={{ color: "var(--danger)" }}>{err}</div>}

        <button className="btn" type="submit">
          Login
        </button>
      </form>

      {mode === "citizen" ? (
        <div style={{ marginTop: 14, color: "var(--muted)" }}>
          No account? <Link to="/citizen/register">Register here</Link>.
        </div>
      ) : (
        <div style={{ marginTop: 14, color: "var(--muted)" }}>
          Staff accounts are created by admin/seed only.
        </div>
      )}
    </div>
  );
}
