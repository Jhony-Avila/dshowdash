const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-audit-trail-contracts";
const TABS = { AUDIT: "audit", PERMISSIONS: "permissions", FRONTEND: "frontend", SECURITY: "security" };
const TAB_CONFIG = {
  [TABS.AUDIT]: { label: "Auditoria", icon: "clipboard-list", color: "#8B5CF6" },
  [TABS.PERMISSIONS]: { label: "Permiss\xF5es", icon: "shield-check", color: "#22C55E" },
  [TABS.FRONTEND]: { label: "Frontend", icon: "monitor", color: "#3B82F6" },
  [TABS.SECURITY]: { label: "Seguran\xE7a", icon: "lock", color: "#EF4444" }
};
const SEVERITY = { INFO: "INFO", WARNING: "WARNING", ERROR: "ERROR", SECURITY: "SECURITY", CRITICAL: "CRITICAL" };
const SEVERITY_CONFIG = {
  [SEVERITY.INFO]: { label: "Info", color: "#3B82F6", icon: "info" },
  [SEVERITY.WARNING]: { label: "Warning", color: "#EAB308", icon: "alert-triangle" },
  [SEVERITY.ERROR]: { label: "Error", color: "#EF4444", icon: "x-circle" },
  [SEVERITY.SECURITY]: { label: "Security", color: "#D946EF", icon: "shield-alert" },
  [SEVERITY.CRITICAL]: { label: "Critical", color: "#DC2626", icon: "alert-octagon" }
};
const EVENT_TYPES = { AUTH_LOGIN: "AUTH_LOGIN", AUTH_LOGOUT: "AUTH_LOGOUT", AUTH_FAILED: "AUTH_FAILED", AUTH_SESSION_EXPIRED: "AUTH_SESSION_EXPIRED", PERMISSION_GRANTED: "PERMISSION_GRANTED", PERMISSION_DENIED: "PERMISSION_DENIED", PERMISSION_CHANGED: "PERMISSION_CHANGED", ROLE_ASSIGNED: "ROLE_ASSIGNED", ROLE_REMOVED: "ROLE_REMOVED", RESOURCE_CREATED: "RESOURCE_CREATED", RESOURCE_UPDATED: "RESOURCE_UPDATED", RESOURCE_DELETED: "RESOURCE_DELETED", CONFIG_CHANGED: "CONFIG_CHANGED", SECURITY_VIOLATION: "SECURITY_VIOLATION", ERROR_OCCURRED: "ERROR_OCCURRED" };
const ACTION_TYPES = ["CREATE", "INSERT", "ADD", "READ", "VIEW", "GET", "LIST", "FETCH", "UPDATE", "EDIT", "MODIFY", "CHANGE", "DELETE", "REMOVE", "DROP", "LOGIN", "SIGNIN", "AUTHENTICATE", "LOGOUT", "SIGNOUT", "GRANT", "ALLOW", "PERMIT", "REVOKE", "DENY", "BLOCK", "EXECUTE", "RUN", "TRIGGER", "EXPORT", "IMPORT", "SYNC"];
const MODULES = { AUTH: "AUTH", PERMISSIONS: "PERMISSIONS", SECURITY: "SECURITY", ROUTER: "ROUTER", GLOBAL_STATE: "GLOBAL_STATE", SESSION: "SESSION", PANEL: "PANEL", API: "API", SYSTEM: "SYSTEM" };
const TIME_PRESETS = { LAST_15_MIN: { label: "15 min", minutes: 15 }, LAST_HOUR: { label: "1 hora", minutes: 60 }, LAST_24H: { label: "24h", minutes: 1440 }, TODAY: { label: "Hoje", days: 1 }, LAST_7_DAYS: { label: "7 dias", days: 7 }, LAST_30_DAYS: { label: "30 dias", days: 30 }, LAST_90_DAYS: { label: "90 dias", days: 90 } };
const LOCAL_EVENTS = { OPENED: "audit-trail:opened", CLOSED: "audit-trail:closed", TAB_CHANGED: "audit-trail:tab:changed", FILTERS_CHANGED: "audit-trail:filters:changed", DATA_LOADED: "audit-trail:data:loaded", DATA_ERROR: "audit-trail:data:error", EXPORT_SUCCESS: "audit-trail:export:success", REFRESH: "audit-trail:refresh" };
const KEYBOARD_SHORTCUTS = { "/": "Focus search", "r": "Refresh", "a": "Toggle auto-refresh", "f": "Fullscreen", "p": "Print", "e": "Export menu", "g": "Focus group select", "i": "Toggle inline filters", "1": "Density compact", "2": "Density normal", "3": "Density comfortable", "Escape": "Close menus / Deselect", "Ctrl+\u2190": "Previous page", "Ctrl+\u2192": "Next page" };
function validateAuditEvent(event) {
  const errors = [];
  if (!event) {
    errors.push("Event is required");
    return { valid: false, errors };
  }
  if (!event.id) errors.push("id is required");
  if (!event.timestamp && !event.created_at) errors.push("timestamp is required");
  return { valid: errors.length === 0, errors };
}
function isCriticalEvent(event) {
  if (!event) return false;
  const severity = event.severity || event.log_level || "";
  return severity.toUpperCase() === "CRITICAL" || severity.toUpperCase() === "SECURITY" || event.event_type?.includes("SECURITY") || event.event_type?.includes("VIOLATION");
}
function isAuthEvent(event) {
  if (!event) return false;
  return event.event_type?.startsWith("AUTH_") || event.action_type?.includes("LOGIN") || event.action_type?.includes("LOGOUT");
}
function getSeverityColor(severity) {
  const upper = (severity || "").toUpperCase();
  const config = SEVERITY_CONFIG[upper];
  return config ? config.color : "#64748B";
}
function getActionBadgeClass(action) {
  const upper = (action || "").toUpperCase();
  if (["CREATE", "INSERT", "ADD"].includes(upper)) return "pat-badge-create";
  if (["READ", "VIEW", "GET", "LIST", "FETCH"].includes(upper)) return "pat-badge-read";
  if (["UPDATE", "EDIT", "MODIFY", "CHANGE"].includes(upper)) return "pat-badge-update";
  if (["DELETE", "REMOVE", "DROP"].includes(upper)) return "pat-badge-delete";
  if (["LOGIN", "SIGNIN", "AUTHENTICATE"].includes(upper)) return "pat-badge-login";
  if (["LOGOUT", "SIGNOUT"].includes(upper)) return "pat-badge-logout";
  if (["GRANT", "ALLOW", "PERMIT"].includes(upper)) return "pat-badge-grant";
  if (["REVOKE", "DENY", "BLOCK"].includes(upper)) return "pat-badge-revoke";
  if (["EXECUTE", "RUN", "TRIGGER"].includes(upper)) return "pat-badge-execute";
  return "pat-badge-default";
}
function getVersion() {
  return VERSION;
}
function healthCheck() {
  const checks = { tabsConfigured: Object.keys(TABS).length > 0, severityConfigured: Object.keys(SEVERITY).length > 0, eventTypesConfigured: Object.keys(EVENT_TYPES).length > 0 };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed === total ? "HEALTHY" : "DEGRADED", moduleId: MODULE_ID, version: VERSION, score: `${passed}/${total}`, checks, p25Compliant: true, timestamp: Date.now() };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, tabsCount: Object.keys(TABS).length, severityCount: Object.keys(SEVERITY).length, eventTypesCount: Object.keys(EVENT_TYPES).length, p25Compliant: true };
}
var contracts_default = { VERSION, MODULE_ID, TABS, TAB_CONFIG, SEVERITY, SEVERITY_CONFIG, EVENT_TYPES, ACTION_TYPES, MODULES, TIME_PRESETS, LOCAL_EVENTS, KEYBOARD_SHORTCUTS, validateAuditEvent, isCriticalEvent, isAuthEvent, getSeverityColor, getActionBadgeClass, getVersion, healthCheck, info };
export {
  ACTION_TYPES,
  EVENT_TYPES,
  KEYBOARD_SHORTCUTS,
  LOCAL_EVENTS,
  MODULES,
  MODULE_ID,
  SEVERITY,
  SEVERITY_CONFIG,
  TABS,
  TAB_CONFIG,
  TIME_PRESETS,
  VERSION,
  contracts_default as default,
  getActionBadgeClass,
  getSeverityColor,
  getVersion,
  healthCheck,
  info,
  isAuthEvent,
  isCriticalEvent,
  validateAuditEvent
};
