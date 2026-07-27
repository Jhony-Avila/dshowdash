import { createCorePorts } from "/core/runtime/ports-profiles.js";
import { LAYOUT_EVENTS } from "/core/runtime/events/catalog/layout.events.js";
import { layoutStore } from "../state/store.js";
import { LayoutLifecycle } from "./lifecycle.js";
import { trackLayoutEvent } from "../telemetry/tracker.js";
const VERSION = "2.4.0-P18EC";
const MODULE_ID = "layout-manager.core.state-machine";
const Ports = createCorePorts({ moduleId: MODULE_ID });
function _initPorts() {
  Ports.init();
}
function _getPort(name) {
  return Ports.get(name);
}
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
const _log = (level, msg, data) => {
  const logger = _getPort("logger");
  if (!logger) return;
  const fn = logger[level] || logger.info;
  if (typeof fn === "function") fn.call(logger, `[${MODULE_ID}]`, msg, data || "");
};
const LAYOUT_STATES = Object.freeze({ DEFAULT: "default", COMPACT: "compact", FULLSCREEN: "fullscreen", ADMIN: "admin", DASHBOARD: "dashboard", MONITOR: "monitor", KIOSK: "kiosk" });
const LAYOUT_ACTIONS = Object.freeze({ TO_DEFAULT: "TO_DEFAULT", TO_COMPACT: "TO_COMPACT", TO_FULLSCREEN: "TO_FULLSCREEN", TO_ADMIN: "TO_ADMIN", TO_DASHBOARD: "TO_DASHBOARD", TO_MONITOR: "TO_MONITOR", TO_KIOSK: "TO_KIOSK" });
const STATE_MACHINE = Object.freeze({ "default": { on: { TO_COMPACT: "compact", TO_FULLSCREEN: "fullscreen", TO_ADMIN: "admin", TO_DASHBOARD: "dashboard", TO_MONITOR: "monitor", TO_KIOSK: "kiosk" } }, "compact": { on: { TO_DEFAULT: "default", TO_FULLSCREEN: "fullscreen", TO_ADMIN: "admin", TO_DASHBOARD: "dashboard" } }, "fullscreen": { on: { TO_DEFAULT: "default", TO_COMPACT: "compact", TO_DASHBOARD: "dashboard", TO_MONITOR: "monitor" } }, "admin": { on: { TO_DEFAULT: "default", TO_COMPACT: "compact", TO_DASHBOARD: "dashboard" } }, "dashboard": { on: { TO_DEFAULT: "default", TO_COMPACT: "compact", TO_FULLSCREEN: "fullscreen", TO_ADMIN: "admin", TO_MONITOR: "monitor" } }, "monitor": { on: { TO_DEFAULT: "default", TO_DASHBOARD: "dashboard", TO_FULLSCREEN: "fullscreen", TO_KIOSK: "kiosk" } }, "kiosk": { on: { TO_DEFAULT: "default" } } });
const ON_ENTER = { "default": function() {
  layoutStore.setCompact(false);
  layoutStore.setFullscreen(false);
  layoutStore.setSidebarCollapsed(false);
  layoutStore.set("mode", "default");
  if (LayoutLifecycle._applyBodyClasses) LayoutLifecycle._applyBodyClasses();
}, "compact": function() {
  layoutStore.setCompact(true);
  layoutStore.setFullscreen(false);
  layoutStore.set("mode", "compact");
  if (LayoutLifecycle._applyBodyClasses) LayoutLifecycle._applyBodyClasses();
}, "fullscreen": function() {
  layoutStore.setFullscreen(true);
  layoutStore.setSidebarCollapsed(true);
  layoutStore.set("mode", "fullscreen");
  if (LayoutLifecycle._applyBodyClasses) LayoutLifecycle._applyBodyClasses();
}, "admin": function() {
  layoutStore.setCompact(false);
  layoutStore.setFullscreen(false);
  layoutStore.setSidebarCollapsed(false);
  layoutStore.set("mode", "admin");
  if (LayoutLifecycle._applyBodyClasses) LayoutLifecycle._applyBodyClasses();
}, "dashboard": function() {
  layoutStore.setCompact(false);
  layoutStore.setFullscreen(false);
  layoutStore.set("mode", "dashboard");
  if (LayoutLifecycle._applyBodyClasses) LayoutLifecycle._applyBodyClasses();
}, "monitor": function() {
  layoutStore.setCompact(true);
  layoutStore.setFullscreen(true);
  layoutStore.setSidebarCollapsed(true);
  layoutStore.set("mode", "monitor");
  if (LayoutLifecycle._applyBodyClasses) LayoutLifecycle._applyBodyClasses();
}, "kiosk": function() {
  layoutStore.setCompact(true);
  layoutStore.setFullscreen(true);
  layoutStore.setSidebarCollapsed(true);
  layoutStore.setModalOpen(false);
  layoutStore.set("mode", "kiosk");
  if (LayoutLifecycle._applyBodyClasses) LayoutLifecycle._applyBodyClasses();
} };
const ON_EXIT = { "default": function() {
}, "compact": function() {
  layoutStore.setCompact(false);
}, "fullscreen": function() {
  layoutStore.setFullscreen(false);
}, "admin": function() {
}, "dashboard": function() {
}, "monitor": function() {
  layoutStore.setFullscreen(false);
}, "kiosk": function() {
  layoutStore.setFullscreen(false);
} };
let _currentState = LAYOUT_STATES.DEFAULT;
let _transitionHistory = [];
let _metrics = { transitionsAttempted: 0, transitionsAccepted: 0, transitionsRejected: 0, lastTransition: null };
function canTransition(action) {
  const currentConfig = STATE_MACHINE[_currentState];
  if (!currentConfig || !currentConfig.on) return false;
  return action in currentConfig.on;
}
function getNextState(action) {
  const currentConfig = STATE_MACHINE[_currentState];
  if (!currentConfig || !currentConfig.on) return null;
  return currentConfig.on[action] || null;
}
function transition(action, options) {
  if (!options) options = {};
  _metrics.transitionsAttempted++;
  const source = options.source || "unknown";
  const fromState = _currentState;
  trackLayoutEvent("layout:transition:requested", { from: fromState, action, source });
  const eventBus = _getPort("eventBus");
  if (eventBus && eventBus.emit) eventBus.emit(LAYOUT_EVENTS.TRANSITION_REQUESTED, { from: fromState, action, source, timestamp: Date.now() });
  if (!canTransition(action)) {
    _metrics.transitionsRejected++;
    const currentConfig = STATE_MACHINE[fromState];
    const allowedActions = currentConfig && currentConfig.on ? Object.keys(currentConfig.on) : [];
    const result = { accepted: false, from: fromState, to: null, action, reason: "transition-not-allowed", allowedActions };
    trackLayoutEvent("layout:transition:rejected", result);
    if (eventBus && eventBus.emit) eventBus.emit(LAYOUT_EVENTS.TRANSITION_REJECTED, Object.assign({}, result, { timestamp: Date.now() }));
    return result;
  }
  const toState = getNextState(action);
  try {
    if (ON_EXIT[fromState]) ON_EXIT[fromState]();
  } catch (e) {
    _log("error", "onExit error:", e);
  }
  _currentState = toState;
  layoutStore.set("layoutState", toState);
  try {
    if (ON_ENTER[toState]) ON_ENTER[toState]();
  } catch (e) {
    _log("error", "onEnter error:", e);
  }
  const transitionRecord = { from: fromState, to: toState, action, source, timestamp: Date.now() };
  _transitionHistory.push(transitionRecord);
  if (_transitionHistory.length > 50) _transitionHistory = _transitionHistory.slice(-50);
  _metrics.transitionsAccepted++;
  _metrics.lastTransition = transitionRecord;
  const resultOk = { accepted: true, from: fromState, to: toState, action, source, reason: null };
  trackLayoutEvent("layout:transition:accepted", resultOk);
  if (eventBus && eventBus.emit) eventBus.emit(LAYOUT_EVENTS.TRANSITION_ACCEPTED, Object.assign({}, resultOk, { timestamp: Date.now() }));
  return resultOk;
}
function modeToAction(mode) {
  const mapping = { "default": LAYOUT_ACTIONS.TO_DEFAULT, "compact": LAYOUT_ACTIONS.TO_COMPACT, "expanded": LAYOUT_ACTIONS.TO_DEFAULT, "fullscreen": LAYOUT_ACTIONS.TO_FULLSCREEN, "admin": LAYOUT_ACTIONS.TO_ADMIN, "dashboard": LAYOUT_ACTIONS.TO_DASHBOARD, "monitor": LAYOUT_ACTIONS.TO_MONITOR, "kiosk": LAYOUT_ACTIONS.TO_KIOSK };
  return mapping[mode] || null;
}
function handleLegacyRequest(mode, options) {
  if (!options) options = {};
  const action = modeToAction(mode);
  if (!action) return { accepted: false, from: _currentState, to: null, reason: "unknown-mode", mode };
  return transition(action, options);
}
function getCurrentState() {
  return _currentState;
}
function isInState(state) {
  return _currentState === state;
}
function getAllowedTransitions() {
  const currentConfig = STATE_MACHINE[_currentState];
  return currentConfig && currentConfig.on ? Object.keys(currentConfig.on) : [];
}
function getTransitionHistory(limit) {
  if (!limit) limit = 10;
  return _transitionHistory.slice(-limit);
}
function forceReset(options) {
  if (!options) options = {};
  const fromState = _currentState;
  trackLayoutEvent("layout:force-reset", { from: fromState, source: options.source || "emergency" });
  try {
    if (ON_EXIT[fromState]) ON_EXIT[fromState]();
  } catch (e) {
  }
  _currentState = LAYOUT_STATES.DEFAULT;
  layoutStore.set("layoutState", LAYOUT_STATES.DEFAULT);
  try {
    if (ON_ENTER[LAYOUT_STATES.DEFAULT]) ON_ENTER[LAYOUT_STATES.DEFAULT]();
  } catch (e) {
  }
  return { accepted: true, from: fromState, to: LAYOUT_STATES.DEFAULT, action: "FORCE_RESET", reason: "emergency-reset" };
}
function getMetrics() {
  return { transitionsAttempted: _metrics.transitionsAttempted, transitionsAccepted: _metrics.transitionsAccepted, transitionsRejected: _metrics.transitionsRejected, lastTransition: _metrics.lastTransition, currentState: _currentState, historySize: _transitionHistory.length, acceptanceRate: _metrics.transitionsAttempted > 0 ? _metrics.transitionsAccepted / _metrics.transitionsAttempted : 1 };
}
function resetMetrics() {
  _metrics = { transitionsAttempted: 0, transitionsAccepted: 0, transitionsRejected: 0, lastTransition: null };
  _transitionHistory = [];
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), currentState: _currentState, allowedTransitions: getAllowedTransitions(), states: Object.keys(LAYOUT_STATES).map((k) => LAYOUT_STATES[k]), actions: Object.keys(LAYOUT_ACTIONS).map((k) => LAYOUT_ACTIONS[k]), metrics: getMetrics(), recentHistory: getTransitionHistory(5), timestamp: Date.now() };
}
function healthCheck() {
  const stateValues = Object.keys(LAYOUT_STATES).map((k) => LAYOUT_STATES[k]);
  const logger = _getPort("logger");
  const checks = { validState: stateValues.indexOf(_currentState) !== -1, stateMatchesStore: layoutStore.get("layoutState") === _currentState || !layoutStore.get("layoutState"), lowRejectionRate: _metrics.transitionsAttempted === 0 || _metrics.transitionsRejected / _metrics.transitionsAttempted < 0.3, historyNotOverflowing: _transitionHistory.length < 50, loggerReady: !!logger, portsInitialized: Ports.isInitialized() };
  let passed = 0;
  for (const k in checks) {
    if (checks[k]) passed++;
  }
  return { status: passed === Object.keys(checks).length ? "HEALTHY" : passed >= 3 ? "DEGRADED" : "UNHEALTHY", score: `${passed}/${Object.keys(checks).length}`, checks, currentState: _currentState, metrics: getMetrics(), version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
}
function init() {
  _initPorts();
  const storedState = layoutStore.get("layoutState");
  const stateValues = Object.keys(LAYOUT_STATES).map((k) => LAYOUT_STATES[k]);
  if (storedState && stateValues.indexOf(storedState) !== -1) _currentState = storedState;
  else {
    _currentState = LAYOUT_STATES.DEFAULT;
    layoutStore.set("layoutState", LAYOUT_STATES.DEFAULT);
  }
  trackLayoutEvent("layout:state-machine:initialized", { initialState: _currentState });
  return { ok: true, initialState: _currentState };
}
var state_machine_default = { transition, handleLegacyRequest, getCurrentState, isInState, getAllowedTransitions, getTransitionHistory, forceReset, canTransition, modeToAction, init, getMetrics, resetMetrics, info, healthCheck, injectPorts, getPorts, LAYOUT_STATES, LAYOUT_ACTIONS, VERSION, MODULE_ID };
export {
  LAYOUT_ACTIONS,
  LAYOUT_STATES,
  MODULE_ID,
  VERSION,
  canTransition,
  state_machine_default as default,
  forceReset,
  getAllowedTransitions,
  getCurrentState,
  getMetrics,
  getPorts,
  getTransitionHistory,
  handleLegacyRequest,
  healthCheck,
  info,
  init,
  injectPorts,
  isInState,
  modeToAction,
  resetMetrics,
  transition
};
