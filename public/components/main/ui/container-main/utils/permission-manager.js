import { createLogger } from "./logger.js";
const VERSION = "1.0.0-PHASE7";
const MODULE_ID = "container-main:permission-manager";
const PERMISSIONS = Object.freeze({
  NOTIFICATIONS: "notifications",
  GEOLOCATION: "geolocation",
  CAMERA: "camera",
  MICROPHONE: "microphone",
  CLIPBOARD_READ: "clipboard-read",
  CLIPBOARD_WRITE: "clipboard-write",
  PERSISTENT_STORAGE: "persistent-storage",
  MIDI: "midi",
  SCREEN_WAKE_LOCK: "screen-wake-lock"
});
const PERMISSION_STATES = Object.freeze({ GRANTED: "granted", DENIED: "denied", PROMPT: "prompt", UNSUPPORTED: "unsupported" });
function createPermissionManager(options = {}) {
  const { onPermissionChange = null } = options;
  const _logger = createLogger(MODULE_ID);
  const _cache = /* @__PURE__ */ new Map();
  const _listeners = /* @__PURE__ */ new Map();
  let _metrics = { queries: 0, requests: 0, granted: 0, denied: 0 };
  async function _queryPermission(name) {
    if (!navigator.permissions) return PERMISSION_STATES.UNSUPPORTED;
    try {
      const result = await navigator.permissions.query({ name });
      return result.state;
    } catch (e) {
      return PERMISSION_STATES.UNSUPPORTED;
    }
  }
  const manager = {
    async query(permission) {
      _metrics.queries++;
      if (_cache.has(permission)) return _cache.get(permission);
      const state = await _queryPermission(permission);
      _cache.set(permission, state);
      return state;
    },
    async queryAll() {
      const results = {};
      for (const perm of Object.values(PERMISSIONS)) {
        results[perm] = await this.query(perm);
      }
      return results;
    },
    async request(permission) {
      _metrics.requests++;
      let state = PERMISSION_STATES.UNSUPPORTED;
      try {
        switch (permission) {
          case PERMISSIONS.NOTIFICATIONS:
            if (!("Notification" in window)) break;
            const notifResult = await Notification.requestPermission();
            state = notifResult;
            break;
          case PERMISSIONS.GEOLOCATION:
            if (!navigator.geolocation) break;
            await new Promise((resolve, reject) => {
              navigator.geolocation.getCurrentPosition(() => {
                state = PERMISSION_STATES.GRANTED;
                resolve(void 0);
              }, (err) => {
                state = err.code === 1 ? PERMISSION_STATES.DENIED : PERMISSION_STATES.PROMPT;
                resolve(void 0);
              }, { timeout: 5e3 });
            });
            break;
          case PERMISSIONS.CAMERA:
          case PERMISSIONS.MICROPHONE:
            if (!navigator.mediaDevices) break;
            const constraints = permission === PERMISSIONS.CAMERA ? { video: true } : { audio: true };
            try {
              const stream = await navigator.mediaDevices.getUserMedia(constraints);
              stream.getTracks().forEach((t) => t.stop());
              state = PERMISSION_STATES.GRANTED;
            } catch (e) {
              state = e.name === "NotAllowedError" ? PERMISSION_STATES.DENIED : PERMISSION_STATES.PROMPT;
            }
            break;
          case PERMISSIONS.CLIPBOARD_READ:
            if (!navigator.clipboard?.readText) break;
            try {
              await navigator.clipboard.readText();
              state = PERMISSION_STATES.GRANTED;
            } catch {
              state = PERMISSION_STATES.DENIED;
            }
            break;
          case PERMISSIONS.PERSISTENT_STORAGE:
            if (!navigator.storage?.persist) break;
            const persisted = await navigator.storage.persist();
            state = persisted ? PERMISSION_STATES.GRANTED : PERMISSION_STATES.DENIED;
            break;
          default:
            state = await this.query(permission);
        }
      } catch (e) {
        _logger.warn(`Permission request failed for ${permission}:`, e);
      }
      _cache.set(permission, state);
      if (state === PERMISSION_STATES.GRANTED) _metrics.granted++;
      else if (state === PERMISSION_STATES.DENIED) _metrics.denied++;
      return state;
    },
    async isGranted(permission) {
      return await this.query(permission) === PERMISSION_STATES.GRANTED;
    },
    async isDenied(permission) {
      return await this.query(permission) === PERMISSION_STATES.DENIED;
    },
    async canRequest(permission) {
      return await this.query(permission) === PERMISSION_STATES.PROMPT;
    },
    watch(permission, callback) {
      if (!navigator.permissions) return null;
      const id = `watch-${Date.now()}`;
      navigator.permissions.query({ name: permission }).then((status) => {
        const handler = () => {
          _cache.set(permission, status.state);
          callback(status.state, permission);
          onPermissionChange?.(permission, status.state);
        };
        status.addEventListener("change", handler);
        _listeners.set(id, { status, handler, permission });
      }).catch(() => {
      });
      return id;
    },
    unwatch(id) {
      const listener = _listeners.get(id);
      if (listener) {
        listener.status.removeEventListener("change", listener.handler);
        _listeners.delete(id);
        return true;
      }
      return false;
    },
    clearCache() {
      _cache.clear();
    },
    getMetrics() {
      return { ..._metrics, cached: _cache.size, watching: _listeners.size };
    },
    resetMetrics() {
      _metrics = { queries: 0, requests: 0, granted: 0, denied: 0 };
    },
    healthCheck() {
      return { status: "HEALTHY", version: VERSION, moduleId: MODULE_ID, permissionsAPI: !!navigator.permissions, cached: _cache.size, metrics: _metrics };
    },
    info() {
      return { moduleId: MODULE_ID, version: VERSION, permissions: Object.keys(PERMISSIONS), states: Object.keys(PERMISSION_STATES) };
    },
    destroy() {
      _listeners.forEach((_, id) => this.unwatch(id));
      _cache.clear();
    }
  };
  return manager;
}
let _instance = null;
function getPermissionManager(options = {}) {
  if (!_instance) _instance = createPermissionManager(options);
  return _instance;
}
function resetPermissionManager() {
  if (_instance) {
    _instance.destroy();
    _instance = null;
  }
}
async function queryPermission(permission) {
  return getPermissionManager().query(permission);
}
async function requestPermission(permission) {
  return getPermissionManager().request(permission);
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, permissions: Object.keys(PERMISSIONS) };
}
function healthCheck() {
  if (_instance) return _instance.healthCheck();
  return { status: "NOT_INITIALIZED", version: VERSION, moduleId: MODULE_ID };
}
var permission_manager_default = { VERSION, MODULE_ID, PERMISSIONS, PERMISSION_STATES, createPermissionManager, getPermissionManager, resetPermissionManager, queryPermission, requestPermission, info, healthCheck };
export {
  MODULE_ID,
  PERMISSIONS,
  PERMISSION_STATES,
  VERSION,
  createPermissionManager,
  permission_manager_default as default,
  getPermissionManager,
  healthCheck,
  info,
  queryPermission,
  requestPermission,
  resetPermissionManager
};
