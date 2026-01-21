// src/pages/StaffDashboard.jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Card from "../components/Card";
import PageHeader from "../components/PageHeader";
import { getKpis } from "../api/analytics";

function StatCard({ title, value, hint }) {
  return (
    <div
      className="card"
      style={{
        padding: 16,
        borderRadius: 16,
        border: "1px solid var(--border)",
        boxShadow: "var(--shadow)",
        background: "var(--card)",
      }}
    >
      <div style={{ color: "var(--muted)", fontSize: 12, fontWeight: 800 }}>
        {title}
      </div>
      <div style={{ fontSize: 34, fontWeight: 900, marginTop: 8 }}>{value}</div>
      {hint ? (
        <div style={{ color: "var(--muted)", fontSize: 13, marginTop: 8 }}>
          {hint}
        </div>
      ) : null}
    </div>
  );
}

function StatusRow({ label, count, total }) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;

  return (
    <div
      style={{
        padding: 12,
        border: "1px solid var(--border)",
        borderRadius: 14,
        background: "#fff",
        display: "grid",
        gap: 8,
      }}
    >
      <div className="row" style={{ justifyContent: "space-between" }}>
        <div style={{ fontWeight: 900 }}>{label}</div>
        <div style={{ color: "var(--muted)", fontSize: 13 }}>
          {count} ({pct}%)
        </div>
      </div>

      <div
        style={{
          height: 10,
          borderRadius: 999,
          background: "#eef2ff",
          overflow: "hidden",
          border: "1px solid var(--border)",
        }}
      >
        <div
          style={{
            width: `${pct}%`,
            height: "100%",
            background: "var(--primary)",
          }}
        />
      </div>
    </div>
  );
}

export default function StaffDashboard() {
  const [kpis, setKpis] = useState(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    setErr("");
    getKpis()
      .then((res) => setKpis(res))
      .catch(() => setErr("Failed to load analytics (staff access required)."));
  }, []);

  return (
    <Card>
      <PageHeader
        title="Staff Dashboard"
        subtitle="Operational overview"
        right={
          <div style={{ display: "flex", gap: 8 }}>
            <Link className="btn-ghost" to="/staff/requests">
              Requests
            </Link>
            <Link className="btn-ghost" to="/staff/map">
              Map
            </Link>
          </div>
        }
      />

      {err ? (
        <div style={{ color: "var(--danger)", marginBottom: 10 }}>{err}</div>
      ) : null}

      {!kpis ? (
        <div style={{ color: "var(--muted)" }}>Loading...</div>
      ) : (
        <>
          {(() => {
            const total = Number(kpis.total_requests || 0);

            const raw = Array.isArray(kpis.by_status) ? kpis.by_status : [];
            const byStatus = raw.map((x) => ({
              status: x._id,
              count: Number(x.count || 0),
            }));

            const getCount = (s) => byStatus.find((x) => x.status === s)?.count || 0;

            return (
              <>
                {/* KPI Cards */}
                <div className="grid-2" style={{ marginTop: 14 }}>
                  <StatCard
                    title="Total Requests"
                    value={total}
                    hint="All requests received"
                  />

                  <StatCard
                    title="New Requests"
                    value={getCount("new")}
                    hint="Awaiting triage"
                  />

                  <StatCard
                    title="In Progress"
                    value={getCount("in_progress")}
                    hint="Currently being handled"
                  />

                  <StatCard
                    title="Assigned"
                    value={getCount("assigned")}
                    hint="Assigned to agents"
                  />
                </div>

                {/* Status Breakdown */}
                <div style={{ marginTop: 18 }}>
                  <div style={{ fontWeight: 900, marginBottom: 10 }}>
                    Status Breakdown
                  </div>

                  <div style={{ display: "grid", gap: 10 }}>
                    <StatusRow label="new" count={getCount("new")} total={total} />
                    <StatusRow label="triaged" count={getCount("triaged")} total={total} />
                    <StatusRow label="assigned" count={getCount("assigned")} total={total} />
                    <StatusRow
                      label="in_progress"
                      count={getCount("in_progress")}
                      total={total}
                    />
                    <StatusRow label="resolved" count={getCount("resolved")} total={total} />
                    <StatusRow label="closed" count={getCount("closed")} total={total} />
                  </div>
                </div>

                {/* Quick actions */}
                <div style={{ marginTop: 18, display: "flex", gap: 10, flexWrap: "wrap" }}>
                  <Link className="btn btn-primary" to="/staff/requests">
                    Open Staff Console
                  </Link>
                  <Link className="btn" to="/staff/map">
                    Open Map
                  </Link>
                </div>
              </>
            );
          })()}
        </>
      )}
    </Card>
  );
}
