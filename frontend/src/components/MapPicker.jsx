import { useEffect, useMemo, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import L from "leaflet";

// Fix default marker icons in Vite
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

function ClickHandler({ onPick }) {
  useMapEvents({
    click(e) {
      onPick({ lat: e.latlng.lat, lng: e.latlng.lng });
    },
  });
  return null;
}

export default function MapPicker({
  value, // {lat, lng}
  onChange,
  height = 360,
  defaultCenter = { lat: 31.9, lng: 35.2 },
  defaultZoom = 12,
}) {
  const [pos, setPos] = useState(value || defaultCenter);

  useEffect(() => {
    if (value) setPos(value);
  }, [value]);

  const center = useMemo(() => [pos.lat, pos.lng], [pos]);

  function pick(p) {
    setPos(p);
    onChange?.(p);
  }

  return (
    <div
      style={{
        height,
        borderRadius: 16,
        overflow: "hidden",
        border: "1px solid var(--border)",
        background: "rgba(0,0,0,.12)",
      }}
    >
      <MapContainer center={center} zoom={defaultZoom} style={{ height: "100%", width: "100%" }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <ClickHandler onPick={pick} />
        <Marker position={center} />
      </MapContainer>
    </div>
  );
}
