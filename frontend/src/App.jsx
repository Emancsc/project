import { Routes, Route } from "react-router-dom";
import SiteLayout from "./components/SiteLayout";
import CitizenBootstrap from "./components/CitizenBootstrap";

import Home from "./pages/Home";
import CitizenNewRequest from "./pages/CitizenNewRequest";
import CitizenMyRequests from "./pages/CitizenMyRequests";
import CitizenRequestDetails from "./pages/CitizenRequestDetails";
import CitizenVerify from "./pages/CitizenVerify";

import StaffRequests from "./pages/StaffRequests";
import StaffRequestDetails from "./pages/StaffRequestDetails";
import StaffMap from "./pages/StaffMap";
import StaffDashboard from "./pages/StaffDashboard";

export default function App() {
  return (
    <Routes>
      <Route element={<SiteLayout />}>
        <Route path="/" element={<Home />} />

        {/* Citizen (wrapped) */}
        <Route
          path="/citizen/new"
          element={
            <CitizenBootstrap>
              <CitizenNewRequest />
            </CitizenBootstrap>
          }
        />
        <Route
          path="/citizen/my"
          element={
            <CitizenBootstrap>
              <CitizenMyRequests />
            </CitizenBootstrap>
          }
        />
        <Route
          path="/citizen/requests/:id"
          element={
            <CitizenBootstrap>
              <CitizenRequestDetails />
            </CitizenBootstrap>
          }
        />
        <Route
          path="/citizen/verify"
          element={
            <CitizenBootstrap>
              <CitizenVerify />
            </CitizenBootstrap>
          }
        />

        {/* Staff */}
        <Route path="/staff/dashboard" element={<StaffDashboard />} />
        <Route path="/staff/requests" element={<StaffRequests />} />
        <Route path="/staff/requests/:id" element={<StaffRequestDetails />} />
        <Route path="/staff/map" element={<StaffMap />} />
      </Route>
    </Routes>
  );
}
