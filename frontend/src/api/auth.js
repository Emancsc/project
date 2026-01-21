import { apiRequest } from "./client";

export const staffLogin = (email, password) =>
  apiRequest({
    url: "/auth/staff/login",
    method: "POST",
    data: {
      email: String(email || "").trim(),
      password: String(password || "")
    },
    headers: {
      "Content-Type": "application/json"
    }
  });
