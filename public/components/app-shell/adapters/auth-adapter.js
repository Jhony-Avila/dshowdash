import { createCorePorts } from "/core/runtime/ports-profiles.js";
import { AUTH_EVENTS, AUTH_INTENTS, LOGIN_MODAL_EVENTS } from "/core/runtime/events/catalog/auth.events.js";
const VERSION = "1.4.0-P18EC-AAA";
const MODULE_ID = "app-shell-auth-adapter";
const MAX_RETRIES = 5;
const RETRY_DELAY = 300;
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
let _cleanups = [];
let _retryCount = 0;
let _connected = false;
let _loginRegion = null;
const _metrics = {
  connects: 0,
  disconnects: 0,
  loginShows: 0,
  loginHides: 0,
  errors: 0,
  retries: 0
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
function _showLogin() {
  if (_loginRegion) {
    _loginRegion.classList.add("login-active");
    _metrics.loginShows++;
  }
}
function _hideLogin() {
  if (_loginRegion) {
    _loginRegion.classList.remove("login-active");
    _metrics.loginHides++;
  }
}
function connect(loginRegionId) {
  if (!loginRegionId) loginRegionId = "shell-login-region";
  if (_connected) return true;
  _loginRegion = document.getElementById(loginRegionId);
  if (!_loginRegion) {
    _trackEvent("no-login-region", { regionId: loginRegionId });
    return false;
  }
  const eventBus = _getPort("eventBus");
  if (!eventBus || typeof eventBus.on !== "function") {
    if (_retryCount < MAX_RETRIES) {
      _retryCount++;
      _metrics.retries++;
      const delay = RETRY_DELAY * _retryCount;
      _trackEvent("retry-scheduled", { attempt: _retryCount, delay });
      setTimeout(() => {
        connect(loginRegionId);
      }, delay);
      return false;
    }
    _metrics.errors++;
    _trackEvent("max-retries-reached", { attempts: _retryCount });
    return false;
  }
  try {
    const c1 = eventBus.on(AUTH_INTENTS.LOGIN, _showLogin);
    const c2 = eventBus.on(AUTH_EVENTS.LOGIN_SUCCESS, _hideLogin);
    const c3 = eventBus.on(LOGIN_MODAL_EVENTS.OPEN, _showLogin);
    const c4 = eventBus.on(LOGIN_MODAL_EVENTS.CLOSE, _hideLogin);
    if (typeof c1 === "function") _cleanups.push(c1);
    if (typeof c2 === "function") _cleanups.push(c2);
    if (typeof c3 === "function") _cleanups.push(c3);
    if (typeof c4 === "function") _cleanups.push(c4);
    _connected = true;
    _metrics.connects++;
    _trackEvent("connected", { listeners: _cleanups.length, retriesNeeded: _retryCount });
    return true;
  } catch (error) {
    _metrics.errors++;
    _trackEvent("connect-error", { error: error.message });
    return false;
  }
}
function disconnect() {
  _cleanups.forEach((fn) => {
    try {
      fn();
    } catch (e) {
    }
  });
  _cleanups = [];
  _retryCount = 0;
  _connected = false;
  _loginRegion = null;
  _metrics.disconnects++;
  _trackEvent("disconnected");
}
function showLoginOverlay() {
  _showLogin();
}
function hideLoginOverlay() {
  _hideLogin();
}
function isConnected() {
  return _connected;
}
function getMetrics() {
  return Object.assign({}, _metrics);
}
function healthCheck() {
  const ps = Ports.snapshot();
  const eventBus = _getPort("eventBus");
  const checks = {
    eventBusExists: !!eventBus,
    connected: _connected,
    hasLoginRegion: !!_loginRegion,
    noExcessiveRetries: _retryCount < MAX_RETRIES,
    portsInitialized: ps._initialized
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const status = passed === 5 ? "HEALTHY" : passed >= 2 ? "DEGRADED" : "UNHEALTHY";
  return {
    status,
    score: `${passed}/5`,
    checks,
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
    hasLoginRegion: !!_loginRegion,
    listeners: _cleanups.length,
    retryCount: _retryCount,
    maxRetries: MAX_RETRIES,
    portsInitialized: ps._initialized,
    metrics: getMetrics(),
    timestamp: Date.now()
  };
}
var auth_adapter_default = {
  connect,
  disconnect,
  showLoginOverlay,
  hideLoginOverlay,
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
  auth_adapter_default as default,
  disconnect,
  getMetrics,
  getPorts,
  healthCheck,
  hideLoginOverlay,
  info,
  injectPorts,
  isConnected,
  showLoginOverlay
};
