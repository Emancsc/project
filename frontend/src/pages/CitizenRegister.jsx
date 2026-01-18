import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import PageHeader from "../components/PageHeader";
import { citizenRegister } from "../api/auth";

export default function CitizenRegister() {
  const nav = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [err, setErr] = useState("");
  const [ok, setOk] = useState("");

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    setOk("");

    try {
      await citizenRegister(form);
      setOk("Registered ✅ Now you can login.");
      setTimeout(() => nav("/citizen/login"), 700);
    } catch (e2) {
      setErr("Registration failed. Email may already exist.");
    }
  }

  return (
    <div className="card card-pad">
      <PageHeader title="Citizen Register" subtitle="Create your citizen account" />
      <form onSubmit={onSubmit} className="grid" style={{ gap: 10 }}>
        <div>
          <label>Name</label>
          <input
            className="input"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </div>

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
        {ok && <div style={{ color: "var(--success)" }}>{ok}</div>}

        <button className="btn" type="submit">
          Register
        </button>

        <div style={{ color: "var(--muted)", fontSize: 12 }}>
          Already have an account? <Link to="/citizen/login">Login</Link>
        </div>
      </form>
    </div>
  );
}
