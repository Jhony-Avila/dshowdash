const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-session-admin-contracts";
const SESSION_STATUS = Object.freeze({ ACTIVE: "active", INACTIVE: "inactive", EXPIRED: "expired", REVOKED: "revoked" });
const SESSION_STATUS_CONFIG = Object.freeze({
  [SESSION_STATUS.ACTIVE]: { label: "Ativa", color: "#22C55E", icon: "check-circle" },
  [SESSION_STATUS.INACTIVE]: { label: "Inativa", color: "#64748B", icon: "circle" },
  [SESSION_STATUS.EXPIRED]: { label: "Expirada", color: "#EAB308", icon: "clock" },
  [SESSION_STATUS.REVOKED]: { label: "Revogada", color: "#EF4444", icon: "x-circle" }
});
const DEVICE_TYPES = Object.freeze({ DESKTOP: "desktop", MOBILE: "mobile", TABLET: "tablet", UNKNOWN: "unknown" });
const DEVICE_CONFIG = Object.freeze({
  [DEVICE_TYPES.DESKTOP]: { label: "Desktop", icon: "monitor" },
  [DEVICE_TYPES.MOBILE]: { label: "Mobile", icon: "smartphone" },
  [DEVICE_TYPES.TABLET]: { label: "Tablet", icon: "tablet" },
  [DEVICE_TYPES.UNKNOWN]: { label: "Desconhecido", icon: "help-circle" }
});
const FILTER_OPTIONS = Object.freeze({ STATUS: [{ value: "all", label: "Todas" }, { value: "active", label: "Ativas" }, { value: "inactive", label: "Inativas" }, { value: "current", label: "Sess\xE3o atual" }] });
const LOCAL_EVENTS = Object.freeze({ MOUNTED: "session-admin:mounted", UNMOUNTED: "session-admin:unmounted", REFRESH_START: "session-admin:refresh:start", REFRESH_SUCCESS: "session-admin:refresh:success", REFRESH_ERROR: "session-admin:refresh:error", SESSION_TERMINATED: "session-admin:session:terminated", SESSION_TERMINATE_ALL: "session-admin:session:terminate-all", FILTER_CHANGED: "session-admin:filter:changed", AUTH_REQUIRED: "session-admin:auth:required" });
const API_CONFIG = Object.freeze({ BASE_URL: "/api/sessions", ENDPOINTS: { LIST: "/?action=list", REVOKE: "/?action=revoke", REVOKE_ALL: "/?action=revoke-all" }, TIMEOUT: 15e3 });
const KEYBOARD_SHORTCUTS = Object.freeze({ "r": "Atualizar", "Escape": "Fechar modais", "/": "Focar busca" });
const validateSession = (session) => {
  const errors = [];
  if (!session) {
    errors.push("Session is required");
    return { valid: false, errors };
  }
  if (!session.session_token && !session.id) errors.push("session_token or id is required");
  return { valid: errors.length === 0, errors };
};
const isCurrentSession = (session, currentToken) => {
  if (!session || !currentToken) return false;
  return session.session_token === currentToken || session.is_current === true;
};
const isActiveSession = (session) => {
  if (!session) return false;
  return session.is_active === true || session.is_active === 1;
};
const getDeviceType = (deviceType) => {
  const type = (deviceType || "").toLowerCase();
  if (type.includes("mobile") || type.includes("phone")) return DEVICE_TYPES.MOBILE;
  if (type.includes("tablet")) return DEVICE_TYPES.TABLET;
  if (type.includes("desktop")) return DEVICE_TYPES.DESKTOP;
  return DEVICE_TYPES.UNKNOWN;
};
const getStatusColor = (isActive, isCurrent) => {
  if (isCurrent) return "#3B82F6";
  if (isActive) return "#22C55E";
  return "#64748B";
};
const getVersion = () => VERSION;
const info = () => ({ moduleId: MODULE_ID, version: VERSION });
const healthCheck = () => ({ status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { validateSessionReady: typeof validateSession === "function", getDeviceTypeReady: typeof getDeviceType === "function" } });
var contracts_default = { VERSION, MODULE_ID, SESSION_STATUS, SESSION_STATUS_CONFIG, DEVICE_TYPES, DEVICE_CONFIG, FILTER_OPTIONS, LOCAL_EVENTS, API_CONFIG, KEYBOARD_SHORTCUTS, validateSession, isCurrentSession, isActiveSession, getDeviceType, getStatusColor, getVersion, info, healthCheck };
export {
  API_CONFIG,
  DEVICE_CONFIG,
  DEVICE_TYPES,
  FILTER_OPTIONS,
  KEYBOARD_SHORTCUTS,
  LOCAL_EVENTS,
  MODULE_ID,
  SESSION_STATUS,
  SESSION_STATUS_CONFIG,
  VERSION,
  contracts_default as default,
  getDeviceType,
  getStatusColor,
  getVersion,
  healthCheck,
  info,
  isActiveSession,
  isCurrentSession,
  validateSession
};
