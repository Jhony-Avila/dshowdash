import { CONTRACTS } from "../core/contracts.js";
const MODULE_ID = "footer-icon-device-mic-helpers";
const VERSION = "1.2.0-ENTERPRISE";
let _metrics = { sizeResolves: 0, classBuilds: 0 };
const Helpers = {
  getSizeValue(s) {
    _metrics.sizeResolves++;
    return CONTRACTS.SIZES[s] || CONTRACTS.SIZES.md;
  },
  buildClasses(p = {}) {
    _metrics.classBuilds++;
    return ["dsd-icon", "dsd-icon--device-mic", `dsd-icon--${p.variant || "primary"}`, `dsd-icon--size-${p.size || "md"}`, `dsd-icon--state-${p.state || "default"}`, p.clickable ? "dsd-icon--clickable" : ""].filter(Boolean).join(" ");
  }
};
function getMetrics() {
  return { ..._metrics };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, metrics: getMetrics() };
}
function healthCheck() {
  return { status: "HEALTHY", version: VERSION, moduleId: MODULE_ID, checks: { helpersReady: true }, metrics: getMetrics() };
}
var helpers_default = { ...Helpers, getMetrics, info, healthCheck, MODULE_ID, VERSION };
export {
  Helpers,
  MODULE_ID,
  VERSION,
  helpers_default as default,
  getMetrics,
  healthCheck,
  info
};
