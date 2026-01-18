import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import { citizenLogin } from "../api/auth";
import { saveAuth } from "../utils/auth";

export default function CitizenLogin() {
  const nav = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [err, setErr] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");

    try {
      const res = await citizenLogin(form);
      saveAuth(res.access_token, "citizen");
      nav("/citizen");
    } catch (e2) {
      setErr("Login failed. Check email/password.");
    }
  }

  return (
    <div className="card card-pad">
      <PageHeader title="Citizen Login" subtitle="Login to track your requests" />
      <form onSubmit={onSubmit} className="grid" style={{ gap: 10 }}>
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

        <div style={{ color: "var(--muted)", fontSize: 12 }}>
          New citizen? <Link to="/citizen/register">Register</Link>
        </div>
      </form>
    </div>
  );
}
