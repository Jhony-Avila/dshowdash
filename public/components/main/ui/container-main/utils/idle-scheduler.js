const VERSION = "1.0.0-ENTERPRISE";
const MODULE_ID = "container-idle-scheduler";
const _requestIdleCallback = typeof requestIdleCallback !== "undefined" ? requestIdleCallback : (cb) => setTimeout(() => cb({ didTimeout: false, timeRemaining: () => 50 }), 1);
const _cancelIdleCallback = typeof cancelIdleCallback !== "undefined" ? cancelIdleCallback : clearTimeout;
const _queue = [];
const _pendingIds = /* @__PURE__ */ new Map();
let _isProcessing = false;
let _nextId = 0;
function schedule(task, options = {}) {
  const { priority = "normal", timeout = 0, onComplete, onError } = options;
  const id = ++_nextId;
  const entry = { id, task, priority, timeout, onComplete, onError, status: "pending" };
  if (priority === "high") {
    const insertIndex = _queue.findIndex((e) => e.priority !== "high");
    if (insertIndex === -1) _queue.push(entry);
    else _queue.splice(insertIndex, 0, entry);
  } else if (priority === "low") {
    _queue.push(entry);
  } else {
    const insertIndex = _queue.findIndex((e) => e.priority === "low");
    if (insertIndex === -1) _queue.push(entry);
    else _queue.splice(insertIndex, 0, entry);
  }
  _pendingIds.set(id, entry);
  _processQueue();
  return id;
}
function _processQueue() {
  if (_isProcessing || _queue.length === 0) return;
  _isProcessing = true;
  const idleId = _requestIdleCallback((deadline) => {
    while (_queue.length > 0 && (deadline.timeRemaining() > 0 || deadline.didTimeout)) {
      const entry = _queue.shift();
      if (!entry || entry.status === "cancelled") continue;
      entry.status = "running";
      try {
        const result = entry.task();
        entry.status = "completed";
        entry.onComplete?.(result);
      } catch (error) {
        entry.status = "error";
        entry.onError?.(error);
      }
      _pendingIds.delete(entry.id);
    }
    _isProcessing = false;
    if (_queue.length > 0) _processQueue();
  }, { timeout: _queue[0]?.timeout || 0 });
  return idleId;
}
function cancel(id) {
  const entry = _pendingIds.get(id);
  if (entry && entry.status === "pending") {
    entry.status = "cancelled";
    _pendingIds.delete(id);
    const index = _queue.findIndex((e) => e.id === id);
    if (index !== -1) _queue.splice(index, 1);
    return true;
  }
  return false;
}
function cancelAll() {
  const count = _queue.length;
  _queue.forEach((entry) => {
    entry.status = "cancelled";
  });
  _queue.length = 0;
  _pendingIds.clear();
  return count;
}
function getStatus(id) {
  const entry = _pendingIds.get(id);
  return entry?.status || "unknown";
}
function getQueueLength() {
  return _queue.length;
}
function runWhenIdle(task, fallbackMs = 100) {
  return new Promise((resolve, reject) => {
    const id = schedule(task, {
      timeout: fallbackMs,
      onComplete: resolve,
      onError: reject
    });
  });
}
function batchSchedule(tasks, options = {}) {
  const { priority = "normal", timeout = 0 } = options;
  const ids = [];
  const results = [];
  return new Promise((resolve, reject) => {
    let completed = 0;
    let hasError = false;
    tasks.forEach((task, index) => {
      const id = schedule(task, {
        priority,
        timeout,
        onComplete: (result) => {
          results[index] = { status: "fulfilled", value: result };
          completed++;
          if (completed === tasks.length) resolve(results);
        },
        onError: (error) => {
          results[index] = { status: "rejected", reason: error };
          completed++;
          if (completed === tasks.length) resolve(results);
        }
      });
      ids.push(id);
    });
  });
}
function defer(fn) {
  return schedule(fn, { priority: "low" });
}
function urgent(fn, timeoutMs = 100) {
  return schedule(fn, { priority: "high", timeout: timeoutMs });
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, queueLength: _queue.length, isProcessing: _isProcessing, hasNativeSupport: typeof requestIdleCallback !== "undefined" };
}
function healthCheck() {
  return { status: "HEALTHY", version: VERSION, moduleId: MODULE_ID, queueLength: _queue.length, isProcessing: _isProcessing, hasNativeSupport: typeof requestIdleCallback !== "undefined" };
}
var idle_scheduler_default = {
  schedule,
  cancel,
  cancelAll,
  getStatus,
  getQueueLength,
  runWhenIdle,
  batchSchedule,
  defer,
  urgent,
  info,
  healthCheck,
  VERSION,
  MODULE_ID
};
export {
  MODULE_ID,
  VERSION,
  batchSchedule,
  cancel,
  cancelAll,
  idle_scheduler_default as default,
  defer,
  getQueueLength,
  getStatus,
  healthCheck,
  info,
  runWhenIdle,
  schedule,
  urgent
};
