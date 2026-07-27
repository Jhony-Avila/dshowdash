import { createLogger } from "./logger.js";
const VERSION = "1.0.0-PHASE7";
const MODULE_ID = "container-main:geolocation-manager";
const GEO_ERRORS = Object.freeze({ PERMISSION_DENIED: 1, POSITION_UNAVAILABLE: 2, TIMEOUT: 3, UNSUPPORTED: 4 });
function createGeolocationManager(options = {}) {
  const { enableHighAccuracy = true, timeout = 1e4, maximumAge = 6e4, cacheTimeout = 3e5 } = options;
  const _logger = createLogger(MODULE_ID);
  let _lastPosition = null;
  let _lastTimestamp = 0;
  let _watchId = null;
  const _listeners = /* @__PURE__ */ new Map();
  let _counter = 0;
  let _metrics = { requests: 0, successes: 0, errors: 0, watches: 0 };
  function _isSupported() {
    return "geolocation" in navigator;
  }
  function _formatPosition(position) {
    return {
      latitude: position.coords.latitude,
      longitude: position.coords.longitude,
      accuracy: position.coords.accuracy,
      altitude: position.coords.altitude,
      altitudeAccuracy: position.coords.altitudeAccuracy,
      heading: position.coords.heading,
      speed: position.coords.speed,
      timestamp: position.timestamp
    };
  }
  const manager = {
    isSupported() {
      return _isSupported();
    },
    async getCurrentPosition(options2 = {}) {
      if (!_isSupported()) return Promise.reject({ code: GEO_ERRORS.UNSUPPORTED, message: "Geolocation not supported" });
      if (_lastPosition && Date.now() - _lastTimestamp < Number(cacheTimeout)) {
        return _lastPosition;
      }
      _metrics.requests++;
      return new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            _lastPosition = _formatPosition(position);
            _lastTimestamp = Date.now();
            _metrics.successes++;
            resolve(_lastPosition);
          },
          (error) => {
            _metrics.errors++;
            reject({ code: error.code, message: error.message });
          },
          { enableHighAccuracy: options2.enableHighAccuracy ?? enableHighAccuracy, timeout: options2.timeout ?? timeout, maximumAge: options2.maximumAge ?? maximumAge }
        );
      });
    },
    watchPosition(callback, errorCallback = null, options2 = {}) {
      if (!_isSupported()) {
        errorCallback?.({ code: GEO_ERRORS.UNSUPPORTED, message: "Geolocation not supported" });
        return null;
      }
      _metrics.watches++;
      const id = `watch-${++_counter}`;
      const watchId = navigator.geolocation.watchPosition(
        (position) => {
          const formatted = _formatPosition(position);
          _lastPosition = formatted;
          _lastTimestamp = Date.now();
          callback(formatted);
        },
        (error) => {
          _metrics.errors++;
          errorCallback?.({ code: error.code, message: error.message });
        },
        { enableHighAccuracy: options2.enableHighAccuracy ?? enableHighAccuracy, timeout: options2.timeout ?? timeout, maximumAge: options2.maximumAge ?? maximumAge }
      );
      _listeners.set(id, watchId);
      return id;
    },
    clearWatch(id) {
      const watchId = _listeners.get(id);
      if (watchId !== void 0) {
        navigator.geolocation.clearWatch(watchId);
        _listeners.delete(id);
        return true;
      }
      return false;
    },
    clearAllWatches() {
      _listeners.forEach((watchId) => navigator.geolocation.clearWatch(watchId));
      _listeners.clear();
    },
    getLastPosition() {
      return _lastPosition;
    },
    clearCache() {
      _lastPosition = null;
      _lastTimestamp = 0;
    },
    distanceBetween(lat1, lon1, lat2, lon2) {
      const R = 6371;
      const dLat = (lat2 - lat1) * Math.PI / 180;
      const dLon = (lon2 - lon1) * Math.PI / 180;
      const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      return R * c;
    },
    async distanceFromCurrent(lat, lon) {
      const current = await this.getCurrentPosition();
      return this.distanceBetween(current.latitude, current.longitude, lat, lon);
    },
    getMetrics() {
      return { ..._metrics, hasLastPosition: !!_lastPosition, activeWatches: _listeners.size };
    },
    resetMetrics() {
      _metrics = { requests: 0, successes: 0, errors: 0, watches: 0 };
    },
    healthCheck() {
      return { status: "HEALTHY", version: VERSION, moduleId: MODULE_ID, supported: _isSupported(), hasLastPosition: !!_lastPosition, activeWatches: _listeners.size, metrics: _metrics };
    },
    info() {
      return { moduleId: MODULE_ID, version: VERSION, supported: _isSupported(), lastPosition: _lastPosition, activeWatches: _listeners.size };
    },
    destroy() {
      this.clearAllWatches();
      this.clearCache();
    }
  };
  return manager;
}
let _instance = null;
function getGeolocationManager(options = {}) {
  if (!_instance) _instance = createGeolocationManager(options);
  return _instance;
}
function resetGeolocationManager() {
  if (_instance) {
    _instance.destroy();
    _instance = null;
  }
}
async function getCurrentPosition(options) {
  return getGeolocationManager().getCurrentPosition(options);
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, errors: Object.keys(GEO_ERRORS) };
}
function healthCheck() {
  if (_instance) return _instance.healthCheck();
  return { status: "NOT_INITIALIZED", version: VERSION, moduleId: MODULE_ID };
}
var geolocation_manager_default = { VERSION, MODULE_ID, GEO_ERRORS, createGeolocationManager, getGeolocationManager, resetGeolocationManager, getCurrentPosition, info, healthCheck };
export {
  GEO_ERRORS,
  MODULE_ID,
  VERSION,
  createGeolocationManager,
  geolocation_manager_default as default,
  getCurrentPosition,
  getGeolocationManager,
  healthCheck,
  info,
  resetGeolocationManager
};
