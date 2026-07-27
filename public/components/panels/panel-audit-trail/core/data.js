import { TABS } from "./contracts.js";
import * as BackendAPI from "../adapters/backend-api.js";
import * as Store from "../state/store.js";
import * as Renderer from "../ui/renderer.js";
import { log, getPresetDays, buildInlineFilters } from "./helpers.js";
async function loadData() {
  const state = Store.getState();
  Store.dispatch({ type: "SET_LOADING", payload: true });
  try {
    const pagination = state.pagination;
    const stateFilters = state.filters;
    const filters = {
      limit: pagination?.limit || 20,
      offset: pagination?.offset || 0,
      search: stateFilters?.search || "",
      days: getPresetDays(stateFilters?.timePreset || ""),
      userId: stateFilters?.userId || "",
      actionType: stateFilters?.actionType || "",
      severity: stateFilters?.severity || "",
      module: stateFilters?.module || "",
      ...buildInlineFilters(stateFilters || {})
    };
    let result;
    switch (state.activeTab) {
      case TABS.AUDIT:
        result = await BackendAPI.fetchAuditLogs(filters);
        Store.dispatch({ type: "SET_AUDIT_LOGS", payload: result.logs || [] });
        break;
      case TABS.PERMISSIONS:
        result = await BackendAPI.fetchPermissionLogs(filters);
        Store.dispatch({ type: "SET_PERMISSION_LOGS", payload: result.logs || [] });
        break;
      case TABS.FRONTEND:
        result = await BackendAPI.fetchFrontendLogs({ ...filters, level: filters.severity });
        Store.dispatch({ type: "SET_FRONTEND_LOGS", payload: result.logs || [] });
        break;
      case TABS.SECURITY:
        result = await BackendAPI.fetchSecurityLogs(filters);
        Store.dispatch({ type: "SET_SECURITY_LOGS", payload: result.logs || [] });
        break;
      default:
        result = await BackendAPI.fetchAuditLogs(filters);
        Store.dispatch({ type: "SET_AUDIT_LOGS", payload: result.logs || [] });
    }
    Store.dispatch({ type: "SET_PAGINATION", payload: { total: result.total || 0 } });
    Store.dispatch({ type: "SET_LAST_FETCH", payload: Date.now() });
    Store.dispatch({ type: "SET_ERROR", payload: null });
    updateHealthStats();
  } catch (err) {
    log("error", "Load data error:", err);
    Store.dispatch({ type: "SET_ERROR", payload: err.message });
    Renderer.toast("Erro ao carregar dados", "error");
  } finally {
    Store.dispatch({ type: "SET_LOADING", payload: false });
  }
}
function updateHealthStats() {
  const state = Store.getState();
  const frontendLogs = state.frontendLogs || [];
  const securityLogs = state.securityLogs || [];
  const stats = {
    error: frontendLogs.filter((l) => l.log_level?.toLowerCase() === "error").length,
    warning: frontendLogs.filter((l) => ["warning", "warn"].includes(l.log_level?.toLowerCase())).length,
    info: frontendLogs.filter((l) => l.log_level?.toLowerCase() === "info").length,
    security: securityLogs.length
  };
  Store.dispatch({ type: "SET_HEALTH_STATS", payload: stats });
  Renderer.updateHealthStats(stats);
}
var data_default = { loadData, updateHealthStats };
const MODULE_ID = "panels-panel-audit-trail-core-data";
const VERSION = "9.3.0-P2-ENTERPRISE";
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { dataReady: true } };
}
export {
  MODULE_ID,
  VERSION,
  data_default as default,
  healthCheck,
  info,
  loadData,
  updateHealthStats
};
