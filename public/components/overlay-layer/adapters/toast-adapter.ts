// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.4.0-P21)
// ═══════════════════════════════════════════════════════════════
// MODULE: overlay-layer.adapters.toast-adapter
// PURPOSE: Overlay Layer - Toast Adapter v1.4.0-P21
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//   UI_EVENTS, TOAST_EVENTS from /core/runtime/events/index.js
//   * as Manager from ../core/manager.js
//
// PROVIDES:
//   show() — exported function
//   success() — exported function
//   error() — exported function
//   warning() — exported function
//   toastInfo() — exported function
//   dismiss() — exported function
//   dismissAll() — exported function
//   update() — exported function
//   connectToToastService() — exported function
//   disconnect() — exported function
//   destroy() — exported function
//   isActive() — exported function
//   getActiveToasts() — exported function
//   getConfig() — exported function
//   setConfig() — exported function
//   getMetrics() — exported function
//   healthCheck() — exported function
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   UI_EVENTS.TOAST_UPDATE
// LISTENS (eventos):
//   TOAST_EVENTS.SHOW
//   TOAST_EVENTS.DISMISS
//   TOAST_EVENTS.DISMISS_ALL
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createUiPorts } from '/core/runtime/ports-profiles.js';
import { UI_EVENTS } from '/core/runtime/events/catalog/ui.events.js';
import { TOAST_EVENTS as _TOAST_EVENTS } from '/components/toast/toast-catalog.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;
const TOAST_EVENTS = _TOAST_EVENTS as any;
import * as Manager from '../core/manager.js';

const VERSION = '1.4.0-P21';
const MODULE_ID = 'overlay-layer.adapters.toast-adapter';

const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
function injectPorts(p: DynObj) { return Ports.inject(p); }
function getPorts() { return Ports.snapshot(); }

const TOAST_BASE_ID = 'toast';
const TOAST_PRIORITY = 6000;
let _toastQueue: DynObj[] = [];
const _activeToasts = new Map();
const _config = { maxVisible: 5, defaultDuration: 5000, position: 'top-right', stackDirection: 'down' };
let _metrics = { shown: 0, dismissed: 0, queued: 0 };
let _cleanups: DynObj[] = [];

function _generateId() { return `${TOAST_BASE_ID}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`; }

function show(message: string, type: DynObj, options: DynObj) {
  if (!type) type = 'info';
  if (!options) options = {};
  const id = options.id || _generateId();
  const duration = options.duration !== undefined ? options.duration : _config.defaultDuration;
  if (_activeToasts.size >= _config.maxVisible) {
    _toastQueue.push({ id, message, type, options, enqueuedAt: Date.now() });
    _metrics.queued++;
    return { ok: true, id, queued: true, position: _toastQueue.length };
  }
  const result = Manager.open({ id, type: 'toast', priority: TOAST_PRIORITY, blocking: false, content: { message, type }, config: { closable: options.closable !== false, duration, position: options.position || _config.position, action: options.action || null } });
  if (result.ok) {
    _activeToasts.set(id, { message, type, showedAt: Date.now(), duration });
    _metrics.shown++;
    if (duration > 0) setTimeout(() => { dismiss(id, 'timeout'); }, duration);
  }
  return { ok: result.ok, id, action: result.action };
}

function success(message: string, options: DynObj) { return show(message, 'success', options); }
function error(message: string, options: DynObj) { if (!options) options = {}; options.duration = options.duration || 8000; return show(message, 'error', options); }
function warning(message: string, options: DynObj) { return show(message, 'warning', options); }
function toastInfo(message: string, options: DynObj) { return show(message, 'info', options); }

function dismiss(id: DynObj, reason: DynObj) {
  if (!reason) reason = 'explicit';
  if (!_activeToasts.has(id)) return { ok: false, reason: 'not-found' };
  const result = Manager.close(id, reason);
  _activeToasts.delete(id);
  _metrics.dismissed++;
  _processQueue();
  return result;
}

function dismissAll(reason?: DynObj) {
  if (!reason) reason = 'dismiss-all';
  const count = _activeToasts.size;
  _activeToasts.forEach((_, id) => { Manager.close(id, reason); });
  _activeToasts.clear();
  _metrics.dismissed += count;
  return { ok: true, dismissed: count };
}

function _processQueue() {
  if (_toastQueue.length === 0 || _activeToasts.size >= _config.maxVisible) return;
  const next = _toastQueue.shift();
  if (next) show(next.message, next.type, next.options);
}

