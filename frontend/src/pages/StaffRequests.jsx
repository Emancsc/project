import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Card from "../components/Card";
import PageHeader from "../components/PageHeader";
import StatusBadge from "../components/StatusBadge";
import { staffListRequests } from "../api/requests";
import { apiRequest } from "../api/client";

function KPIBox({ title, value }) {
  return (
    <div
      style={{
        padding: 14,
        border: "1px solid var(--border)",
        borderRadius: 14,
        background: "var(--card)",
        flex: 1,
        minWidth: 160,
      }}
    >
      <div style={{ fontSize: 12, color: "var(--muted)" }}>{title}</div>
      <div style={{ fontSize: 22, fontWeight: 900, marginTop: 6 }}>{value ?? "—"}</div>
    </div>
  );
}

export default function StaffRequests() {
  const [data, setData] = useState(null);
  const [kpis, setKpis] = useState(null);

  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  function loadRequests() {
    staffListRequests({ page, status })
      .then(setData)
      .catch(() =>
        setData({
          items: [],
          page: 1,
          page_size: 10,
          total: 0,
          _error: "Failed to load (check staff login).",
        })
      );
  }

  function loadKPIs() {
    apiRequest({ url: "/analytics/kpis", method: "GET" })
      .then(setKpis)
      .catch(() => setKpis(null));
  }

  useEffect(() => {
    loadRequests();
    loadKPIs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, status]);

  if (!data) return <Card>Loading...</Card>;

  const canPrev = page > 1;
  const canNext = page * data.page_size < data.total;

  const backlogTotal =
    kpis?.backlog_by_status?.reduce((s, i) => s + i.count, 0) ?? "—";

  return (
    <div style={{ display: "grid", gap: 16 }}>
      {/* KPI DASHBOARD */}
      <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
        <KPIBox title="Total Requests" value={backlogTotal} />
        <KPIBox title="Average Rating" value={kpis?.rating_summary?.avg_rating?.toFixed?.(2)} />
        <KPIBox title="Rated Requests" value={kpis?.rating_summary?.count} />
      </div>

      {/* MAIN LIST */}
      <Card>
        <PageHeader
          title="Staff Console"
          subtitle="Manage and monitor all service requests"
          right={
            <div style={{ display: "flex", gap: 8 }}>
              <button className="btn-ghost" onClick={() => { loadRequests(); loadKPIs(); }}>
                Refresh
              </button>
              <Link className="btn-ghost" to="/staff/map">
                Map View
              </Link>
            </div>
          }
        />

        {data._error && (
          <div style={{ color: "var(--danger)", marginBottom: 10 }}>{data._error}</div>
        )}

        <div className="row" style={{ marginBottom: 12 }}>
          <div style={{ minWidth: 220 }}>
            <label>Status</label>
            <select
              className="input"
              value={status}
              onChange={(e) => {
                setPage(1);
                setStatus(e.target.value);
              }}
            >
              <option value="">All</option>
              <option value="new">new</option>
              <option value="triaged">triaged</option>
              <option value="assigned">assigned</option>
              <option value="in_progress">in_progress</option>
              <option value="resolved">resolved</option>
              <option value="closed">closed</option>
            </select>
          </div>

          <div
            style={{
              marginLeft: "auto",
              alignSelf: "end",
              color: "var(--muted)",
              fontSize: 12,
            }}
          >
            Total: {data.total} | Page: {data.page}
          </div>
        </div>

        <div style={{ display: "grid", gap: 10 }}>
          {data.items.map((r) => (
            <div
              key={r._id}
              style={{
                padding: 12,
                border: "1px solid var(--border)",
                borderRadius: 14,
                background: "rgba(0,0,0,.03)",
                display: "flex",
                justifyContent: "space-between",
                gap: 12,
                alignItems: "center",
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 900 }}>{r.category}</div>
                <div
                  style={{
                    color: "var(--muted)",
                    fontSize: 12,
                    marginTop: 4,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                  }}
                >
                  {r.description}
                </div>
              </div>

              <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                <StatusBadge status={r.status} />
                <Link className="btn-ghost" to={`/staff/requests/${r._id}`}>
                  Open
                </Link>
              </div>
            </div>
          ))}

          {data.items.length === 0 && (
            <div style={{ color: "var(--muted)" }}>No requests found.</div>
          )}
        </div>

        <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
          <button
            className="btn-ghost"
            disabled={!canPrev}
            onClick={() => setPage((p) => p - 1)}
          >
            Prev
          </button>
          <button
            className="btn-ghost"
            disabled={!canNext}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
      </Card>
    </div>
  );
}
