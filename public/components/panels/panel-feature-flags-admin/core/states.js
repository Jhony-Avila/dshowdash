const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-feature-flags-admin/core/states";
const STATES = Object.freeze({ IDLE: "IDLE", MOUNTING: "MOUNTING", MOUNTED: "MOUNTED", LOADING: "LOADING", READY: "READY", ERROR: "ERROR", DEGRADED: "DEGRADED", UNMOUNTING: "UNMOUNTING", DESTROYED: "DESTROYED" });
function getVersion() {
  return VERSION;
}
var states_default = STATES;
export {
  MODULE_ID,
  STATES,
  VERSION,
  states_default as default,
  getVersion
};
