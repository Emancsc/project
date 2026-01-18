import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";

const API_NEARBY = "http://localhost:8000/requests/nearby";

export default function MapPage() {
  const [items, setItems] = useState([]);

  // مركز افتراضي (نفس اللي استخدمته في test: 35.2, 31.9)
  const center = { lng: 35.2, lat: 31.9 };

  useEffect(() => {
    fetch(`${API_NEARBY}?lng=${center.lng}&lat=${center.lat}&radius_m=5000`)
      .then((res) => res.json())
      .then((data) => setItems(data.items || []))
      .catch(() => setItems([]));
  }, []);

  return (
    <div style={{ padding: 20 }}>
      <h1>Requests Map</h1>

      <div style={{ height: 500 }}>
        <MapContainer center={[center.lat, center.lng]} zoom={12} style={{ height: "100%" }}>
          <TileLayer
            attribution='&copy; OpenStreetMap contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />

          {items.map((r) => {
            const coords = r.location?.coordinates;
            if (!coords || coords.length !== 2) return null;

            const [lng, lat] = coords;
            return (
              <Marker key={r._id} position={[lat, lng]}>
                <Popup>
                  <div>
                    <b>{r.category}</b>
                    <div>Status: {r.status}</div>
                    <div style={{ marginTop: 6 }}>{r.description}</div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}
