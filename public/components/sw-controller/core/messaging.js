const VERSION = "2.2.0-ENTERPRISE";
const MODULE_ID = "sw-controller-messaging";
let _listeners = {};
let _listenerIdCounter = 0;
let _metrics = { messagesSent: 0, listenersAdded: 0, listenersRemoved: 0 };
const _getListenerCount = () => Object.keys(_listeners).length;
const postMessage = (message) => {
  if (!navigator.serviceWorker?.controller) return false;
  navigator.serviceWorker.controller.postMessage(message);
  _metrics.messagesSent++;
  return true;
};
const onMessage = (callback) => {
  if (typeof callback !== "function") return null;
  const id = ++_listenerIdCounter;
  const wrapper = (event) => callback(event);
  _listeners[String(id)] = { callback, wrapper };
  navigator.serviceWorker?.addEventListener("message", wrapper);
  _metrics.listenersAdded++;
  return id;
};
const offMessage = (id) => {
  const key = String(id);
  if (!_listeners[key]) return false;
  const { wrapper } = _listeners[key];
  navigator.serviceWorker?.removeEventListener("message", wrapper);
  delete _listeners[key];
  _metrics.listenersRemoved++;
  return true;
};
const cleanup = () => {
  let removed = 0;
  for (const id of Object.keys(_listeners)) {
    const { wrapper } = _listeners[id];
    navigator.serviceWorker?.removeEventListener("message", wrapper);
    removed++;
  }
  _listeners = {};
  _metrics.listenersRemoved += removed;
  return removed;
};
const destroy = () => {
  cleanup();
  _metrics = { messagesSent: 0, listenersAdded: 0, listenersRemoved: 0 };
  _listenerIdCounter = 0;
};
const getMetrics = () => ({ ..._metrics, activeListeners: _getListenerCount() });
const healthCheck = () => {
  const hasController = !!navigator.serviceWorker?.controller;
  const checks = { hasController, noLeakedListeners: _getListenerCount() < 100 };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed === total ? "HEALTHY" : "DEGRADED", score: `${passed}/${total}`, checks, metrics: getMetrics(), version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
};
const info = () => {
  const hasController = !!navigator.serviceWorker?.controller;
  return { moduleId: MODULE_ID, version: VERSION, hasController, activeListeners: _getListenerCount(), metrics: getMetrics(), timestamp: Date.now() };
};
const SWMessaging = { postMessage, onMessage, offMessage, cleanup, destroy, getMetrics, healthCheck, info };
var messaging_default = { postMessage, onMessage, offMessage, cleanup, destroy, getMetrics, healthCheck, info, VERSION, MODULE_ID };
export {
  MODULE_ID,
  SWMessaging,
  VERSION,
  cleanup,
  messaging_default as default,
  destroy,
  getMetrics,
  healthCheck,
  info,
  offMessage,
  onMessage,
  postMessage
};
