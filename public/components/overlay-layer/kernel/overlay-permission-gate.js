import { PERMISSION_TRIGGERS, getTypeById, getPermissionTrigger, isTypeAllowedInMode, requiresAuth } from "./overlay-manifest.js";
const VERSION = "2.2.0-STEP8";
const MODULE_ID = "overlay-kernel:permission-gate";
function _resolveRuntimeContext() {
  if (typeof window === "undefined") return null;
  if (window.Core && window.Core.windowAdapter && window.Core.windowAdapter.get) {
    const rc = window.Core.windowAdapter.get("RuntimeContext");
    if (rc) return rc;
  }
  return window.RuntimeContext || null;
}
const _state = {
  initialized: false,
  permissionsGuard: null,
  runtimeKernel: null,
  eventBus: null,
  metrics: {
    checks: 0,
    granted: 0,
    denied: 0,
    errors: 0
  },
  lastDenial: null
};
const DENIAL_REASONS = Object.freeze({
  NOT_INITIALIZED: "gate:not-initialized",
  TYPE_NOT_FOUND: "type:not-found",
  MODE_NOT_ALLOWED: "mode:not-allowed",
  AUTH_REQUIRED: "auth:required",
  PERMISSION_DENIED: "permission:denied",
  CAPABILITY_MISSING: "capability:missing",
  RUNTIME_DEGRADED: "runtime:degraded",
  CUSTOM_GATE_DENIED: "custom:denied",
  UNKNOWN: "unknown"
});
function _emit(eventName, data) {
  if (_state.eventBus && _state.eventBus.emit) {
    _state.eventBus.emit(eventName, Object.assign({
      source: MODULE_ID,
      timestamp: Date.now()
    }, data || {}));
  }
}
function _getRuntimeMode() {
  const rc = _resolveRuntimeContext();
  if (rc && rc.getMode) {
    try {
      return rc.getMode();
    } catch (e) {
    }
  }
  if (_state.runtimeKernel && typeof _state.runtimeKernel.getMode === "function") {
    return _state.runtimeKernel.getMode();
  }
  return "NORMAL";
}
function _isAuthenticated() {
  const rc = _resolveRuntimeContext();
  if (rc && rc.isAuthenticated) {
    try {
      return rc.isAuthenticated();
    } catch (e) {
    }
  }
  if (_state.permissionsGuard && typeof _state.permissionsGuard.getUserLevel === "function") {
    const context = _getAuthContext();
    return context.isAuthenticated;
  }
  return false;
}
function _getAuthContext() {
  const rc = _resolveRuntimeContext();
  if (rc) {
    try {
      return {
        isAuthenticated: rc.isAuthenticated(),
        level: rc.getAuthLevel ? rc.getAuthLevel() : 0,
        roles: [],
        capabilities: []
      };
    } catch (e) {
    }
  }
  if (typeof window !== "undefined" && window.AuthState) {
    const authState = window.AuthState.getState ? window.AuthState.getState() : window.AuthState;
    return {
      isAuthenticated: authState.isAuthenticated || false,
      roles: authState.roles || [],
      capabilities: authState.capabilities || [],
      level: authState.level || 0
    };
  }
  return {
    isAuthenticated: false,
    roles: [],
    capabilities: [],
    level: 0
  };
}
function _createDenialResult(reason, details) {
  _state.metrics.denied++;
  _state.lastDenial = {
    reason,
    details: details || null,
    timestamp: Date.now()
  };
  _emit("overlay-permission.denied", { reason, details });
  return { allowed: false, reason, details: details || null };
}
function _createGrantResult(typeId) {
  _state.metrics.granted++;
  _emit("overlay-permission.granted", { typeId });
  return { allowed: true, reason: null, details: null };
}
function init(dependencies) {
  dependencies = dependencies || {};
  if (_state.initialized) {
    return { ok: true, alreadyInitialized: true };
  }
  _state.permissionsGuard = dependencies.permissionsGuard || null;
  _state.runtimeKernel = dependencies.runtimeKernel || null;
  _state.eventBus = dependencies.eventBus || null;
  _state.initialized = true;
  _emit("overlay-permission-gate.ready", { version: VERSION });
  return {
    ok: true,
    initialized: true,
    hasPermissionsGuard: !!_state.permissionsGuard,
    hasRuntimeKernel: !!_state.runtimeKernel,
    hasRuntimeContext: !!_resolveRuntimeContext()
  };
}
function check(params) {
  params = params || {};
  _state.metrics.checks++;
  if (!_state.initialized) {
    console.debug(`[${MODULE_ID}] Gate not initialized, allowing by default`);
    return _createGrantResult(params.typeId || "unknown");
  }
  const typeId = params.typeId || params.trigger || params.overlayType;
  const scope = params.scope || "global";
  const capability = params.capability || null;
  const typeDef = getTypeById(typeId);
  if (!typeDef && typeId) {
    console.debug(`[${MODULE_ID}] Type not in manifest: ${typeId}, allowing`);
    return _createGrantResult(typeId);
  }
  const currentMode = _getRuntimeMode();
  if (typeDef && !isTypeAllowedInMode(typeId, currentMode)) {
    return _createDenialResult(DENIAL_REASONS.MODE_NOT_ALLOWED, {
      typeId,
      currentMode,
      allowedModes: typeDef.allowedModes
    });
  }
  if (typeDef && requiresAuth(typeId)) {
    if (!_isAuthenticated()) {
      return _createDenialResult(DENIAL_REASONS.AUTH_REQUIRED, { typeId });
    }
  }
  const trigger = typeDef ? getPermissionTrigger(typeId) : PERMISSION_TRIGGERS.NONE;
  switch (trigger) {
    case PERMISSION_TRIGGERS.NONE:
      break;
    case PERMISSION_TRIGGERS.AUTH_REQUIRED:
      break;
    case PERMISSION_TRIGGERS.ROLE_ADMIN:
      const ctx = _getAuthContext();
      if (!ctx.roles.includes("admin") && !ctx.roles.includes("super_admin")) {
        return _createDenialResult(DENIAL_REASONS.PERMISSION_DENIED, {
          typeId,
          required: "admin role"
        });
      }
      break;
    case PERMISSION_TRIGGERS.ROLE_USER:
      const ctx2 = _getAuthContext();
      if (!ctx2.roles.includes("user") && !ctx2.roles.includes("admin") && !ctx2.roles.includes("super_admin")) {
        return _createDenialResult(DENIAL_REASONS.PERMISSION_DENIED, {
          typeId,
          required: "user role"
        });
      }
      break;
    case PERMISSION_TRIGGERS.CAPABILITY:
      if (capability && _state.permissionsGuard) {
        const canDo = _state.permissionsGuard.can(capability, _getAuthContext());
        if (!canDo) {
          return _createDenialResult(DENIAL_REASONS.CAPABILITY_MISSING, {
            typeId,
            capability
          });
        }
      }
      break;
    case PERMISSION_TRIGGERS.CUSTOM:
      if (params.customGate && typeof params.customGate === "function") {
        const customResult = params.customGate(_getAuthContext(), typeDef);
        if (!customResult) {
          return _createDenialResult(DENIAL_REASONS.CUSTOM_GATE_DENIED, { typeId });
        }
      }
      break;
  }
  const rc = _resolveRuntimeContext();
  if (rc && rc.isCapabilityEnabled) {
    if (!rc.isCapabilityEnabled("UI_COMPONENTS")) {
      if (!typeDef || typeDef.priority < 100) {
        return _createDenialResult(DENIAL_REASONS.RUNTIME_DEGRADED, {
          typeId,
          capability: "UI_COMPONENTS"
        });
      }
    }
  } else if (_state.runtimeKernel && typeof _state.runtimeKernel.isCapabilityEnabled === "function") {
    if (!_state.runtimeKernel.isCapabilityEnabled("UI_COMPONENTS")) {
      if (!typeDef || typeDef.priority < 100) {
        return _createDenialResult(DENIAL_REASONS.RUNTIME_DEGRADED, {
          typeId,
          capability: "UI_COMPONENTS"
        });
      }
    }
  }
  return _createGrantResult(typeId);
}
function canOpen(typeId, options) {
  const result = check(Object.assign({ typeId }, options || {}));
  return result.allowed;
}
function checkAndDeny(typeId, options, onDeny) {
  const result = check(Object.assign({ typeId }, options || {}));
  if (!result.allowed && typeof onDeny === "function") {
    onDeny(result);
  }
  return result;
}
function getMetrics() {
  return Object.assign({}, _state.metrics);
}
function getLastDenial() {
  return _state.lastDenial ? Object.assign({}, _state.lastDenial) : null;
}
function isInitialized() {
  return _state.initialized;
}
function getDenialRate() {
  if (_state.metrics.checks === 0) return 0;
  return _state.metrics.denied / _state.metrics.checks * 100;
}
function getAuthSource() {
  if (_resolveRuntimeContext()) {
    return "RuntimeContext";
  }
  if (_state.permissionsGuard) {
    return "permissionsGuard";
  }
  return "none";
}
function injectDependencies(dependencies) {
  dependencies = dependencies || {};
  if (dependencies.permissionsGuard) _state.permissionsGuard = dependencies.permissionsGuard;
  if (dependencies.runtimeKernel) _state.runtimeKernel = dependencies.runtimeKernel;
  if (dependencies.eventBus) _state.eventBus = dependencies.eventBus;
}
function reset() {
  _state.initialized = false;
  _state.permissionsGuard = null;
  _state.runtimeKernel = null;
  _state.eventBus = null;
  _state.metrics = { checks: 0, granted: 0, denied: 0, errors: 0 };
  _state.lastDenial = null;
}
function healthCheck() {
  const checks = {
    initialized: _state.initialized,
    hasPermissionsGuard: !!_state.permissionsGuard,
    hasRuntimeKernel: !!_state.runtimeKernel,
    hasRuntimeContext: !!_resolveRuntimeContext(),
    lowDenialRate: getDenialRate() < 50,
    noExcessiveErrors: _state.metrics.errors < 100
  };
  let passed = 0;
  const keys = Object.keys(checks);
  for (let i = 0; i < keys.length; i++) {
    if (checks[keys[i]]) passed++;
  }
  let status = "HEALTHY";
  if (passed < keys.length * 0.5) status = "UNHEALTHY";
  else if (passed < keys.length) status = "DEGRADED";
  return {
    status,
    score: passed,
    maxScore: keys.length,
    scoreDisplay: `${passed}/${keys.length}`,
    checks,
    metrics: getMetrics(),
    authSource: getAuthSource(),
    denialRate: `${getDenialRate().toFixed(2)}%`,
    lastDenial: getLastDenial(),
    moduleId: MODULE_ID,
    version: VERSION,
    timestamp: Date.now()
  };
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    initialized: _state.initialized,
    hasPermissionsGuard: !!_state.permissionsGuard,
    hasRuntimeKernel: !!_state.runtimeKernel,
    hasRuntimeContext: !!_resolveRuntimeContext(),
    hasEventBus: !!_state.eventBus,
    authSource: getAuthSource(),
    metrics: getMetrics(),
    denialReasons: Object.keys(DENIAL_REASONS),
    timestamp: Date.now()
  };
}
var overlay_permission_gate_default = {
  VERSION,
  MODULE_ID,
  DENIAL_REASONS,
  init,
  check,
  canOpen,
  checkAndDeny,
  getMetrics,
  getLastDenial,
  isInitialized,
  getDenialRate,
  getAuthSource,
  injectDependencies,
  reset,
  healthCheck,
  info
};
export {
  DENIAL_REASONS,
  MODULE_ID,
  VERSION,
  canOpen,
  check,
  checkAndDeny,
  overlay_permission_gate_default as default,
  getAuthSource,
  getDenialRate,
  getLastDenial,
  getMetrics,
  healthCheck,
  info,
  init,
  injectDependencies,
  isInitialized,
  reset
};
