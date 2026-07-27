const PAINEL_ID = "panel-dashboard";
const MODULE_ID = "panel-dashboard.core.constants";
const VERSION = "9.3.0-P2-ENTERPRISE";
function info() {
  return { moduleId: "panels-panel-dashboard-core-constants", version: VERSION || "1.0.0" };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: "panels-panel-dashboard-core-constants", version: VERSION || "1.0.0", checks: { constantsLoaded: true } };
}
export {
  MODULE_ID,
  PAINEL_ID,
  VERSION,
  healthCheck,
  info
};
