import { OVERLAY_EVENT_NAMES } from "/core/runtime/constants/event-names.js";
const VERSION = "1.2.0-EVENT-CONSTANTS";
const MODULE_ID = "overlay-kernel-auto-cleanup";
const DEFAULT_CONFIG = {
  enabled: false,
  scanInterval: 1e4,
  defaultMaxAge: 3e5,
  maxAgeByType: {
    toast: 1e4,
    loading: 6e4,
    modal: 0,
    dialog: 0,
    drawer: 0,
    sheet: 18e4
  },
  exemptTypes: ["system-modal", "login-modal", "error-modal"],
  exemptIds: [],
  closeReason: "auto-cleanup-expired",
  onCleanup: null
};
let _config = { ...DEFAULT_CONFIG };
let _state = {
  enabled: false,
  intervalId: null,
  lastScan: null,
  cleanedCount: 0,
  scansCount: 0,
  exemptedCount: 0,
  startTime: null
};
let _store = null;
let _closeOverlay = null;
let _eventBus = null;
function inject(dependencies) {
  if (dependencies.store) _store = dependencies.store;
  if (dependencies.closeOverlay) _closeOverlay = dependencies.closeOverlay;
  if (dependencies.eventBus) _eventBus = dependencies.eventBus;
}
function getOverlayAge(overlay) {
  if (!overlay) return 0;
  const createdAt = overlay.createdAt || overlay.runtime?.createdAt || overlay.meta?.createdAt;
  if (!createdAt) return 0;
  return Date.now() - createdAt;
}
function getMaxAge(type) {
  if (_config.maxAgeByType[type] !== void 0) {
    return _config.maxAgeByType[type];
  }
  return _config.defaultMaxAge;
}
function isExempt(overlay) {
  if (!overlay) return true;
  if (_config.exemptIds.includes(overlay.id)) {
    return true;
  }
  const typeId = overlay.typeId || overlay.type;
  if (_config.exemptTypes.includes(typeId)) {
    return true;
  }
  if (overlay.config?.noAutoCleanup || overlay.meta?.exempt) {
    return true;
  }
  const maxAge = getMaxAge(typeId);
  if (maxAge === 0) {
    return true;
  }
  return false;
}
function isExpired(overlay) {
  if (isExempt(overlay)) return false;
  const typeId = overlay.typeId || overlay.type;
  const maxAge = getMaxAge(typeId);
  const age = getOverlayAge(overlay);
  return age > maxAge;
}
function scan() {
  if (!_store) {
    console.debug(`[${MODULE_ID}] Store not injected, cannot scan`);
    return { scanned: 0, cleaned: 0, exempted: 0, errors: ["store-not-injected"] };
  }
  _state.lastScan = Date.now();
  _state.scansCount++;
  const stack = _store.getStack ? _store.getStack() : [];
  const overlays = _store.getOverlays ? _store.getOverlays() : {};
  const result = {
    scanned: 0,
    cleaned: 0,
    exempted: 0,
    expired: [],
    errors: []
  };
  for (const id of stack) {
    const overlay = overlays[id];
    if (!overlay) continue;
    result.scanned++;
    if (isExempt(overlay)) {
      result.exempted++;
      _state.exemptedCount++;
      continue;
    }
    if (isExpired(overlay)) {
      result.expired.push({
        id: overlay.id,
        type: overlay.type || overlay.typeId,
        age: getOverlayAge(overlay),
        maxAge: getMaxAge(overlay.type || overlay.typeId)
      });
      if (_closeOverlay) {
        try {
          const closeResult = _closeOverlay(overlay.id, _config.closeReason);
          if (closeResult?.ok !== false) {
            result.cleaned++;
            _state.cleanedCount++;
            if (typeof _config.onCleanup === "function") {
              try {
                _config.onCleanup(overlay, "expired");
              } catch (e) {
              }
            }
            if (_eventBus?.emit) {
              _eventBus.emit(OVERLAY_EVENT_NAMES.AUTO_CLEANED, {
                id: overlay.id,
                type: overlay.type,
                reason: "expired",
                age: getOverlayAge(overlay)
              });
            }
          } else {
            result.errors.push(`failed-to-close:${overlay.id}`);
          }
        } catch (error) {
          result.errors.push(`error-closing:${overlay.id}:${error.message}`);
        }
      } else {
        result.errors.push("close-function-not-injected");
      }
    }
  }
  return result;
}
function enable(config = {}) {
  if (_state.enabled) {
    disable();
  }
  if (Object.keys(config).length > 0) {
    configure(config);
  }
  _config.enabled = true;
  _state.enabled = true;
  _state.startTime = Date.now();
  _state.intervalId = setInterval(() => {
    if (_state.enabled) {
      scan();
    }
  }, _config.scanInterval);
  scan();
  return {
    ok: true,
    enabled: true,
    scanInterval: _config.scanInterval,
    startTime: _state.startTime
  };
}
function disable() {
  _config.enabled = false;
  _state.enabled = false;
  if (_state.intervalId) {
    clearInterval(_state.intervalId);
    _state.intervalId = null;
  }
  return { ok: true, enabled: false };
}
function isEnabled() {
  return _state.enabled;
}
function configure(config) {
  if (!config || typeof config !== "object") return false;
  if (config.maxAgeByType) {
    _config.maxAgeByType = { ..._config.maxAgeByType, ...config.maxAgeByType };
    delete config.maxAgeByType;
  }
  if (config.exemptTypes) {
    _config.exemptTypes = [.../* @__PURE__ */ new Set([..._config.exemptTypes, ...config.exemptTypes])];
    delete config.exemptTypes;
  }
  if (config.exemptIds) {
    _config.exemptIds = [.../* @__PURE__ */ new Set([..._config.exemptIds, ...config.exemptIds])];
    delete config.exemptIds;
  }
  _config = { ..._config, ...config };
  if (_state.enabled && config.scanInterval) {
    disable();
    enable();
  }
  return true;
}
function getConfig() {
  return { ..._config, maxAgeByType: { ..._config.maxAgeByType } };
}
function setMaxAge(type, ms) {
  if (typeof type !== "string" || typeof ms !== "number") return false;
  _config.maxAgeByType[type] = Math.max(0, ms);
  return true;
}
function exempt(id) {
  if (!_config.exemptIds.includes(id)) {
    _config.exemptIds.push(id);
  }
}
function unexempt(id) {
  _config.exemptIds = _config.exemptIds.filter((i) => i !== id);
}
function exemptType(type) {
  if (!_config.exemptTypes.includes(type)) {
    _config.exemptTypes.push(type);
  }
}
function unexemptType(type) {
  _config.exemptTypes = _config.exemptTypes.filter((t) => t !== type);
}
function getExpired() {
  if (!_store) return [];
  const stack = _store.getStack ? _store.getStack() : [];
  const overlays = _store.getOverlays ? _store.getOverlays() : {};
  const expired = [];
  for (const id of stack) {
    const overlay = overlays[id];
    if (overlay && isExpired(overlay)) {
      expired.push({
        id: overlay.id,
        type: overlay.type || overlay.typeId,
        age: getOverlayAge(overlay),
        maxAge: getMaxAge(overlay.type || overlay.typeId)
      });
    }
  }
  return expired;
}
function getMetrics() {
  return {
    enabled: _state.enabled,
    cleanedCount: _state.cleanedCount,
    scansCount: _state.scansCount,
    exemptedCount: _state.exemptedCount,
    lastScan: _state.lastScan,
    uptime: _state.startTime ? Date.now() - _state.startTime : 0,
    currentExpired: getExpired().length
  };
}
function resetMetrics() {
  _state.cleanedCount = 0;
  _state.scansCount = 0;
  _state.exemptedCount = 0;
}
function healthCheck() {
  const metrics = getMetrics();
  const checks = {
    storeInjected: !!_store,
    closeFunctionInjected: !!_closeOverlay,
    configValid: _config.scanInterval > 0,
    noExpiredBacklog: metrics.currentExpired < 10
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  let status = "HEALTHY";
  if (!_state.enabled) status = "DEGRADED";
  else if (!checks.storeInjected || !checks.closeFunctionInjected) status = "UNHEALTHY";
  else if (!checks.noExpiredBacklog) status = "DEGRADED";
  return {
    status,
    score: `${passed}/${total}`,
    checks,
    enabled: _state.enabled,
    metrics: {
      cleaned: _state.cleanedCount,
      scans: _state.scansCount,
      expiredBacklog: metrics.currentExpired
    },
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    enabled: _state.enabled,
    config: getConfig(),
    metrics: getMetrics(),
    expired: getExpired(),
    timestamp: Date.now()
  };
}
var auto_cleanup_default = {
  inject,
  scan,
  enable,
  disable,
  isEnabled,
  configure,
  getConfig,
  setMaxAge,
  exempt,
  unexempt,
  exemptType,
  unexemptType,
  getExpired,
  getMetrics,
  resetMetrics,
  healthCheck,
  info,
  VERSION,
  MODULE_ID
};
export {
  MODULE_ID,
  VERSION,
  configure,
  auto_cleanup_default as default,
  disable,
  enable,
  exempt,
  exemptType,
  getConfig,
  getExpired,
  getMetrics,
  healthCheck,
  info,
  inject,
  isEnabled,
  resetMetrics,
  scan,
  setMaxAge,
  unexempt,
  unexemptType
};
