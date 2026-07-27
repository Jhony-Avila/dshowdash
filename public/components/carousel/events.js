const VERSION = "2.0.0-ENTERPRISE-AAA";
const MODULE_ID = "carousel-events";
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
function healthCheck() {
  return { status: "HEALTHY", score: "1/1", checks: { available: true }, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, registeredEvents: Array.from(_handlers.keys()), timestamp: Date.now() };
}
var events_default = { on, off, emit, healthCheck, info, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  events_default as default,
  emit,
  healthCheck,
  info,
  off,
  on
};
