const MODULE_ID = "components._shared.permissions.integration.api-backend";
const VERSION = "1.0.1-P2-ENTERPRISE";
const API_BASE = "/api/permissions/uarps.php";
async function loadUserPermissions(currentUserId, state, log) {
  if (!currentUserId || currentUserId === "anonymous") return;
  try {
    state.stats.apiCalls++;
    const response = await fetch(`${API_BASE}?action=my-permissions`, {
      credentials: "include",
      headers: { "Accept": "application/json" }
    });
    if (!response.ok) {
      state.stats.apiFails++;
      if (log) log("api-error", { status: response.status });
      return;
    }
    const data = await response.json();
    if (!data.ok) {
      if (log) log("api-response-error", data.error);
      return;
    }
    state.userPermissions.triggers = {};
    state.userPermissions.regions = {};
    for (let i = 0; i < (data.triggers || []).length; i++) {
      const t = data.triggers[i];
      state.userPermissions.triggers[t.trigger_id] = t.state;
    }
    for (let j = 0; j < (data.regions || []).length; j++) {
      const r = data.regions[j];
      state.userPermissions.regions[r.region_id] = r.state;
    }
    state.apiConnected = true;
    if (log) log("permissions-loaded", {
      triggers: Object.keys(state.userPermissions.triggers).length,
      regions: Object.keys(state.userPermissions.regions).length
    });
  } catch (error) {
    state.stats.apiFails++;
    if (log) log("api-fetch-error", error.message);
  }
}
async function checkTriggerAPI(triggerId, state) {
  try {
    state.stats.apiCalls++;
    const response = await fetch(`${API_BASE}?action=check-trigger&trigger_id=${encodeURIComponent(triggerId)}`, {
      credentials: "include",
      headers: { "Accept": "application/json" }
    });
    if (!response.ok) {
      state.stats.apiFails++;
      return null;
    }
    const data = await response.json();
    return data.ok ? data.allowed : null;
  } catch (error) {
    state.stats.apiFails++;
    return null;
  }
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, apiBase: API_BASE, timestamp: Date.now() };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, apiBase: API_BASE, timestamp: Date.now() };
}
var api_backend_default = { MODULE_ID, VERSION, loadUserPermissions, checkTriggerAPI, API_BASE, info, healthCheck };
export {
  MODULE_ID,
  VERSION,
  checkTriggerAPI,
  api_backend_default as default,
  healthCheck,
  info,
  loadUserPermissions
};
