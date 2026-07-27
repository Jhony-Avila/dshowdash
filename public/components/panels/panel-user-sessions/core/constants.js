const MODULE_ID = "panel-user-sessions";
const VERSION = "9.3.0-P2-ENTERPRISE";
const EVENTS = {
  MOUNTED: "panel:user-sessions:mounted",
  UNMOUNTED: "panel:user-sessions:unmounted",
  READY: "panel:user-sessions:ready",
  ERROR: "panel:user-sessions:error",
  SESSION_TERMINATED: "panel:user-sessions:session:terminated"
};
const API_ENDPOINTS = {
  LIST_SESSIONS: "/api/users/sessions.php",
  TERMINATE_SESSION: "/api/users/sessions.php",
  TERMINATE_ALL: "/api/users/sessions.php"
};
var constants_default = { MODULE_ID, VERSION, EVENTS, API_ENDPOINTS };
const info = () => ({ moduleId: MODULE_ID, version: VERSION });
const healthCheck = () => ({ status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { constantsLoaded: true } });
export {
  API_ENDPOINTS,
  EVENTS,
  MODULE_ID,
  VERSION,
  constants_default as default,
  healthCheck,
  info
};
