import { useEffect, useState } from "react";
import { apiGet } from "../api/client";


export default function RequestsPage() {
  const [data, setData] = useState(null);
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
  const path = `/requests/?page=${page}&page_size=10&status=${status}`;

  apiGet(path)
    .then(setData)
    .catch(() => {
      setData({
        items: [],
        page: 1,
        page_size: 10,
        total: 0,
        _error: "Unauthorized. Please login as staff.",
      });
    });
}, [page, status]);


  if (!data) return <p style={{ padding: 20 }}>Loading...</p>;

  const canPrev = page > 1;
  const canNext = page * data.page_size < data.total;

  return (
    <div style={{ padding: 20 }}>
      <h1>Requests List</h1>

      <div style={{ marginBottom: 12 }}>
        <label style={{ marginRight: 8 }}>Status:</label>
        <select
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value);
          }}
        >
          <option value="">All</option>
          <option value="new">new</option>
          <option value="triaged">triaged</option>
          <option value="assigned">assigned</option>
          <option value="in_progress">in_progress</option>
          <option value="resolved">resolved</option>
          <option value="closed">closed</option>
        </select>
      </div>

      <div style={{ marginBottom: 8, color: "#444" }}>
        Total: {data.total} | Page: {data.page}
      </div>

      <ul>
        {data.items.map((r) => (
          <li key={r._id} style={{ marginBottom: 8 }}>
            <b>{r.category}</b> — {r.status}
            <div style={{ fontSize: 12, color: "#666" }}>{r.description}</div>
          </li>
        ))}
      </ul>

      {data.items.length === 0 && <p>No requests found.</p>}

      <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
        <button disabled={!canPrev} onClick={() => setPage((p) => p - 1)}>
          Prev
        </button>
        <button disabled={!canNext} onClick={() => setPage((p) => p + 1)}>
          Next
        </button>
      </div>
    </div>
  );
}
