import { Link } from "react-router-dom";

export default function Home() {
  return (
    <div style={{ display: "grid", gap: 18 }}>
      {/* Hero / Welcome */}
      <div className="card" style={{ padding: 22 }}>
        <div
          style={{
            display: "grid",
            gap: 12,
          }}
        >
          <div style={{ fontSize: 26, fontWeight: 900 }}>
            Citizen Service Tracker
          </div>

          <div style={{ color: "var(--muted)", maxWidth: 720 }}>
            Official municipal portal for submitting and tracking public service
            requests. Citizens can report issues, follow progress, and receive
            updates transparently.
          </div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginTop: 8 }}>
            <Link className="btn btn-primary" to="/citizen/new">
              Submit New Request
            </Link>
            <Link className="btn" to="/citizen/my">
              Track My Requests
            </Link>
          </div>
        </div>
      </div>

      {/* Sections */}
      <div className="grid-2">
        {/* Citizen */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 6 }}>
            For Citizens
          </div>

          <div style={{ color: "var(--muted)", marginBottom: 14 }}>
            Submit service requests, select location on the map, follow the full
            timeline of actions, add comments, and provide feedback after
            resolution.
          </div>

          <ul style={{ color: "var(--muted)", paddingLeft: 18, marginBottom: 16 }}>
            <li>Location-based reporting</li>
            <li>Status & timeline tracking</li>
            <li>Comments & ratings</li>
            <li>No login required</li>
          </ul>

          <div style={{ display: "flex", gap: 10 }}>
            <Link className="btn btn-primary" to="/citizen/new">
              New Request
            </Link>
            <Link className="btn" to="/citizen/my">
              My Requests
            </Link>
          </div>
        </div>

        {/* Staff */}
        <div className="card" style={{ padding: 20 }}>
          <div style={{ fontSize: 18, fontWeight: 900, marginBottom: 6 }}>
            For Staff
          </div>

          <div style={{ color: "var(--muted)", marginBottom: 14 }}>
            Authorized staff members can manage requests, prioritize work,
            analyze performance metrics, and view geographic distribution.
          </div>

          <ul style={{ color: "var(--muted)", paddingLeft: 18, marginBottom: 16 }}>
            <li>Requests management console</li>
            <li>Status transitions & prioritization</li>
            <li>Analytics dashboard</li>
            <li>Map & heatmap views</li>
          </ul>

          <div style={{ display: "flex", gap: 10 }}>
            <Link className="btn btn-primary" to="/staff/requests">
              Staff Console
            </Link>
            <Link className="btn" to="/staff/map">
              Map View
            </Link>
          </div>
        </div>
      </div>

      {/* Footer note */}
      <div
        style={{
          textAlign: "center",
          color: "var(--muted)",
          fontSize: 13,
          marginTop: 10,
        }}
      >
        © {new Date().getFullYear()} Citizen Service Tracker · Municipal Services Portal
      </div>
    </div>
  );
}
