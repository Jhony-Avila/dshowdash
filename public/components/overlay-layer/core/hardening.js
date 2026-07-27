import { createUiPorts } from "/core/runtime/ports-profiles.js";
import { OVERLAY_EVENTS } from "/core/runtime/events/catalog/overlay.events.js";
const VERSION = "2.5.0-P2-ENTERPRISE";
const MODULE_ID = "overlay-layer.core.hardening";
const Ports = createUiPorts({ moduleId: MODULE_ID });
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
const _config = { enabled: true, mode: "warn", trackViolations: true, interceptBodyOverflow: true };
let _violations = [];
let _originalBodyOverflowSetter = null;
let _interceptorInstalled = false;
function _recordViolation(type, details) {
  if (!_config.trackViolations) return;
  const violation = { type, details, stack: new Error().stack ? new Error().stack.split("\n").slice(3, 8).join("\n") : "", timestamp: Date.now() };
  _violations.push(violation);
  if (_violations.length > 100) _violations = _violations.slice(-100);
  const eb = _getPort("eventBus");
  if (eb && eb.emit) eb.emit(OVERLAY_EVENTS.VIOLATION, violation);
  return violation;
}
function installOverflowInterceptor() {
  if (_interceptorInstalled || !_config.interceptBodyOverflow) return { ok: false, reason: "already-installed-or-disabled" };
  try {
    const bodyStyle = document.body.style;
    const descriptor = Object.getOwnPropertyDescriptor(CSSStyleDeclaration.prototype, "overflow") || Object.getOwnPropertyDescriptor(bodyStyle, "overflow");
    if (!descriptor) return { ok: false, reason: "cannot-get-descriptor" };
    _originalBodyOverflowSetter = descriptor.set;
    Object.defineProperty(bodyStyle, "overflow", { get: descriptor.get, set(value) {
      const stack = new Error().stack || "";
      const isAuthorized = stack.indexOf("LayoutManager") !== -1 || stack.indexOf("layout-manager") !== -1 || stack.indexOf("_setScrollLock") !== -1 || stack.indexOf("overlay-layer") !== -1 || stack.indexOf("preloader") !== -1 || stack.indexOf("login-modal") !== -1;
      if (!isAuthorized && _config.enabled) {
        const violation = _recordViolation("direct-overflow-manipulation", { attemptedValue: value, source: stack.split("\n")[2] ? stack.split("\n")[2].trim() : "unknown" });
        _log("warn", "Direct body.style.overflow manipulation detected!", { value, source: violation.details.source });
        if (_config.mode === "error") {
          _log("info", "Operation blocked. Use LayoutManager.setScrollLocked() instead.");
          return;
        }
      }
      if (_originalBodyOverflowSetter) _originalBodyOverflowSetter.call(this, value);
    }, configurable: true });
    _interceptorInstalled = true;
    _log("info", "Overflow interceptor installed");
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}
function removeOverflowInterceptor() {
  if (!_interceptorInstalled) return { ok: false, reason: "not-installed" };
  try {
    if (_originalBodyOverflowSetter) Object.defineProperty(document.body.style, "overflow", { set: _originalBodyOverflowSetter, configurable: true });
    _interceptorInstalled = false;
    _originalBodyOverflowSetter = null;
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error.message };
  }
}
function validateZIndex(element, expectedRange) {
  if (!element) return { ok: false, reason: "no-element" };
  const computed = window.getComputedStyle(element);
  const zIndex = parseInt(computed.zIndex) || 0;
  const validRanges = { base: [0, 99], layout: [100, 500], floating: [1e3, 1999], overlay: [2e3, 6999], modal: [7e3, 8999], critical: [9e3, 9999] };
  let inValidRange = false;
  let detectedRange = "unknown";
  for (const name in validRanges) {
    if (validRanges.hasOwnProperty(name)) {
      const range = validRanges[name];
      if (zIndex >= range[0] && zIndex <= range[1]) {
        inValidRange = true;
        detectedRange = name;
        break;
      }
    }
  }
  if (expectedRange && detectedRange !== expectedRange) {
    _recordViolation("invalid-zindex", { element: element.tagName, zIndex, expected: expectedRange, actual: detectedRange });
    _log("warn", `Invalid z-index: expected ${expectedRange}, got ${detectedRange} (${zIndex})`);
    return { ok: false, zIndex, expected: expectedRange, actual: detectedRange };
  }
  if (!inValidRange && zIndex > 0) {
    _recordViolation("arbitrary-zindex", { element: element.tagName, zIndex });
    _log("warn", `Arbitrary z-index detected: ${zIndex}. Use z-index tokens!`);
    return { ok: false, zIndex, reason: "arbitrary-value" };
  }
  return { ok: true, zIndex, range: detectedRange };
}
function scanForViolations() {
  const issues = [];
  const backdrops = document.querySelectorAll(".overlay-backdrop, [data-overlay-backdrop], .modal-backdrop");
  if (backdrops.length > 1) {
    issues.push({ type: "multiple-backdrops", count: backdrops.length });
    _recordViolation("multiple-backdrops", { count: backdrops.length });
  }
  const overlayElements = document.querySelectorAll("[data-overlay], .overlay, .modal, .drawer");
  for (let i = 0; i < overlayElements.length; i++) {
    const result = validateZIndex(overlayElements[i]);
    if (!result.ok) issues.push({ type: "invalid-zindex", element: overlayElements[i].tagName, zIndex: result.zIndex });
  }
  if (document.body.style.overflow && document.body.style.overflow !== "") {
    const stack = document.body.getAttribute("data-overflow-source");
    if (!stack) issues.push({ type: "unmarked-overflow", value: document.body.style.overflow });
  }
  const inertElements = document.querySelectorAll("[inert]");
  const hasActiveOverlay = document.querySelector('[data-overlay-active="true"]');
  if (inertElements.length > 0 && !hasActiveOverlay) {
    issues.push({ type: "orphan-inert", count: inertElements.length });
    _recordViolation("orphan-inert", { count: inertElements.length });
  }
  return { ok: issues.length === 0, issues, scannedAt: Date.now() };
}
function getViolations(filter) {
  if (!filter) return _violations.slice();
  const result = [];
  for (let i = 0; i < _violations.length; i++) {
    const v = _violations[i];
    if (filter.type && v.type !== filter.type) continue;
    if (filter.since && v.timestamp < filter.since) continue;
    result.push(v);
  }
  return result;
}
function clearViolations() {
  const count = _violations.length;
  _violations = [];
  return { ok: true, cleared: count };
}
function getConfig() {
  return Object.assign({}, _config);
}
function setConfig(newConfig) {
  if (newConfig.enabled !== void 0) _config.enabled = newConfig.enabled;
  if (newConfig.mode) _config.mode = newConfig.mode;
  if (newConfig.trackViolations !== void 0) _config.trackViolations = newConfig.trackViolations;
  if (newConfig.interceptBodyOverflow !== void 0) _config.interceptBodyOverflow = newConfig.interceptBodyOverflow;
  return { ok: true, config: Object.assign({}, _config) };
}
function init(config) {
  if (!config) config = {};
  setConfig(config);
  if (_config.interceptBodyOverflow) installOverflowInterceptor();
  return { ok: true, config: Object.assign({}, _config) };
}
function shutdown() {
  removeOverflowInterceptor();
  _config.enabled = false;
  return { ok: true };
}
function healthCheck() {
  const logger = _getPort("logger");
  const eb = _getPort("eventBus");
  const recentViolations = [];
  const now = Date.now();
  for (let i = 0; i < _violations.length; i++) {
    if (now - _violations[i].timestamp < 3e5) recentViolations.push(_violations[i]);
  }
  let hasCritical = false;
  for (let j = 0; j < recentViolations.length; j++) {
    if (recentViolations[j].type === "direct-overflow-manipulation") {
      hasCritical = true;
      break;
    }
  }
  const checks = { enabled: _config.enabled, interceptorActive: _interceptorInstalled, lowViolationRate: recentViolations.length < 10, noRecentCritical: !hasCritical, loggerAvailable: !!logger, eventBusAvailable: !!eb, portsInitialized: Ports.isInitialized() };
  let passed = 0;
  const checkKeys = Object.keys(checks);
  for (let k = 0; k < checkKeys.length; k++) {
    if (checks[checkKeys[k]]) passed++;
  }
  return { status: passed === checkKeys.length ? "HEALTHY" : passed >= 2 ? "DEGRADED" : "UNHEALTHY", score: `${passed}/${checkKeys.length}`, checks, totalViolations: _violations.length, recentViolations: recentViolations.length, config: getConfig(), version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, portsInitialized: Ports.isInitialized(), enabled: _config.enabled, mode: _config.mode, interceptorInstalled: _interceptorInstalled, totalViolations: _violations.length, config: getConfig(), timestamp: Date.now() };
}
var hardening_default = { init, shutdown, installOverflowInterceptor, removeOverflowInterceptor, validateZIndex, scanForViolations, getViolations, clearViolations, getConfig, setConfig, healthCheck, info, injectPorts, getPorts, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  clearViolations,
  hardening_default as default,
  getConfig,
  getPorts,
  getViolations,
  healthCheck,
  info,
  init,
  injectPorts,
  installOverflowInterceptor,
  removeOverflowInterceptor,
  scanForViolations,
  setConfig,
  shutdown,
  validateZIndex
};
