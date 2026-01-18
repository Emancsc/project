// src/pages/Home.jsx
import Card from "../components/Card";
import PageHeader from "../components/PageHeader";

export default function Home() {
  return (
    <Card>
      <PageHeader
        title="Citizen Services Tracker"
        subtitle="Report issues, track progress, and help improve city services."
      />

      <div className="grid2" style={{ marginTop: 12 }}>
        <div>
          <div style={{ fontWeight: 900, marginBottom: 6 }}>What you can do</div>
          <ul style={{ margin: 0, paddingLeft: 18, color: "var(--muted)" }}>
            <li>Submit a service request (potholes, lights, trash, water leaks).</li>
            <li>Track your request status in real time.</li>
            <li>Transparent workflow progress.</li>
          </ul>

          <div style={{ marginTop: 14, color: "var(--muted)" }}>
            Use the Login button to access the Citizen Portal or Staff Console.
          </div>
        </div>

        <div>
          <div style={{ fontWeight: 900, marginBottom: 6 }}>Workflow</div>
          <div style={{ color: "var(--muted)" }}>
            <b>new</b> → <b>triaged</b> → <b>assigned</b> → <b>in_progress</b> → <b>resolved</b> → <b>closed</b>.
            Staff members manage transitions and priorities.
          </div>
        </div>
      </div>
    </Card>
  );
}
