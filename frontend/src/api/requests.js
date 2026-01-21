import { apiRequest } from "./client";

// ---------- Citizen ----------
export const createRequest = (data, idempotencyKey) =>
  apiRequest({
    url: "/requests",
    method: "POST",
    data,
    headers: {
      "Idempotency-Key": idempotencyKey,
    },
  });

export const getMyRequests = () =>
  apiRequest({
    url: "/requests/me",
    method: "GET",
  });

export const getRequestById = (id) =>
  apiRequest({
    url: `/requests/${id}`,
    method: "GET",
  });

export const getTimeline = (id) =>
  apiRequest({
    url: `/requests/${id}/timeline`,
    method: "GET",
  });

export const addComment = (id, payload) =>
  apiRequest({
    url: `/requests/${id}/comment`,
    method: "POST",
    data: payload,
  });

export const addRating = (id, payload) =>
  apiRequest({
    url: `/requests/${id}/rating`,
    method: "POST",
    data: payload,
  });

// ---------- Staff ----------
const staffHeaders = { "X-Role": "staff" };

export const listRequests = (params) =>
  apiRequest({
    url: "/requests",
    method: "GET",
    params,
    headers: staffHeaders,
  });

export const transitionRequest = (id, payload) =>
  apiRequest({
    url: `/requests/${id}/transition`,
    method: "PATCH",
    data: payload,
    headers: staffHeaders,
  });

export const updatePriority = (id, payload) =>
  apiRequest({
    url: `/requests/${id}/priority`,
    method: "PATCH",
    data: payload,
    headers: staffHeaders,
  });

export const autoAssign = (id) =>
  apiRequest({
    url: `/requests/${id}/auto-assign`,
    method: "POST",
    headers: staffHeaders,
  });

export const assignAgent = (id, agentId) =>
  apiRequest({
    url: `/requests/${id}/assign/${agentId}`,
    method: "POST",
    headers: staffHeaders,
  });

export const mergeRequest = (id, masterId) =>
  apiRequest({
    url: `/requests/${id}/merge`,
    method: "POST",
    data: { master_request_id: masterId },
    headers: staffHeaders,
  });

export const escalateRequest = (id) =>
  apiRequest({
    url: `/requests/${id}/escalate`,
    method: "POST",
    headers: staffHeaders,
  });

// ----------------------------
// Backward-compatible aliases
// ----------------------------

// Citizen
export const citizenCreateRequest = (data, idempotencyKey) =>
  createRequest(data, idempotencyKey);

export const citizenMyRequests = () => getMyRequests();

export const citizenGetRequestById = (id) => getRequestById(id);

export const citizenGetTimeline = (id) => getTimeline(id);

export const citizenAddComment = (id, payload) => addComment(id, payload);

export const citizenAddRating = (id, payload) => addRating(id, payload);

// Staff
export const staffListRequests = (params) => listRequests(params);

export const staffGetRequestById = (id) => getRequestById(id);

export const staffTransition = (id, payload) =>
  transitionRequest(id, payload);

export const staffSetPriority = (id, payload) =>
  updatePriority(id, payload);

export const staffAutoAssign = (id) => autoAssign(id);

export const staffAssignAgent = (id, agentId) =>
  assignAgent(id, agentId);

export const staffMerge = (id, masterId) =>
  mergeRequest(id, masterId);

export const staffEscalate = (id) => escalateRequest(id);

export const staffGetTimeline = (id) => getTimeline(id);
