import { createLogger } from "../utils/logger.js";
const VERSION = "1.1.0-LOGGER-INTEGRATED";
const MODULE_ID = "container-main:contracts:resource";
const logger = createLogger(MODULE_ID);
const RESOURCE_TYPES = Object.freeze({
  VIDEO: "video",
  AUDIO: "audio",
  IMAGE: "image",
  IFRAME: "iframe",
  CANVAS: "canvas",
  WEBGL: "webgl",
  STREAM: "stream",
  WEBSOCKET: "websocket",
  WORKER: "worker",
  ANIMATION: "animation",
  TIMER: "timer",
  GENERIC: "generic"
});
const RESOURCE_STATES = Object.freeze({
  IDLE: "idle",
  LOADING: "loading",
  READY: "ready",
  ACTIVE: "active",
  PAUSED: "paused",
  ERROR: "error",
  DISPOSED: "disposed"
});
const CLEANUP_POLICIES = Object.freeze({
  IMMEDIATE: "immediate",
  DEFERRED: "deferred",
  ON_IDLE: "on-idle",
  MANUAL: "manual"
});
const RESOURCE_INTERFACE = {
  required: [
    "getId",
    "getType",
    "getState",
    "load",
    "dispose",
    "healthCheck"
  ],
  optional: [
    "pause",
    "resume",
    "reset",
    "getMemoryUsage",
    "onError"
  ]
};
const _resourceRegistry = /* @__PURE__ */ new Map();
let _resourceIdCounter = 0;
function _generateResourceId(type) {
  return `resource-${type}-${++_resourceIdCounter}-${Date.now().toString(36)}`;
}
function registerResource(resource) {
  const id = resource.getId();
  _resourceRegistry.set(id, resource);
  return () => _resourceRegistry.delete(id);
}
function getRegisteredResources() {
  return Array.from(_resourceRegistry.values());
}
function getResourcesByType(type) {
  return getRegisteredResources().filter((r) => r.getType() === type);
}
async function disposeResourcesByType(type) {
  const resources = getResourcesByType(type);
  await Promise.all(resources.map((r) => r.dispose()));
  return resources.length;
}
async function disposeAllResources() {
  const resources = getRegisteredResources();
  await Promise.all(resources.map((r) => r.dispose()));
  _resourceRegistry.clear();
  return resources.length;
}
function pauseResourcesByType(type) {
  const resources = getResourcesByType(type);
  resources.forEach((r) => r.pause?.());
  return resources.length;
}
function resumeResourcesByType(type) {
  const resources = getResourcesByType(type);
  resources.forEach((r) => r.resume?.());
  return resources.length;
}
function createResource(type, options = {}) {
  const {
    onLoad,
    onError,
    onDispose,
    cleanupPolicy = CLEANUP_POLICIES.DEFERRED,
    autoRegister = true
  } = options;
  const _id = _generateResourceId(type);
  let _state = RESOURCE_STATES.IDLE;
  let _error = null;
  let _loadPromise = null;
  let _memoryEstimate = 0;
  let _unregister = null;
  const resource = {
    getId: () => _id,
    getType: () => type,
    getState: () => ({
      id: _id,
      type,
      state: _state,
      error: _error?.message || null,
      memoryEstimate: _memoryEstimate
    }),
    async load(loader) {
      if (_state === RESOURCE_STATES.LOADING) return _loadPromise;
      if (_state === RESOURCE_STATES.READY || _state === RESOURCE_STATES.ACTIVE) return this;
      _state = RESOURCE_STATES.LOADING;
      _error = null;
      _loadPromise = (async () => {
        try {
          const result = await loader();
          _memoryEstimate = result?.memoryEstimate || 0;
          _state = RESOURCE_STATES.READY;
          onLoad?.(result);
          return result;
        } catch (e) {
          _error = e;
          _state = RESOURCE_STATES.ERROR;
          onError?.(e);
          throw e;
        }
      })();
      return _loadPromise;
    },
    async dispose() {
      if (_state === RESOURCE_STATES.DISPOSED) return this;
      _state = RESOURCE_STATES.DISPOSED;
      try {
        await onDispose?.();
      } catch (e) {
        logger.error(`Error during dispose`, { resourceId: _id, error: e.message });
      }
      if (_unregister) _unregister();
      _memoryEstimate = 0;
      _error = null;
      _loadPromise = null;
      return this;
    },
    pause() {
      if (_state === RESOURCE_STATES.ACTIVE) {
        _state = RESOURCE_STATES.PAUSED;
      }
      return this;
    },
    resume() {
      if (_state === RESOURCE_STATES.PAUSED) {
        _state = RESOURCE_STATES.ACTIVE;
      }
      return this;
    },
    activate() {
      if (_state === RESOURCE_STATES.READY || _state === RESOURCE_STATES.PAUSED) {
        _state = RESOURCE_STATES.ACTIVE;
      }
      return this;
    },
    reset() {
      _state = RESOURCE_STATES.IDLE;
      _error = null;
      _loadPromise = null;
      _memoryEstimate = 0;
      return this;
    },
    getMemoryUsage: () => _memoryEstimate,
    healthCheck() {
      return {
        status: _error ? "ERROR" : _state === RESOURCE_STATES.DISPOSED ? "DISPOSED" : "HEALTHY",
        resourceId: _id,
        resourceType: type,
        state: _state,
        error: _error?.message || null,
        memoryEstimate: _memoryEstimate,
        cleanupPolicy
      };
    }
  };
  if (autoRegister) {
    _unregister = registerResource(resource);
  }
  return resource;
}
function createVideoResource(videoElement, options = {}) {
  const resource = createResource(RESOURCE_TYPES.VIDEO, {
    ...options,
    onDispose: async () => {
      if (videoElement) {
        videoElement.pause();
        videoElement.src = "";
        videoElement.load();
      }
      options.onDispose?.();
    }
  });
  return {
    ...resource,
    play: () => {
      videoElement?.play();
      resource.activate();
    },
    pause: () => {
      videoElement?.pause();
      resource.pause();
    },
    stop: () => {
      videoElement?.pause();
      videoElement.currentTime = 0;
      resource.pause();
    },
    setVolume: (v) => {
      if (videoElement) videoElement.volume = v;
    },
    getVideoElement: () => videoElement
  };
}
function createCanvasResource(canvas, options = {}) {
  let _animationId = null;
  const resource = createResource(
    options.webgl ? RESOURCE_TYPES.WEBGL : RESOURCE_TYPES.CANVAS,
    {
      ...options,
      onDispose: async () => {
        if (_animationId) cancelAnimationFrame(_animationId);
        if (canvas) {
          const ctx = canvas.getContext("2d") || canvas.getContext("webgl");
          if (ctx?.clearRect) ctx.clearRect(0, 0, canvas.width, canvas.height);
        }
        options.onDispose?.();
      }
    }
  );
  return {
    ...resource,
    startAnimation: (callback) => {
      const loop = () => {
        if (resource.getState().state === RESOURCE_STATES.ACTIVE) {
          callback();
          _animationId = requestAnimationFrame(loop);
        }
      };
      resource.activate();
      loop();
    },
    stopAnimation: () => {
      if (_animationId) cancelAnimationFrame(_animationId);
      _animationId = null;
      resource.pause();
    },
    getCanvas: () => canvas
  };
}
function createTimerResource(options = {}) {
  const _timers = /* @__PURE__ */ new Set();
  const _intervals = /* @__PURE__ */ new Set();
  const resource = createResource(RESOURCE_TYPES.TIMER, {
    ...options,
    onDispose: async () => {
      _timers.forEach((t) => clearTimeout(t));
      _intervals.forEach((i) => clearInterval(i));
      _timers.clear();
      _intervals.clear();
      options.onDispose?.();
    }
  });
  return {
    ...resource,
    setTimeout: (fn, delay) => {
      const id = setTimeout(() => {
        _timers.delete(id);
        fn();
      }, delay);
      _timers.add(id);
      return id;
    },
    clearTimeout: (id) => {
      clearTimeout(id);
      _timers.delete(id);
    },
    setInterval: (fn, delay) => {
      const id = setInterval(fn, delay);
      _intervals.add(id);
      return id;
    },
    clearInterval: (id) => {
      clearInterval(id);
      _intervals.delete(id);
    },
    clearAll: () => {
      _timers.forEach((t) => clearTimeout(t));
      _intervals.forEach((i) => clearInterval(i));
      _timers.clear();
      _intervals.clear();
    }
  };
}
function getResourceStats() {
  const resources = getRegisteredResources();
  const byType = {};
  const byState = {};
  let totalMemory = 0;
  resources.forEach((r) => {
    const state = r.getState();
    byType[state.type] = (byType[state.type] || 0) + 1;
    byState[state.state] = (byState[state.state] || 0) + 1;
    totalMemory += state.memoryEstimate || 0;
  });
  return {
    total: resources.length,
    byType,
    byState,
    totalMemoryEstimate: totalMemory
  };
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    resourceTypes: Object.keys(RESOURCE_TYPES).length,
    cleanupPolicies: Object.keys(CLEANUP_POLICIES).length,
    registeredResources: _resourceRegistry.size
  };
}
function healthCheck() {
  const stats = getResourceStats();
  return {
    status: "HEALTHY",
    version: VERSION,
    moduleId: MODULE_ID,
    stats
  };
}
var resource_contract_default = {
  VERSION,
  MODULE_ID,
  RESOURCE_TYPES,
  RESOURCE_STATES,
  CLEANUP_POLICIES,
  RESOURCE_INTERFACE,
  registerResource,
  getRegisteredResources,
  getResourcesByType,
  disposeResourcesByType,
  disposeAllResources,
  pauseResourcesByType,
  resumeResourcesByType,
  createResource,
  createVideoResource,
  createCanvasResource,
  createTimerResource,
  getResourceStats,
  info,
  healthCheck
};
export {
  CLEANUP_POLICIES,
  MODULE_ID,
  RESOURCE_INTERFACE,
  RESOURCE_STATES,
  RESOURCE_TYPES,
  VERSION,
  createCanvasResource,
  createResource,
  createTimerResource,
  createVideoResource,
  resource_contract_default as default,
  disposeAllResources,
  disposeResourcesByType,
  getRegisteredResources,
  getResourceStats,
  getResourcesByType,
  healthCheck,
  info,
  pauseResourcesByType,
  registerResource,
  resumeResourcesByType
};
