// src/pages/StaffMap.jsx
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import Card from "../components/Card";
import PageHeader from "../components/PageHeader";

import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet.heat";
import "leaflet/dist/leaflet.css";

import { staffListRequests } from "../api/requests";
import { getHeatmapData } from "../api/analytics";

// ✅ Fix default marker icons (Vite + Leaflet)
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

function HeatLayer({ points }) {
  const map = useMap();

  useEffect(() => {
    if (!points || points.length === 0) return;

    const layer = L.heatLayer(points, {
      radius: 30,
      blur: 25,
      maxZoom: 13,
    }).addTo(map);

    return () => {
      map.removeLayer(layer);
    };
  }, [map, points]);

  return null;
}

const STATUS_OPTIONS = [
  { label: "All", value: "" },
  { label: "new", value: "new" },
  { label: "triaged", value: "triaged" },
  { label: "assigned", value: "assigned" },
  { label: "in_progress", value: "in_progress" },
  { label: "resolved", value: "resolved" },
  { label: "closed", value: "closed" },
];

export default function StaffMap() {
  const [requests, setRequests] = useState([]);
  const [heat, setHeat] = useState([]);
  const [status, setStatus] = useState("");
  const [err, setErr] = useState("");

  async function load() {
    setErr("");
    try {
      const res = await staffListRequests({ page: 1, status });
      setRequests(res?.items || []);
    } catch (e) {
      setRequests([]);
      setErr(e.message || "Failed to load requests (staff access required).");
    }

    try {
      // backend may support status_in param; if yours uses something else, keep default
      const statusIn = status ? status : "new,triaged,assigned,in_progress,resolved,closed";
      const hm = await getHeatmapData(statusIn);

      // ✅ accept multiple shapes safely:
      // 1) { points: [[lat,lng,intensity], ...] }
      // 2) { items: [{lat,lng,weight}...] }
      // 3) { items: [{location:{coordinates:[lng,lat]}, weight?}...] }
      let points = [];

      if (Array.isArray(hm?.points)) {
        points = hm.points;
      } else if (Array.isArray(hm?.items)) {
        points = hm.items
          .map((x) => {
            if (typeof x?.lat === "number" && typeof x?.lng === "number") {
              return [x.lat, x.lng, x.weight ?? 0.6];
            }
            const c = x?.location?.coordinates;
            if (Array.isArray(c) && c.length === 2) {
              return [c[1], c[0], x.weight ?? 0.6];
            }
            return null;
          })
          .filter(Boolean);
      } else {
        points = [];
      }

      setHeat(points);
    } catch (e) {
      setHeat([]);
      // لا نخليها توقف الصفحة، بس نعرض خطأ خفيف
      setErr((prev) => prev || (e.message || "Failed to load heatmap."));
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  const center = useMemo(() => {
    const first = requests.find((r) => r.location?.coordinates?.length === 2);
    return first
      ? [first.location.coordinates[1], first.location.coordinates[0]]
      : [31.9, 35.2];
  }, [requests]);

  return (
    <Card>
      <PageHeader
        title="Staff Map"
        subtitle="Requests density & locations"
        right={
          <div style={{ display: "flex", gap: 8 }}>
            <button className="btn-ghost" type="button" onClick={load}>
              Refresh
            </button>
            <Link className="btn-ghost" to="/staff/requests">
              Back
            </Link>
          </div>
        }
      />

      {err && <div style={{ color: "var(--danger)", marginBottom: 10 }}>{err}</div>}

      <div className="row" style={{ gap: 10, marginBottom: 12 }}>
        <div style={{ minWidth: 220 }}>
          <label>Status</label>
          <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
            {STATUS_OPTIONS.map((s) => (
              <option key={s.value || "all"} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>
        </div>

        <div style={{ marginLeft: "auto", alignSelf: "end", color: "var(--muted)", fontSize: 12 }}>
          Markers: {requests.length} | Heat points: {heat.length}
        </div>
      </div>

      <div
        style={{
          height: 520,
          borderRadius: 16,
          overflow: "hidden",
          border: "1px solid var(--border)",
        }}
      >
        <MapContainer center={center} zoom={12} style={{ height: "100%", width: "100%" }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

          {/* Heatmap */}
          <HeatLayer points={heat} />

          {/* Markers */}
          {requests.map((r) => {
            const c = r.location?.coordinates;
            if (!c || c.length !== 2) return null;

            return (
              <Marker key={r._id} position={[c[1], c[0]]}>
                <Popup>
                  <div style={{ fontWeight: 900 }}>{r.category}</div>
                  <div style={{ fontSize: 12, color: "var(--muted)" }}>{r.status}</div>
                  <div style={{ fontSize: 12, marginTop: 6 }}>{r.description}</div>
                  <div style={{ marginTop: 8 }}>
                    <Link to={`/staff/requests/${r._id}`}>Open</Link>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </Card>
  );
}
