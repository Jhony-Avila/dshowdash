const VERSION = "10.3.0-MIGRATION-PHASE7";
const MODULE_ID = "panel-nav-admin.events.event-emitter";
const NAV_ADMIN_EVENTS = Object.freeze({
  ITEM_CREATED: "nav-admin:item:created",
  ITEM_UPDATED: "nav-admin:item:updated",
  ITEM_DELETED: "nav-admin:item:deleted",
  ITEM_REORDERED: "nav-admin:item:reordered",
  ITEM_DUPLICATED: "nav-admin:item:duplicated",
  SECTION_CREATED: "nav-admin:section:created",
  SECTION_UPDATED: "nav-admin:section:updated",
  SECTION_DELETED: "nav-admin:section:deleted",
  BULK_OPERATION: "nav-admin:bulk:operation",
  IMPORT_COMPLETED: "nav-admin:import:completed",
  EXPORT_COMPLETED: "nav-admin:export:completed",
  FILTER_CHANGED: "nav-admin:filter:changed",
  VIEW_CHANGED: "nav-admin:view:changed",
  SETTINGS_CHANGED: "nav-admin:settings:changed",
  DATA_REFRESHED: "nav-admin:data:refreshed",
  ERROR: "nav-admin:error"
});
function EventEmitter(options = {}) {
  const { maxListeners = 50, debug = false } = options;
  const _listeners = /* @__PURE__ */ new Map();
  const _metrics = {
    emitted: 0,
    listened: 0,
    removed: 0,
    eventCounts: {}
  };
  function on(event, handler) {
    if (typeof handler !== "function") return () => {
    };
    if (!_listeners.has(event)) {
      _listeners.set(event, []);
    }
    const handlers = _listeners.get(event);
    if (handlers.length >= maxListeners) {
      console.warn(`[EventEmitter] Max listeners (${maxListeners}) reached for "${event}"`);
    }
    handlers.push(handler);
    _metrics.listened++;
    return () => off(event, handler);
  }
  function once(event, handler) {
    if (typeof handler !== "function") return () => {
    };
    const wrappedHandler = (...args) => {
      off(event, wrappedHandler);
      handler(...args);
    };
    wrappedHandler._original = handler;
    return on(event, wrappedHandler);
  }
  function off(event, handler) {
    if (!_listeners.has(event)) return;
    const handlers = _listeners.get(event);
    const index = handlers.findIndex((h) => h === handler || h._original === handler);
    if (index !== -1) {
      handlers.splice(index, 1);
      _metrics.removed++;
    }
    if (handlers.length === 0) {
      _listeners.delete(event);
    }
  }
  function emit(event, data) {
    _metrics.emitted++;
    _metrics.eventCounts[event] = (_metrics.eventCounts[event] || 0) + 1;
    if (debug) {
      console.debug(`[EventEmitter] emit "${event}"`, data);
    }
    const handlers = _listeners.get(event);
    if (!handlers || handlers.length === 0) return 0;
    const snapshot = [...handlers];
    let called = 0;
    for (const handler of snapshot) {
      try {
        handler(data, { event, timestamp: Date.now() });
        called++;
      } catch (err) {
        console.error(`[EventEmitter] Error in handler for "${event}":`, err);
      }
    }
    return called;
  }
  function removeAll(event) {
    if (event) {
      _listeners.delete(event);
    } else {
      _listeners.clear();
    }
  }
  function listenerCount(event) {
    return (_listeners.get(event) || []).length;
  }
  function eventNames() {
    return [..._listeners.keys()];
  }
  function getEmitMetrics() {
    return { ..._metrics, activeListeners: _getTotalListeners() };
  }
  function _getTotalListeners() {
    let total = 0;
    for (const handlers of _listeners.values()) {
      total += handlers.length;
    }
    return total;
  }
  return {
    on,
    once,
    off,
    emit,
    removeAll,
    listenerCount,
    eventNames,
    getEmitMetrics
  };
}
function createNavAdminEmitter(options = {}) {
  const emitter = EventEmitter(options);
  emitter.EVENTS = NAV_ADMIN_EVENTS;
  return emitter;
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, eventTypes: Object.keys(NAV_ADMIN_EVENTS).length };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
var event_emitter_default = { EventEmitter, createNavAdminEmitter, NAV_ADMIN_EVENTS, info, healthCheck, VERSION, MODULE_ID };
export {
  EventEmitter,
  MODULE_ID,
  NAV_ADMIN_EVENTS,
  VERSION,
  createNavAdminEmitter,
  event_emitter_default as default,
  healthCheck,
  info
};
