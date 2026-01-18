// src/components/Navbar.jsx
import { Link, useNavigate } from "react-router-dom";
import { getRole, isLoggedIn, logout } from "../utils/auth";

export default function Navbar() {
  const nav = useNavigate();
  const role = getRole();

  function onLogout() {
    logout();
    nav("/");
  }

  return (
    <div className="nav">
      <div
        className="container"
        style={{ display: "flex", alignItems: "center", gap: 14 }}
      >
        <Link to="/" style={{ textDecoration: "none" }}>
          <div style={{ fontWeight: 1000, letterSpacing: 0.2 }}>
            Citizen Services Tracker
          </div>
        </Link>

        <div style={{ display: "flex", gap: 10 }}>
          <Link to="/">Home</Link>
          <Link to="/citizen">Citizen</Link>
          <Link to="/staff/requests">Staff</Link>
        </div>

        <div
          style={{
            marginLeft: "auto",
            display: "flex",
            gap: 10,
            alignItems: "center",
          }}
        >
          {isLoggedIn() ? (
            <>
              <span style={{ color: "var(--muted)", fontSize: 12 }}>
                role: <b style={{ color: "var(--text)" }}>{role}</b>
              </span>
              <button className="btn-ghost" onClick={onLogout}>
                Logout
              </button>
            </>
          ) : (
            <Link className="btn-ghost" to="/login">
              Login
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
