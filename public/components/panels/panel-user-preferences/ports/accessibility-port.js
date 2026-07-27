import { createPanelPorts } from "/core/runtime/ports-profiles.js";
import { ACCESSIBILITY_INTENTS, ACCESSIBILITY_EVENTS, ANNOUNCE_PRIORITY } from "/core/runtime/events/catalog/accessibility.events.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-user-preferences.ports.accessibility";
const hasWindow = typeof window !== "undefined";
const Ports = createPanelPorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const _getPort = (name) => Ports.get(name);
const injectPorts = (p) => Ports.inject(p);
const getPorts = () => Ports.snapshot();
const _log = (level, ...args) => {
  const logger = _getPort("logger");
  if (!logger) return;
  const prefix = "[A11y]";
  const fn = logger[level] || logger.info;
  fn?.(prefix, args.join(" "));
};
const A11Y_RESPONSES = { ANNOUNCED: ACCESSIBILITY_EVENTS.ANNOUNCED, SETTING_APPLIED: ACCESSIBILITY_EVENTS.SETTING_APPLIED, ERROR: ACCESSIBILITY_EVENTS.ERROR };
let _metrics = { announcements: 0, settingsChanged: 0, errors: 0 };
const announce = (message, options = {}) => {
  _initPorts();
  if (!message) return { ok: false, error: "no-message" };
  _metrics.announcements++;
  const intent = { message, priority: options.priority || ANNOUNCE_PRIORITY.POLITE, context: options.context || "panel-user-preferences", source: "panel-user-preferences", timestamp: Date.now() };
  const eb = _getPort("eventBus");
  if (eb?.emit) {
    eb.emit(ACCESSIBILITY_INTENTS.ANNOUNCE, intent);
    return { ok: true, method: "event" };
  }
  _log("info", message);
  return { ok: true, method: "logger" };
};
const setReducedMotion = (enabled, options = {}) => {
  _initPorts();
  _metrics.settingsChanged++;
  const intent = { enabled: !!enabled, source: options.source || "panel-user-preferences", timestamp: Date.now(), persist: options.persist !== false };
  const eb = _getPort("eventBus");
  eb?.emit?.(ACCESSIBILITY_INTENTS.SET_REDUCED_MOTION, intent);
  return { ok: true, intent };
};
const setHighContrast = (enabled, options = {}) => {
  _initPorts();
  _metrics.settingsChanged++;
  const intent = { enabled: !!enabled, source: options.source || "panel-user-preferences", timestamp: Date.now(), persist: options.persist !== false };
  const eb = _getPort("eventBus");
  eb?.emit?.(ACCESSIBILITY_INTENTS.SET_HIGH_CONTRAST, intent);
  return { ok: true, intent };
};
const setFontSize = (size, options = {}) => {
  _initPorts();
  const validSizes = ["small", "normal", "large", "extra-large"];
  if (!validSizes.includes(size)) return { ok: false, error: "invalid-size", validSizes };
  _metrics.settingsChanged++;
  const intent = { size, source: options.source || "panel-user-preferences", timestamp: Date.now(), persist: options.persist !== false };
  const eb = _getPort("eventBus");
  eb?.emit?.(ACCESSIBILITY_INTENTS.SET_FONT_SIZE, intent);
  return { ok: true, intent };
};
const setFocusVisible = (enabled, options = {}) => {
  _initPorts();
  _metrics.settingsChanged++;
  const intent = { enabled: !!enabled, source: options.source || "panel-user-preferences", timestamp: Date.now(), persist: options.persist !== false };
  const eb = _getPort("eventBus");
  eb?.emit?.(ACCESSIBILITY_INTENTS.SET_FOCUS_VISIBLE, intent);
  return { ok: true, intent };
};
const getCurrentSettings = () => {
  let reducedMotion = false;
  let highContrast = false;
  if (hasWindow && window.matchMedia) {
    const rmq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const hcq = window.matchMedia("(prefers-contrast: more)");
    reducedMotion = rmq?.matches ?? false;
    highContrast = hcq?.matches ?? false;
  }
  return { reducedMotion, highContrast, fontSize: "normal", focusVisible: true };
};
const isManagerAvailable = () => !!_getPort("eventBus");
const getMetrics = () => ({ ..._metrics });
const resetMetrics = () => {
  _metrics = { announcements: 0, settingsChanged: 0, errors: 0 };
};
const info = () => ({ moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), managerAvailable: isManagerAvailable(), currentSettings: getCurrentSettings(), metrics: getMetrics(), p18Source: "/core/runtime/events/index.js" });
const healthCheck = () => {
  _initPorts();
  const eb = _getPort("eventBus");
  const logger = _getPort("logger");
  const checks = { eventBusAvailable: !!eb, canAnnounce: !!eb?.emit, loggerReady: !!logger, portsInitialized: Ports.isInitialized(), usingP18Core: true };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed >= 4 ? "HEALTHY" : passed >= 3 ? "DEGRADED" : "UNHEALTHY", score: `${passed}/${total}`, checks, version: VERSION, moduleId: MODULE_ID };
};
var accessibility_port_default = { announce, setReducedMotion, setHighContrast, setFontSize, setFocusVisible, getCurrentSettings, isManagerAvailable, getMetrics, resetMetrics, info, healthCheck, injectPorts, getPorts, ANNOUNCE_PRIORITY, ACCESSIBILITY_INTENTS, A11Y_RESPONSES, VERSION, MODULE_ID };
export {
  A11Y_RESPONSES,
  ACCESSIBILITY_INTENTS,
  ANNOUNCE_PRIORITY,
  MODULE_ID,
  VERSION,
  announce,
  accessibility_port_default as default,
  getCurrentSettings,
  getMetrics,
  getPorts,
  healthCheck,
  info,
  injectPorts,
  isManagerAvailable,
  resetMetrics,
  setFocusVisible,
  setFontSize,
  setHighContrast,
  setReducedMotion
};
