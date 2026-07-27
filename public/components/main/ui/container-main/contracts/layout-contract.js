import { createLogger } from "../utils/logger.js";
const VERSION = "1.1.0-HARDENED";
const MODULE_ID = "container-main:contracts:layout";
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
const PANEL_LAYOUT_STATES = Object.freeze({
  NORMAL: "normal",
  DOCKED: "docked",
  FLOATING: "floating",
  MAXIMIZED: "maximized",
  MINIMIZED: "minimized",
  FULLSCREEN: "fullscreen",
  SPLIT_LEFT: "split-left",
  SPLIT_RIGHT: "split-right",
  SPLIT_TOP: "split-top",
  SPLIT_BOTTOM: "split-bottom"
});
const DOCK_ZONES = Object.freeze({
  LEFT: "left",
  RIGHT: "right",
  TOP: "top",
  BOTTOM: "bottom",
  CENTER: "center"
});
const SPLIT_MODES = Object.freeze({
  HORIZONTAL: "horizontal",
  VERTICAL: "vertical",
  QUAD: "quad"
});
const LAYOUT_TRANSITIONS = Object.freeze({
  [PANEL_LAYOUT_STATES.NORMAL]: [
    PANEL_LAYOUT_STATES.DOCKED,
    PANEL_LAYOUT_STATES.FLOATING,
    PANEL_LAYOUT_STATES.MAXIMIZED,
    PANEL_LAYOUT_STATES.MINIMIZED,
    PANEL_LAYOUT_STATES.FULLSCREEN,
    PANEL_LAYOUT_STATES.SPLIT_LEFT,
    PANEL_LAYOUT_STATES.SPLIT_RIGHT,
    PANEL_LAYOUT_STATES.SPLIT_TOP,
    PANEL_LAYOUT_STATES.SPLIT_BOTTOM
  ],
  [PANEL_LAYOUT_STATES.DOCKED]: [
    PANEL_LAYOUT_STATES.NORMAL,
    PANEL_LAYOUT_STATES.FLOATING,
    PANEL_LAYOUT_STATES.MAXIMIZED,
    PANEL_LAYOUT_STATES.FULLSCREEN
  ],
  [PANEL_LAYOUT_STATES.FLOATING]: [
    PANEL_LAYOUT_STATES.NORMAL,
    PANEL_LAYOUT_STATES.DOCKED,
    PANEL_LAYOUT_STATES.MAXIMIZED,
    PANEL_LAYOUT_STATES.FULLSCREEN
  ],
  [PANEL_LAYOUT_STATES.MAXIMIZED]: [
    PANEL_LAYOUT_STATES.NORMAL,
    PANEL_LAYOUT_STATES.FULLSCREEN,
    PANEL_LAYOUT_STATES.MINIMIZED
  ],
  [PANEL_LAYOUT_STATES.MINIMIZED]: [
    PANEL_LAYOUT_STATES.NORMAL,
    PANEL_LAYOUT_STATES.MAXIMIZED
  ],
  [PANEL_LAYOUT_STATES.FULLSCREEN]: [
    PANEL_LAYOUT_STATES.NORMAL,
    PANEL_LAYOUT_STATES.MAXIMIZED
  ],
  [PANEL_LAYOUT_STATES.SPLIT_LEFT]: [
    PANEL_LAYOUT_STATES.NORMAL,
    PANEL_LAYOUT_STATES.FULLSCREEN
  ],
  [PANEL_LAYOUT_STATES.SPLIT_RIGHT]: [
    PANEL_LAYOUT_STATES.NORMAL,
    PANEL_LAYOUT_STATES.FULLSCREEN
  ],
  [PANEL_LAYOUT_STATES.SPLIT_TOP]: [
    PANEL_LAYOUT_STATES.NORMAL,
    PANEL_LAYOUT_STATES.FULLSCREEN
  ],
  [PANEL_LAYOUT_STATES.SPLIT_BOTTOM]: [
    PANEL_LAYOUT_STATES.NORMAL,
    PANEL_LAYOUT_STATES.FULLSCREEN
  ]
});
const DEFAULT_CONSTRAINTS = Object.freeze({
  minWidth: 200,
  minHeight: 100,
  maxWidth: Infinity,
  maxHeight: Infinity,
  aspectRatio: null,
  resizable: true,
  draggable: true,
  dockable: true
});
const CONSTRAINT_SCHEMA = {
  minWidth: { type: "number", min: 50, default: 200 },
  minHeight: { type: "number", min: 50, default: 100 },
  maxWidth: { type: "number", min: 100, default: Infinity },
  maxHeight: { type: "number", min: 100, default: Infinity },
  aspectRatio: { type: "number", nullable: true, default: null },
  resizable: { type: "boolean", default: true },
  draggable: { type: "boolean", default: true },
  dockable: { type: "boolean", default: true }
};
const REQUIRED_OPERATIONS = Object.freeze({
  stateManagement: ["getState", "setState", "canTransition"],
  panelRegistry: ["register", "unregister", "getPanel", "getPanels"],
  geometry: ["resize", "move", "getPosition", "getSize"],
  dock: ["dock", "undock"],
  split: ["split", "unsplit"],
  fullscreen: ["enterFullscreen", "exitFullscreen", "toggleFullscreen"]
});
const LAYOUT_PANEL_EVENTS = Object.freeze({
  STATE_CHANGED: "layout.panel.state-changed",
  RESIZED: "layout.panel.resized",
  MOVED: "layout.panel.moved",
  DOCKED: "layout.panel.docked",
  UNDOCKED: "layout.panel.undocked",
  SPLIT: "layout.panel.split",
  UNSPLIT: "layout.panel.unsplit",
  FULLSCREEN_ENTER: "layout.panel.fullscreen.enter",
  FULLSCREEN_EXIT: "layout.panel.fullscreen.exit",
  REGISTERED: "layout.panel.registered",
  UNREGISTERED: "layout.panel.unregistered",
  CONSTRAINTS_CHANGED: "layout.panel.constraints-changed"
});
const INVARIANTS = Object.freeze([
  "N\xE3o pode haver dois pain\xE9is em fullscreen simult\xE2neo",
  "Split requer pelo menos dois pain\xE9is registrados",
  "Transi\xE7\xF5es DEVEM seguir LAYOUT_TRANSITIONS",
  "Constraints DEVEM respeitar minWidth/minHeight",
  "Painel minimizado n\xE3o pode ser splitado",
  "Dock zone CENTER n\xE3o permite split"
]);
function isValidLayoutTransition(fromState, toState) {
  const allowed = LAYOUT_TRANSITIONS[fromState];
  if (!allowed) return false;
  return allowed.includes(toState);
}
function validateConstraints(constraints) {
  const errors = [];
  if (!constraints || typeof constraints !== "object") {
    return { valid: false, errors: ["Constraints must be an object"] };
  }
  if (constraints.minWidth !== void 0 && constraints.minWidth < 50) {
    errors.push("minWidth must be >= 50");
  }
  if (constraints.minHeight !== void 0 && constraints.minHeight < 50) {
    errors.push("minHeight must be >= 50");
  }
  if (constraints.maxWidth !== void 0 && constraints.maxWidth < constraints.minWidth) {
    errors.push("maxWidth must be >= minWidth");
  }
  if (constraints.maxHeight !== void 0 && constraints.maxHeight < constraints.minHeight) {
    errors.push("maxHeight must be >= minHeight");
  }
  if (constraints.aspectRatio !== null && constraints.aspectRatio !== void 0) {
    if (typeof constraints.aspectRatio !== "number" || constraints.aspectRatio <= 0) {
      errors.push("aspectRatio must be a positive number or null");
    }
  }
  return { valid: errors.length === 0, errors };
}
function validateLayoutManager(manager) {
  const missing = [];
  const categories = Object.entries(REQUIRED_OPERATIONS);
  for (let i = 0; i < categories.length; i++) {
    const category = categories[i][0];
    const methods = categories[i][1];
    for (let j = 0; j < methods.length; j++) {
      if (typeof manager[methods[j]] !== "function") {
        missing.push({ category, method: methods[j] });
      }
    }
  }
  const valid = missing.length === 0;
  if (!valid) {
    _log("warn", "Layout manager validation failed", { missing: missing.length, details: missing });
  }
  return {
    valid,
    missing,
    checkedMethods: categories.reduce((sum, c) => sum + c[1].length, 0),
    missingCount: missing.length
  };
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    states: Object.keys(PANEL_LAYOUT_STATES).length,
    dockZones: Object.keys(DOCK_ZONES).length,
    splitModes: Object.keys(SPLIT_MODES).length,
    events: Object.keys(LAYOUT_PANEL_EVENTS).length,
    requiredOperations: Object.values(REQUIRED_OPERATIONS).flat().length,
    invariants: INVARIANTS.length,
    validators: ["isValidLayoutTransition", "validateConstraints", "validateLayoutManager"]
  };
}
function healthCheck() {
  try {
    const statesOk = Object.keys(PANEL_LAYOUT_STATES).length === 10;
    const transitionsOk = Object.keys(LAYOUT_TRANSITIONS).length === Object.keys(PANEL_LAYOUT_STATES).length;
    const eventsOk = Object.keys(LAYOUT_PANEL_EVENTS).length === 12;
    return {
      status: statesOk && transitionsOk && eventsOk ? "HEALTHY" : "DEGRADED",
      version: VERSION,
      moduleId: MODULE_ID,
      checks: { statesOk, transitionsOk, eventsOk }
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
var layout_contract_default = {
  VERSION,
  MODULE_ID,
  PANEL_LAYOUT_STATES,
  DOCK_ZONES,
  SPLIT_MODES,
  LAYOUT_TRANSITIONS,
  DEFAULT_CONSTRAINTS,
  CONSTRAINT_SCHEMA,
  REQUIRED_OPERATIONS,
  LAYOUT_PANEL_EVENTS,
  INVARIANTS,
  isValidLayoutTransition,
  validateConstraints,
  validateLayoutManager,
  info,
  healthCheck
};
export {
  CONSTRAINT_SCHEMA,
  DEFAULT_CONSTRAINTS,
  DOCK_ZONES,
  INVARIANTS,
  LAYOUT_PANEL_EVENTS,
  LAYOUT_TRANSITIONS,
  MODULE_ID,
  PANEL_LAYOUT_STATES,
  REQUIRED_OPERATIONS,
  SPLIT_MODES,
  VERSION,
  layout_contract_default as default,
  healthCheck,
  info,
  isValidLayoutTransition,
  validateConstraints,
  validateLayoutManager
};
