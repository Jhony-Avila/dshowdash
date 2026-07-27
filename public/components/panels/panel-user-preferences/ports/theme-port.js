import { createPanelPorts } from "/core/runtime/ports-profiles.js";
import { THEME_INTENTS, THEME_EVENTS } from "/core/runtime/events/catalog/theme.events.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-user-preferences.ports.theme";
const Ports = createPanelPorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const _getPort = (name) => Ports.get(name);
const injectPorts = (p) => Ports.inject(p);
const getPorts = () => Ports.snapshot();
const _debug = () => {
  const cfg = _getPort("config");
  return cfg?.app?.debug;
};
const _log = (level, msg, extra) => {
  const logger = _getPort("logger");
  if (!logger) return;
  if (!_debug() && level === "debug") return;
  const fn = logger[level] || logger.info;
  fn?.(` [${MODULE_ID}] ${msg}`, extra);
};
const THEME_RESPONSES = { THEME_APPLIED: THEME_EVENTS.APPLIED, THEME_ERROR: THEME_EVENTS.ERROR, THEME_PREVIEW_ACTIVE: THEME_EVENTS.PREVIEW_ACTIVE };
let _pendingPreview = null;
let _metrics = { intentsSent: 0, responsesReceived: 0, errors: 0 };
const setTheme = (theme, options = {}) => {
  _initPorts();
  if (!["light", "dark", "auto"].includes(theme)) {
    _log("warn", `Invalid theme: ${theme}`);
    return { ok: false, error: "invalid-theme" };
  }
  _metrics.intentsSent++;
  const intent = { theme, source: options.source || "panel-user-preferences", timestamp: Date.now(), persist: options.persist !== false };
  const eb = _getPort("eventBus");
  eb?.emit?.(THEME_INTENTS.SET_THEME, intent);
  return { ok: true, intent };
};
const setAccentColor = (color, options = {}) => {
  _initPorts();
  if (!color || !/^#[0-9A-Fa-f]{6}$/.test(color)) {
    _log("warn", `Invalid accent color: ${color}`);
    return { ok: false, error: "invalid-color" };
  }
  _metrics.intentsSent++;
  const intent = { color, source: options.source || "panel-user-preferences", timestamp: Date.now(), persist: options.persist !== false };
  const eb = _getPort("eventBus");
  eb?.emit?.(THEME_INTENTS.SET_ACCENT, intent);
  return { ok: true, intent };
};
const previewTheme = (theme) => {
  _initPorts();
  _pendingPreview = theme;
  _metrics.intentsSent++;
  const eb = _getPort("eventBus");
  eb?.emit?.(THEME_INTENTS.PREVIEW_THEME, { theme, source: "panel-user-preferences", timestamp: Date.now(), isPreview: true });
  return { ok: true, previewing: theme };
};
const cancelPreview = () => {
  _initPorts();
  if (!_pendingPreview) return { ok: false, reason: "no-preview-active" };
  const previousPreview = _pendingPreview;
  _pendingPreview = null;
  _metrics.intentsSent++;
  const eb = _getPort("eventBus");
  eb?.emit?.(THEME_INTENTS.CANCEL_PREVIEW, { source: "panel-user-preferences", timestamp: Date.now() });
  return { ok: true, cancelled: previousPreview };
};
const confirmPreview = () => {
  if (!_pendingPreview) return { ok: false, reason: "no-preview-active" };
  const theme = _pendingPreview;
  _pendingPreview = null;
  return setTheme(theme, { persist: true });
};
const getCurrentTheme = () => {
  if (typeof document !== "undefined") {
    const root = document.documentElement;
    if (root.classList.contains("theme-dark")) return "dark";
    if (root.classList.contains("theme-light")) return "light";
    if (root.classList.contains("theme-auto")) return "auto";
  }
  return "light";
};
const isManagerAvailable = () => !!_getPort("eventBus");
const getMetrics = () => ({ hasPendingPreview: !!_pendingPreview, ..._metrics });
const resetMetrics = () => {
  _metrics = { intentsSent: 0, responsesReceived: 0, errors: 0 };
};
const healthCheck = () => {
  _initPorts();
  const eb = _getPort("eventBus");
  const logger = _getPort("logger");
  const checks = { eventBusAvailable: !!eb, canEmitIntents: !!eb?.emit, loggerReady: !!logger, portsInitialized: Ports.isInitialized(), usingP18Core: true };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed >= 4 ? "HEALTHY" : passed >= 3 ? "DEGRADED" : "UNHEALTHY", score: `${passed}/${total}`, checks, version: VERSION, moduleId: MODULE_ID };
};
const info = () => ({ moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), currentTheme: getCurrentTheme(), hasPendingPreview: !!_pendingPreview, metrics: getMetrics(), p18Source: "/core/runtime/events/index.js", healthCheck: healthCheck() });
var theme_port_default = { setTheme, setAccentColor, previewTheme, cancelPreview, confirmPreview, getCurrentTheme, isManagerAvailable, getMetrics, resetMetrics, info, healthCheck, injectPorts, getPorts, THEME_INTENTS, THEME_RESPONSES, VERSION, MODULE_ID };
export {
  MODULE_ID,
  THEME_INTENTS,
  THEME_RESPONSES,
  VERSION,
  cancelPreview,
  confirmPreview,
  theme_port_default as default,
  getCurrentTheme,
  getMetrics,
  getPorts,
  healthCheck,
  info,
  injectPorts,
  isManagerAvailable,
  previewTheme,
  resetMetrics,
  setAccentColor,
  setTheme
};
