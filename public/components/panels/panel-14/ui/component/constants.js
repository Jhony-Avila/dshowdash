const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-14-ui";
var constants_default = { VERSION, MODULE_ID };
function info() {
  return { moduleId: "panels-ui-component-constants", version: VERSION || "1.0.0" };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: "panels-ui-component-constants", version: VERSION || "1.0.0", checks: { constantsLoaded: true } };
}
export {
  MODULE_ID,
  VERSION,
  constants_default as default,
  healthCheck,
  info
};
