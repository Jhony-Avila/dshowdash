const MODULE_ID = "footer-icon-map-pin-states";
const VERSION = "1.2.0-ENTERPRISE";
let _metrics = { stateChanges: 0, variantChanges: 0 };
const States = {
  applyState(el, s) {
    if (!el) return;
    _metrics.stateChanges++;
    el.classList.remove("dsd-icon--state-default", "dsd-icon--state-active", "dsd-icon--state-disabled", "dsd-icon--state-loading");
    el.classList.add(`dsd-icon--state-${s}`);
  },
  applyVariant(el, v) {
    if (!el) return;
    _metrics.variantChanges++;
    ["primary", "secondary", "brand", "success", "warning", "danger", "muted"].forEach((x) => el.classList.remove(`dsd-icon--${x}`));
    el.classList.add(`dsd-icon--${v}`);
  }
};
function getMetrics() {
  return { ..._metrics };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, metrics: getMetrics() };
}
function healthCheck() {
  return { status: "HEALTHY", version: VERSION, moduleId: MODULE_ID, checks: { statesReady: true }, metrics: getMetrics() };
}
var states_default = { ...States, getMetrics, info, healthCheck, MODULE_ID, VERSION };
export {
  MODULE_ID,
  States,
  VERSION,
  states_default as default,
  getMetrics,
  healthCheck,
  info
};
