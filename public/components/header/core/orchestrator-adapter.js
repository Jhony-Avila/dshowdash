import { createCorePorts } from "/core/runtime/ports-profiles.js";
const VERSION = "1.2.0-ES6";
const MODULE_ID = "header/core/orchestrator-adapter";
const Ports = createCorePorts({ moduleId: MODULE_ID });
let _portsInitialized = false;
function _initPorts() {
  if (_portsInitialized) return;
  Ports.init();
  _portsInitialized = true;
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
const _debugEnabled = () => {
  const cfg = _getPort("config");
  return cfg && cfg.app && cfg.app.debug ? true : false;
};
const _log = function(level, ...args) {
  const logger = _getPort("logger");
  if (!logger) return;
  const prefix = `[${MODULE_ID}]`;
  if (level === "error") {
    if (logger.error) logger.error(prefix, args.join(" "));
    return;
  }
  if (level === "warn") {
    if (logger.warn) logger.warn(prefix, args.join(" "));
    return;
  }
  if (level === "info") {
    if (logger.info) logger.info(prefix, args.join(" "));
    return;
  }
  if (_debugEnabled() && logger.debug) logger.debug(prefix, args.join(" "));
};
const ORCHESTRATOR_EVENTS = { LAYOUT_CHANGE: "orchestrator:layout:change", THEME_CHANGE: "orchestrator:theme:change", ROUTE_CHANGE: "orchestrator:route:change", USER_CHANGE: "orchestrator:user:change", PERMISSIONS_CHANGE: "orchestrator:permissions:change", CONFIG_UPDATE: "orchestrator:config:update", REFRESH_REQUEST: "orchestrator:refresh:request", VISIBILITY_CHANGE: "orchestrator:visibility:change" };
const HEADER_COMMANDS = { REQUEST_LAYOUT: "header:request:layout", REQUEST_REFRESH: "header:request:refresh", NOTIFY_READY: "header:notify:ready", NOTIFY_ERROR: "header:notify:error", NOTIFY_STATE: "header:notify:state", REQUEST_NAVIGATION: "header:request:navigation", REQUEST_MODAL: "header:request:modal" };
let _initialized = false;
let _orchestrator = null;
let _listeners = [];
let _cleanups = [];
let _pendingCommands = [];
let _metrics = { eventsReceived: 0, commandsSent: 0, errors: 0, lastEventAt: null, lastCommandAt: null };
function init(orchestratorRef) {
  _initPorts();
  _orchestrator = orchestratorRef || _findOrchestrator();
  _setupEventListeners();
  _initialized = true;
  _processPendingCommands();
  _log("info", "OrchestratorAdapter inicializado");
  sendCommand(HEADER_COMMANDS.NOTIFY_READY, { moduleId: MODULE_ID, version: VERSION, timestamp: Date.now() });
}
function _findOrchestrator() {
  if (window.Orchestrator) return window.Orchestrator;
  if (window.AppOrchestrator) return window.AppOrchestrator;
  if (window.appShell && window.appShell.orchestrator) return window.appShell.orchestrator;
  return null;
}
function _setupEventListeners() {
  const eventBus = _getPort("eventBus");
  if (!eventBus) {
    _log("warn", "EventBus nao disponivel");
    return;
  }
  Object.keys(ORCHESTRATOR_EVENTS).forEach((key) => {
    const eventName = ORCHESTRATOR_EVENTS[key];
    const handler = (data) => {
      _metrics.eventsReceived++;
      _metrics.lastEventAt = Date.now();
      _handleOrchestratorEvent(key, data);
    };
    if (eventBus.on) {
      const cleanup2 = eventBus.on(eventName, handler);
      if (cleanup2) _cleanups.push(cleanup2);
    }
  });
  _log("debug", "Listeners configurados para", Object.keys(ORCHESTRATOR_EVENTS).length, "eventos");
}
function _handleOrchestratorEvent(eventType, data) {
  _log("debug", "Evento recebido:", eventType, data);
  switch (eventType) {
    case "LAYOUT_CHANGE":
      _notifyListeners("layout", data);
      break;
    case "THEME_CHANGE":
      _notifyListeners("theme", data);
      break;
    case "ROUTE_CHANGE":
      _notifyListeners("route", data);
      break;
    case "USER_CHANGE":
      _notifyListeners("user", data);
      break;
    case "PERMISSIONS_CHANGE":
      _notifyListeners("permissions", data);
      break;
    case "CONFIG_UPDATE":
      _notifyListeners("config", data);
      break;
    case "REFRESH_REQUEST":
      _notifyListeners("refresh", data);
      break;
    case "VISIBILITY_CHANGE":
      _notifyListeners("visibility", data);
      break;
    default:
      _notifyListeners("unknown", { type: eventType, data });
  }
}
function sendCommand(command, payload) {
  if (!_initialized) {
    _pendingCommands.push({ command, payload });
    _log("debug", "Comando enfileirado (nao inicializado):", command);
    return false;
  }
  _metrics.commandsSent++;
  _metrics.lastCommandAt = Date.now();
  const eventBus = _getPort("eventBus");
  if (eventBus && eventBus.emit) {
    eventBus.emit(command, Object.assign({ source: MODULE_ID, timestamp: Date.now() }, payload));
    _log("debug", "Comando enviado:", command);
    return true;
  }
  if (_orchestrator && typeof _orchestrator.handleCommand === "function") {
    try {
      _orchestrator.handleCommand(command, payload);
      _log("debug", "Comando enviado via orchestrator:", command);
      return true;
    } catch (e) {
      _metrics.errors++;
      _log("error", "Erro ao enviar comando:", e.message);
      return false;
    }
  }
  _log("warn", "Nenhum canal disponivel para enviar comando:", command);
  return false;
}
function _processPendingCommands() {
  if (_pendingCommands.length === 0) return;
  _pendingCommands.forEach((cmd) => {
    sendCommand(cmd.command, cmd.payload);
  });
  _pendingCommands = [];
  _log("debug", "Comandos pendentes processados");
}
function _notifyListeners(type, data) {
  _listeners.forEach((listener) => {
    if (listener.type === type || listener.type === "*") {
      try {
        listener.callback(data);
      } catch (e) {
        _log("error", "Listener error:", e.message);
      }
    }
  });
}
function requestLayout(layout) {
  return sendCommand(HEADER_COMMANDS.REQUEST_LAYOUT, { layout });
}
function requestRefresh(options) {
  return sendCommand(HEADER_COMMANDS.REQUEST_REFRESH, options || {});
}
function notifyReady(info2) {
  return sendCommand(HEADER_COMMANDS.NOTIFY_READY, info2 || {});
}
function notifyError(error) {
  return sendCommand(HEADER_COMMANDS.NOTIFY_ERROR, { error, timestamp: Date.now() });
}
function notifyState(state) {
  return sendCommand(HEADER_COMMANDS.NOTIFY_STATE, { state });
}
function requestNavigation(route, options) {
  return sendCommand(HEADER_COMMANDS.REQUEST_NAVIGATION, { route, options });
}
function requestModal(modalId, options) {
  return sendCommand(HEADER_COMMANDS.REQUEST_MODAL, { modalId, options });
}
function onOrchestratorEvent(type, callback) {
  if (typeof callback !== "function") return () => {
  };
  const listener = { type, callback };
  _listeners.push(listener);
  return () => {
    const idx = _listeners.indexOf(listener);
    if (idx > -1) _listeners.splice(idx, 1);
  };
}
function getOrchestratorState() {
  if (_orchestrator && typeof _orchestrator.getState === "function") {
    return _orchestrator.getState();
  }
  return null;
}
function isOrchestratorAvailable() {
  return !!_orchestrator || !!_getPort("eventBus");
}
function cleanup() {
  _cleanups.forEach((fn) => {
    try {
      fn();
    } catch (e) {
    }
  });
  _cleanups = [];
  _listeners = [];
  _initialized = false;
  _orchestrator = null;
  _log("info", "Cleanup concluido");
}
function getMetrics() {
  return Object.assign({}, _metrics);
}
function resetMetrics() {
  _metrics = { eventsReceived: 0, commandsSent: 0, errors: 0, lastEventAt: null, lastCommandAt: null };
}
function healthCheck() {
  _initPorts();
  const checks = { initialized: _initialized, orchestratorAvailable: isOrchestratorAvailable(), hasListeners: _listeners.length > 0 || _metrics.commandsSent > 0, lowErrorRate: _metrics.commandsSent === 0 || _metrics.errors / _metrics.commandsSent < 0.1, portsInitialized: _portsInitialized };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed === total ? "HEALTHY" : passed >= 3 ? "DEGRADED" : "UNHEALTHY", score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, version: VERSION, moduleId: MODULE_ID, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
}
function info() {
  return { version: VERSION, moduleId: MODULE_ID, initialized: _initialized, orchestratorAvailable: isOrchestratorAvailable(), eventsListening: Object.keys(ORCHESTRATOR_EVENTS), commandsAvailable: Object.keys(HEADER_COMMANDS), listenersCount: _listeners.length, metrics: getMetrics(), portsInitialized: _portsInitialized, healthCheck: healthCheck() };
}
var orchestrator_adapter_default = { VERSION, MODULE_ID, init, sendCommand, requestLayout, requestRefresh, notifyReady, notifyError, onOrchestratorEvent, isOrchestratorAvailable, cleanup, healthCheck, info };
export {
  HEADER_COMMANDS,
  MODULE_ID,
  ORCHESTRATOR_EVENTS,
  VERSION,
  cleanup,
  orchestrator_adapter_default as default,
  getMetrics,
  getOrchestratorState,
  getPorts,
  healthCheck,
  info,
  init,
  injectPorts,
  isOrchestratorAvailable,
  notifyError,
  notifyReady,
  notifyState,
  onOrchestratorEvent,
  requestLayout,
  requestModal,
  requestNavigation,
  requestRefresh,
  resetMetrics,
  sendCommand
};
