// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.3.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.overlay-layer.core.queue
// PURPOSE: Overlay Layer Queue - Sequential overlay display queue
// ───────────────────────────────────────────────────────────────
// @contract MODULE_ID - module constant identifier
// @contract VERSION - module constant version
// @contract INJECT_PORTS - injectPorts() for dependency injection
// @contract GET_PORTS - getPorts() returns ports snapshot
// @contract ENQUEUE - enqueue() adds overlay to queue
// @contract ENQUEUE_CRITICAL - enqueueCritical() adds critical overlay
// @contract DEQUEUE - dequeue() removes overlay from queue
// @contract PROCESS_NEXT - processNext() processes next in queue
// @contract CLOSE_CURRENT - closeCurrentAndProcessNext() closes current
// @contract CLEAR - clear() clears entire queue
// @contract GET_STATE - getState() returns queue state
// @contract IS_QUEUED - isQueued() checks if overlay is queued
// @contract IS_CURRENT - isCurrent() checks if overlay is current
// @contract PRIORITIZE - prioritize() moves overlay to front
// @contract GET_CONFIG - getConfig() returns queue config
// @contract SET_CONFIG - setConfig() updates queue config
// @contract GET_METRICS - getMetrics() returns queue metrics
// @contract RESET_METRICS - resetMetrics() resets metrics
// @contract HEALTH - healthCheck() returns health status
// @contract INFO - info() returns module information
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//   OVERLAY_EVENTS from /core/runtime/events/index.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   enqueue() — exported function
//   enqueueCritical() — exported function
//   dequeue() — exported function
//   processNext() — exported function
//   closeCurrentAndProcessNext() — exported function
//   clear() — exported function
//   getState() — exported function
//   isQueued() — exported function
//   isCurrent() — exported function
//   prioritize() — exported function
//   getConfig() — exported function
//   setConfig() — exported function
//   getMetrics() — exported function
//   resetMetrics() — exported function
//   healthCheck() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos): overlay:queue:show, overlay:queue:close, overlay:queue:cleared
// LISTENS (eventos): (none)
// WINDOW ACCESS: (none)
// ───────────────────────────────────────────────────────────────
// @changelog v1.3.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v1.2.1-ENTERPRISE: ES5 Object.values fix in healthCheck
// @changelog P17WI: PortsFactory/PortsProfiles pattern
// @changelog P18EC: Events Contracts Migration - Agente 04
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createUiPorts } from '/core/runtime/ports-profiles.js';
import { OVERLAY_EVENTS } from '/core/runtime/events/catalog/overlay.events.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '1.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'overlay-layer-queue';

const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: DynObj) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

let _queue: DynObj[] = [];
let _processing = false;
let _currentOverlay: DynObj = null;
const _config = { maxQueueSize: 20, defaultDelay: 300, autoProcess: true, priorityLevels: ['critical', 'high', 'normal', 'low'] };
let _metrics = { enqueued: 0, processed: 0, dropped: 0, avgWaitTime: 0 };

