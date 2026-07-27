const PAINEL_ID = "panel-user-management";
const MODULE_ID = "panel-user-management.core.constants";
const VERSION = "9.3.0-P2-ENTERPRISE";
function info() {
  return { moduleId: "panels-panel-user-management-core-constants", version: VERSION || "1.0.0" };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: "panels-panel-user-management-core-constants", version: VERSION || "1.0.0", checks: { constantsLoaded: true } };
}
export {
  MODULE_ID,
  PAINEL_ID,
  VERSION,
  healthCheck,
  info
};
