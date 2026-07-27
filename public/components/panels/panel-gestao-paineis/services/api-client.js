import { API } from "../core/config.js";
function getCsrfToken() {
  if (window.SecurityCSRF?.getToken) {
    return window.SecurityCSRF.getToken();
  }
  const meta = document.querySelector('meta[name="csrf-token"]');
  if (meta?.content) return meta.content;
  const cookie = document.cookie.split(";").find((c) => c.trim().startsWith("csrf_token="));
  if (cookie) return cookie.split("=")[1]?.trim() ?? "";
  return "";
}
function buildHeaders(write = false) {
  const headers = {
    "Content-Type": "application/json",
    "Accept": "application/json"
  };
  if (write) {
    const token = getCsrfToken();
    if (token) headers["X-CSRF-Token"] = token;
  }
  return headers;
}
async function handleResponse(response) {
  if (response.status === 401) {
    window.location.href = "/login";
    throw new Error("AUTH_REQUIRED");
  }
  const json = await response.json();
  if (!response.ok) {
    throw new Error(json.error || json.meta?.message || `HTTP ${response.status}`);
  }
  return json;
}
async function fetchPanels(filters, pagination, signal) {
  const params = new URLSearchParams();
  if (filters.category) params.set("category", filters.category);
  if (filters.status !== "all") params.set("status", filters.status);
  if (filters.search) params.set("search", filters.search);
  if (pagination.page) params.set("page", String(pagination.page));
  if (pagination.per_page) params.set("per_page", String(pagination.per_page));
  const url = `${API.panels}?${params.toString()}`;
  const response = await fetch(url, {
    method: "GET",
    headers: buildHeaders(),
    credentials: "same-origin",
    signal
  });
  return handleResponse(response);
}
async function updatePanel(panelId, data, signal) {
  const url = `${API.panels}?id=${encodeURIComponent(panelId)}`;
  const response = await fetch(url, {
    method: "PATCH",
    headers: buildHeaders(true),
    credentials: "same-origin",
    body: JSON.stringify(data),
    signal
  });
  return handleResponse(response);
}
async function fetchCategories(signal) {
  const response = await fetch(API.categories, {
    method: "GET",
    headers: buildHeaders(),
    credentials: "same-origin",
    signal
  });
  return handleResponse(response);
}
async function fetchScreenshotHistory(panelId, signal) {
  const url = `${API.panels}/${encodeURIComponent(panelId)}/screenshots`;
  const response = await fetch(url, {
    method: "GET",
    headers: buildHeaders(),
    credentials: "same-origin",
    signal
  });
  return handleResponse(response);
}
async function triggerScreenshot(panelId, options, signal) {
  const url = API.screenshot(panelId);
  const response = await fetch(url, {
    method: "POST",
    headers: buildHeaders(true),
    credentials: "same-origin",
    body: JSON.stringify(options ?? {}),
    signal
  });
  return handleResponse(response);
}
export {
  fetchCategories,
  fetchPanels,
  fetchScreenshotHistory,
  triggerScreenshot,
  updatePanel
};
