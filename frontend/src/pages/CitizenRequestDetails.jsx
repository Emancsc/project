import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Card from "../components/Card";
import PageHeader from "../components/PageHeader";
import StatusBadge from "../components/StatusBadge";
import { citizenGetRequestById } from "../api/requests";

export default function CitizenRequestDetails() {
  const { id } = useParams();
  const [req, setReq] = useState(null);

  useEffect(() => {
    citizenGetRequestById(id)
      .then(setReq)
      .catch(() => setReq({ _error: "Failed to load request." }));
  }, [id]);

  if (!req) return <Card>Loading...</Card>;
  if (req._error) return <Card>{req._error}</Card>;

  const coords = req.location?.coordinates || [];

  return (
    <Card>
      <PageHeader
        title={`Request: ${req.category}`}
        subtitle="Details and current status"
        right={<Link className="btn-ghost" to="/citizen/my">Back</Link>}
      />

      <div className="row" style={{ alignItems: "center", marginBottom: 12 }}>
        <StatusBadge status={req.status} />
        <div style={{ color: "var(--muted)", fontSize: 12 }}>
          ID: {req._id}
        </div>
      </div>

      <div style={{ display: "grid", gap: 10 }}>
        <div>
          <div style={{ color: "var(--muted)", fontSize: 12 }}>Description</div>
          <div style={{ marginTop: 6 }}>{req.description}</div>
        </div>

        <div className="row">
          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ color: "var(--muted)", fontSize: 12 }}>Priority</div>
            <div style={{ marginTop: 6, fontWeight: 900 }}>{req.priority}</div>
          </div>

          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ color: "var(--muted)", fontSize: 12 }}>Location</div>
            <div style={{ marginTop: 6 }}>
              {coords.length === 2 ? `${coords[0]}, ${coords[1]}` : "—"}
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
