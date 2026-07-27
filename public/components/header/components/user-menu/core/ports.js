import { createUiPorts } from "/core/runtime/ports-profiles.js";
import { UI_EVENTS } from "/core/runtime/events/catalog/ui.events.js";
const VERSION = "1.0.0-ENTERPRISE";
const MODULE_ID = "header/components/user-menu.core.ports";
let _debug = false;
let _logBuffer = [];
function _log(level, ...args) {
  if (!_debug && level === "debug") return;
  _logBuffer.push({ level, args, ts: Date.now() });
  if (_logBuffer.length > 50) _logBuffer.shift();
}
const Ports = createUiPorts({ moduleId: MODULE_ID });
function initPorts() {
  Ports.init();
}
function getPort(name) {
  return Ports.get(name);
}
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
function isPortsInitialized() {
  return Ports.isInitialized();
}
const _internalHardNavService = {
  redirect(url, reason, source) {
    const eb = getPort("eventBus");
    if (eb && eb.emit) {
      eb.emit(UI_EVENTS.HARD_NAV, {
        action: "redirect",
        url,
        reason,
        source,
        timestamp: Date.now()
      });
    }
    window.location.href = url;
  },
  VERSION: "1.0.0-INTERNAL"
};
function getHardNavService() {
  const external = getPort("hardNavService");
  return external || _internalHardNavService;
}
function loadCSS() {
  const cssPath = "/components/header/components/user-menu/component.css";
  if (!document.querySelector(`link[href="${cssPath}"]`)) {
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = cssPath;
    document.head.appendChild(link);
  }
}
function healthCheck() {
  const hasEventBus = !!getPort("eventBus");
  const hasHardNav = !!getHardNavService();
  const checks = {
    portsInitialized: Ports.isInitialized(),
    hasEventBus,
    hasHardNavService: hasHardNav
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return {
    status: passed === total ? "HEALTHY" : "DEGRADED",
    score: passed,
    maxScore: total,
    scoreDisplay: `${passed}/${total}`,
    checks,
    version: VERSION,
    moduleId: MODULE_ID + "/core/ports",
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  };
}
function info() {
  return {
    version: VERSION,
    moduleId: MODULE_ID + "/core/ports",
    portsInitialized: Ports.isInitialized(),
    hardNavServiceVersion: _internalHardNavService.VERSION,
    healthCheck: healthCheck()
  };
}
function setDebug(enabled) {
  _debug = !!enabled;
}
function getLogs() {
  return [..._logBuffer];
}
export {
  MODULE_ID,
  VERSION,
  getHardNavService,
  getLogs,
  getPort,
  getPorts,
  healthCheck,
  info,
  initPorts,
  injectPorts,
  isPortsInitialized,
  loadCSS,
  setDebug
};
