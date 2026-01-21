import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Card from "../components/Card";
import PageHeader from "../components/PageHeader";
import StatusBadge from "../components/StatusBadge";
import {
  staffGetRequestById,
  staffTransition,
  staffSetPriority,
} from "../api/requests";

const STATUSES = ["new", "triaged", "assigned", "in_progress", "resolved", "closed"];
const PRIORITIES = ["P1", "P2", "P3"];

export default function StaffRequestDetails() {
  const { id } = useParams();
  const [req, setReq] = useState(null);

  const [nextStatus, setNextStatus] = useState("triaged");
  const [priority, setPriority] = useState("P3");

  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  function load() {
    staffGetRequestById(id)
      .then((r) => {
        setReq(r);

        const i = Math.max(0, STATUSES.indexOf(r.status));
        setNextStatus(STATUSES[Math.min(i + 1, STATUSES.length - 1)]);

        setPriority(r.priority || "P3");
      })
      .catch((e) => setReq({ _error: e?.message || "Failed to load request." }));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function onTransition() {
    setErr("");
    setMsg("");
    setBusy(true);
    try {
      // ✅ correct payload for TransitionPayload
      const updated = await staffTransition(id, { next_status: nextStatus });
      setReq(updated);
      setMsg(`Status updated to "${nextStatus}"`);
    } catch (e2) {
      setErr(e2?.message || "Transition failed.");
    } finally {
      setBusy(false);
    }
  }

  async function onSetPriority() {
    setErr("");
    setMsg("");
    setBusy(true);
    try {
      // ✅ correct payload for UpdatePriority
      const updated = await staffSetPriority(id, { priority });
      setReq(updated);
      setMsg(`Priority updated to "${priority}"`);
    } catch (e2) {
      setErr(e2?.message || "Priority update failed.");
    } finally {
      setBusy(false);
    }
  }

  if (!req) return <Card>Loading...</Card>;
  if (req._error) return <Card>{req._error}</Card>;

  const coords = req.location?.coordinates || [];

  return (
    <Card>
      <PageHeader
        title={`Request: ${req.category}`}
        subtitle="Staff view + status transitions"
        right={
          <Link className="btn-ghost" to="/staff/requests">
            Back
          </Link>
        }
      />

      <div className="row" style={{ alignItems: "center", marginBottom: 12 }}>
        <StatusBadge status={req.status} />
        <div style={{ color: "var(--muted)", fontSize: 12 }}>ID: {req._id}</div>
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        <div>
          <div style={{ color: "var(--muted)", fontSize: 12 }}>Description</div>
          <div style={{ marginTop: 6 }}>{req.description}</div>
        </div>

        <div className="row">
          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ color: "var(--muted)", fontSize: 12 }}>Location</div>
            <div style={{ marginTop: 6 }}>
              {coords.length === 2 ? `${coords[0]}, ${coords[1]}` : "—"}
            </div>
          </div>
        </div>

        {/* Priority controls */}
        <div className="row" style={{ alignItems: "end" }}>
          <div style={{ flex: 1, minWidth: 240 }}>
            <label style={{ fontWeight: 800, fontSize: 13 }}>Priority</label>
            <select
              className="input"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              disabled={busy}
            >
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>
          <button className="btn-ghost" type="button" onClick={onSetPriority} disabled={busy}>
            {busy ? "Saving..." : "Set Priority"}
          </button>
        </div>

        {/* Status transition */}
        <div className="row" style={{ alignItems: "end" }}>
          <div style={{ flex: 1, minWidth: 240 }}>
            <label style={{ fontWeight: 800, fontSize: 13 }}>Next Status</label>
            <select
              className="input"
              value={nextStatus}
              onChange={(e) => setNextStatus(e.target.value)}
              disabled={busy}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <button className="btn btn-primary" type="button" onClick={onTransition} disabled={busy}>
            {busy ? "Applying..." : "Apply Transition"}
          </button>
        </div>

        {msg && <div style={{ color: "var(--success)" }}>{msg}</div>}
        {err && <div style={{ color: "var(--danger)" }}>{err}</div>}
      </div>
    </Card>
  );
}
