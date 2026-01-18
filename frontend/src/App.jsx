// src/App.jsx
import { Routes, Route } from "react-router-dom";

import AppLayout from "./layouts/AppLayout";
import AuthLayout from "./layouts/AuthLayout";
import ProtectedRoute from "./components/ProtectedRoute";

import Home from "./pages/Home";
import Login from "./pages/Login";

import CitizenHome from "./pages/CitizenHome";
import CitizenRegister from "./pages/CitizenRegister";
import CitizenMyRequests from "./pages/CitizenMyRequests";
import CitizenNewRequest from "./pages/CitizenNewRequest";
import CitizenRequestDetails from "./pages/CitizenRequestDetails";

import StaffRequests from "./pages/StaffRequests";
import StaffRequestDetails from "./pages/StaffRequestDetails";
import StaffMap from "./pages/StaffMap";

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<AppLayout><Home /></AppLayout>} />
      <Route path="/login" element={<AuthLayout><Login /></AuthLayout>} />

      {/* Citizen register (public) */}
      <Route path="/citizen/register" element={<AuthLayout><CitizenRegister /></AuthLayout>} />

      {/* Citizen (protected) */}
      <Route
        path="/citizen"
        element={
          <ProtectedRoute role="citizen">
            <AppLayout><CitizenHome /></AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/citizen/my"
        element={
          <ProtectedRoute role="citizen">
            <AppLayout><CitizenMyRequests /></AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/citizen/new"
        element={
          <ProtectedRoute role="citizen">
            <AppLayout><CitizenNewRequest /></AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/citizen/requests/:id"
        element={
          <ProtectedRoute role="citizen">
            <AppLayout><CitizenRequestDetails /></AppLayout>
          </ProtectedRoute>
        }
      />

      {/* Staff (protected) */}
      <Route
        path="/staff/requests"
        element={
          <ProtectedRoute role="staff">
            <AppLayout><StaffRequests /></AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/staff/requests/:id"
        element={
          <ProtectedRoute role="staff">
            <AppLayout><StaffRequestDetails /></AppLayout>
          </ProtectedRoute>
        }
      />
      <Route
        path="/staff/map"
        element={
          <ProtectedRoute role="staff">
            <AppLayout><StaffMap /></AppLayout>
          </ProtectedRoute>
        }
      />

      {/* Fallback */}
      <Route
        path="*"
        element={
          <AppLayout>
            <div className="card card-pad">Not Found</div>
          </AppLayout>
        }
      />
    </Routes>
  );
}
