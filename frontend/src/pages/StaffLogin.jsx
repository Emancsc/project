import { useState } from "react";
import { useNavigate } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import { apiPost } from "../api/client";
import { saveAuth } from "../utils/auth";

export default function StaffLogin() {
  const nav = useNavigate();
  const [form, setForm] = useState({ email: "staff@cst.com", password: "staff123" });
  const [err, setErr] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");

    try {
      const res = await apiPost("/auth/staff/login", form);
      saveAuth(res.access_token, "staff");
      nav("/staff/requests");
    } catch {
      setErr("Staff login failed (demo: staff@cst.com / staff123)");
    }
  }

  return (
    <div className="card card-pad">
      <PageHeader title="Staff Login" subtitle="Access staff console" />
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

        <button className="btn" type="submit">Login</button>
      </form>
    </div>
  );
}
