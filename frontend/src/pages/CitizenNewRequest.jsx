import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Card from "../components/Card";
import PageHeader from "../components/PageHeader";
import MapPicker from "../components/MapPicker";
import { citizenCreateRequest } from "../api/requests";

export default function CitizenNewRequest() {
  const nav = useNavigate();
  const [err, setErr] = useState("");
  const [gpsMsg, setGpsMsg] = useState("");
  const [gpsLoading, setGpsLoading] = useState(false);

  const [form, setForm] = useState({
    category: "pothole",
    description: "",
    location: { lat: 31.9, lng: 35.2 },
  });

  function useMyLocation() {
    setErr("");
    setGpsMsg("");
    if (!navigator.geolocation) {
      setErr("Geolocation is not supported in this browser.");
      return;
    }

    setGpsLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        setForm((f) => ({ ...f, location: { lat, lng } }));
        setGpsMsg("Location updated from GPS.");
        setGpsLoading(false);
      },
      (e) => {
        setErr(e.message || "Failed to get GPS location.");
        setGpsLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    setGpsMsg("");

    try {
      const payload = {
        category: form.category,
        description: form.description,
        location: {
          type: "Point",
          coordinates: [Number(form.location.lng), Number(form.location.lat)], // [lng, lat]
        },
      };

      const created = await citizenCreateRequest(payload);
      nav(`/citizen/requests/${created._id}`);
    } catch (e2) {
      setErr(e2.message || "Failed to create request.");
    }
  }

  return (
    <Card>
      <PageHeader title="New Request" subtitle="Click on the map or use GPS to select location" />

      <form onSubmit={onSubmit} className="grid" style={{ gap: 12 }}>
        <div>
          <label>Category</label>
          <select
            className="input"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          >
            <option value="pothole">pothole</option>
            <option value="street_light">street_light</option>
            <option value="trash">trash</option>
            <option value="water_leak">water_leak</option>
            <option value="other">other</option>
          </select>
        </div>

        <div>
          <label>Description</label>
          <textarea
            className="input"
            rows={4}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            required
          />
        </div>

        <div className="row" style={{ alignItems: "center" }}>
          <button type="button" className="btn-ghost" onClick={useMyLocation} disabled={gpsLoading}>
            {gpsLoading ? "Getting GPS..." : "Use my current location"}
          </button>

          <div style={{ marginLeft: "auto", fontSize: 12, color: "var(--muted)" }}>
            Selected: <b>{form.location.lng.toFixed(6)}</b>, <b>{form.location.lat.toFixed(6)}</b>
          </div>
        </div>

        <div>
          <label>Pick Location (click on map)</label>
          <MapPicker
            value={form.location}
            onChange={(p) => setForm({ ...form, location: p })}
            height={380}
          />
        </div>

        {gpsMsg && <div style={{ color: "var(--success)" }}>{gpsMsg}</div>}
        {err && <div style={{ color: "var(--danger)" }}>{err}</div>}

        <button className="btn" type="submit">
          Submit Request
        </button>
      </form>
    </Card>
  );
}
