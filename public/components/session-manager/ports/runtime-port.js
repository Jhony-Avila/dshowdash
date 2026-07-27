const VERSION = "5.0.0-BULLETPROOF";
const MODULE_ID = "session-runtime-port";
const _metrics = { eventListeners: 0, eventRemovals: 0, timersCreated: 0, timersCleared: 0, errors: 0 };
const _activeListeners = /* @__PURE__ */ new Map();
const _activeTimers = /* @__PURE__ */ new Set();
function _isWindowAvailable() {
  return typeof window !== "undefined";
}
function _isDocumentAvailable() {
  return typeof document !== "undefined";
}
const _browserAdapter = {
  addEventListener(target, event, handler, options = {}) {
    _metrics.eventListeners++;
    try {
      const el = target === "document" ? document : target === "window" ? window : target;
      if (!el?.addEventListener) return null;
      el.addEventListener(event, handler, options);
      const id = `${target}-${event}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
      _activeListeners.set(id, { target: el, event, handler, options });
      return id;
    } catch (e) {
      _metrics.errors++;
      return null;
    }
  },
  removeEventListener(listenerId) {
    _metrics.eventRemovals++;
    try {
      const listener = _activeListeners.get(listenerId);
      if (!listener) return false;
      listener.target.removeEventListener(listener.event, listener.handler);
      _activeListeners.delete(listenerId);
      return true;
    } catch (e) {
      _metrics.errors++;
      return false;
    }
  },
  setInterval(callback, ms) {
    _metrics.timersCreated++;
    try {
      const id = globalThis.setInterval(callback, ms);
      _activeTimers.add(id);
      return id;
    } catch (e) {
      _metrics.errors++;
      return null;
    }
  },
  clearInterval(id) {
    _metrics.timersCleared++;
    try {
      globalThis.clearInterval(id);
      _activeTimers.delete(id);
      return true;
    } catch (e) {
      _metrics.errors++;
      return false;
    }
  },
  setTimeout(callback, ms) {
    _metrics.timersCreated++;
    try {
      let timerId;
      timerId = globalThis.setTimeout(() => {
        _activeTimers.delete(timerId);
        callback();
      }, ms);
      _activeTimers.add(timerId);
      return timerId;
    } catch (e) {
      _metrics.errors++;
      return null;
    }
  },
  clearTimeout(id) {
    _metrics.timersCleared++;
    try {
      globalThis.clearTimeout(id);
      _activeTimers.delete(id);
      return true;
    } catch (e) {
      _metrics.errors++;
      return false;
    }
  },
  getWindow() {
    return window;
  },
  getDocument() {
    return document;
  },
  isOnline() {
    return navigator?.onLine ?? true;
  },
  getLocation() {
    return window?.location ?? null;
  },
  getUserAgent() {
    return navigator?.userAgent ?? null;
  }
};
const _memoryListeners = /* @__PURE__ */ new Map();
let _memoryTimerCounter = 0;
const _memoryTimerCallbacks = /* @__PURE__ */ new Map();
const _memoryAdapter = {
  addEventListener(target, event, handler, options = {}) {
    _metrics.eventListeners++;
    const id = `mem-${target}-${event}-${++_memoryTimerCounter}`;
    _memoryListeners.set(id, { target, event, handler, options });
    return id;
  },
  removeEventListener(listenerId) {
    _metrics.eventRemovals++;
    return _memoryListeners.delete(listenerId);
  },
  setInterval(callback, ms) {
    _metrics.timersCreated++;
    const id = ++_memoryTimerCounter;
    _memoryTimerCallbacks.set(id, { callback, ms, type: "interval" });
    return id;
  },
  clearInterval(id) {
    _metrics.timersCleared++;
    return _memoryTimerCallbacks.delete(id);
  },
  setTimeout(callback, ms) {
    _metrics.timersCreated++;
    const id = ++_memoryTimerCounter;
    _memoryTimerCallbacks.set(id, { callback, ms, type: "timeout" });
    return id;
  },
  clearTimeout(id) {
    _metrics.timersCleared++;
    return _memoryTimerCallbacks.delete(id);
  },
  getWindow() {
    return null;
  },
  getDocument() {
    return null;
  },
  isOnline() {
    return true;
  },
  getLocation() {
    return { href: "http://localhost", pathname: "/", hostname: "localhost" };
  },
  getUserAgent() {
    return "SSR/Test";
  },
  triggerEvent(target, event, data = {}) {
    _memoryListeners.forEach((listener) => {
      if (listener.target === target && listener.event === event) {
        try {
          listener.handler(data);
        } catch {
        }
      }
    });
  },
  triggerTimer(id) {
    const timer = _memoryTimerCallbacks.get(id);
    if (timer) {
      try {
        timer.callback();
      } catch {
      }
      if (timer.type === "timeout") _memoryTimerCallbacks.delete(id);
    }
  }
};
let _activeAdapter = _isWindowAvailable() ? _browserAdapter : _memoryAdapter;
let _adapterType = _isWindowAvailable() ? "browser" : "memory";
function addEventListener(target, event, handler, options = {}) {
  return _activeAdapter.addEventListener(target, event, handler, options);
}
function removeEventListener(listenerId) {
  return _activeAdapter.removeEventListener(listenerId);
}
function setInterval(callback, ms) {
  return _activeAdapter.setInterval(callback, ms);
}
function clearInterval(id) {
  return _activeAdapter.clearInterval(id);
}
function setTimeout(callback, ms) {
  return _activeAdapter.setTimeout(callback, ms);
}
function clearTimeout(id) {
  return _activeAdapter.clearTimeout(id);
}
function getWindow() {
  return _activeAdapter.getWindow();
}
function getDocument() {
  return _activeAdapter.getDocument();
}
function isOnline() {
  return _activeAdapter.isOnline();
}
function getLocation() {
  return _activeAdapter.getLocation();
}
function getUserAgent() {
  return _activeAdapter.getUserAgent();
}
function cleanup() {
  _activeListeners.forEach((_, id) => removeEventListener(id));
  _activeTimers.forEach((id) => {
    clearInterval(id);
    clearTimeout(id);
  });
  _activeListeners.clear();
  _activeTimers.clear();
}
function useMemoryAdapter() {
  cleanup();
  _activeAdapter = _memoryAdapter;
  _adapterType = "memory";
}
function useBrowserAdapter() {
  if (_isWindowAvailable()) {
    _activeAdapter = _browserAdapter;
    _adapterType = "browser";
    return true;
  }
  return false;
}
function getAdapterType() {
  return _adapterType;
}
function getVersion() {
  return VERSION;
}
function getMetrics() {
  return { ..._metrics, adapterType: _adapterType, activeListeners: _activeListeners.size, activeTimers: _activeTimers.size };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, adapterType: _adapterType, windowAvailable: _isWindowAvailable(), documentAvailable: _isDocumentAvailable(), activeListeners: _activeListeners.size, activeTimers: _activeTimers.size, isOnline: isOnline(), metrics: getMetrics(), timestamp: Date.now() };
}
function healthCheck() {
  const checks = { adapterActive: !!_activeAdapter, noLeakedListeners: _activeListeners.size < 100, noLeakedTimers: _activeTimers.size < 50, lowErrorRate: _metrics.eventListeners + _metrics.timersCreated === 0 || _metrics.errors / (_metrics.eventListeners + _metrics.timersCreated) < 0.1 };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed === total ? "HEALTHY" : "DEGRADED", score: `${passed}/${total}`, checks, adapterType: _adapterType, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
}
const RuntimePort = { addEventListener, removeEventListener, setInterval, clearInterval, setTimeout, clearTimeout, getWindow, getDocument, isOnline, getLocation, getUserAgent, cleanup, useMemoryAdapter, useBrowserAdapter, getAdapterType, getVersion, getMetrics, info, healthCheck };
var runtime_port_default = RuntimePort;
export {
  MODULE_ID,
  RuntimePort,
  VERSION,
  addEventListener,
  cleanup,
  clearInterval,
  clearTimeout,
  runtime_port_default as default,
  getAdapterType,
  getDocument,
  getLocation,
  getMetrics,
  getUserAgent,
  getVersion,
  getWindow,
  healthCheck,
  info,
  isOnline,
  removeEventListener,
  setInterval,
  setTimeout,
  useBrowserAdapter,
  useMemoryAdapter
};
