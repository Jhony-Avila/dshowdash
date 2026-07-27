import { MODULE_ID, VERSION } from "./constants.js";
let _initialized = false;
function init(container, options = {}) {
  _initialized = true;
  return { container, options, moduleId: MODULE_ID };
}
function destroy() {
  _initialized = false;
}
function healthCheck() {
  const checks = { initialized: _initialized };
  const passed = Object.values(checks).filter(Boolean).length;
  return { status: passed === 1 ? "HEALTHY" : "DEGRADED", score: `${passed}/1`, checks, version: VERSION, moduleId: MODULE_ID };
}
function info() {
  return { version: VERSION, moduleId: MODULE_ID, initialized: _initialized, healthCheck: healthCheck() };
}
export {
  destroy,
  healthCheck,
  info,
  init
};
