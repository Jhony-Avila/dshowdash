import { PANEL_ID } from "./constants.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-05/core/lifecycle";
let _initialized = false;
let _container = null;
async function initLifecycle(container, options = {}) {
  _container = container;
  _initialized = true;
  const instance = {
    panelId: PANEL_ID,
    container,
    options,
    destroy() {
      _initialized = false;
      _container = null;
    },
    healthCheck() {
      return { status: _initialized ? "HEALTHY" : "UNHEALTHY", moduleId: MODULE_ID };
    }
  };
  return instance;
}
function healthCheck() {
  const checks = { initialized: _initialized, containerReady: !!_container };
  const passed = Object.values(checks).filter(Boolean).length;
  return { status: passed === 2 ? "HEALTHY" : "DEGRADED", score: `${passed}/2`, checks, version: VERSION, moduleId: MODULE_ID };
}
function info() {
  return { version: VERSION, moduleId: MODULE_ID, initialized: _initialized, panelId: PANEL_ID, healthCheck: healthCheck() };
}
export {
  MODULE_ID,
  VERSION,
  healthCheck,
  info,
  initLifecycle
};
