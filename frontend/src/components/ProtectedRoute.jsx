import { Navigate } from "react-router-dom";
import { getRole, isLoggedIn } from "../utils/auth";

export default function ProtectedRoute({ role, children }) {
  if (!isLoggedIn()) return <Navigate to="/" replace />;
  if (role && getRole() !== role) return <Navigate to="/" replace />;
  return children;
}