function update(id: DynObj, message: string, type: DynObj) {
  if (!_activeToasts.has(id)) return { ok: false, reason: 'not-found' };
  const toast = _activeToasts.get(id);
  toast.message = message;
  if (type) toast.type = type;
  const eb = _getPort('eventBus');
  if (eb && eb.emit) eb.emit(UI_EVENTS.TOAST_UPDATE, { id, message, type });
  return { ok: true, id };
}

function _showHandler(data: DynObj) { show(data.message, data.type, data.options); }
function _dismissHandler(data: DynObj) { dismiss(data.id, data.reason); }
function _dismissAllHandler() { dismissAll(); }

function connectToToastService() {
  const eb = _getPort('eventBus');
  if (!eb || !eb.on) return { ok: false, reason: 'EventBus not available' };
  const c1 = eb.on(TOAST_EVENTS.SHOW, _showHandler);
  if (typeof c1 === 'function') _cleanups.push(c1);
  else _cleanups.push(() => { if (eb.off) eb.off(TOAST_EVENTS.SHOW, _showHandler); });
  const c2 = eb.on(TOAST_EVENTS.DISMISS, _dismissHandler);
  if (typeof c2 === 'function') _cleanups.push(c2);
  else _cleanups.push(() => { if (eb.off) eb.off(TOAST_EVENTS.DISMISS, _dismissHandler); });
  const c3 = eb.on(TOAST_EVENTS.DISMISS_ALL, _dismissAllHandler);
  if (typeof c3 === 'function') _cleanups.push(c3);
  else _cleanups.push(() => { if (eb.off) eb.off(TOAST_EVENTS.DISMISS_ALL, _dismissAllHandler); });
  return { ok: true, connected: true };
}

function disconnect() {
  _cleanups.forEach(fn => { try { fn(); } catch (e) {} });
  _cleanups = [];
  return { ok: true };
}

function destroy() {
  disconnect();
  dismissAll('destroy');
  _toastQueue = [];
  _metrics = { shown: 0, dismissed: 0, queued: 0 };
}

function isActive(id: DynObj) { return _activeToasts.has(id); }
function getActiveToasts() { const list: DynObj[] = []; _activeToasts.forEach((data, id) => { list.push(Object.assign({ id, age: Date.now() - data.showedAt }, data)); }); return list; }
function getConfig() { return Object.assign({}, _config); }

function setConfig(newConfig: DynObj) {
  if (newConfig.maxVisible) _config.maxVisible = newConfig.maxVisible;
  if (newConfig.defaultDuration !== undefined) _config.defaultDuration = newConfig.defaultDuration;
  if (newConfig.position) _config.position = newConfig.position;
  if (newConfig.stackDirection) _config.stackDirection = newConfig.stackDirection;
  return { ok: true, config: Object.assign({}, _config) };
}

function getMetrics() { return Object.assign({}, _metrics, { active: _activeToasts.size, queued: _toastQueue.length }); }

function healthCheck() {
  const eb = _getPort('eventBus');
  const checks = { managerAvailable: !!Manager, queueNotOverflowing: _toastQueue.length < 20, activeWithinLimit: _activeToasts.size <= _config.maxVisible, eventBusAvailable: !!eb, portsInitialized: Ports.isInitialized() };
  let passed = 0;
  const keys = Object.keys(checks);
  for (let i = 0; i < keys.length; i++) { if ((checks as DynObj)[keys[i]]) passed++; }
  return { status: passed === keys.length ? 'HEALTHY' : 'DEGRADED', score: `${passed}/${keys.length}`, checks, metrics: getMetrics(), portsInitialized: Ports.isInitialized(), version: VERSION, moduleId: MODULE_ID, p21Compliant: true, cleanups: _cleanups.length, timestamp: Date.now() };
}

function info() { return { moduleId: MODULE_ID, version: VERSION, config: getConfig(), activeToasts: getActiveToasts(), queueSize: _toastQueue.length, metrics: getMetrics(), portsInitialized: Ports.isInitialized(), p21Compliant: true, timestamp: Date.now() }; }

export { show, success, error, warning, toastInfo as info, dismiss, dismissAll, update, connectToToastService, disconnect, destroy, isActive, getActiveToasts, getConfig, setConfig, getMetrics, healthCheck, VERSION, MODULE_ID, injectPorts, getPorts };

export default { show, success, error, warning, info: toastInfo, dismiss, dismissAll, update, connectToToastService, disconnect, destroy, isActive, getActiveToasts, getConfig, setConfig, getMetrics, healthCheck, moduleInfo: info, injectPorts, getPorts, VERSION, MODULE_ID };
