const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-uarps-monitor:api/client";
const API_BASE = "/api/uarps-status.php";
async function fetchAPI(action, { signal } = {}) {
  const response = await fetch(`${API_BASE}?action=${action}`, {
    credentials: "include",
    headers: { "Accept": "application/json" },
    signal
  });
  const json = await response.json();
  if (!json.ok) throw new Error(json.error || "API Error");
  return json.data;
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, apiBase: API_BASE };
}
export {
  MODULE_ID,
  VERSION,
  fetchAPI,
  info
};
