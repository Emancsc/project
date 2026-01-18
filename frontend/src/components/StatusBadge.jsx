export default function StatusBadge({ status }) {
  const map = {
    new: "NEW",
    triaged: "TRIAGED",
    assigned: "ASSIGNED",
    in_progress: "IN PROGRESS",
    resolved: "RESOLVED",
    closed: "CLOSED",
  };

  return (
    <span
      style={{
        fontSize: 11,
        fontWeight: 900,
        padding: "6px 10px",
        borderRadius: 999,
        border: "1px solid var(--border)",
        background: "rgba(0,0,0,.18)",
      }}
    >
      {map[status] || status}
    </span>
  );
}
