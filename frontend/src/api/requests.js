import { apiGet, apiPost, apiPatch } from "./client";

// Staff
export function staffListRequests(params = "") {
  return apiGet(`/requests/${params}`);
}
export function staffGetRequestById(id) {
  return apiGet(`/requests/${id}`);
}
export function staffTransition(id, next_status) {
  // backend expects body: { next_status: <enum string> }
  return apiPatch(`/requests/${id}/transition`, { next_status });
}
export function staffSetPriority(id, priority) {
  return apiPatch(`/requests/${id}/priority`, { priority });
}
export function staffAutoAssign(id) {
  return apiPost(`/requests/${id}/auto-assign`, {});
}
export function staffAssignToAgent(id, agentId) {
  return apiPost(`/requests/${id}/assign/${agentId}`, {});
}

// Citizen
export function citizenCreateRequest(body) {
  return apiPost(`/requests/`, body);
}
export function citizenMyRequests() {
  return apiGet(`/requests/me`);
}
export function citizenGetRequestById(id) {
  return apiGet(`/requests/${id}`);
}
export function citizenAddComment(id, body) {
  return apiPost(`/requests/${id}/comment`, body);
}
export function citizenRate(id, body) {
  return apiPost(`/requests/${id}/rating`, body);
}

// Map/shared
export function nearbyRequests(lng, lat, radius_m = 1000) {
  return apiGet(`/requests/nearby?lng=${lng}&lat=${lat}&radius_m=${radius_m}`);
}

// Analytics
export function analyticsKPIs() {
  return apiGet(`/analytics/kpis`);
}
export function analyticsHeatmap() {
  return apiGet(`/analytics/geofeeds/heatmap`);
}
export function analyticsCohorts() {
  return apiGet(`/analytics/cohorts`);
}
export function analyticsAgents() {
  return apiGet(`/analytics/agents`);
}