export function enqueue(overlayDescriptor: DynObj, options: DynObj) {
  if (!options) options = {};
  if (_queue.length >= _config.maxQueueSize) { _metrics.dropped++; return { ok: false, reason: 'queue-full', queueSize: _queue.length }; }
  const priority = options.priority || 'normal';
  const priorityIndex = _config.priorityLevels.indexOf(priority);
  const queueItem = {
    id: overlayDescriptor.id || `overlay-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    descriptor: overlayDescriptor,
    priority,
    priorityIndex: priorityIndex >= 0 ? priorityIndex : 2,
    enqueuedAt: Date.now(),
    delay: options.delay !== undefined ? options.delay : _config.defaultDelay,
    onShow: options.onShow || null,
    onClose: options.onClose || null,
    timeout: options.timeout || null
  };
  let insertIndex = -1;
  for (let i = 0; i < _queue.length; i++) {
    if (_queue[i].priorityIndex > queueItem.priorityIndex) { insertIndex = i; break; }
  }
  if (insertIndex === -1) { _queue.push(queueItem); } else { _queue.splice(insertIndex, 0, queueItem); }
  _metrics.enqueued++;
  if (_config.autoProcess && !_processing && !_currentOverlay) processNext();
  return { ok: true, id: queueItem.id, position: insertIndex === -1 ? _queue.length : insertIndex + 1, queueSize: _queue.length };
}

export function enqueueCritical(overlayDescriptor: DynObj, options: DynObj) {
  if (!options) options = {};
  return enqueue(overlayDescriptor, Object.assign({}, options, { priority: 'critical', delay: 0 }));
}

export function dequeue(id: DynObj) {
  let index = -1;
  for (let i = 0; i < _queue.length; i++) { if (_queue[i].id === id) { index = i; break; } }
  if (index === -1) return { ok: false, reason: 'not-found' };
  const removed = _queue.splice(index, 1)[0];
  return { ok: true, removed };
}

export function processNext() {
  if (_processing || _queue.length === 0) return Promise.resolve({ ok: false, reason: _processing ? 'already-processing' : 'empty-queue' });
  _processing = true;
  const item = _queue.shift();
  _currentOverlay = item;
  const waitTime = Date.now() - item.enqueuedAt;
  _metrics.avgWaitTime = (_metrics.avgWaitTime * _metrics.processed + waitTime) / (_metrics.processed + 1);
  _metrics.processed++;

  const delayPromise = item.delay > 0 ? new Promise(r => { setTimeout(r, item.delay); }) : Promise.resolve();

  return delayPromise.then(() => {
    if (item.onShow) {
      try { return Promise.resolve(item.onShow(item.descriptor)); } catch (e) { return Promise.resolve(); }
    }
    return Promise.resolve();
  }).then(() => {
    const eb = _getPort('eventBus');
    if (eb && eb.emit) eb.emit(OVERLAY_EVENTS.QUEUE_SHOW, { id: item.id, descriptor: item.descriptor, waitTime });
    if (item.timeout) {
      setTimeout(() => {
        if (_currentOverlay && _currentOverlay.id === item.id) closeCurrentAndProcessNext('timeout');
      }, item.timeout);
    }
    _processing = false;
    return { ok: true, id: item.id, waitTime, remainingInQueue: _queue.length };
  });
}

export function closeCurrentAndProcessNext(reason: DynObj) {
  if (!reason) reason = 'explicit';
  if (!_currentOverlay) return Promise.resolve({ ok: false, reason: 'no-current-overlay' });
  const closed = _currentOverlay;
  let closePromise = Promise.resolve();
  if (closed.onClose) {
    try { closePromise = Promise.resolve(closed.onClose(reason)); } catch (e) {}
  }
  return closePromise.then(() => {
    const eb = _getPort('eventBus');
    if (eb && eb.emit) eb.emit(OVERLAY_EVENTS.QUEUE_CLOSE, { id: closed.id, reason });
    _currentOverlay = null;
    if (_queue.length > 0 && _config.autoProcess) setTimeout(() => { processNext(); }, 100);
    return { ok: true, closedId: closed.id, reason, remainingInQueue: _queue.length };
  });
}

export function clear(reason: DynObj) {
  if (!reason) reason = 'clear-all';
  const count = _queue.length;
  _queue = [];
  _currentOverlay = null;
  _processing = false;
  const eb = _getPort('eventBus');
  if (eb && eb.emit) eb.emit(OVERLAY_EVENTS.QUEUE_CLEARED, { count, reason });
  return { ok: true, cleared: count };
}

export function getState() {
  return {
    queueSize: _queue.length,
    currentOverlay: _currentOverlay ? { id: _currentOverlay.id, priority: _currentOverlay.priority } : null,
    processing: _processing,
    queue: _queue.map(item => ({
      id: item.id,
      priority: item.priority,
      enqueuedAt: item.enqueuedAt,
      waitTime: Date.now() - item.enqueuedAt
    }))
  };
}

export function isQueued(id: DynObj) {
  for (let i = 0; i < _queue.length; i++) { if (_queue[i].id === id) return true; }
  return false;
}

export function isCurrent(id: DynObj) { return _currentOverlay && _currentOverlay.id === id; }

export function prioritize(id: DynObj) {
  let index = -1;
  for (let i = 0; i < _queue.length; i++) { if (_queue[i].id === id) { index = i; break; } }
  if (index === -1) return { ok: false, reason: 'not-found' };
  if (index === 0) return { ok: true, already: true };
  const item = _queue.splice(index, 1)[0];
  item.priority = 'critical';
  item.priorityIndex = 0;
  _queue.unshift(item);
  return { ok: true, newPosition: 1 };
}

export function getConfig() { return Object.assign({}, _config); }

export function setConfig(newConfig: DynObj) {
  if (newConfig.maxQueueSize) _config.maxQueueSize = newConfig.maxQueueSize;
  if (newConfig.defaultDelay !== undefined) _config.defaultDelay = newConfig.defaultDelay;
  if (newConfig.autoProcess !== undefined) _config.autoProcess = newConfig.autoProcess;
  return { ok: true, config: Object.assign({}, _config) };
}

export function getMetrics() { return Object.assign({}, _metrics, { currentQueueSize: _queue.length, hasCurrentOverlay: !!_currentOverlay }); }
export function resetMetrics() { _metrics = { enqueued: 0, processed: 0, dropped: 0, avgWaitTime: 0 }; return { ok: true }; }

export function healthCheck() {
  const eb = _getPort('eventBus');
  const checks = { queueNotOverflowing: _queue.length < _config.maxQueueSize * 0.8, lowDropRate: _metrics.enqueued === 0 || (_metrics.dropped / _metrics.enqueued) < 0.1, processingHealthy: !_processing || _currentOverlay !== null, eventBusAvailable: !!eb, portsInitialized: Ports.isInitialized() };
  const checkKeys = Object.keys(checks);
  let passed = 0;
  for (let i = 0; i < checkKeys.length; i++) { if ((checks as DynObj)[checkKeys[i]]) passed++; }
  const total = checkKeys.length;
  return { status: passed === total ? 'HEALTHY' : 'DEGRADED', score: `${passed}/${total}`, checks, state: getState(), metrics: getMetrics(), portsInitialized: Ports.isInitialized(), version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
}

export function info() { return { moduleId: MODULE_ID, version: VERSION, state: getState(), config: getConfig(), metrics: getMetrics(), portsInitialized: Ports.isInitialized(), timestamp: Date.now() }; }

export default { enqueue, enqueueCritical, dequeue, processNext, closeCurrentAndProcessNext, clear, getState, isQueued, isCurrent, prioritize, getConfig, setConfig, getMetrics, resetMetrics, healthCheck, info, injectPorts, getPorts, VERSION, MODULE_ID };
