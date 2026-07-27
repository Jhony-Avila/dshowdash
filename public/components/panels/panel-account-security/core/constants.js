const MODULE_ID = "panel-account-security";
const VERSION = "9.3.0-P2-ENTERPRISE";
const UI_ACTIONS = Object.freeze({
  PASSWORD_CHANGED: "password:changed"
});
const API_ENDPOINTS = {
  GET_SECURITY_INFO: "/api/users/security.php",
  CHANGE_PASSWORD: "/api/users/change-password.php"
};
var constants_default = { MODULE_ID, VERSION, UI_ACTIONS, API_ENDPOINTS };
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { constantsLoaded: true } };
}
export {
  API_ENDPOINTS,
  MODULE_ID,
  UI_ACTIONS,
  VERSION,
  constants_default as default,
  healthCheck,
  info
};
