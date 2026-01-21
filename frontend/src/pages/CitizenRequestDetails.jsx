import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Card from "../components/Card";
import PageHeader from "../components/PageHeader";
import StatusBadge from "../components/StatusBadge";
import { citizenGetRequestById, citizenAddComment, citizenRate } from "../api/requests";

export default function CitizenRequestDetails() {
  const { id } = useParams();
  const [req, setReq] = useState(null);

  const [comment, setComment] = useState("");
  const [stars, setStars] = useState(5);
  const [ratingComment, setRatingComment] = useState("");

  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  function load() {
    setErr("");
    citizenGetRequestById(id)
      .then(setReq)
      .catch((e) => setReq({ _error: e.message || "Failed to load" }));
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function onAddComment() {
    setErr("");
    setMsg("");
    try {
      await citizenAddComment(id, { text: comment });
      setComment("");
      setMsg("Comment added.");
    } catch (e) {
      setErr(e.message);
    }
  }

  async function onRate() {
    setErr("");
    setMsg("");
    try {
      await citizenRate(id, { stars, comment: ratingComment, reason_codes: [] });
      setMsg("Thanks! Your rating was submitted.");
      setRatingComment("");
      load();
    } catch (e) {
      setErr(e.message);
    }
  }

  if (!req) return <Card>Loading...</Card>;
  if (req._error) return <Card>{req._error}</Card>;

  const coords = req.location?.coordinates || [];
  const canRate = req.status === "resolved" || req.status === "closed";

  return (
    <Card>
      <PageHeader
        title={`Request: ${req.category}`}
        subtitle="Citizen view"
        right={<Link className="btn-ghost" to="/citizen">Back</Link>}
      />

      <div className="row" style={{ alignItems: "center", marginBottom: 12 }}>
        <StatusBadge status={req.status} />
        <div style={{ color: "var(--muted)", fontSize: 12 }}>ID: {req._id}</div>
      </div>

      <div style={{ display: "grid", gap: 12 }}>
        <div>
          <div style={{ color: "var(--muted)", fontSize: 12 }}>Description</div>
          <div style={{ marginTop: 6 }}>{req.description}</div>
        </div>

        <div className="row">
          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ color: "var(--muted)", fontSize: 12 }}>Priority</div>
            <div style={{ marginTop: 6, fontWeight: 900 }}>{req.priority || "—"}</div>
          </div>

          <div style={{ flex: 1, minWidth: 220 }}>
            <div style={{ color: "var(--muted)", fontSize: 12 }}>Location</div>
            <div style={{ marginTop: 6 }}>
              {coords.length === 2 ? `${coords[0]}, ${coords[1]}` : "—"}
            </div>
          </div>
        </div>

        <div>
          <label>Add Comment</label>
          <textarea
            className="input"
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Write a comment..."
          />
          <div style={{ marginTop: 8 }}>
            <button className="btn" onClick={onAddComment} disabled={!comment.trim()}>
              Submit Comment
            </button>
          </div>
        </div>

        <div>
          <label>Rate Service</label>
          {!canRate ? (
            <div style={{ color: "var(--muted)", marginTop: 6 }}>
              You can rate after the request is resolved/closed.
            </div>
          ) : (
            <>
              <div className="row" style={{ alignItems: "center", gap: 10, marginTop: 8 }}>
                <select className="input" value={stars} onChange={(e) => setStars(Number(e.target.value))}>
                  {[1,2,3,4,5].map((s) => <option key={s} value={s}>{s} ⭐</option>)}
                </select>
                <button className="btn" onClick={onRate}>Submit Rating</button>
              </div>

              <textarea
                className="input"
                rows={3}
                value={ratingComment}
                onChange={(e) => setRatingComment(e.target.value)}
                placeholder="Optional comment..."
                style={{ marginTop: 8 }}
              />
            </>
          )}
        </div>

        {msg && <div style={{ color: "var(--success)" }}>{msg}</div>}
        {err && <div style={{ color: "var(--danger)" }}>{err}</div>}
      </div>
    </Card>
  );
}
