const VERSION = "8.2.0-ENTERPRISE";
const MODULE_ID = "container-main:utils:events";
const EVENT_PREFIX = "container";
function emit(container, eventName, data = {}) {
  if (!container) return false;
  const fullEventName = eventName.includes(":") ? eventName : `${EVENT_PREFIX}:${eventName}`;
  container.dispatchEvent(new CustomEvent(fullEventName, { bubbles: true, cancelable: true, detail: { containerId: container.id, timestamp: Date.now(), ...data } }));
  return true;
}
function emitGlobal(eventName, data = {}) {
  const fullEventName = eventName.includes(":") ? eventName : `${EVENT_PREFIX}:${eventName}`;
  document.dispatchEvent(new CustomEvent(fullEventName, { bubbles: true, cancelable: true, detail: { timestamp: Date.now(), ...data } }));
  return true;
}
function on(target, eventName, callback, options = {}) {
  const { once: once2 = false, capture = false } = options;
  const fullEventName = eventName.includes(":") ? eventName : `${EVENT_PREFIX}:${eventName}`;
  const handler = (e) => {
    callback(e.detail, e);
    if (once2) target.removeEventListener(fullEventName, handler, capture);
  };
  target.addEventListener(fullEventName, handler, capture);
  return () => target.removeEventListener(fullEventName, handler, capture);
}
function once(target, eventName, callback) {
  return on(target, eventName, callback, { once: true });
}
function off(target, eventName, callback, capture = false) {
  const fullEventName = eventName.includes(":") ? eventName : `${EVENT_PREFIX}:${eventName}`;
  target.removeEventListener(fullEventName, callback, capture);
}
function delegate(container, selector, eventName, callback) {
  const handler = (e) => {
    const target = e.target.closest(selector);
    if (target && container.contains(target)) callback(e, target);
  };
  container.addEventListener(eventName, handler);
  return () => container.removeEventListener(eventName, handler);
}
function createBatchEmitter(container, eventName, delay = 100) {
  let _batch = [], _timeout = null;
  return {
    add(data) {
      _batch.push(data);
      if (_timeout) clearTimeout(_timeout);
      _timeout = setTimeout(() => {
        emit(container, eventName, { batch: _batch });
        _batch = [];
      }, delay);
    },
    flush() {
      if (_timeout) clearTimeout(_timeout);
      if (_batch.length > 0) {
        emit(container, eventName, { batch: _batch });
        _batch = [];
      }
    },
    clear() {
      if (_timeout) clearTimeout(_timeout);
      _batch = [];
    }
  };
}
const CONTAINER_EVENTS = {
  INIT: "init",
  READY: "ready",
  DESTROY: "destroy",
  MINIMIZE: "minimize",
  MAXIMIZE: "maximize",
  RESTORE: "restore",
  FULLSCREEN: "fullscreen",
  COLLAPSE: "collapse",
  EXPAND: "expand",
  FOCUS: "focus",
  BLUR: "blur",
  CLICK: "click",
  DRAG_START: "dragstart",
  DRAG_MOVE: "dragmove",
  DRAG_END: "dragend",
  RESIZE_START: "resizestart",
  RESIZE: "resize",
  RESIZE_END: "resizeend",
  CONTENT_LOAD: "content:load",
  CONTENT_ERROR: "content:error",
  REFRESH: "refresh",
  TAB_ADD: "tab:add",
  TAB_REMOVE: "tab:remove",
  TAB_SELECT: "tab:select"
};
function healthCheck() {
  return { status: "HEALTHY", score: "2/2", version: VERSION, moduleId: MODULE_ID, checks: { eventsReady: true, customEventSupported: typeof CustomEvent !== "undefined" }, eventsCount: Object.keys(CONTAINER_EVENTS).length, p18ECLocal: true, timestamp: Date.now() };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, eventsCount: Object.keys(CONTAINER_EVENTS).length, eventsList: Object.keys(CONTAINER_EVENTS), p18ECLocal: true };
}
var events_default = { emit, emitGlobal, on, once, off, delegate, createBatchEmitter, CONTAINER_EVENTS, healthCheck, info, VERSION, MODULE_ID };
export {
  CONTAINER_EVENTS,
  MODULE_ID,
  VERSION,
  createBatchEmitter,
  events_default as default,
  delegate,
  emit,
  emitGlobal,
  healthCheck,
  info,
  off,
  on,
  once
};
