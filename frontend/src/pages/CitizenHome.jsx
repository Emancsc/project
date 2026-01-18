import { Link } from "react-router-dom";
import PageHeader from "../components/PageHeader";

export default function CitizenHome() {
  return (
    <div className="card card-pad">
      <PageHeader title="Citizen Portal" subtitle="Welcome! Manage your requests." />
      <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
        <Link className="btn" to="/citizen/new">Create Request</Link>
        <Link className="btn" to="/citizen/my">My Requests</Link>
      </div>
    </div>
  );
}
