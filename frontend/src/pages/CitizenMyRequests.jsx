import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Card from "../components/Card";
import StatusBadge from "../components/StatusBadge";
import PageHeader from "../components/PageHeader";
import { citizenMyRequests } from "../api/requests";

export default function CitizenMyRequests() {
  const [data, setData] = useState(null);

  useEffect(() => {
    citizenMyRequests()
      .then((res) => setData(res))
      .catch(() => setData({ items: [], _error: "Failed to load your requests." }));
  }, []);

  if (!data) return <Card>Loading...</Card>;

  return (
    <Card>
      <PageHeader
        title="My Requests"
        subtitle="Track the status of your submitted requests"
        right={<Link className="btn" to="/citizen/new">New Request</Link>}
      />

      {data._error && <div style={{ color: "var(--danger)", marginBottom: 10 }}>{data._error}</div>}

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
              <Link className="btn-ghost" to={`/citizen/requests/${r._id}`}>View</Link>
            </div>
          </div>
        ))}

        {data.items.length === 0 && <div style={{ color: "var(--muted)" }}>No requests yet.</div>}
      </div>
    </Card>
  );
}
