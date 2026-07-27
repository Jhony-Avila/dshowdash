const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-header-admin/api/client";
const BASE = "/api/ui/header";
const TIMEOUT = 1e4;
async function _fetch(url, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);
  try {
    const response = await fetch(url, {
      ...options,
      credentials: "include",
      signal: controller.signal,
      headers: { "Content-Type": "application/json", ...options.headers || {} }
    });
    const data = await response.json();
    return data;
  } finally {
    clearTimeout(timeoutId);
  }
}
async function fetchComponents(forceRefresh = false) {
  const url = forceRefresh ? `${BASE}/components?t=${Date.now()}` : `${BASE}/components`;
  const result = await _fetch(url);
  return { success: !!result.success, data: result.data || result.components || [] };
}
async function createComponent(payload) {
  return _fetch(`${BASE}/components`, { method: "POST", body: JSON.stringify(payload) });
}
async function updateComponent(payload) {
  return _fetch(`${BASE}/components/${payload.id}`, { method: "PUT", body: JSON.stringify(payload) });
}
async function deleteComponent(componentId) {
  return _fetch(`${BASE}/components/${componentId}`, { method: "DELETE" });
}
function healthCheck() {
  const checks = { endpointConfigured: !!BASE };
  return { status: "HEALTHY", score: "1/1", checks, version: VERSION, moduleId: MODULE_ID };
}
function info() {
  return { version: VERSION, moduleId: MODULE_ID, endpoint: BASE, healthCheck: healthCheck() };
}
export {
  MODULE_ID,
  VERSION,
  createComponent,
  deleteComponent,
  fetchComponents,
  healthCheck,
  info,
  updateComponent
};
