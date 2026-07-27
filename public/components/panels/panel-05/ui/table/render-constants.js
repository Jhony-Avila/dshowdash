const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-05:table:render-constants";
const DENSITY_MODES = ["compact", "comfortable", "expanded"];
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { constantsReady: true } };
}
var render_constants_default = { VERSION, MODULE_ID, DENSITY_MODES, info, healthCheck };
export {
  DENSITY_MODES,
  MODULE_ID,
  VERSION,
  render_constants_default as default,
  healthCheck,
  info
};
