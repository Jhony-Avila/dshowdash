import { createCorePorts } from "/core/runtime/ports-profiles.js";
const VERSION = "1.2.0-ES6";
const MODULE_ID = "header/core/service-worker-bridge";
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
let _swRegistration = null;
let _initialized = false;
const _supported = "serviceWorker" in navigator;
const _messageHandlers = /* @__PURE__ */ new Map();
let _pendingMessages = [];
let _metrics = { messagesSent: 0, messagesReceived: 0, cacheHits: 0, cacheMisses: 0, syncRequests: 0, errors: 0 };
const MESSAGE_TYPES = { CACHE_REQUEST: "header:cache:request", CACHE_CLEAR: "header:cache:clear", SYNC_REQUEST: "header:sync:request", PREFETCH: "header:prefetch", GET_STATUS: "header:get:status", NOTIFICATION: "header:notification" };
function init() {
  _initPorts();
  if (!_supported) {
    _log("warn", "Service Worker nao suportado");
    _initialized = true;
    return Promise.resolve(false);
  }
  return _registerMessageHandler().then(() => {
    _initialized = true;
    _processPendingMessages();
    _log("info", "ServiceWorkerBridge inicializado");
    return true;
  }).catch((error) => {
    _log("error", "Erro ao inicializar:", error.message);
    _initialized = true;
    return false;
  });
}
function _registerMessageHandler() {
  return navigator.serviceWorker.ready.then((registration) => {
    _swRegistration = registration;
    navigator.serviceWorker.addEventListener("message", _handleMessage);
    _log("debug", "Message handler registrado");
    return registration;
  });
}
function _handleMessage(event) {
  _metrics.messagesReceived++;
  const data = event.data;
  if (!data || !data.type) return;
  _log("debug", "Mensagem recebida:", data.type);
  const handler = _messageHandlers.get(data.type);
  if (handler) {
    try {
      handler(data.payload, event);
    } catch (e) {
      _log("error", "Handler error:", e.message);
    }
  }
  _emitEvent("message", data);
}
function sendMessage(type, payload) {
  if (!_initialized || !_swRegistration || !_swRegistration.active) {
    _pendingMessages.push({ type, payload });
    return Promise.resolve(false);
  }
  _metrics.messagesSent++;
  return new Promise((resolve) => {
    const messageChannel = new MessageChannel();
    messageChannel.port1.onmessage = (event) => {
      resolve(event.data);
    };
    _swRegistration.active.postMessage({ type, payload, source: MODULE_ID }, [messageChannel.port2]);
    setTimeout(() => {
      resolve(null);
    }, 5e3);
  });
}
function _processPendingMessages() {
  if (_pendingMessages.length === 0) return;
  _pendingMessages.forEach((msg) => {
    sendMessage(msg.type, msg.payload);
  });
  _pendingMessages = [];
}
function cacheRequest(url, options) {
  options = options || {};
  return sendMessage(MESSAGE_TYPES.CACHE_REQUEST, { url, strategy: options.strategy || "network-first", ttl: options.ttl || 3e5 });
}
function clearCache(pattern) {
  return sendMessage(MESSAGE_TYPES.CACHE_CLEAR, { pattern });
}
function prefetch(urls) {
  if (!Array.isArray(urls)) urls = [urls];
  return sendMessage(MESSAGE_TYPES.PREFETCH, { urls });
}
function requestSync(tag, data) {
  _metrics.syncRequests++;
  if (!_swRegistration || !_swRegistration.sync) {
    _log("warn", "Background Sync nao suportado");
    return Promise.resolve(false);
  }
  return _swRegistration.sync.register(tag).then(() => {
    _log("debug", "Sync registrado:", tag);
    return sendMessage(MESSAGE_TYPES.SYNC_REQUEST, { tag, data });
  }).catch((error) => {
    _log("error", "Sync error:", error.message);
    return false;
  });
}
function getStatus() {
  return sendMessage(MESSAGE_TYPES.GET_STATUS, {}).then((response) => response || { active: !!(_swRegistration && _swRegistration.active), scope: _swRegistration ? _swRegistration.scope : null });
}
function isActive() {
  return !!(_swRegistration && _swRegistration.active);
}
function isSupported() {
  return _supported;
}
function onMessage(type, handler) {
  if (typeof handler !== "function") return () => {
  };
  _messageHandlers.set(type, handler);
  return () => {
    _messageHandlers.delete(type);
  };
}
function checkForUpdate() {
  if (!_swRegistration) return Promise.resolve(false);
  return _swRegistration.update().then(() => {
    _log("debug", "Update check concluido");
    return true;
  }).catch((error) => {
    _log("error", "Update check error:", error.message);
    return false;
  });
}
function skipWaiting() {
  if (_swRegistration && _swRegistration.waiting) {
    _swRegistration.waiting.postMessage({ type: "SKIP_WAITING" });
    return true;
  }
  return false;
}
function _emitEvent(type, data) {
  const eventBus = _getPort("eventBus");
  if (eventBus && eventBus.emit) {
    eventBus.emit(`header:sw:${type}`, Object.assign({ timestamp: Date.now() }, data));
  }
}
function cleanup() {
  if (_supported) {
    navigator.serviceWorker.removeEventListener("message", _handleMessage);
  }
  _messageHandlers.clear();
  _pendingMessages = [];
  _initialized = false;
}
function getMetrics() {
  return Object.assign({}, _metrics);
}
function resetMetrics() {
  _metrics = { messagesSent: 0, messagesReceived: 0, cacheHits: 0, cacheMisses: 0, syncRequests: 0, errors: 0 };
}
function healthCheck() {
  _initPorts();
  const checks = { supported: _supported, initialized: _initialized, swActive: isActive() || !_supported, portsInitialized: _portsInitialized };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed === total ? "HEALTHY" : passed >= 2 ? "DEGRADED" : "UNHEALTHY", score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, version: VERSION, moduleId: MODULE_ID, timestamp: (/* @__PURE__ */ new Date()).toISOString() };
}
function info() {
  return { version: VERSION, moduleId: MODULE_ID, supported: _supported, initialized: _initialized, active: isActive(), scope: _swRegistration ? _swRegistration.scope : null, messageTypes: Object.keys(MESSAGE_TYPES), handlersCount: _messageHandlers.size, metrics: getMetrics(), portsInitialized: _portsInitialized, healthCheck: healthCheck() };
}
var service_worker_bridge_default = { VERSION, MODULE_ID, init, sendMessage, cacheRequest, clearCache, prefetch, requestSync, getStatus, isActive, isSupported, onMessage, cleanup, healthCheck, info };
export {
  MESSAGE_TYPES,
  MODULE_ID,
  VERSION,
  cacheRequest,
  checkForUpdate,
  cleanup,
  clearCache,
  service_worker_bridge_default as default,
  getMetrics,
  getPorts,
  getStatus,
  healthCheck,
  info,
  init,
  injectPorts,
  isActive,
  isSupported,
  onMessage,
  prefetch,
  requestSync,
  resetMetrics,
  sendMessage,
  skipWaiting
};
