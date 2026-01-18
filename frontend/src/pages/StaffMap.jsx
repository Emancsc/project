import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Card from "../components/Card";
import PageHeader from "../components/PageHeader";
import { staffListRequests } from "../api/requests";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";

export default function StaffMap() {
  const [data, setData] = useState(null);

  useEffect(() => {
    staffListRequests({ page: 1, status: "" })
      .then(setData)
      .catch(() => setData({ items: [], _error: "Failed to load map data." }));
  }, []);

  if (!data) return <Card>Loading...</Card>;

  const first = data.items.find((r) => r.location?.coordinates?.length === 2);
  const center = first ? [first.location.coordinates[1], first.location.coordinates[0]] : [31.9, 35.2];

  return (
    <Card>
      <PageHeader
        title="Staff Map"
        subtitle="All requests on the map"
        right={<Link className="btn-ghost" to="/staff/requests">Back</Link>}
      />

      {data._error && <div style={{ color: "var(--danger)", marginBottom: 10 }}>{data._error}</div>}

      <div style={{ height: 520, borderRadius: 16, overflow: "hidden", border: "1px solid var(--border)" }}>
        <MapContainer center={center} zoom={12} style={{ height: "100%", width: "100%" }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
          {data.items.map((r) => {
            const c = r.location?.coordinates;
            if (!c || c.length !== 2) return null;
            return (
              <Marker key={r._id} position={[c[1], c[0]]}>
                <Popup>
                  <div style={{ fontWeight: 900 }}>{r.category}</div>
                  <div style={{ fontSize: 12 }}>{r.status}</div>
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
