import { createLogger } from "./logger.js";
const VERSION = "1.0.0-PHASE7";
const MODULE_ID = "container-main:network-manager";
const NETWORK_STATES = Object.freeze({ ONLINE: "online", OFFLINE: "offline", SLOW: "slow", UNKNOWN: "unknown" });
const CONNECTION_TYPES = Object.freeze({ WIFI: "wifi", CELLULAR: "cellular", ETHERNET: "ethernet", BLUETOOTH: "bluetooth", NONE: "none", UNKNOWN: "unknown" });
function createNetworkManager(options = {}) {
  const { pingUrl = "/api/health", pingInterval = 3e4, slowThresholdMs = 2e3, onStatusChange = null } = options;
  const _logger = createLogger(MODULE_ID);
  const _listeners = /* @__PURE__ */ new Map();
  let _status = navigator.onLine ? NETWORK_STATES.ONLINE : NETWORK_STATES.OFFLINE;
  let _connectionType = CONNECTION_TYPES.UNKNOWN;
  let _effectiveType = "unknown";
  let _downlink = 0;
  let _rtt = 0;
  let _pingTimer = null;
  let _onVisibilityChange = null;
  let _counter = 0;
  let _metrics = { statusChanges: 0, pings: 0, failures: 0 };
  function _updateConnectionInfo() {
    const conn2 = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
    if (conn2) {
      _connectionType = conn2.type || CONNECTION_TYPES.UNKNOWN;
      _effectiveType = conn2.effectiveType || "unknown";
      _downlink = conn2.downlink || 0;
      _rtt = conn2.rtt || 0;
    }
  }
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
  function _handleOnline() {
    if (_status !== NETWORK_STATES.ONLINE) {
      _status = NETWORK_STATES.ONLINE;
      _metrics.statusChanges++;
      _updateConnectionInfo();
      _notifyListeners("online", { status: _status, connectionType: _connectionType });
      onStatusChange?.(_status);
    }
  }
  function _handleOffline() {
    if (_status !== NETWORK_STATES.OFFLINE) {
      _status = NETWORK_STATES.OFFLINE;
      _metrics.statusChanges++;
      _notifyListeners("offline", { status: _status });
      onStatusChange?.(_status);
    }
  }
  async function _ping() {
    if (!navigator.onLine) return false;
    _metrics.pings++;
    const start = performance.now();
    try {
      const response = await fetch(pingUrl, { method: "HEAD", cache: "no-store", signal: AbortSignal.timeout(5e3) });
      const latency = performance.now() - start;
      if (latency > slowThresholdMs && _status !== NETWORK_STATES.SLOW) {
        _status = NETWORK_STATES.SLOW;
        _notifyListeners("slow", { status: _status, latency });
      } else if (latency <= slowThresholdMs && _status === NETWORK_STATES.SLOW) {
        _status = NETWORK_STATES.ONLINE;
        _notifyListeners("online", { status: _status, latency });
      }
      return response.ok;
    } catch (e) {
      _metrics.failures++;
      return false;
    }
  }
  window.addEventListener("online", _handleOnline);
  window.addEventListener("offline", _handleOffline);
  _updateConnectionInfo();
  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (conn) conn.addEventListener("change", _updateConnectionInfo);
  const manager = {
    isOnline() {
      return _status === NETWORK_STATES.ONLINE || _status === NETWORK_STATES.SLOW;
    },
    isOffline() {
      return _status === NETWORK_STATES.OFFLINE;
    },
    isSlow() {
      return _status === NETWORK_STATES.SLOW;
    },
    getStatus() {
      return _status;
    },
    getConnectionInfo() {
      return { status: _status, type: _connectionType, effectiveType: _effectiveType, downlink: _downlink, rtt: _rtt, online: navigator.onLine };
    },
    async ping() {
      return _ping();
    },
    startMonitoring(interval = pingInterval) {
      this.stopMonitoring();
      _pingTimer = setInterval(() => {
        if (typeof document !== "undefined" && document.hidden) return;
        _ping();
      }, interval);
      _onVisibilityChange = () => { if (!document.hidden) _ping(); };
      document.addEventListener("visibilitychange", _onVisibilityChange);
      _ping();
    },
    stopMonitoring() {
      if (_pingTimer) {
        clearInterval(_pingTimer);
        _pingTimer = null;
      }
      if (_onVisibilityChange) {
        document.removeEventListener("visibilitychange", _onVisibilityChange);
        _onVisibilityChange = null;
      }
    },
    onOnline(callback) {
      const id = `on-${++_counter}`;
      _listeners.set(id, { event: "online", callback });
      return id;
    },
    onOffline(callback) {
      const id = `off-${++_counter}`;
      _listeners.set(id, { event: "offline", callback });
      return id;
    },
    onSlow(callback) {
      const id = `slow-${++_counter}`;
      _listeners.set(id, { event: "slow", callback });
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
    async waitForOnline(timeoutMs = 3e4) {
      if (this.isOnline()) return true;
      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          this.off(id);
          resolve(false);
        }, timeoutMs);
        const id = this.onOnline(() => {
          clearTimeout(timeout);
          this.off(id);
          resolve(true);
        });
      });
    },
    async fetchWithRetry(url, options2 = {}, retries = 3, delay = 1e3) {
      for (let i = 0; i < retries; i++) {
        try {
          if (!this.isOnline()) await this.waitForOnline(1e4);
          return await fetch(url, options2);
        } catch (e) {
          if (i === retries - 1) throw e;
          await new Promise((r) => setTimeout(r, delay * (i + 1)));
        }
      }
    },
    getMetrics() {
      return { ..._metrics, status: _status, connectionType: _connectionType, listeners: _listeners.size };
    },
    resetMetrics() {
      _metrics = { statusChanges: 0, pings: 0, failures: 0 };
    },
    healthCheck() {
      return { status: "HEALTHY", version: VERSION, moduleId: MODULE_ID, networkStatus: _status, connectionType: _connectionType, online: navigator.onLine, metrics: _metrics };
    },
    info() {
      return { moduleId: MODULE_ID, version: VERSION, status: _status, connectionInfo: this.getConnectionInfo() };
    },
    destroy() {
      this.stopMonitoring();
      window.removeEventListener("online", _handleOnline);
      window.removeEventListener("offline", _handleOffline);
      const conn2 = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
      if (conn2) conn2.removeEventListener("change", _updateConnectionInfo);
      _listeners.clear();
    }
  };
  return manager;
}
let _instance = null;
function getNetworkManager(options = {}) {
  if (!_instance) _instance = createNetworkManager(options);
  return _instance;
}
function resetNetworkManager() {
  if (_instance) {
    _instance.destroy();
    _instance = null;
  }
}
function isOnline() {
  return getNetworkManager().isOnline();
}
function isOffline() {
  return getNetworkManager().isOffline();
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, states: Object.keys(NETWORK_STATES) };
}
function healthCheck() {
  if (_instance) return _instance.healthCheck();
  return { status: "NOT_INITIALIZED", version: VERSION, moduleId: MODULE_ID };
}
var network_manager_default = { VERSION, MODULE_ID, NETWORK_STATES, CONNECTION_TYPES, createNetworkManager, getNetworkManager, resetNetworkManager, isOnline, isOffline, info, healthCheck };
export {
  CONNECTION_TYPES,
  MODULE_ID,
  NETWORK_STATES,
  VERSION,
  createNetworkManager,
  network_manager_default as default,
  getNetworkManager,
  healthCheck,
  info,
  isOffline,
  isOnline,
  resetNetworkManager
};
