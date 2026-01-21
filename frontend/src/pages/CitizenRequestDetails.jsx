import { useEffect, useMemo, useState } from "react";
import { useParams, Link } from "react-router-dom";
import Card from "../components/Card";
import PageHeader from "../components/PageHeader";
import StatusBadge from "../components/StatusBadge";

import {
  citizenGetRequestById,
  citizenGetTimeline,
  citizenAddComment,
  citizenAddRating,
} from "../api/requests";

function formatEvent(ev) {
  const at = ev?.at ? new Date(ev.at).toLocaleString() : "";
  const type = ev?.type || "event";
  const meta = ev?.meta || {};
  const who = meta.display_name || ev?.by?.actor_id || ev?.by?.actor_type || "";

  if (type === "comment") return `${who} commented`;
  if (type === "rating") return `${who} rated (${meta.stars}★)`;
  if (type === "transition") return `Status changed`;
  if (type.startsWith("milestone:")) return `Milestone: ${type.replace("milestone:", "")}`;
  if (type === "created") return `Request created`;
  return type;

  // you can expand later
}

export default function CitizenRequestDetails() {
  const { id } = useParams();

  const [req, setReq] = useState(null);
  const [timeline, setTimeline] = useState(null);

  const [commentText, setCommentText] = useState("");
  const [commentMsg, setCommentMsg] = useState("");
  const [commentErr, setCommentErr] = useState("");

  const [stars, setStars] = useState(5);
  const [rateComment, setRateComment] = useState("");
  const [rateMsg, setRateMsg] = useState("");
  const [rateErr, setRateErr] = useState("");

  const comments = useMemo(() => {
    const stream = timeline?.event_stream || [];
    return stream.filter((e) => e.type === "comment").slice().reverse();
  }, [timeline]);

  const ratings = useMemo(() => {
    const stream = timeline?.event_stream || [];
    return stream.filter((e) => e.type === "rating").slice().reverse();
  }, [timeline]);

  async function load() {
    const r = await citizenGetRequestById(id);
    setReq(r);

    const t = await citizenGetTimeline(id);
    setTimeline(t);
  }

  useEffect(() => {
    load().catch((e) => {
      setReq({ _error: e.message || "Failed to load request." });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  async function onAddComment() {
    setCommentMsg("");
    setCommentErr("");

    const text = commentText.trim();
    if (!text) {
      setCommentErr("Write a comment first.");
      return;
    }

    try {
      await citizenAddComment(id, { text });
      setCommentText("");
      setCommentMsg("Comment added.");
      const t = await citizenGetTimeline(id);
      setTimeline(t);
    } catch (e) {
      setCommentErr(e.message || "Failed to add comment.");
    }
  }

  async function onAddRating() {
    setRateMsg("");
    setRateErr("");

    try {
      await citizenAddRating(id, { stars: Number(stars), comment: rateComment, reason_codes: [] });
      setRateMsg("Rating submitted.");
      const t = await citizenGetTimeline(id);
      setTimeline(t);
    } catch (e) {
      setRateErr(e.message || "Failed to submit rating.");
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
        subtitle="Track progress, timeline, comments and rating"
        right={<Link className="btn-ghost" to="/citizen/my">Back</Link>}
      />

      <div className="row" style={{ alignItems: "center", gap: 10, marginBottom: 12 }}>
        <StatusBadge status={req.status} />
        <div style={{ color: "var(--muted)", fontSize: 12 }}>ID: {req._id}</div>
      </div>

      <div style={{ display: "grid", gap: 14 }}>
        <div>
          <div style={{ color: "var(--muted)", fontSize: 12 }}>Description</div>
          <div style={{ marginTop: 6 }}>{req.description}</div>
        </div>

        <div>
          <div style={{ color: "var(--muted)", fontSize: 12 }}>Location</div>
          <div style={{ marginTop: 6 }}>
            {coords.length === 2 ? `${coords[0]}, ${coords[1]}` : "—"}
          </div>
        </div>

        {/* Timeline */}
        <div style={{ marginTop: 8 }}>
          <div style={{ fontWeight: 900, marginBottom: 8 }}>Timeline</div>

          {!timeline ? (
            <div style={{ color: "var(--muted)" }}>Loading timeline...</div>
          ) : (
            <div style={{ display: "grid", gap: 8 }}>
              {(timeline.event_stream || []).slice().reverse().map((ev, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: 12,
                    border: "1px solid var(--border)",
                    borderRadius: 14,
                    background: "rgba(0,0,0,.03)",
                  }}
                >
                  <div style={{ fontWeight: 800 }}>{formatEvent(ev)}</div>
                  <div style={{ marginTop: 4, fontSize: 12, color: "var(--muted)" }}>
                    {ev.at ? new Date(ev.at).toLocaleString() : ""}
                  </div>

                  {/* show comment text */}
                  {ev.type === "comment" && (
                    <div style={{ marginTop: 8 }}>
                      <div style={{ fontSize: 12, color: "var(--muted)" }}>
                        By: {ev.meta?.display_name || "Citizen"}
                      </div>
                      <div style={{ marginTop: 6 }}>{ev.meta?.text}</div>
                    </div>
                  )}

                  {/* show rating */}
                  {ev.type === "rating" && (
                    <div style={{ marginTop: 8 }}>
                      <div style={{ fontSize: 12, color: "var(--muted)" }}>
                        By: {ev.meta?.display_name || "Citizen"}
                      </div>
                      <div style={{ marginTop: 6 }}>
                        {"⭐".repeat(Number(ev.meta?.stars || 0))} ({ev.meta?.stars} / 5)
                      </div>
                      {ev.meta?.comment ? (
                        <div style={{ marginTop: 6 }}>{ev.meta.comment}</div>
                      ) : null}
                    </div>
                  )}
                </div>
              ))}

              {(timeline.event_stream || []).length === 0 && (
                <div style={{ color: "var(--muted)" }}>No timeline events yet.</div>
              )}
            </div>
          )}
        </div>

        {/* Add Comment */}
        <div style={{ marginTop: 10 }}>
          <div style={{ fontWeight: 900, marginBottom: 8 }}>Add Comment</div>
          <textarea
            className="input"
            rows={3}
            placeholder="Write your comment..."
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
          />
          <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
            <button className="btn btn-primary" type="button" onClick={onAddComment}>
              Submit Comment
            </button>
            <button className="btn" type="button" onClick={() => setCommentText("")}>
              Clear
            </button>
          </div>
          {commentMsg && <div style={{ color: "var(--success)", marginTop: 10 }}>{commentMsg}</div>}
          {commentErr && <div style={{ color: "var(--danger)", marginTop: 10 }}>{commentErr}</div>}
        </div>

        {/* Rating */}
        <div style={{ marginTop: 10 }}>
          <div style={{ fontWeight: 900, marginBottom: 8 }}>Rate Service</div>

          {!canRate ? (
            <div style={{ color: "var(--muted)" }}>
              You can rate only after the request is resolved/closed.
            </div>
          ) : (
            <>
              <label>Stars</label>
              <select className="input" value={stars} onChange={(e) => setStars(e.target.value)}>
                {[5, 4, 3, 2, 1].map((s) => (
                  <option key={s} value={s}>
                    {s} Stars
                  </option>
                ))}
              </select>

              <label style={{ marginTop: 10, display: "block" }}>Comment (optional)</label>
              <textarea
                className="input"
                rows={3}
                placeholder="Optional feedback..."
                value={rateComment}
                onChange={(e) => setRateComment(e.target.value)}
              />

              <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
                <button className="btn btn-primary" type="button" onClick={onAddRating}>
                  Submit Rating
                </button>
              </div>

              {rateMsg && <div style={{ color: "var(--success)", marginTop: 10 }}>{rateMsg}</div>}
              {rateErr && <div style={{ color: "var(--danger)", marginTop: 10 }}>{rateErr}</div>}
            </>
          )}
        </div>
      </div>
    </Card>
  );
}
