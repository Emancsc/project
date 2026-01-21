import { apiRequest } from "./client";

// KPIs (staff-only)
export const getKpis = () =>
  apiRequest({
    url: "/analytics/kpis",
    method: "GET",
  });

// Heatmap points (staff-only)
// status_in مثال: "new,triaged,assigned"
export const getHeatmapData = (status_in = "new,triaged,assigned,in_progress,resolved,closed") =>
  apiRequest({
    url: "/analytics/geofeeds/heatmap",
    method: "GET",
    params: { status_in },
  });

// Optional endpoints (if you want later)
export const getCohorts = () =>
  apiRequest({
    url: "/analytics/cohorts",
    method: "GET",
  });

export const getAgentAnalytics = () =>
  apiRequest({
    url: "/analytics/agents",
    method: "GET",
  });
