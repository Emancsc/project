import { apiPost, apiGet } from "./client";

export function citizenRegister(payload) {
  // payload: { name, email, password }
  return apiPost("/auth/register", payload);
}

export function citizenLogin(payload) {
  // payload: { email, password }
  return apiPost("/auth/login", payload);
}

export function me() {
  return apiGet("/auth/me");
}
