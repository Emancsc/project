import { useEffect, useState } from "react";
import Card from "../components/Card";
import PageHeader from "../components/PageHeader";
import { getCitizenId } from "../api/client";
import { createCitizen, getCitizenMe, sendOtp, verifyOtp } from "../api/citizens";

export default function CitizenVerify() {
  const citizenId = getCitizenId();

  const [profile, setProfile] = useState(null);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [anonymous, setAnonymous] = useState(false);

  const [channel, setChannel] = useState("email");
  const [code, setCode] = useState("");

  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [otpShown, setOtpShown] = useState("");

  async function load() {
    setErr("");
    setMsg("");
    try {
      const me = await getCitizenMe();
      setProfile(me);
      setFullName(me.full_name || "");
      setEmail(me.email || "");
      setPhone(me.phone || "");
      setAnonymous(!!me.anonymous);
    } catch (e) {
      setErr(e.message);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line
  }, []);

  async function onSaveProfile() {
    setErr("");
    setMsg("");
    setOtpShown("");
    try {
      await createCitizen({
        full_name: fullName || null,
        email: email || null,
        phone: phone || null,
        anonymous: false, // ✅ مهم
      });
      setMsg("Profile saved.");
      await load();
    } catch (e) {
      setErr(e.message);
    }
  }

  async function onSend() {
    setErr("");
    setMsg("");
    setOtpShown("");
    try {
      const res = await sendOtp(channel);
      setMsg(`OTP sent via ${res.channel} (stub).`);
      if (res.otp_stub_code) setOtpShown(res.otp_stub_code);
      await load();
    } catch (e) {
      setErr(e.message);
    }
  }

  async function onVerify() {
    setErr("");
    setMsg("");
    try {
      const res = await verifyOtp(code);
      setMsg("Verified successfully ✅");
      setProfile(res.citizen);
      setOtpShown("");
    } catch (e) {
      setErr(e.message);
    }
  }

  const canSendEmail = !!(profile?.email);
  const canSendPhone = !!(profile?.phone);

  return (
    <Card>
      <PageHeader
        title="Citizen Verification (OTP Stub)"
        subtitle="Save your profile then send OTP (stub code يظهر للتجربة)"
      />

      <div style={{ color: "var(--muted)", marginBottom: 10 }}>
        Citizen ID: <b>{citizenId}</b>
      </div>

      {err && <div style={{ color: "var(--danger)", marginBottom: 10 }}>{err}</div>}
      {msg && <div style={{ color: "var(--success)", marginBottom: 10 }}>{msg}</div>}

      <div className="grid-2">
        {/* Profile */}
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontWeight: 900, marginBottom: 10 }}>Profile</div>

          <label>Full name</label>
          <input className="input" value={fullName} onChange={(e) => setFullName(e.target.value)} />

          <div style={{ height: 10 }} />

          <label>Email</label>
          <input className="input" value={email} onChange={(e) => setEmail(e.target.value)} />

          <div style={{ height: 10 }} />

          <label>Phone</label>
          <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g. 059xxxxxxx" />

          <div style={{ height: 14 }} />

          <button className="btn btn-primary" type="button" onClick={onSaveProfile}>
            Save Profile
          </button>

          <div style={{ marginTop: 12, color: "var(--muted)", fontSize: 13 }}>
            Verification state: <b>{profile?.verification?.state || "—"}</b>
          </div>
        </div>

        {/* OTP */}
        <div className="card" style={{ padding: 16 }}>
          <div style={{ fontWeight: 900, marginBottom: 10 }}>OTP</div>

          <label>Channel</label>
          <select className="input" value={channel} onChange={(e) => setChannel(e.target.value)}>
            <option value="email" disabled={!canSendEmail}>email</option>
            <option value="phone" disabled={!canSendPhone}>phone</option>
          </select>

          <div style={{ height: 12 }} />

          <button className="btn" type="button" onClick={onSend}>
            Send OTP
          </button>

          {otpShown && (
            <div style={{ marginTop: 12 }}>
              <div style={{ color: "var(--muted)", fontSize: 12 }}>Stub OTP (for testing):</div>
              <div style={{ fontSize: 24, fontWeight: 900, letterSpacing: 2 }}>{otpShown}</div>
            </div>
          )}

          <div style={{ height: 14 }} />

          <label>Enter Code</label>
          <div className="row" style={{ gap: 10 }}>
            <input
              className="input"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="6 digits"
            />
            <button className="btn btn-primary" type="button" onClick={onVerify}>
              Verify
            </button>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 14 }}>
        <div style={{ color: "var(--muted)", fontSize: 12 }}>Current Profile (debug)</div>
        <pre className="codeblock">{JSON.stringify(profile, null, 2)}</pre>
      </div>
    </Card>
  );
}
