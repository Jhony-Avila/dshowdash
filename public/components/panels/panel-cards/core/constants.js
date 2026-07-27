const PAINEL_ID = "panel-cards";
const MODULE_ID = "panel-cards.core.constants";
const VERSION = "9.3.0-P2-ENTERPRISE";
const CSS_PATH = "/components/panels/panel-cards/styles/index.css";
function info() {
  return { moduleId: "panels-panel-cards-core-constants", version: VERSION || "1.0.0" };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: "panels-panel-cards-core-constants", version: VERSION || "1.0.0", checks: { constantsLoaded: true } };
}
export {
  CSS_PATH,
  MODULE_ID,
  PAINEL_ID,
  VERSION,
  healthCheck,
  info
};
