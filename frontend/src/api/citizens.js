import { apiRequest } from "./client";

// create new citizen (no header) OR update existing (header X-Citizen-Id auto sent by apiRequest)
export const createCitizen = (payload) =>
  apiRequest({
    url: "/citizens",
    method: "POST",
    data: payload,
  });

export const getCitizenMe = () =>
  apiRequest({
    url: "/citizens/me",
    method: "GET",
  });

export const sendOtp = (channel) =>
  apiRequest({
    url: `/citizens/otp/send?channel=${encodeURIComponent(channel)}`,
    method: "POST",
  });

export const verifyOtp = (code) =>
  apiRequest({
    url: `/citizens/otp/verify?code=${encodeURIComponent(code)}`,
    method: "POST",
  });
