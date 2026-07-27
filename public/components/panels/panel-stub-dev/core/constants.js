const PANEL_ID = "panel-stub-dev";
const MODULE_ID = "panel-stub-dev.core.constants";
const VERSION = "9.3.0-P2-ENTERPRISE";
const PANEL_TITLE = "Em Desenvolvimento";
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { constantsLoaded: true } };
}
export {
  MODULE_ID,
  PANEL_ID,
  PANEL_TITLE,
  VERSION,
  healthCheck,
  info
};
