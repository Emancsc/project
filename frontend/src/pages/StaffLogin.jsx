import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../components/Card";
import PageHeader from "../components/PageHeader";
import { setRole } from "../api/client";

export default function StaffLogin() {
  const [key, setKey] = useState("");
  const [err, setErr] = useState("");
  const nav = useNavigate();

  function onLogin(e) {
    e.preventDefault();
    setErr("");

    // Simple demo key (optional)
    if (key && key !== "admin123") {
      setErr("Invalid staff key. Try: admin123");
      return;
    }

    setRole("staff");
    nav("/staff/dashboard");
  }

  return (
    <Card>
      <PageHeader title="Staff Login" subtitle="No-login mode (header-based role)" />
      <form onSubmit={onLogin} style={{ display: "grid", gap: 10, maxWidth: 420 }}>
        <label>Staff Key (optional)</label>
        <input className="input" value={key} onChange={(e) => setKey(e.target.value)} placeholder="admin123" />
        <button className="btn btn-primary" type="submit">Enter Staff Mode</button>
        {err && <div style={{ color: "var(--danger)" }}>{err}</div>}
      </form>
    </Card>
  );
}
