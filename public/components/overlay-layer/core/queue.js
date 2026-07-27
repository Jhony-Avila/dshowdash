import { createUiPorts } from "/core/runtime/ports-profiles.js";
import { OVERLAY_EVENTS } from "/core/runtime/events/catalog/overlay.events.js";
const VERSION = "1.3.0-P2-ENTERPRISE";
const MODULE_ID = "overlay-layer-queue";
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
let _queue = [];
let _processing = false;
let _currentOverlay = null;
const _config = { maxQueueSize: 20, defaultDelay: 300, autoProcess: true, priorityLevels: ["critical", "high", "normal", "low"] };
let _metrics = { enqueued: 0, processed: 0, dropped: 0, avgWaitTime: 0 };
function enqueue(overlayDescriptor, options) {
  if (!options) options = {};
  if (_queue.length >= _config.maxQueueSize) {
    _metrics.dropped++;
    return { ok: false, reason: "queue-full", queueSize: _queue.length };
  }
  const priority = options.priority || "normal";
  const priorityIndex = _config.priorityLevels.indexOf(priority);
  const queueItem = {
    id: overlayDescriptor.id || `overlay-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    descriptor: overlayDescriptor,
    priority,
    priorityIndex: priorityIndex >= 0 ? priorityIndex : 2,
    enqueuedAt: Date.now(),
    delay: options.delay !== void 0 ? options.delay : _config.defaultDelay,
    onShow: options.onShow || null,
    onClose: options.onClose || null,
    timeout: options.timeout || null
  };
  let insertIndex = -1;
  for (let i = 0; i < _queue.length; i++) {
    if (_queue[i].priorityIndex > queueItem.priorityIndex) {
      insertIndex = i;
      break;
    }
  }
  if (insertIndex === -1) {
    _queue.push(queueItem);
  } else {
    _queue.splice(insertIndex, 0, queueItem);
  }
  _metrics.enqueued++;
  if (_config.autoProcess && !_processing && !_currentOverlay) processNext();
  return { ok: true, id: queueItem.id, position: insertIndex === -1 ? _queue.length : insertIndex + 1, queueSize: _queue.length };
}
function enqueueCritical(overlayDescriptor, options) {
  if (!options) options = {};
  return enqueue(overlayDescriptor, Object.assign({}, options, { priority: "critical", delay: 0 }));
}
function dequeue(id) {
  let index = -1;
  for (let i = 0; i < _queue.length; i++) {
    if (_queue[i].id === id) {
      index = i;
      break;
    }
  }
  if (index === -1) return { ok: false, reason: "not-found" };
  const removed = _queue.splice(index, 1)[0];
  return { ok: true, removed };
}
function processNext() {
  if (_processing || _queue.length === 0) return Promise.resolve({ ok: false, reason: _processing ? "already-processing" : "empty-queue" });
  _processing = true;
  const item = _queue.shift();
  _currentOverlay = item;
  const waitTime = Date.now() - item.enqueuedAt;
  _metrics.avgWaitTime = (_metrics.avgWaitTime * _metrics.processed + waitTime) / (_metrics.processed + 1);
  _metrics.processed++;
  const delayPromise = item.delay > 0 ? new Promise((r) => {
    setTimeout(r, item.delay);
  }) : Promise.resolve();
  return delayPromise.then(() => {
    if (item.onShow) {
      try {
        return Promise.resolve(item.onShow(item.descriptor));
      } catch (e) {
        return Promise.resolve();
      }
    }
    return Promise.resolve();
  }).then(() => {
    const eb = _getPort("eventBus");
    if (eb && eb.emit) eb.emit(OVERLAY_EVENTS.QUEUE_SHOW, { id: item.id, descriptor: item.descriptor, waitTime });
    if (item.timeout) {
      setTimeout(() => {
        if (_currentOverlay && _currentOverlay.id === item.id) closeCurrentAndProcessNext("timeout");
      }, item.timeout);
    }
    _processing = false;
    return { ok: true, id: item.id, waitTime, remainingInQueue: _queue.length };
  });
}
function closeCurrentAndProcessNext(reason) {
  if (!reason) reason = "explicit";
  if (!_currentOverlay) return Promise.resolve({ ok: false, reason: "no-current-overlay" });
  const closed = _currentOverlay;
  let closePromise = Promise.resolve();
  if (closed.onClose) {
    try {
      closePromise = Promise.resolve(closed.onClose(reason));
    } catch (e) {
    }
  }
  return closePromise.then(() => {
    const eb = _getPort("eventBus");
    if (eb && eb.emit) eb.emit(OVERLAY_EVENTS.QUEUE_CLOSE, { id: closed.id, reason });
    _currentOverlay = null;
    if (_queue.length > 0 && _config.autoProcess) setTimeout(() => {
      processNext();
    }, 100);
    return { ok: true, closedId: closed.id, reason, remainingInQueue: _queue.length };
  });
}
function clear(reason) {
  if (!reason) reason = "clear-all";
  const count = _queue.length;
  _queue = [];
  _currentOverlay = null;
  _processing = false;
  const eb = _getPort("eventBus");
  if (eb && eb.emit) eb.emit(OVERLAY_EVENTS.QUEUE_CLEARED, { count, reason });
  return { ok: true, cleared: count };
}
function getState() {
  return {
    queueSize: _queue.length,
    currentOverlay: _currentOverlay ? { id: _currentOverlay.id, priority: _currentOverlay.priority } : null,
    processing: _processing,
    queue: _queue.map((item) => ({
      id: item.id,
      priority: item.priority,
      enqueuedAt: item.enqueuedAt,
      waitTime: Date.now() - item.enqueuedAt
    }))
  };
}
function isQueued(id) {
  for (let i = 0; i < _queue.length; i++) {
    if (_queue[i].id === id) return true;
  }
  return false;
}
function isCurrent(id) {
  return _currentOverlay && _currentOverlay.id === id;
}
function prioritize(id) {
  let index = -1;
  for (let i = 0; i < _queue.length; i++) {
    if (_queue[i].id === id) {
      index = i;
      break;
    }
  }
  if (index === -1) return { ok: false, reason: "not-found" };
  if (index === 0) return { ok: true, already: true };
  const item = _queue.splice(index, 1)[0];
  item.priority = "critical";
  item.priorityIndex = 0;
  _queue.unshift(item);
  return { ok: true, newPosition: 1 };
}
function getConfig() {
  return Object.assign({}, _config);
}
function setConfig(newConfig) {
  if (newConfig.maxQueueSize) _config.maxQueueSize = newConfig.maxQueueSize;
  if (newConfig.defaultDelay !== void 0) _config.defaultDelay = newConfig.defaultDelay;
  if (newConfig.autoProcess !== void 0) _config.autoProcess = newConfig.autoProcess;
  return { ok: true, config: Object.assign({}, _config) };
}
function getMetrics() {
  return Object.assign({}, _metrics, { currentQueueSize: _queue.length, hasCurrentOverlay: !!_currentOverlay });
}
function resetMetrics() {
  _metrics = { enqueued: 0, processed: 0, dropped: 0, avgWaitTime: 0 };
  return { ok: true };
}
function healthCheck() {
  const eb = _getPort("eventBus");
  const checks = { queueNotOverflowing: _queue.length < _config.maxQueueSize * 0.8, lowDropRate: _metrics.enqueued === 0 || _metrics.dropped / _metrics.enqueued < 0.1, processingHealthy: !_processing || _currentOverlay !== null, eventBusAvailable: !!eb, portsInitialized: Ports.isInitialized() };
  const checkKeys = Object.keys(checks);
  let passed = 0;
  for (let i = 0; i < checkKeys.length; i++) {
    if (checks[checkKeys[i]]) passed++;
  }
  const total = checkKeys.length;
  return { status: passed === total ? "HEALTHY" : "DEGRADED", score: `${passed}/${total}`, checks, state: getState(), metrics: getMetrics(), portsInitialized: Ports.isInitialized(), version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, state: getState(), config: getConfig(), metrics: getMetrics(), portsInitialized: Ports.isInitialized(), timestamp: Date.now() };
}
var queue_default = { enqueue, enqueueCritical, dequeue, processNext, closeCurrentAndProcessNext, clear, getState, isQueued, isCurrent, prioritize, getConfig, setConfig, getMetrics, resetMetrics, healthCheck, info, injectPorts, getPorts, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  clear,
  closeCurrentAndProcessNext,
  queue_default as default,
  dequeue,
  enqueue,
  enqueueCritical,
  getConfig,
  getMetrics,
  getPorts,
  getState,
  healthCheck,
  info,
  injectPorts,
  isCurrent,
  isQueued,
  prioritize,
  processNext,
  resetMetrics,
  setConfig
};
