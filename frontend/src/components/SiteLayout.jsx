import { NavLink, Outlet } from "react-router-dom";
import {
  getRole,
  setRole,
  setCitizenId,
} from "../api/client";

function Brand() {
  return (
    <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 12,
          background:
            "linear-gradient(135deg, var(--primary), var(--accent))",
        }}
      />
      <div>
        <div style={{ fontWeight: 900 }}>
          Citizen Service Tracker
        </div>
        <div style={{ fontSize: 12, color: "var(--muted)" }}>
          Municipal Requests Portal
        </div>
      </div>
    </div>
  );
}

function TopNav() {
  const role = getRole();

  const linkStyle = ({ isActive }) => ({
    padding: "10px 12px",
    borderRadius: 12,
    fontWeight: 700,
    fontSize: 13,
    background: isActive ? "var(--primary)" : "transparent",
    color: isActive ? "#fff" : "var(--text)",
  });

  return (
    <nav style={{ display: "flex", gap: 6 }}>
      <NavLink to="/" style={linkStyle}>Home</NavLink>

      {/* Citizen */}
      {role === "citizen" && (
        <>
          <NavLink to="/citizen/new" style={linkStyle}>
            New Request
          </NavLink>
          <NavLink to="/citizen/my" style={linkStyle}>
            My Requests
          </NavLink>
        </>
      )}

      {/* Staff */}
      {role === "staff" && (
        <>
          <NavLink to="/staff/dashboard" style={linkStyle}>
            Dashboard
          </NavLink>
          <NavLink to="/staff/requests" style={linkStyle}>
            Requests
          </NavLink>
          <NavLink to="/staff/map" style={linkStyle}>
            Map
          </NavLink>
        </>
      )}
    </nav>
  );
}

function RoleIndicator() {
  const role = getRole();

  return (
    <div style={{ display: "flex", gap: 8 }}>
      <span
        style={{
          fontSize: 12,
          fontWeight: 800,
          padding: "6px 10px",
          borderRadius: 999,
          background: role === "staff"
            ? "#fee2e2"
            : "#dcfce7",
        }}
      >
        {role.toUpperCase()}
      </span>

      {/* Optional – only for testing */}
      <button
        className="btn"
        onClick={() => {
          if (role === "citizen") {
            setRole("staff");
          } else {
            setRole("citizen");
            setCitizenId("public-citizen");
          }
          location.reload();
        }}
      >
        Switch
      </button>
    </div>
  );
}

export default function SiteLayout() {
  return (
    <>
      <header className="site-header">
        <div
          className="container"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            padding: "16px 0",
          }}
        >
          <Brand />
          <TopNav />
          <RoleIndicator />
        </div>
      </header>

      <main className="container" style={{ padding: "24px 0" }}>
        <Outlet />
      </main>

      <footer className="site-footer">
        <div className="container" style={{ padding: "24px 0" }}>
          © {new Date().getFullYear()} CST
        </div>
      </footer>
    </>
  );
}
