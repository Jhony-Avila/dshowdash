import { UI_EVENTS } from "/core/runtime/events/catalog/ui.events.js";
import { isPortsInitialized, getHardNavService } from "./ports.js";
import { ACTION_CONFIG } from "./actions.js";
const VERSION = "1.0.0-ENTERPRISE";
const MODULE_ID = "header/components/user-menu/core/health";
const COMPONENT_VERSION = "17.3.0-MODULAR";
const COMPONENT_ID = "user-menu";
const COMPONENT_MODULE_ID = "header/components/user-menu";
let _debug = false;
let _logBuffer = [];
function _log(level, ...args) {
  if (!_debug && level === "debug") return;
  _logBuffer.push({ level, args, ts: Date.now() });
  if (_logBuffer.length > 50) _logBuffer.shift();
}
function componentHealthCheck(component) {
  const dropdownInBody = !!(component.dropdown && component.dropdown.parentElement === document.body);
  const hns = getHardNavService();
  const checks = {
    initialized: component._initialized,
    mounted: component._mounted,
    hasElement: !!component.element,
    hasDropdown: !!component.dropdown,
    // @ts-expect-error TS migration - TS2339
    hasUser: !!component.store.getState().user,
    hasHardNavService: !!hns,
    hasLogger: !!component.logger,
    dropdownInBody,
    portsInitialized: isPortsInitialized(),
    // @ts-expect-error TS migration - TS2339
    shortcutsEnabled: component.shortcuts && component.shortcuts.enabled,
    announcerReady: !!component.announcer,
    // @ts-expect-error TS migration - TS2339
    circuitBreakerHealthy: component.circuitBreaker && component.circuitBreaker.getState() !== "OPEN",
    tooltipsReady: !!component.tooltips
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return {
    status: passed >= total - 1 ? "HEALTHY" : passed >= total - 3 ? "DEGRADED" : "UNHEALTHY",
    score: passed,
    maxScore: total,
    scoreDisplay: `${passed}/${total}`,
    checks,
    portsInitialized: isPortsInitialized(),
    version: COMPONENT_VERSION,
    moduleId: COMPONENT_MODULE_ID,
    adr015Compliant: true,
    subHealth: {
      // @ts-expect-error TS migration - TS2339
      circuitBreaker: component.circuitBreaker ? component.circuitBreaker.healthCheck() : null,
      // @ts-expect-error TS migration - TS2339
      shortcuts: component.shortcuts ? component.shortcuts.healthCheck() : null,
      // @ts-expect-error TS migration - TS2339
      tooltips: component.tooltips ? component.tooltips.healthCheck() : null
    },
    emits: [UI_EVENTS.ACTION, UI_EVENTS.HARD_NAV],
    timestamp: (/* @__PURE__ */ new Date()).toISOString()
  };
}
function componentInfo(component) {
  return {
    id: COMPONENT_ID,
    // @ts-expect-error TS migration - TS2339
    capabilities: component.constructor._exportCapabilities || {
      type: "menu",
      reorderable: false,
      hideable: false,
      critical: true,
      rendersUI: true,
      accessibility: true,
      keyboardNavigation: true,
      circuitBreaker: true,
      tooltips: true
    },
    label: ACTION_CONFIG.label,
    version: COMPONENT_VERSION,
    moduleId: COMPONENT_MODULE_ID,
    portsInitialized: isPortsInitialized(),
    mounted: component._mounted,
    // @ts-expect-error TS migration - TS2339
    user: component.store.getState().user ? component.store.getState().user.name : null,
    emits: [UI_EVENTS.ACTION, UI_EVENTS.HARD_NAV],
    adr015Compliant: true,
    p0Compliant: true,
    integrations: {
      // @ts-expect-error TS migration - TS2339
      shortcuts: component.shortcuts ? component.shortcuts.info() : null,
      // @ts-expect-error TS migration - TS2339
      announcer: component.announcer ? component.announcer.info() : null,
      // @ts-expect-error TS migration - TS2339
      circuitBreaker: component.circuitBreaker ? component.circuitBreaker.info() : null,
      // @ts-expect-error TS migration - TS2339
      tooltips: component.tooltips ? component.tooltips.info() : null,
      hardNavService: { internal: true, version: getHardNavService().VERSION || "1.0.0" }
    },
    metrics: Object.assign({}, component._metrics)
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
  componentHealthCheck,
  componentInfo,
  getLogs,
  setDebug
};
