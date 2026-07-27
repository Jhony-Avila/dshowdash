import { createCorePorts } from "/core/runtime/ports-profiles.js";
import { THEME_EVENTS } from "/core/runtime/events/catalog/theme.events.js";
const VERSION = "1.3.0-P18EC-AAA";
const MODULE_ID = "app-shell-theme-adapter";
const Ports = createCorePorts({ moduleId: MODULE_ID });
function _getPort(name) {
  return Ports.get(name);
}
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
let _cleanup = null;
let _connected = false;
let _currentTheme = null;
const _metrics = {
  connects: 0,
  disconnects: 0,
  themeChanges: 0,
  errors: 0
};
function _trackEvent(event, data) {
  if (!data) data = {};
  try {
    const telemetry = _getPort("telemetry");
    if (telemetry && telemetry.event) {
      telemetry.event(`${MODULE_ID}:${event}`, data);
    }
  } catch (e) {
  }
}
function connect(callbacks) {
  if (!callbacks) callbacks = {};
  if (_connected) return true;
  const eventBus = _getPort("eventBus");
  if (!eventBus) {
    _trackEvent("no-eventbus");
    return false;
  }
  try {
    const handler = (data) => {
      _currentTheme = data && data.theme ? data.theme : data;
      _metrics.themeChanges++;
      _trackEvent("theme-changed", { theme: _currentTheme });
      if (callbacks.onThemeChange) callbacks.onThemeChange(_currentTheme);
    };
    eventBus.on(THEME_EVENTS.CHANGED, handler);
    eventBus.on(THEME_EVENTS.APPLIED, handler);
    _cleanup = () => {
      eventBus.off(THEME_EVENTS.CHANGED, handler);
      eventBus.off(THEME_EVENTS.APPLIED, handler);
    };
    const themeManager = _getPort("themeManager");
    _currentTheme = themeManager && themeManager.getCurrentTheme ? themeManager.getCurrentTheme() : document.documentElement.dataset.theme || "dark";
    _connected = true;
    _metrics.connects++;
    _trackEvent("connected", { initialTheme: _currentTheme });
    return true;
  } catch (error) {
    _metrics.errors++;
    _trackEvent("connect-error", { error: error.message });
    return false;
  }
}
function disconnect() {
  if (_cleanup) {
    _cleanup();
    _cleanup = null;
  }
  _connected = false;
  _metrics.disconnects++;
  _trackEvent("disconnected");
}
function getCurrentTheme() {
  return _currentTheme;
}
function isConnected() {
  return _connected;
}
function getMetrics() {
  return Object.assign({}, _metrics);
}
function setTheme(theme) {
  const themeManager = _getPort("themeManager");
  if (themeManager && themeManager.setTheme) {
    themeManager.setTheme(theme);
    return true;
  }
  const eventBus = _getPort("eventBus");
  if (eventBus && eventBus.emit) {
    eventBus.emit(THEME_EVENTS.REQUEST, { theme, source: MODULE_ID });
    return true;
  }
  return false;
}
function healthCheck() {
  const ps = Ports.snapshot();
  const themeManager = _getPort("themeManager");
  const checks = {
    connected: _connected,
    hasTheme: !!_currentTheme,
    themeManagerExists: !!themeManager,
    portsInitialized: ps._initialized
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const status = passed >= 2 ? "HEALTHY" : passed >= 1 ? "DEGRADED" : "UNHEALTHY";
  return {
    status,
    score: `${passed}/4`,
    checks,
    currentTheme: _currentTheme,
    metrics: getMetrics(),
    version: VERSION,
    moduleId: MODULE_ID,
    portsInitialized: ps._initialized,
    timestamp: Date.now()
  };
}
function info() {
  const ps = Ports.snapshot();
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    connected: _connected,
    currentTheme: _currentTheme,
    portsInitialized: ps._initialized,
    metrics: getMetrics(),
    timestamp: Date.now()
  };
}
var theme_adapter_default = {
  connect,
  disconnect,
  getCurrentTheme,
  setTheme,
  isConnected,
  getMetrics,
  healthCheck,
  info,
  VERSION,
  MODULE_ID,
  injectPorts,
  getPorts
};
export {
  MODULE_ID,
  VERSION,
  connect,
  theme_adapter_default as default,
  disconnect,
  getCurrentTheme,
  getMetrics,
  getPorts,
  healthCheck,
  info,
  injectPorts,
  isConnected,
  setTheme
};
