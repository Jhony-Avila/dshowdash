import { createLogger } from "./logger.js";
const VERSION = "1.0.0-PHASE7";
const MODULE_ID = "container-main:wake-lock-manager";
function createWakeLockManager(options = {}) {
  const { autoReacquire = true, onAcquire = null, onRelease = null, onError = null } = options;
  const _logger = createLogger(MODULE_ID);
  let _wakeLock = null;
  let _isActive = false;
  const _listeners = /* @__PURE__ */ new Map();
  let _counter = 0;
  let _metrics = { acquires: 0, releases: 0, reacquires: 0, errors: 0 };
  function _notifyListeners(event, data) {
    _listeners.forEach((config) => {
      if (config.event === event || config.event === "all") {
        try {
          config.callback(data);
        } catch (e) {
          _logger.error("Listener error:", e);
        }
      }
    });
  }
  async function _handleVisibilityChange() {
    if (autoReacquire && document.visibilityState === "visible" && _isActive && !_wakeLock) {
      try {
        await manager.acquire();
        _metrics.reacquires++;
      } catch (e) {
        _logger.warn("Failed to reacquire wake lock:", e);
      }
    }
  }
  document.addEventListener("visibilitychange", _handleVisibilityChange);
  const manager = {
    isSupported() {
      return "wakeLock" in navigator;
    },
    isActive() {
      return _isActive && _wakeLock !== null;
    },
    async acquire() {
      if (!this.isSupported()) {
        const error = new Error("Wake Lock API not supported");
        onError?.(error);
        throw error;
      }
      try {
        _wakeLock = await navigator.wakeLock.request("screen");
        _isActive = true;
        _metrics.acquires++;
        _wakeLock.addEventListener("release", () => {
          _wakeLock = null;
          if (_isActive) {
            _metrics.releases++;
            _notifyListeners("release", { reason: "system" });
            onRelease?.({ reason: "system" });
          }
        });
        _notifyListeners("acquire", {});
        onAcquire?.({});
        return true;
      } catch (e) {
        _metrics.errors++;
        _notifyListeners("error", { error: e });
        onError?.(e);
        throw e;
      }
    },
    async release() {
      if (_wakeLock) {
        _isActive = false;
        await _wakeLock.release();
        _wakeLock = null;
        _metrics.releases++;
        _notifyListeners("release", { reason: "manual" });
        onRelease?.({ reason: "manual" });
        return true;
      }
      return false;
    },
    async toggle() {
      if (this.isActive()) {
        await this.release();
        return false;
      } else {
        await this.acquire();
        return true;
      }
    },
    onAcquire(callback) {
      const id = `acq-${++_counter}`;
      _listeners.set(id, { event: "acquire", callback });
      return id;
    },
    onRelease(callback) {
      const id = `rel-${++_counter}`;
      _listeners.set(id, { event: "release", callback });
      return id;
    },
    onError(callback) {
      const id = `err-${++_counter}`;
      _listeners.set(id, { event: "error", callback });
      return id;
    },
    onChange(callback) {
      const id = `all-${++_counter}`;
      _listeners.set(id, { event: "all", callback });
      return id;
    },
    off(id) {
      return _listeners.delete(id);
    },
    getMetrics() {
      return { ..._metrics, supported: this.isSupported(), active: this.isActive(), listeners: _listeners.size };
    },
    resetMetrics() {
      _metrics = { acquires: 0, releases: 0, reacquires: 0, errors: 0 };
    },
    healthCheck() {
      return { status: "HEALTHY", version: VERSION, moduleId: MODULE_ID, supported: this.isSupported(), active: this.isActive(), metrics: _metrics };
    },
    info() {
      return { moduleId: MODULE_ID, version: VERSION, supported: this.isSupported(), active: this.isActive() };
    },
    async destroy() {
      document.removeEventListener("visibilitychange", _handleVisibilityChange);
      if (_wakeLock) {
        _isActive = false;
        await _wakeLock.release();
        _wakeLock = null;
      }
      _listeners.clear();
    }
  };
  return manager;
}
let _instance = null;
function getWakeLockManager(options = {}) {
  if (!_instance) _instance = createWakeLockManager(options);
  return _instance;
}
function resetWakeLockManager() {
  if (_instance) {
    _instance.destroy();
    _instance = null;
  }
}
async function acquireWakeLock() {
  return getWakeLockManager().acquire();
}
async function releaseWakeLock() {
  return getWakeLockManager().release();
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  if (_instance) return _instance.healthCheck();
  return { status: "NOT_INITIALIZED", version: VERSION, moduleId: MODULE_ID };
}
var wake_lock_manager_default = { VERSION, MODULE_ID, createWakeLockManager, getWakeLockManager, resetWakeLockManager, acquireWakeLock, releaseWakeLock, info, healthCheck };
export {
  MODULE_ID,
  VERSION,
  acquireWakeLock,
  createWakeLockManager,
  wake_lock_manager_default as default,
  getWakeLockManager,
  healthCheck,
  info,
  releaseWakeLock,
  resetWakeLockManager
};
