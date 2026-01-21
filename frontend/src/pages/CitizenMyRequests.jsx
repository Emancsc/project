import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Card from "../components/Card";
import StatusBadge from "../components/StatusBadge";
import PageHeader from "../components/PageHeader";
import { citizenMyRequests } from "../api/requests";

function fmtDate(v) {
  if (!v) return "—";
  try {
    return new Date(v).toLocaleString();
  } catch {
    return String(v);
  }
}

export default function CitizenMyRequests() {
  const [data, setData] = useState(null);

  // UI filters
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("all");
  const [priority, setPriority] = useState("all");
  const [sortBy, setSortBy] = useState("newest"); // newest | oldest | priority

  useEffect(() => {
    citizenMyRequests()
      .then((res) => setData(res))
      .catch(() => setData({ items: [], _error: "Failed to load your requests." }));
  }, []);

  const items = useMemo(() => {
    const list = Array.isArray(data?.items) ? [...data.items] : [];

    // search
    const qq = q.trim().toLowerCase();
    let filtered = list.filter((r) => {
      const cat = String(r?.category || "").toLowerCase();
      const desc = String(r?.description || "").toLowerCase();
      const id = String(r?._id || r?.request_id || "").toLowerCase();
      const matchQ = !qq || cat.includes(qq) || desc.includes(qq) || id.includes(qq);

      const matchStatus = status === "all" || String(r?.status || "") === status;
      const matchPriority = priority === "all" || String(r?.priority || "") === priority;

      return matchQ && matchStatus && matchPriority;
    });

    // sort
    const prRank = (p) => (p === "P1" ? 3 : p === "P2" ? 2 : p === "P3" ? 1 : 0);
    filtered.sort((a, b) => {
      const ta = new Date(a?.created_at || a?.timestamps?.created_at || 0).getTime();
      const tb = new Date(b?.created_at || b?.timestamps?.created_at || 0).getTime();

      if (sortBy === "oldest") return ta - tb;
      if (sortBy === "priority") return prRank(b?.priority) - prRank(a?.priority);
      // newest
      return tb - ta;
    });

    return filtered;
  }, [data, q, status, priority, sortBy]);

  if (!data) return <Card>Loading...</Card>;

  return (
    <Card>
      <PageHeader
        title="My Requests"
        subtitle="Track the status of your submitted requests"
        right={
          <Link className="btn btn-primary" to="/citizen/new">
            New Request
          </Link>
        }
      />

      {data._error && (
        <div style={{ color: "var(--danger)", marginBottom: 10 }}>{data._error}</div>
      )}

      {/* Filters */}
      <div
        style={{
          display: "grid",
          gap: 10,
          marginBottom: 12,
          padding: 12,
          border: "1px solid var(--border)",
          borderRadius: 14,
          background: "rgba(0,0,0,.06)",
        }}
      >
        <div className="grid-2">
          <div>
            <label style={{ fontWeight: 800, fontSize: 13 }}>Search</label>
            <input
              className="input"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search by category, description, or ID..."
            />
          </div>

          <div>
            <label style={{ fontWeight: 800, fontSize: 13 }}>Sort</label>
            <select className="input" value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
              <option value="newest">Newest</option>
              <option value="oldest">Oldest</option>
              <option value="priority">Priority</option>
            </select>
          </div>
        </div>

        <div className="grid-2">
          <div>
            <label style={{ fontWeight: 800, fontSize: 13 }}>Status</label>
            <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="all">All</option>
              <option value="new">new</option>
              <option value="triaged">triaged</option>
              <option value="assigned">assigned</option>
              <option value="in_progress">in_progress</option>
              <option value="resolved">resolved</option>
              <option value="closed">closed</option>
            </select>
          </div>

          <div>
            <label style={{ fontWeight: 800, fontSize: 13 }}>Priority</label>
            <select className="input" value={priority} onChange={(e) => setPriority(e.target.value)}>
              <option value="all">All</option>
              <option value="P1">P1</option>
              <option value="P2">P2</option>
              <option value="P3">P3</option>
            </select>
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
          <div style={{ color: "var(--muted)", fontSize: 13 }}>
            Showing <b>{items.length}</b> of <b>{data.items?.length || 0}</b>
          </div>

          <button
            className="btn"
            onClick={() => {
              setQ("");
              setStatus("all");
              setPriority("all");
              setSortBy("newest");
            }}
          >
            Reset
          </button>
        </div>
      </div>

      {/* Table */}
      {items.length === 0 ? (
        <div
          style={{
            padding: 18,
            border: "1px dashed var(--border)",
            borderRadius: 14,
            color: "var(--muted)",
            background: "rgba(0,0,0,.04)",
          }}
        >
          No requests found.
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="table" style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0 }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: 12, borderBottom: "1px solid var(--border)" }}>
                  Category
                </th>
                <th style={{ textAlign: "left", padding: 12, borderBottom: "1px solid var(--border)" }}>
                  Description
                </th>
                <th style={{ textAlign: "left", padding: 12, borderBottom: "1px solid var(--border)" }}>
                  Priority
                </th>
                <th style={{ textAlign: "left", padding: 12, borderBottom: "1px solid var(--border)" }}>
                  Status
                </th>
                <th style={{ textAlign: "left", padding: 12, borderBottom: "1px solid var(--border)" }}>
                  Created
                </th>
                <th style={{ textAlign: "right", padding: 12, borderBottom: "1px solid var(--border)" }}>
                  Action
                </th>
              </tr>
            </thead>

            <tbody>
              {items.map((r) => (
                <tr key={r._id} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: 12, fontWeight: 900, whiteSpace: "nowrap" }}>
                    {r.category || "—"}
                  </td>

                  <td style={{ padding: 12, color: "var(--muted)", maxWidth: 420 }}>
                    <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {r.description || "—"}
                    </div>
                    <div
                      style={{
                        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                        fontSize: 12,
                        marginTop: 6,
                        color: "var(--muted)",
                      }}
                    >
                      {r.request_id || r._id}
                    </div>
                  </td>

                  <td style={{ padding: 12, whiteSpace: "nowrap" }}>
                    <span className="badge">{r.priority || "—"}</span>
                  </td>

                  <td style={{ padding: 12, whiteSpace: "nowrap" }}>
                    <StatusBadge status={r.status} />
                  </td>

                  <td style={{ padding: 12, whiteSpace: "nowrap", color: "var(--muted)" }}>
                    {fmtDate(r.created_at || r.timestamps?.created_at)}
                  </td>

                  <td style={{ padding: 12, textAlign: "right", whiteSpace: "nowrap" }}>
                    <Link className="btn-ghost" to={`/citizen/requests/${r._id}`}>
                      View →
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Card>
  );
}
