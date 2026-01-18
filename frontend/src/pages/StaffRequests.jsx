import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Card from "../components/Card";
import PageHeader from "../components/PageHeader";
import StatusBadge from "../components/StatusBadge";
import { staffListRequests } from "../api/requests";

export default function StaffRequests() {
  const [data, setData] = useState(null);
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    staffListRequests({ page, status })
      .then(setData)
      .catch(() =>
        setData({ items: [], page: 1, page_size: 10, total: 0, _error: "Failed to load (check staff login)." })
      );
  }, [page, status]);

  if (!data) return <Card>Loading...</Card>;

  const canPrev = page > 1;
  const canNext = page * data.page_size < data.total;

  return (
    <Card>
      <PageHeader
        title="Staff Console"
        subtitle="Manage all service requests"
        right={<Link className="btn-ghost" to="/staff/map">Map View</Link>}
      />

      {data._error && <div style={{ color: "var(--danger)", marginBottom: 10 }}>{data._error}</div>}

      <div className="row" style={{ marginBottom: 12 }}>
        <div style={{ minWidth: 220 }}>
          <label>Status</label>
          <select className="input" value={status} onChange={(e) => { setPage(1); setStatus(e.target.value); }}>
            <option value="">All</option>
            <option value="new">new</option>
            <option value="triaged">triaged</option>
            <option value="assigned">assigned</option>
            <option value="in_progress">in_progress</option>
            <option value="resolved">resolved</option>
            <option value="closed">closed</option>
          </select>
        </div>

        <div style={{ marginLeft: "auto", alignSelf: "end", color: "var(--muted)", fontSize: 12 }}>
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
              background: "rgba(0,0,0,.12)",
              display: "flex",
              justifyContent: "space-between",
              gap: 12,
              alignItems: "center",
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 900 }}>{r.category}</div>
              <div style={{ color: "var(--muted)", fontSize: 12, marginTop: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {r.description}
              </div>
            </div>

            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <StatusBadge status={r.status} />
              <Link className="btn-ghost" to={`/staff/requests/${r._id}`}>Open</Link>
            </div>
          </div>
        ))}

        {data.items.length === 0 && <div style={{ color: "var(--muted)" }}>No requests found.</div>}
      </div>

      <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
        <button className="btn-ghost" disabled={!canPrev} onClick={() => setPage((p) => p - 1)}>Prev</button>
        <button className="btn-ghost" disabled={!canNext} onClick={() => setPage((p) => p + 1)}>Next</button>
      </div>
    </Card>
  );
}
