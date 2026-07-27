import { createPanelPorts } from "/core/runtime/ports-profiles.js";
import { isEnabled } from "../config/feature-flags.js";
const VERSION = "10.4.0-MIGRATION-PHASE8";
const MODULE_ID = "panel-nav-admin.performance.worker";
const Ports = createPanelPorts({ moduleId: MODULE_ID });
function injectPorts(p) {
  return Ports.inject(p);
}
const _log = (level, ...args) => {
  const logger = Ports.get("logger");
  if (!logger) return;
  const prefix = "[WorkerManager]";
  if (level === "error") logger.error?.(prefix, ...args);
  else if (level === "debug") logger.debug?.(prefix, ...args);
  else logger.info?.(prefix, ...args);
};
const WORKER_SCRIPT = `
'use strict';

// \u2500\u2500\u2500 Worker operations \u2500\u2500\u2500
const ops = {
  /**
   * Fuzzy search \u2014 O(n*m) string matching
   */
  fuzzySearch(data) {
    const { items, query, fields } = data;
    if (!query || !items) return { results: items || [] };
    const lower = query.toLowerCase();
    const scored = [];
    for (const item of items) {
      let bestScore = 0;
      for (const field of (fields || ['label'])) {
        const val = (item[field] || '').toLowerCase();
        const score = _fuzzyScore(val, lower);
        if (score > bestScore) bestScore = score;
      }
      if (bestScore > 0) scored.push({ item, score: bestScore });
    }
    scored.sort((a, b) => b.score - a.score);
    return { results: scored.map(s => s.item) };
  },

  /**
   * Delta diff \u2014 compute changes between two arrays
   */
  deltaDiff(data) {
    const { current, previous, idField } = data;
    const id = idField || 'id';
    const prevMap = new Map();
    for (const item of (previous || [])) prevMap.set(item[id], item);
    const currMap = new Map();
    for (const item of (current || [])) currMap.set(item[id], item);
    const added = [];
    const updated = [];
    const removed = [];
    for (const [key, item] of currMap) {
      if (!prevMap.has(key)) added.push(item);
      else if (JSON.stringify(item) !== JSON.stringify(prevMap.get(key))) updated.push(item);
    }
    for (const [key, item] of prevMap) {
      if (!currMap.has(key)) removed.push(item);
    }
    return { added, updated, removed };
  },

  /**
   * Bulk transform \u2014 apply transformations to items
   */
  bulkTransform(data) {
    const { items, transforms } = data;
    const results = items.map(item => {
      const copy = { ...item };
      for (const [key, value] of Object.entries(transforms || {})) {
        copy[key] = value;
      }
      return copy;
    });
    return { results };
  },

  /**
   * Sort \u2014 sort items by field
   */
  sort(data) {
    const { items, field, direction } = data;
    const dir = direction === 'desc' ? -1 : 1;
    const sorted = [...items].sort((a, b) => {
      const va = a[field] ?? '';
      const vb = b[field] ?? '';
      if (typeof va === 'number' && typeof vb === 'number') return (va - vb) * dir;
      return String(va).localeCompare(String(vb)) * dir;
    });
    return { results: sorted };
  },

  /**
   * Filter \u2014 apply multiple filters
   */
  filter(data) {
    const { items, filters } = data;
    let result = items;
    for (const [field, value] of Object.entries(filters || {})) {
      if (value === '' || value == null || value === 'all') continue;
      result = result.filter(item => String(item[field] || '').toLowerCase().includes(String(value).toLowerCase()));
    }
    return { results: result };
  }
};

function _fuzzyScore(str, query) {
  if (str.includes(query)) return 100;
  let score = 0;
  let qi = 0;
  for (let si = 0; si < str.length && qi < query.length; si++) {
    if (str[si] === query[qi]) { score += 10; qi++; }
  }
  return qi === query.length ? score : 0;
}

self.onmessage = function(e) {
  const { id, operation, data } = e.data;
  try {
    const handler = ops[operation];
    if (!handler) {
      self.postMessage({ id, error: 'Unknown operation: ' + operation });
      return;
    }
    const result = handler(data);
    self.postMessage({ id, result });
  } catch (err) {
    self.postMessage({ id, error: err.message });
  }
};
`;
function WorkerManager(options = {}) {
  const { timeoutMs = 1e4 } = options;
  let _worker = null;
  let _idCounter = 0;
  const _pending = /* @__PURE__ */ new Map();
  function init() {
    if (!isEnabled("webWorker")) return false;
    try {
      if (typeof Worker === "undefined") {
        _log("debug", "Web Workers not available");
        return false;
      }
      const blob = new Blob([WORKER_SCRIPT], { type: "application/javascript" });
      const url = URL.createObjectURL(blob);
      _worker = new Worker(url);
      URL.revokeObjectURL(url);
      _worker.onmessage = (e) => {
        const { id, result, error } = e.data;
        const handler = _pending.get(id);
        if (!handler) return;
        _pending.delete(id);
        clearTimeout(handler.timer);
        if (error) handler.reject(new Error(error));
        else handler.resolve(result);
      };
      _worker.onerror = (e) => {
        _log("error", "Worker error:", e.message);
      };
      _log("info", "Worker initialized");
      return true;
    } catch (err) {
      _log("error", "Worker init failed:", err);
      return false;
    }
  }
  function execute(operation, data) {
    if (!_worker) {
      return Promise.reject(new Error("Worker not initialized"));
    }
    return new Promise((resolve, reject) => {
      const id = ++_idCounter;
      const timer = setTimeout(() => {
        _pending.delete(id);
        reject(new Error(`Worker operation "${operation}" timed out after ${timeoutMs}ms`));
      }, Number(timeoutMs));
      _pending.set(id, { resolve, reject, timer });
      _worker.postMessage({ id, operation, data });
    });
  }
  function isAvailable() {
    return _worker !== null;
  }
  function getStats() {
    return {
      available: isAvailable(),
      pendingOperations: _pending.size,
      totalOperations: _idCounter
    };
  }
  function destroy() {
    if (_worker) {
      _worker.terminate();
      _worker = null;
    }
    for (const handler of _pending.values()) {
      clearTimeout(handler.timer);
      handler.reject(new Error("Worker destroyed"));
    }
    _pending.clear();
  }
  return { init, execute, isAvailable, getStats, destroy };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, workerSupport: typeof Worker !== "undefined" };
}
function healthCheck() {
  return {
    status: typeof Worker !== "undefined" ? "HEALTHY" : "DEGRADED",
    moduleId: MODULE_ID,
    version: VERSION,
    workerSupport: typeof Worker !== "undefined"
  };
}
var worker_default = { WorkerManager, injectPorts, info, healthCheck, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  WorkerManager,
  worker_default as default,
  healthCheck,
  info,
  injectPorts
};
