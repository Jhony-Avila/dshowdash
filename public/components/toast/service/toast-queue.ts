// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.5.0-STRICT-MODE)
// ═══════════════════════════════════════════════════════════════
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//   CONFIG from ./config.js
//   UI_EVENTS from /core/runtime/events/index.js
//   isStrict, recordViolation from /core/runtime/enterprise/strict-mode.js
//
// PROVIDES:
//   generateId(), addToQueue(), removeFromVisible(), processQueue(),
//   getQueue(), getVisible(), clearAll(), findById(),
//   info(), healthCheck(), injectPorts(), getPorts()
//
// WINDOW ACCESS (controlado por strict-mode):
//   Nenhum acesso direto a window necessário
// ═══════════════════════════════════════════════════════════════
// Toast Service - Queue Manager
// @version 1.5.0-STRICT-MODE
// @changelog v1.5.0-STRICT-MODE - Migração para strict-mode NR-FULL
// @changelog v1.4.0-P03-PORTS - P0.3 FIX: Use Ports pattern instead of window.EventBus
// @changelog v1.3.0-P18EC - Removed DOM dispatchEvent (EventBus only)
'use strict';

import { createUiPorts } from '/core/runtime/ports-profiles.js';
import { isStrict, recordViolation } from '/core/runtime/enterprise/strict-mode.js';
import { CONFIG } from './config.js';
import { UI_EVENTS } from '/core/runtime/events/catalog/ui.events.js';

export const VERSION = '1.6.0-P2-ENTERPRISE';
export const MODULE_ID = 'toast-queue';

const hasWindow = typeof window !== 'undefined';

const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

let _queue: Record<string, unknown>[] = [];
let _visible: Record<string, unknown>[] = [];
let _counter = 0;

// P0.3: Use only Ports pattern - no window.EventBus fallback
function _emitToEventBus(toast: Record<string, unknown>) {
  _initPorts();
  try {
    const eb = _getPort('eventBus');
    if (eb && eb.emit) {
      eb.emit(UI_EVENTS.TOAST_SHOW, Object.assign({}, toast, { source: MODULE_ID, timestamp: Date.now() }));
    }
  } catch (e) {}
}

export function generateId() {
  return `toast-${++_counter}-${Date.now().toString(36)}`;
}

export function addToQueue(toast: Record<string, unknown>) {
  _queue.push(toast);
  processQueue();
}

export function removeFromVisible(id: string) {
  _visible = _visible.filter(t => t.id !== id);
  processQueue();
}

export function processQueue() {
  while (_visible.length < CONFIG.maxVisible && _queue.length > 0) {
    const toast = _queue.shift();
    if (toast) { _visible.push(toast); _emitToEventBus(toast); }
  }
}

export function getQueue() { return _queue.slice(); }
export function getVisible() { return _visible.slice(); }

export function clearAll() {
  _queue = [];
  const ids = _visible.map(t => t.id);
  _visible = [];
  return ids;
}

export function findById(id: string) {
  for (let i = 0; i < _visible.length; i++) { if (_visible[i].id === id) return _visible[i]; }
  for (let j = 0; j < _queue.length; j++) { if (_queue[j].id === id) return _queue[j]; }
  return null;
}

export function info() {
  return { moduleId: MODULE_ID, version: VERSION, p03PortsOnly: true, portsInitialized: Ports.isInitialized(), strictMode: isStrict(), strictModeCompliant: true };
}

export function healthCheck() {
  const hasEventBus = !!_getPort('eventBus');
  return {
    status: hasEventBus ? 'HEALTHY' : 'DEGRADED',
    moduleId: MODULE_ID,
    version: VERSION,
    p03PortsOnly: true,
    strictMode: isStrict(),
    strictModeCompliant: true,
    checks: { ready: true, hasEventBus, portsInitialized: Ports.isInitialized() }
  };
}

const ToastQueue = {
  generateId,
  addToQueue,
  removeFromVisible,
  processQueue,
  getQueue,
  getVisible,
  clearAll,
  findById,
  VERSION,
  MODULE_ID,
  info,
  healthCheck,
  injectPorts,
  getPorts
};

// Strict Mode: Controle de exposição global
if (hasWindow) {
  // DevTools sempre permitido
  if (typeof (window as any).__DEVTOOLS__ !== 'undefined') {
    (window as any).__DEVTOOLS__.ToastQueue = ToastQueue;
  }
}

export default ToastQueue;
