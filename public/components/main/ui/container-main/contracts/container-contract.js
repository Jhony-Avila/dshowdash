import { createLogger } from "../utils/logger.js";
const VERSION = "1.1.0-HARDENED";
const MODULE_ID = "container-main:contracts:container";
let logger;
try {
  logger = createLogger(MODULE_ID);
} catch (e) {
  logger = null;
}
const _log = (level, msg, data) => {
  if (logger && typeof logger[level] === "function") {
    try {
      logger[level](msg, data);
    } catch (e) {
    }
  }
};
const CONTAINER_STATES = Object.freeze({
  INITIALIZING: "initializing",
  READY: "ready",
  LOADING: "loading",
  ERROR: "error",
  COLLAPSED: "collapsed",
  FULLSCREEN: "fullscreen",
  MINIMIZED: "minimized",
  DESTROYED: "destroyed"
});
const VALID_TRANSITIONS = Object.freeze({
  initializing: ["ready", "error"],
  ready: ["loading", "collapsed", "fullscreen", "minimized", "destroyed", "error"],
  loading: ["ready", "error"],
  error: ["ready", "destroyed"],
  collapsed: ["ready", "fullscreen", "destroyed"],
  fullscreen: ["ready", "collapsed", "destroyed"],
  minimized: ["ready", "destroyed"],
  destroyed: []
});
const CONTAINER_EVENTS = Object.freeze({
  STATE_CHANGED: "container-main.state.changed",
  STATE_RESTORE: "container-main.state.restore",
  READY: "container-main.ready",
  MOUNTED: "container-main.mounted",
  UNMOUNTED: "container-main.unmounted",
  DESTROYED: "container-main.destroyed",
  ERROR: "container-main.error",
  RECOVER: "container-main.recover",
  NAVIGATION_SYNC: "main.navigation.sync",
  PANEL_CHANGE: "container-main.panel.change",
  COLLAPSE: "container-main.collapse",
  EXPAND: "container-main.expand",
  FULLSCREEN_ENTER: "container-main.fullscreen.enter",
  FULLSCREEN_EXIT: "container-main.fullscreen.exit",
  RESIZE: "container-main.resize",
  CONTENT_LOADED: "container-main.content.loaded",
  CONTENT_ERROR: "container-main.content.error",
  THEME_CHANGE: "container-main.theme.change",
  LAYOUT_CHANGE: "container-main.layout.change",
  BREAKPOINT_CHANGE: "container-main.breakpoint.change"
});
const REQUIRED_API = Object.freeze({
  lifecycle: ["unmount", "getState", "isMounted"],
  stateQueries: ["isCollapsed", "isFullscreen", "isMinimized", "isLoading"],
  stateMutations: ["collapse", "expand", "toggle", "fullscreen", "close"],
  content: ["setContent", "getContent", "setTitle", "setIcon"],
  loading: ["showLoading", "hideLoading", "setProgress"],
  diagnostics: ["healthCheck", "audit", "getMetrics", "getPerformance"],
  identity: ["getId", "getElement", "getOptions"]
});
const OPTIONAL_API = Object.freeze({
  toast: ["toast", "toastSuccess", "toastError", "toastWarning", "toastInfo"],
  tabs: ["addTab", "removeTab", "setActiveTab"],
  badge: ["setBadge", "clearBadge"],
  toolbar: ["setToolbarItems", "addToolbarItem"],
  zoom: ["zoomIn", "zoomOut", "setZoom", "resetZoom", "getZoom"],
  accessibility: ["announce", "focusFirst", "enableFocusTrap", "disableFocusTrap"],
  plugins: ["registerPlugin", "unregisterPlugin", "getPlugin"],
  events: ["on", "off", "emit"],
  debug: ["debug"]
});
const LAYOUT_OPERATIONS = Object.freeze({
  required: ["register", "unregister"],
  panel: ["resize", "move", "dock", "toggleFullscreen"]
});
const INVARIANTS = Object.freeze([
  "Um container destru\xEDdo n\xE3o pode ser remontado",
  "N\xE3o pode haver dois containers em fullscreen simult\xE2neo",
  "Estado collapsed e fullscreen s\xE3o mutuamente exclusivos",
  "Todo container DEVE ter um containerId \xFAnico",
  "healthCheck() DEVE retornar objeto com status string",
  "Transi\xE7\xF5es de estado DEVEM seguir VALID_TRANSITIONS"
]);
function isValidTransition(fromState, toState) {
  const allowed = VALID_TRANSITIONS[fromState];
  if (!allowed) return false;
  return allowed.includes(toState);
}
function validateContainerApi(api) {
  const missing = [];
  const categories = Object.entries(REQUIRED_API);
  for (let i = 0; i < categories.length; i++) {
    const category = categories[i][0];
    const methods = categories[i][1];
    for (let j = 0; j < methods.length; j++) {
      if (typeof api[methods[j]] !== "function") {
        missing.push({ category, method: methods[j] });
      }
    }
  }
  const valid = missing.length === 0;
  if (!valid) {
    _log("warn", "Container API validation failed", { missing: missing.length, details: missing });
  }
  return {
    valid,
    missing,
    checkedMethods: categories.reduce((sum, c) => sum + c[1].length, 0),
    missingCount: missing.length
  };
}
function validateContainerConfig(config) {
  const errors = [];
  if (!config) {
    errors.push("Config is null/undefined");
    return { valid: false, errors };
  }
  if (!config.containerId || typeof config.containerId !== "string") errors.push("containerId must be a non-empty string");
  if (!config.options || typeof config.options !== "object") errors.push("options must be an object");
  return { valid: errors.length === 0, errors };
}
function validateHealthResponse(response) {
  if (!response || typeof response !== "object") return { valid: false, reason: "Response must be an object" };
  if (!response.status || typeof response.status !== "string") return { valid: false, reason: "status must be a string" };
  const validStatuses = ["HEALTHY", "DEGRADED", "NOT_INITIALIZED", "ERROR"];
  if (validStatuses.indexOf(response.status) === -1) return { valid: false, reason: `status must be one of: ${validStatuses.join(", ")}` };
  return { valid: true };
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    states: Object.keys(CONTAINER_STATES).length,
    events: Object.keys(CONTAINER_EVENTS).length,
    requiredApiMethods: Object.values(REQUIRED_API).flat().length,
    optionalApiMethods: Object.values(OPTIONAL_API).flat().length,
    layoutOperations: Object.values(LAYOUT_OPERATIONS).flat().length,
    invariants: INVARIANTS.length,
    validators: ["isValidTransition", "validateContainerApi", "validateContainerConfig", "validateHealthResponse"]
  };
}
function healthCheck() {
  try {
    const statesOk = Object.keys(CONTAINER_STATES).length === 8;
    const eventsOk = Object.keys(CONTAINER_EVENTS).length === 20;
    const transitionsOk = Object.keys(VALID_TRANSITIONS).length === Object.keys(CONTAINER_STATES).length;
    return {
      status: statesOk && eventsOk && transitionsOk ? "HEALTHY" : "DEGRADED",
      version: VERSION,
      moduleId: MODULE_ID,
      checks: { statesOk, eventsOk, transitionsOk }
    };
  } catch (e) {
    return {
      status: "ERROR",
      version: VERSION,
      moduleId: MODULE_ID,
      error: e.message || "healthCheck failed"
    };
  }
}
var container_contract_default = {
  VERSION,
  MODULE_ID,
  CONTAINER_STATES,
  VALID_TRANSITIONS,
  CONTAINER_EVENTS,
  REQUIRED_API,
  OPTIONAL_API,
  LAYOUT_OPERATIONS,
  INVARIANTS,
  isValidTransition,
  validateContainerApi,
  validateContainerConfig,
  validateHealthResponse,
  info,
  healthCheck
};
export {
  CONTAINER_EVENTS,
  CONTAINER_STATES,
  INVARIANTS,
  LAYOUT_OPERATIONS,
  MODULE_ID,
  OPTIONAL_API,
  REQUIRED_API,
  VALID_TRANSITIONS,
  VERSION,
  container_contract_default as default,
  healthCheck,
  info,
  isValidTransition,
  validateContainerApi,
  validateContainerConfig,
  validateHealthResponse
};
