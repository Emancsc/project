import { apiGet, apiPost, apiPatch } from "./client";

// Citizen
export function citizenCreateRequest(payload) {
  return apiPost("/requests", payload);
}

export function citizenMyRequests() {
  return apiGet("/requests/me");
}

export function citizenGetRequestById(id) {
  return apiGet(`/requests/${id}`);
}

// Staff
export function staffListRequests({ page = 1, page_size = 10, status = "", category = "", priority = "" } = {}) {
  const qs = new URLSearchParams({
    page: String(page),
    page_size: String(page_size),
    status,
    category,
    priority,
  }).toString();

  return apiGet(`/requests?${qs}`);
}

export function staffGetRequestById(id) {
  return apiGet(`/requests/${id}`);
}

// ✅ FIX: send body { next_status: "assigned" }
export function staffTransition(requestId, nextStatus) {
  return apiPatch(`/requests/${requestId}/transition`, {
    next_status: nextStatus,
  });
}

export function staffSetPriority(requestId, priority) {
  return apiPatch(`/requests/${requestId}/priority`, {
    priority,
  });
}

export function nearbyRequests(lng, lat, radius_m = 1000) {
  const qs = new URLSearchParams({
    lng: String(lng),
    lat: String(lat),
    radius_m: String(radius_m),
  }).toString();

  return apiGet(`/requests/nearby?${qs}`);
}
