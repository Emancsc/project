import { useEffect, useState } from "react";
import { createCitizen } from "../api/citizens";
import { getCitizenId, setCitizenId, setRole } from "../api/client";

export default function CitizenBootstrap({ children }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // default role = citizen (بدون ما نخرب ستاف بمتصفح ثاني)
    setRole("citizen");

    const existing = getCitizenId();
    if (existing) {
      setReady(true);
      return;
    }

    createCitizen({ anonymous: true })
      .then((res) => {
        if (res?.citizen_id) setCitizenId(res.citizen_id);
      })
      .finally(() => setReady(true));
  }, []);

  if (!ready) {
    return (
      <div style={{ padding: 24, color: "var(--muted)" }}>
        Initializing citizen session...
      </div>
    );
  }

  return children;
}
