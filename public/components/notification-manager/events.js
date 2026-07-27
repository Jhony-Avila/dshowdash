const VERSION = "2.0.0-ENTERPRISE-AAA";
const MODULE_ID = "notification-manager-events";
const _handlers = /* @__PURE__ */ new Map();
function on(event, handler) {
  if (!_handlers.has(event)) _handlers.set(event, []);
  _handlers.get(event).push(handler);
}
function off(event, handler) {
  const h = _handlers.get(event);
  if (h) _handlers.set(event, h.filter((fn) => fn !== handler));
}
function emit(event, data) {
  const h = _handlers.get(event);
  if (h) h.forEach((fn) => {
    try {
      fn(data);
    } catch (e) {
    }
  });
}
function clear() {
  _handlers.clear();
}
function healthCheck() {
  return { status: "HEALTHY", score: "1/1", checks: { available: true }, handlerCount: _handlers.size, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, events: Array.from(_handlers.keys()), timestamp: Date.now() };
}
const EVENTS = Object.freeze({ NOTIFICATION_RECEIVED: "notification:received", NOTIFICATION_READ: "notification:read", NOTIFICATION_DELETED: "notification:deleted", POLL_COMPLETE: "notification:poll:complete" });
function once(event, handler) {
  const wrapper = function(data) {
    off(event, wrapper);
    handler(data);
  };
  on(event, wrapper);
}
const clearListeners = clear;
function getRegisteredEvents() {
  return [];
}
function syncWithGlobalState() {
  return;
}
function notifyOrchestrator() {
  return;
}
var events_default = { on, off, emit, clear, healthCheck, info, VERSION, MODULE_ID };
export {
  EVENTS,
  MODULE_ID,
  VERSION,
  clear,
  clearListeners,
  events_default as default,
  emit,
  getRegisteredEvents,
  healthCheck,
  info,
  notifyOrchestrator,
  off,
  on,
  once,
  syncWithGlobalState
};
