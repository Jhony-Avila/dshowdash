import { getEventBus, createEventBridge } from "../core/event-bridge.js";
import { createLogger } from "../utils/logger.js";
const VERSION = "1.0.0-PHASE4";
const MODULE_ID = "container-main:event-bus-adapter";
const EVENT_NAMESPACES = Object.freeze({
  BOOTSTRAP: "bootstrap",
  KERNEL: "kernel",
  SLOT: "slot",
  PANEL: "panel",
  RESOURCE: "resource",
  LIFECYCLE: "lifecycle",
  PERFORMANCE: "performance",
  UI: "ui",
  USER: "user",
  SYSTEM: "system"
});
const SYSTEM_EVENTS = Object.freeze({
  // Bootstrap
  "bootstrap:starting": { namespace: "bootstrap", description: "Bootstrap iniciando" },
  "bootstrap:ready": { namespace: "bootstrap", description: "Bootstrap pronto" },
  "bootstrap:error": { namespace: "bootstrap", description: "Erro no bootstrap" },
  "bootstrap:shutdown": { namespace: "bootstrap", description: "Shutdown iniciado" },
  // Kernel
  "kernel:initialized": { namespace: "kernel", description: "Kernel inicializado" },
  "kernel:started": { namespace: "kernel", description: "Kernel iniciado" },
  "kernel:paused": { namespace: "kernel", description: "Kernel pausado" },
  "kernel:resumed": { namespace: "kernel", description: "Kernel retomado" },
  "kernel:error": { namespace: "kernel", description: "Erro no kernel" },
  // Slot
  "slot:registered": { namespace: "slot", description: "Slot registrado" },
  "slot:activated": { namespace: "slot", description: "Slot ativado" },
  "slot:deactivated": { namespace: "slot", description: "Slot desativado" },
  "slot:destroyed": { namespace: "slot", description: "Slot destru\xEDdo" },
  // Panel
  "panel:loaded": { namespace: "panel", description: "Panel carregado" },
  "panel:ready": { namespace: "panel", description: "Panel pronto" },
  "panel:error": { namespace: "panel", description: "Erro no panel" },
  "panel:refresh": { namespace: "panel", description: "Panel atualizado" },
  // Performance
  "performance:warning": { namespace: "performance", description: "Alerta de performance" },
  "performance:critical": { namespace: "performance", description: "Performance cr\xEDtica" },
  // Lifecycle
  "lifecycle:beforeInit": { namespace: "lifecycle", description: "Antes de inicializar" },
  "lifecycle:afterInit": { namespace: "lifecycle", description: "Ap\xF3s inicializar" },
  "lifecycle:beforeDestroy": { namespace: "lifecycle", description: "Antes de destruir" },
  "lifecycle:afterDestroy": { namespace: "lifecycle", description: "Ap\xF3s destruir" }
});
function createEventBusAdapter(options = {}) {
  const { eventBus = null, debug = false, maxListeners = 100, enableHistory = true } = options;
  const _logger = createLogger(MODULE_ID);
  let _eventBus = eventBus || getEventBus({});
  let _bridge = createEventBridge(_eventBus);
  let _subscriptions = /* @__PURE__ */ new Map();
  let _history = [];
  let _historyLimit = 100;
  let _middlewares = [];
  let _paused = false;
  let _metrics = {
    emitted: 0,
    received: 0,
    errors: 0,
    byNamespace: {}
  };
  function _normalizeEvent(event) {
    if (typeof event !== "string") return null;
    return event.toLowerCase().trim();
  }
  function _getNamespace(event) {
    const parts = event.split(":");
    return parts[0] || "unknown";
  }
  function _recordHistory(type, event, data) {
    if (!enableHistory) return;
    _history.push({ type, event, data, timestamp: Date.now() });
    if (_history.length > _historyLimit) _history.shift();
  }
  function _applyMiddlewares(event, data) {
    let result = { event, data, cancelled: false };
    for (const middleware of _middlewares) {
      try {
        const output = middleware(result.event, result.data);
        if (output === false) {
          result.cancelled = true;
          break;
        }
        if (output && typeof output === "object") {
          result = { ...result, ...output };
        }
      } catch (e) {
        _logger.error(`Middleware error: ${e.message}`);
      }
    }
    return result;
  }
  function _updateMetrics(type, event) {
    const namespace = _getNamespace(event);
    if (type === "emit") _metrics.emitted++;
    if (type === "receive") _metrics.received++;
    if (type === "error") _metrics.errors++;
    if (!_metrics.byNamespace[namespace]) {
      _metrics.byNamespace[namespace] = { emitted: 0, received: 0 };
    }
    if (type === "emit") _metrics.byNamespace[namespace].emitted++;
    if (type === "receive") _metrics.byNamespace[namespace].received++;
  }
  const adapter = {
    // Emite evento
    emit(event, data = {}) {
      if (_paused) return false;
      const normalized = _normalizeEvent(event);
      if (!normalized) return false;
      const result = _applyMiddlewares(normalized, data);
      if (result.cancelled) {
        if (debug) _logger.debug(`Event cancelled by middleware: ${normalized}`);
        return false;
      }
      try {
        _bridge.emit(result.event, { ...result.data, __source: MODULE_ID, __timestamp: Date.now() });
        _updateMetrics("emit", result.event);
        _recordHistory("emit", result.event, result.data);
        if (debug) _logger.debug(`Emitted: ${result.event}`, result.data);
        return true;
      } catch (e) {
        _updateMetrics("error", result.event);
        _logger.error(`Emit error: ${e.message}`);
        return false;
      }
    },
    // Escuta evento
    on(event, callback, options2 = {}) {
      const { once = false, priority = 0 } = options2;
      const normalized = _normalizeEvent(event);
      if (!normalized || typeof callback !== "function") return null;
      const wrappedCallback = (data) => {
        if (_paused) return;
        _updateMetrics("receive", normalized);
        _recordHistory("receive", normalized, data);
        try {
          callback(data);
        } catch (e) {
          _updateMetrics("error", normalized);
          _logger.error(`Handler error for ${normalized}: ${e.message}`);
        }
      };
      const method = once ? "once" : "on";
      _eventBus[method](normalized, wrappedCallback);
      const subscriptionId = `${normalized}-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`;
      _subscriptions.set(subscriptionId, { event: normalized, callback: wrappedCallback, original: callback });
      if (debug) _logger.debug(`Subscribed to: ${normalized}`);
      return subscriptionId;
    },
    // Escuta uma vez
    once(event, callback) {
      return this.on(event, callback, { once: true });
    },
    // Remove listener
    off(subscriptionIdOrEvent, callback = null) {
      if (_subscriptions.has(subscriptionIdOrEvent)) {
        const sub = _subscriptions.get(subscriptionIdOrEvent);
        _eventBus.off(sub.event, sub.callback);
        _subscriptions.delete(subscriptionIdOrEvent);
        return true;
      }
      if (typeof subscriptionIdOrEvent === "string" && callback) {
        const normalized = _normalizeEvent(subscriptionIdOrEvent);
        _eventBus.off(normalized, callback);
        return true;
      }
      return false;
    },
    // Remove todos os listeners de um evento
    offAll(event = null) {
      if (event) {
        const normalized = _normalizeEvent(event);
        for (const [id, sub] of _subscriptions) {
          if (sub.event === normalized) {
            _eventBus.off(sub.event, sub.callback);
            _subscriptions.delete(id);
          }
        }
      } else {
        for (const [id, sub] of _subscriptions) {
          _eventBus.off(sub.event, sub.callback);
        }
        _subscriptions.clear();
      }
    },
    // Adiciona middleware
    use(middleware) {
      if (typeof middleware === "function") {
        _middlewares.push(middleware);
        return () => {
          const idx = _middlewares.indexOf(middleware);
          if (idx > -1) _middlewares.splice(idx, 1);
        };
      }
      return null;
    },
    // Pausa/Resume
    pause() {
      _paused = true;
    },
    resume() {
      _paused = false;
    },
    isPaused() {
      return _paused;
    },
    // Emite para namespace
    emitTo(namespace, event, data = {}) {
      return this.emit(`${namespace}:${event}`, data);
    },
    // Escuta namespace inteiro
    onNamespace(namespace, callback) {
      const pattern = `${namespace}:`;
      const wrappedCallback = (event, data) => {
        if (event.startsWith(pattern)) {
          callback(event, data);
        }
      };
      const knownEvents = Object.keys(SYSTEM_EVENTS).filter((e) => e.startsWith(pattern));
      const subscriptions = knownEvents.map((e) => this.on(e, (data) => callback(e, data)));
      return () => subscriptions.forEach((id) => this.off(id));
    },
    // Getters
    getHistory(limit = 50) {
      return _history.slice(-limit);
    },
    getMetrics() {
      return { ..._metrics };
    },
    getSubscriptionCount() {
      return _subscriptions.size;
    },
    getEventBus() {
      return _eventBus;
    },
    getBridge() {
      return _bridge;
    },
    // Reset
    resetMetrics() {
      _metrics = { emitted: 0, received: 0, errors: 0, byNamespace: {} };
    },
    clearHistory() {
      _history = [];
    },
    // Health check
    healthCheck() {
      return {
        status: _subscriptions.size < Number(maxListeners) ? "HEALTHY" : "WARNING",
        version: VERSION,
        moduleId: MODULE_ID,
        subscriptions: _subscriptions.size,
        maxListeners,
        paused: _paused,
        metrics: _metrics
      };
    },
    // Info
    info() {
      return {
        moduleId: MODULE_ID,
        version: VERSION,
        namespaces: Object.keys(EVENT_NAMESPACES),
        systemEvents: Object.keys(SYSTEM_EVENTS).length,
        subscriptions: _subscriptions.size,
        middlewares: _middlewares.length,
        historySize: _history.length
      };
    },
    // Destroy
    destroy() {
      this.offAll();
      _middlewares = [];
      _history = [];
      _logger.info("EventBusAdapter destroyed");
    }
  };
  return adapter;
}
let _instance = null;
function getEventBusAdapter(options = {}) {
  if (!_instance) {
    _instance = createEventBusAdapter(options);
  }
  return _instance;
}
function resetEventBusAdapter() {
  if (_instance) {
    _instance.destroy();
    _instance = null;
  }
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, namespaces: Object.keys(EVENT_NAMESPACES) };
}
function healthCheck() {
  if (_instance) return _instance.healthCheck();
  return { status: "NOT_INITIALIZED", version: VERSION, moduleId: MODULE_ID };
}
var event_bus_adapter_default = {
  VERSION,
  MODULE_ID,
  EVENT_NAMESPACES,
  SYSTEM_EVENTS,
  createEventBusAdapter,
  getEventBusAdapter,
  resetEventBusAdapter,
  info,
  healthCheck
};
export {
  EVENT_NAMESPACES,
  MODULE_ID,
  SYSTEM_EVENTS,
  VERSION,
  createEventBusAdapter,
  event_bus_adapter_default as default,
  getEventBusAdapter,
  healthCheck,
  info,
  resetEventBusAdapter
};
