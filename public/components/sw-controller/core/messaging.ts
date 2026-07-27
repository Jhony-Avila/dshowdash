// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.2.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: sw-controller-messaging
// PURPOSE: SW Controller - Messaging
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   postMessage() — exported function
//   onMessage() — exported function
//   offMessage() — exported function
//   cleanup() — exported function
//   destroy() — exported function
//   getMetrics() — exported function
//   healthCheck() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '2.2.0-ENTERPRISE';
export const MODULE_ID = 'sw-controller-messaging';

type ListenerEntry = { callback: (event: MessageEvent) => void; wrapper: (event: MessageEvent) => void };
let _listeners: Record<string, ListenerEntry> = {};
let _listenerIdCounter = 0;
let _metrics = { messagesSent: 0, listenersAdded: 0, listenersRemoved: 0 };

const _getListenerCount = () => Object.keys(_listeners).length;

export const postMessage = (message: unknown) => {
  if (!navigator.serviceWorker?.controller) return false;
  navigator.serviceWorker.controller.postMessage(message);
  _metrics.messagesSent++;
  return true;
};

export const onMessage = (callback: (event: MessageEvent) => void) => {
  if (typeof callback !== 'function') return null;
  const id = ++_listenerIdCounter;
  const wrapper = (event: MessageEvent) => callback(event);
  _listeners[String(id)] = { callback, wrapper };
  navigator.serviceWorker?.addEventListener('message', wrapper);
  _metrics.listenersAdded++;
  return id;
};

export const offMessage = (id: number | string) => {
  const key = String(id);
  if (!_listeners[key]) return false;
  const { wrapper } = _listeners[key];
  navigator.serviceWorker?.removeEventListener('message', wrapper);
  delete _listeners[key];
  _metrics.listenersRemoved++;
  return true;
};

export const cleanup = () => {
  let removed = 0;
  for (const id of Object.keys(_listeners)) {
    const { wrapper } = _listeners[id];
    navigator.serviceWorker?.removeEventListener('message', wrapper);
    removed++;
  }
  _listeners = {};
  _metrics.listenersRemoved += removed;
  return removed;
};

export const destroy = () => {
  cleanup();
  _metrics = { messagesSent: 0, listenersAdded: 0, listenersRemoved: 0 };
  _listenerIdCounter = 0;
};

export const getMetrics = () => ({ ..._metrics, activeListeners: _getListenerCount() });

export const healthCheck = () => {
  const hasController = !!navigator.serviceWorker?.controller;
  const checks = { hasController, noLeakedListeners: _getListenerCount() < 100 };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed === total ? 'HEALTHY' : 'DEGRADED', score: `${passed}/${total}`, checks, metrics: getMetrics(), version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
};

export const info = () => {
  const hasController = !!navigator.serviceWorker?.controller;
  return { moduleId: MODULE_ID, version: VERSION, hasController, activeListeners: _getListenerCount(), metrics: getMetrics(), timestamp: Date.now() };
};

export const SWMessaging = { postMessage, onMessage, offMessage, cleanup, destroy, getMetrics, healthCheck, info };
export default { postMessage, onMessage, offMessage, cleanup, destroy, getMetrics, healthCheck, info, VERSION, MODULE_ID };
