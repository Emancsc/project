// src/api/client.js
import axios from "axios";

const BASE_URL =
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000";

export const client = axios.create({
  baseURL: BASE_URL,
  withCredentials: false,
});

// -----------------------------
// Role & Citizen helpers
// -----------------------------

export function setRole(role) {
  localStorage.setItem("cst_role", role);
}

export function getRole() {
  return localStorage.getItem("cst_role") || "citizen";
}

export function setCitizenId(id) {
  localStorage.setItem("cst_citizen_id", id);
}

export function getCitizenId() {
  const v = localStorage.getItem("cst_citizen_id");
  // تجاهل public-citizen لأنه مش ObjectId
  if (!v || v === "public-citizen") return "";
  return v;
}


// -----------------------------
// Main API request helper
// -----------------------------

export async function apiRequest(config) {
  const role = getRole();
  const citizenId = getCitizenId();

  const headers = {
    ...(config.headers || {}),
    "X-Role": role,
  };

  if (citizenId) {
    headers["X-Citizen-Id"] = citizenId;
  }

  try {
    const res = await client.request({
      ...config,
      headers,
    });
    return res.data;
  } catch (err) {
    const msg =
      err?.response?.data?.detail ||
      err?.response?.data?.message ||
      err?.message ||
      "Request failed";

    throw new Error(
      typeof msg === "string" ? msg : JSON.stringify(msg)
    );
  }
}
