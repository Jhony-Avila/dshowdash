import { createUiPorts } from "/core/runtime/ports-profiles.js";
const VERSION = "5.7.0-P18EC";
const MODULE_ID = "sidebar._shared.event-utils";
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
let _metrics = { emittersCreated: 0, customEventsDispatched: 0 };
function createEventEmitter() {
  _metrics.emittersCreated++;
  const listeners = /* @__PURE__ */ new Map();
  return { on(event, handler) {
    if (!listeners.has(event)) listeners.set(event, /* @__PURE__ */ new Set());
    listeners.get(event).add(handler);
    return () => this.off(event, handler);
  }, off(event, handler) {
    listeners.get(event)?.delete(handler);
  }, emit(event, data) {
    listeners.get(event)?.forEach((handler) => {
      try {
        handler(data);
      } catch (e) {
        _getPort("logger")?.warn?.(`Event ${event} handler error:`, e);
      }
    });
  }, once(event, handler) {
    const wrapper = (data) => {
      this.off(event, wrapper);
      handler(data);
    };
    return this.on(event, wrapper);
  }, clear(event) {
    if (event) listeners.delete(event);
    else listeners.clear();
  }, listenerCount(event) {
    return listeners.get(event)?.size || 0;
  } };
}
function waitForEvent(target, event, timeout = 5e3) {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      target.removeEventListener(event, handler);
      reject(new Error(`Event ${event} timeout after ${timeout}ms`));
    }, timeout);
    const handler = (e) => {
      clearTimeout(timer);
      target.removeEventListener(event, handler);
      resolve(e);
    };
    target.addEventListener(event, handler);
  });
}
function dispatchCustomEvent(element, name, detail = {}, options = {}) {
  _metrics.customEventsDispatched++;
  const event = new CustomEvent(name, { bubbles: true, cancelable: true, detail, ...options });
  return element.dispatchEvent(event);
}
function createDelegatedHandler(handlers) {
  return (e) => {
    for (const [selector, handler] of Object.entries(handlers)) {
      const target = e.target.closest(selector);
      if (target) {
        handler(e, target);
        break;
      }
    }
  };
}
function isEnterOrSpace(e) {
  return e.key === "Enter" || e.key === " ";
}
function isEscape(e) {
  return e.key === "Escape";
}
function isArrowKey(e) {
  return ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(e.key);
}
function getModifiers(e) {
  return { ctrl: e.ctrlKey, alt: e.altKey, shift: e.shiftKey, meta: e.metaKey };
}
function prevent(e) {
  e.preventDefault();
  e.stopPropagation();
}
function once(target, event, handler, options = {}) {
  target.addEventListener(event, handler, { ...options, once: true });
}
function addListeners(target, events, handler, options = {}) {
  const eventList = events.split(" ");
  eventList.forEach((event) => target.addEventListener(event, handler, options));
  return () => eventList.forEach((event) => target.removeEventListener(event, handler, options));
}
function createAbortable() {
  const controller = new AbortController();
  return { signal: controller.signal, abort: () => controller.abort(), isAborted: () => controller.signal.aborted };
}
function getMetrics() {
  return { ..._metrics };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, metrics: getMetrics(), portsInitialized: Ports.isInitialized(), p18ECLocal: true };
}
function healthCheck() {
  return { status: Ports.isInitialized() ? "HEALTHY" : "DEGRADED", version: VERSION, moduleId: MODULE_ID, checks: { customEventSupported: typeof CustomEvent !== "undefined", portsInitialized: Ports.isInitialized() }, metrics: getMetrics(), p18ECLocal: true };
}
var event_utils_default = { createEventEmitter, waitForEvent, dispatchCustomEvent, createDelegatedHandler, isEnterOrSpace, isEscape, isArrowKey, getModifiers, prevent, once, addListeners, createAbortable, healthCheck, info, getMetrics, injectPorts, getPorts, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  addListeners,
  createAbortable,
  createDelegatedHandler,
  createEventEmitter,
  event_utils_default as default,
  dispatchCustomEvent,
  getMetrics,
  getModifiers,
  getPorts,
  healthCheck,
  info,
  injectPorts,
  isArrowKey,
  isEnterOrSpace,
  isEscape,
  once,
  prevent,
  waitForEvent
};
