import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import Card from "../components/Card";
import PageHeader from "../components/PageHeader";

import { citizenCreateRequest } from "../api/requests";
import { createCitizen } from "../api/citizens";
import { setCitizenId, getCitizenId, setRole } from "../api/client";

import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";

// ---- خيارات جاهزة ----
const CATEGORIES = [
  "pothole",
  "street_light",
  "garbage",
  "water_leak",
  "road_block",
  "other",
];

const PRIORITIES = ["P1", "P2", "P3"];

// ---- Component يلتقط click على الخريطة ----
function ClickPicker({ value, onChange }) {
  useMapEvents({
    click(e) {
      onChange([e.latlng.lat, e.latlng.lng]);
    },
  });

  if (!value) return null;
  return <Marker position={value} />;
}

export default function CitizenNewRequest() {
  const nav = useNavigate();

  // تأكد role citizen بهذا المتصفح
  useEffect(() => {
    setRole("citizen");
  }, []);

  // --- Profile ---
  const [anonymous, setAnonymous] = useState(true);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");

  // --- Request fields ---
  const [category, setCategory] = useState("pothole");
  const [priority, setPriority] = useState("P3");
  const [description, setDescription] = useState("");

  // --- Location (lat,lng) للاستخدام بالـ leaflet ---
  const [picked, setPicked] = useState(null); // [lat,lng]
  const [addressHint, setAddressHint] = useState("");

  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const center = useMemo(() => picked || [31.9, 35.2], [picked]);

  // generate idempotency key
  function makeIdempotencyKey() {
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  async function ensureCitizenProfileIfNeeded() {
    // لو anonymous ما بدنا citizen profile
    if (anonymous) return null;

    // لو عندك citizen_id مخزن أصلا لا تعمله مرة ثانية
    const existing = getCitizenId();
    if (existing) return existing;

    // اعمل citizen profile
    const payload = {
      full_name: fullName || null,
      email: email || null,
      phone: phone || null,
      anonymous: false,
    };

    const res = await createCitizen(payload);
    const cid = res.citizen_id;
    setCitizenId(cid);
    return cid;
  }

  async function onSubmit(e) {
    e.preventDefault();
    setErr("");
    setMsg("");

    // validation بسيط
    if (!description.trim()) {
      setErr("Please enter a description.");
      return;
    }
    if (!picked) {
      setErr("Please pick a location from the map.");
      return;
    }

    // لو مش anonymous لازم واحد على الأقل من email/phone
    if (!anonymous) {
      const ok = (email && email.trim()) || (phone && phone.trim());
      if (!ok) {
        setErr("For verification, please provide at least Email or Phone.");
        return;
      }
    }

    setLoading(true);
    try {
      // 1) create citizen profile if needed
      const cid = await ensureCitizenProfileIfNeeded();

      // 2) build request payload (backend expects GeoJSON: [lng, lat])
      const lat = picked[0];
      const lng = picked[1];

      const payload = {
        category,
        description,
        priority,
        location: {
          type: "Point",
          coordinates: [lng, lat],
          address_hint: addressHint || null,
          zone_id: null,
        },
      };

      const idemKey = makeIdempotencyKey();
      const created = await citizenCreateRequest(payload, idemKey);

      setMsg("✅ Request submitted successfully!");

      // لو مش anonymous: خليه يروح ع verify مباشرة
      if (!anonymous && cid) {
        // نوديه لصفحة verify
        nav("/citizen/verify");
        return;
      }

      // anonymous: نوديه على My Requests
      nav("/citizen/my");
    } catch (e2) {
      setErr(e2.message || "Failed to submit request.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <PageHeader
        title="New Service Request"
        subtitle="Submit a new municipal service request"
        right={<Link className="btn-ghost" to="/citizen/my">My Requests</Link>}
      />

      {err && <div style={{ color: "var(--danger)", marginBottom: 10 }}>{err}</div>}
      {msg && <div style={{ color: "var(--success)", marginBottom: 10 }}>{msg}</div>}

      <form onSubmit={onSubmit} style={{ display: "grid", gap: 14 }}>
        {/* Profile mode */}
        <div
          style={{
            border: "1px solid var(--border)",
            borderRadius: 14,
            padding: 12,
            background: "rgba(0,0,0,.03)",
          }}
        >
          <div className="row" style={{ alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <div style={{ fontWeight: 900 }}>Submit As</div>
              <div style={{ color: "var(--muted)", fontSize: 12, marginTop: 4 }}>
                Anonymous or with a profile (OTP verify)
              </div>
            </div>

            <label className="row" style={{ gap: 8, userSelect: "none" }}>
              <input
                type="checkbox"
                checked={!anonymous}
                onChange={(e) => setAnonymous(!e.target.checked)}
              />
              <span style={{ fontWeight: 800 }}>With Profile</span>
            </label>
          </div>

          {!anonymous && (
            <div className="grid-2" style={{ marginTop: 12 }}>
              <div>
                <label>Full Name</label>
                <input
                  className="input"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your name"
                />
              </div>
              <div>
                <label>Email (or Phone)</label>
                <input
                  className="input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@example.com"
                />
              </div>
              <div>
                <label>Phone (optional)</label>
                <input
                  className="input"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+970..."
                />
              </div>
              <div style={{ alignSelf: "end", color: "var(--muted)", fontSize: 12 }}>
                بعد الإرسال رح يحولك على صفحة OTP Verify.
              </div>
            </div>
          )}
        </div>

        {/* Request fields */}
        <div className="grid-2">
          <div>
            <label>Category</label>
            <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div>
            <label>Priority</label>
            <select className="input" value={priority} onChange={(e) => setPriority(e.target.value)}>
              {PRIORITIES.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label>Description</label>
          <textarea
            className="input"
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the issue..."
          />
        </div>

        <div>
          <label>Address Hint (optional)</label>
          <input
            className="input"
            value={addressHint}
            onChange={(e) => setAddressHint(e.target.value)}
            placeholder="Street name, landmark..."
          />
        </div>

        {/* Map */}
        <div>
          <div className="row" style={{ justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <div style={{ fontWeight: 900 }}>Pick Location</div>
              <div style={{ color: "var(--muted)", fontSize: 12, marginTop: 4 }}>
                Click on the map to select the request location
              </div>
            </div>

            <div style={{ color: "var(--muted)", fontSize: 12 }}>
              {picked ? `Lat: ${picked[0].toFixed(5)} | Lng: ${picked[1].toFixed(5)}` : "No location selected"}
            </div>
          </div>

          <div
            style={{
              height: 420,
              borderRadius: 16,
              overflow: "hidden",
              border: "1px solid var(--border)",
              marginTop: 10,
            }}
          >
            <MapContainer center={center} zoom={12} style={{ height: "100%", width: "100%" }}>
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
              <ClickPicker value={picked} onChange={setPicked} />
            </MapContainer>
          </div>
        </div>

        <div className="row" style={{ gap: 10 }}>
          <button className="btn btn-primary" type="submit" disabled={loading}>
            {loading ? "Submitting..." : "Submit Request"}
          </button>

          <Link className="btn" to="/citizen/my">
            Cancel
          </Link>
        </div>
      </form>
    </Card>
  );
}
