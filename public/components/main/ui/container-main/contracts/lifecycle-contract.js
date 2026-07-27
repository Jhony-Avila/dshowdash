import { createLogger } from "../utils/logger.js";
const VERSION = "1.1.0-LOGGER-INTEGRATED";
const MODULE_ID = "container-main:contracts:lifecycle";
const logger = createLogger(MODULE_ID);
const LIFECYCLE_STATES = Object.freeze({
  IDLE: "idle",
  INITIALIZING: "initializing",
  READY: "ready",
  ACTIVE: "active",
  PAUSED: "paused",
  ERROR: "error",
  DESTROYING: "destroying",
  DESTROYED: "destroyed"
});
const VALID_TRANSITIONS = Object.freeze({
  [LIFECYCLE_STATES.IDLE]: [LIFECYCLE_STATES.INITIALIZING],
  [LIFECYCLE_STATES.INITIALIZING]: [LIFECYCLE_STATES.READY, LIFECYCLE_STATES.ERROR],
  [LIFECYCLE_STATES.READY]: [LIFECYCLE_STATES.ACTIVE, LIFECYCLE_STATES.PAUSED, LIFECYCLE_STATES.DESTROYING],
  [LIFECYCLE_STATES.ACTIVE]: [LIFECYCLE_STATES.PAUSED, LIFECYCLE_STATES.ERROR, LIFECYCLE_STATES.DESTROYING],
  [LIFECYCLE_STATES.PAUSED]: [LIFECYCLE_STATES.ACTIVE, LIFECYCLE_STATES.DESTROYING],
  [LIFECYCLE_STATES.ERROR]: [LIFECYCLE_STATES.INITIALIZING, LIFECYCLE_STATES.DESTROYING],
  [LIFECYCLE_STATES.DESTROYING]: [LIFECYCLE_STATES.DESTROYED],
  [LIFECYCLE_STATES.DESTROYED]: []
});
const REQUIRED_METHODS = Object.freeze([
  "init",
  "destroy",
  "getState",
  "healthCheck"
]);
const OPTIONAL_METHODS = Object.freeze([
  "pause",
  "resume",
  "reset",
  "update",
  "onError",
  "onRecover"
]);
function isValidTransition(from, to) {
  const allowed = VALID_TRANSITIONS[from];
  return allowed ? allowed.includes(to) : false;
}
function validateLifecycleContract(obj) {
  const result = {
    valid: true,
    missing: [],
    optional: [],
    warnings: []
  };
  REQUIRED_METHODS.forEach((method) => {
    if (typeof obj[method] !== "function") {
      result.valid = false;
      result.missing.push(method);
    }
  });
  OPTIONAL_METHODS.forEach((method) => {
    if (typeof obj[method] === "function") {
      result.optional.push(method);
    }
  });
  if (!result.optional.includes("pause") || !result.optional.includes("resume")) {
    result.warnings.push("Componente n\xE3o suporta pause/resume - pode impactar performance");
  }
  if (!result.optional.includes("onError") || !result.optional.includes("onRecover")) {
    result.warnings.push("Componente n\xE3o suporta error recovery - falhas ser\xE3o terminais");
  }
  return result;
}
function createLifecycleWrapper(component, options = {}) {
  const { id = "unknown", onStateChange } = options;
  let _state = LIFECYCLE_STATES.IDLE;
  let _error = null;
  let _initialized = false;
  const _setState = (newState) => {
    if (!isValidTransition(_state, newState)) {
      logger.warn(`Invalid state transition: ${_state} -> ${newState}`, { componentId: id });
      return false;
    }
    const oldState = _state;
    _state = newState;
    onStateChange?.(newState, oldState, id);
    return true;
  };
  return {
    getId: () => id,
    getState: () => ({
      lifecycle: _state,
      initialized: _initialized,
      error: _error,
      timestamp: Date.now()
    }),
    async init() {
      if (_initialized) return this;
      _setState(LIFECYCLE_STATES.INITIALIZING);
      try {
        if (component.init) await component.init();
        _initialized = true;
        _error = null;
        _setState(LIFECYCLE_STATES.READY);
      } catch (e) {
        _error = e;
        _setState(LIFECYCLE_STATES.ERROR);
        throw e;
      }
      return this;
    },
    async destroy() {
      _setState(LIFECYCLE_STATES.DESTROYING);
      try {
        if (component.destroy) await component.destroy();
      } catch (e) {
        logger.error(`Error during destroy`, { componentId: id, error: e.message });
      }
      _initialized = false;
      _setState(LIFECYCLE_STATES.DESTROYED);
      return this;
    },
    pause() {
      if (_state !== LIFECYCLE_STATES.ACTIVE) return this;
      if (component.pause) component.pause();
      _setState(LIFECYCLE_STATES.PAUSED);
      return this;
    },
    resume() {
      if (_state !== LIFECYCLE_STATES.PAUSED) return this;
      if (component.resume) component.resume();
      _setState(LIFECYCLE_STATES.ACTIVE);
      return this;
    },
    activate() {
      if (_state === LIFECYCLE_STATES.READY || _state === LIFECYCLE_STATES.PAUSED) {
        _setState(LIFECYCLE_STATES.ACTIVE);
      }
      return this;
    },
    async recover() {
      if (_state !== LIFECYCLE_STATES.ERROR) return this;
      _error = null;
      if (component.onRecover) {
        await component.onRecover();
      }
      _setState(LIFECYCLE_STATES.INITIALIZING);
      return this.init();
    },
    healthCheck() {
      const componentHealth = component.healthCheck?.() || { status: "UNKNOWN" };
      return {
        ...componentHealth,
        lifecycle: _state,
        initialized: _initialized,
        hasError: !!_error,
        error: _error?.message || null
      };
    },
    getComponent: () => component
  };
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    states: Object.keys(LIFECYCLE_STATES).length,
    requiredMethods: REQUIRED_METHODS.length,
    optionalMethods: OPTIONAL_METHODS.length
  };
}
function healthCheck() {
  return {
    status: "HEALTHY",
    version: VERSION,
    moduleId: MODULE_ID
  };
}
var lifecycle_contract_default = {
  VERSION,
  MODULE_ID,
  LIFECYCLE_STATES,
  VALID_TRANSITIONS,
  REQUIRED_METHODS,
  OPTIONAL_METHODS,
  isValidTransition,
  validateLifecycleContract,
  createLifecycleWrapper,
  info,
  healthCheck
};
export {
  LIFECYCLE_STATES,
  MODULE_ID,
  OPTIONAL_METHODS,
  REQUIRED_METHODS,
  VALID_TRANSITIONS,
  VERSION,
  createLifecycleWrapper,
  lifecycle_contract_default as default,
  healthCheck,
  info,
  isValidTransition,
  validateLifecycleContract
};
