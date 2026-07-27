import { createCorePorts } from "/core/runtime/ports-profiles.js";
const MODULE_ID = "components.router.core.transitions";
const VERSION = "2.3.0-P18EC";
const TRANSITIONS_TELEMETRY = { START: "router:transition:start", COMPLETE: "router:transition:complete" };
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
const _config = { enabled: true, defaultDuration: 300, defaultEasing: "ease-in-out" };
const _metrics = { started: 0, completed: 0, skipped: 0, errors: 0 };
const TRANSITIONS = { FADE: "fade", SLIDE_LEFT: "slide-left", SLIDE_RIGHT: "slide-right", SLIDE_UP: "slide-up", SLIDE_DOWN: "slide-down", NONE: "none" };
function _track(eventKey, payload) {
  try {
    const tk = _getPort("telemetry");
    if (tk && tk.track) tk.track(eventKey, Object.assign({ moduleId: MODULE_ID }, payload || {}));
  } catch (e) {
  }
}
function _applyTransition(element, type, direction, duration) {
  if (!element || type === TRANSITIONS.NONE) {
    _metrics.skipped++;
    return Promise.resolve({ ok: true, skipped: true });
  }
  _metrics.started++;
  return new Promise((resolve) => {
    const originalTransition = element.style.transition;
    const originalOpacity = element.style.opacity;
    const originalTransform = element.style.transform;
    element.style.transition = `opacity ${duration}ms ${_config.defaultEasing}, transform ${duration}ms ${_config.defaultEasing}`;
    if (direction === "out") {
      element.style.opacity = "0";
      if (type === TRANSITIONS.SLIDE_LEFT) element.style.transform = "translateX(-20px)";
      else if (type === TRANSITIONS.SLIDE_RIGHT) element.style.transform = "translateX(20px)";
      else if (type === TRANSITIONS.SLIDE_UP) element.style.transform = "translateY(-20px)";
      else if (type === TRANSITIONS.SLIDE_DOWN) element.style.transform = "translateY(20px)";
    } else {
      element.style.opacity = "1";
      element.style.transform = "translateX(0) translateY(0)";
    }
    setTimeout(() => {
      element.style.transition = originalTransition;
      if (direction === "in") {
        element.style.opacity = originalOpacity;
        element.style.transform = originalTransform;
      }
      _metrics.completed++;
      resolve({ ok: true });
    }, duration);
  });
}
function transitionOut(element, type, options = {}) {
  const duration = options.duration || _config.defaultDuration;
  return _applyTransition(element, type || TRANSITIONS.FADE, "out", duration);
}
function transitionIn(element, type, options = {}) {
  const duration = options.duration || _config.defaultDuration;
  if (type !== TRANSITIONS.NONE) {
    element.style.opacity = "0";
    if (type === TRANSITIONS.SLIDE_LEFT) element.style.transform = "translateX(20px)";
    else if (type === TRANSITIONS.SLIDE_RIGHT) element.style.transform = "translateX(-20px)";
    else if (type === TRANSITIONS.SLIDE_UP) element.style.transform = "translateY(20px)";
    else if (type === TRANSITIONS.SLIDE_DOWN) element.style.transform = "translateY(-20px)";
  }
  return _applyTransition(element, type || TRANSITIONS.FADE, "in", duration);
}
function transition(outElement, inElement, type, options = {}) {
  _track(TRANSITIONS_TELEMETRY.START, { type });
  return transitionOut(outElement, type, options).then(() => transitionIn(inElement, type, options)).then(() => {
    _track(TRANSITIONS_TELEMETRY.COMPLETE, { type });
    return { ok: true };
  }).catch((err) => {
    _metrics.errors++;
    return { ok: false, error: err && err.message || "transition_error" };
  });
}
function setEnabled(enabled) {
  _config.enabled = enabled;
}
function isEnabled() {
  return _config.enabled;
}
function setDefaultDuration(duration) {
  _config.defaultDuration = duration;
}
function init(ctx) {
  _initPorts();
  if (ctx && ctx.ports) injectPorts(ctx.ports);
  return { ok: true, version: VERSION };
}
function healthCheck() {
  return { status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED", score: 100, moduleId: MODULE_ID, version: VERSION, checks: { enabled: { ok: _config.enabled, severity: "info" }, portsInitialized: { ok: Ports.isInitialized(), severity: "info" } }, metrics: _metrics };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, enabled: _config.enabled, defaultDuration: _config.defaultDuration, metrics: _metrics, portsInitialized: Ports.isInitialized() };
}
const RouteTransitions = {
  MODULE_ID,
  VERSION,
  TRANSITIONS,
  TRANSITIONS_TELEMETRY,
  init,
  transitionOut,
  transitionIn,
  transition,
  setEnabled,
  isEnabled,
  setDefaultDuration,
  healthCheck,
  info,
  injectPorts,
  getPorts
};
var transitions_default = RouteTransitions;
export {
  MODULE_ID,
  RouteTransitions,
  TRANSITIONS,
  TRANSITIONS_TELEMETRY,
  VERSION,
  transitions_default as default,
  getPorts,
  healthCheck,
  info,
  init,
  injectPorts,
  isEnabled,
  setDefaultDuration,
  setEnabled,
  transition,
  transitionIn,
  transitionOut
};
