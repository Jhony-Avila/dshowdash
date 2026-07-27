import { createLogger } from "../utils/logger.js";
const VERSION = "1.1.0-LOGGER-INTEGRATED";
const MODULE_ID = "container-main:contracts:slot";
const logger = createLogger(MODULE_ID);
const SLOT_TYPES = Object.freeze({
  PANEL: "panel",
  WIDGET: "widget",
  MODAL: "modal",
  SIDEBAR: "sidebar",
  OVERLAY: "overlay",
  EMBEDDED: "embedded"
});
const RENDER_MODES = Object.freeze({
  IMMEDIATE: "immediate",
  LAZY: "lazy",
  ON_DEMAND: "on-demand",
  VIRTUAL: "virtual"
});
const LOAD_PRIORITY = Object.freeze({
  CRITICAL: 0,
  HIGH: 1,
  NORMAL: 2,
  LOW: 3,
  IDLE: 4
});
const SLOT_CONFIG_SCHEMA = {
  id: { type: "string", required: true },
  type: { type: "enum", values: Object.values(SLOT_TYPES), default: SLOT_TYPES.PANEL },
  renderMode: { type: "enum", values: Object.values(RENDER_MODES), default: RENDER_MODES.LAZY },
  priority: { type: "enum", values: Object.values(LOAD_PRIORITY), default: LOAD_PRIORITY.NORMAL },
  isolateErrors: { type: "boolean", default: true },
  pauseWhenHidden: { type: "boolean", default: true },
  destroyWhenUnmounted: { type: "boolean", default: false },
  maxRetries: { type: "number", default: 3 },
  retryDelay: { type: "number", default: 1e3 }
};
function validateSlotConfig(config) {
  const result = { valid: true, errors: [], normalized: {} };
  Object.entries(SLOT_CONFIG_SCHEMA).forEach(([key, schema]) => {
    const value = config[key];
    if (schema.required && (value === void 0 || value === null)) {
      result.valid = false;
      result.errors.push(`Missing required field: ${key}`);
      return;
    }
    if (value === void 0) {
      result.normalized[key] = schema.default;
      return;
    }
    if (schema.type === "enum" && !schema.values.includes(value)) {
      result.valid = false;
      result.errors.push(`Invalid value for ${key}: ${value}. Expected one of: ${schema.values.join(", ")}`);
      return;
    }
    if (schema.type === "string" && typeof value !== "string") {
      result.valid = false;
      result.errors.push(`Invalid type for ${key}: expected string`);
      return;
    }
    if (schema.type === "boolean" && typeof value !== "boolean") {
      result.valid = false;
      result.errors.push(`Invalid type for ${key}: expected boolean`);
      return;
    }
    if (schema.type === "number" && typeof value !== "number") {
      result.valid = false;
      result.errors.push(`Invalid type for ${key}: expected number`);
      return;
    }
    result.normalized[key] = value;
  });
  return result;
}
const SLOT_INTERFACE = {
  // Métodos obrigatórios
  required: [
    "getId",
    "getType",
    "getConfig",
    "mount",
    "unmount",
    "getState",
    "healthCheck"
  ],
  // Métodos opcionais para conteúdo pesado
  optional: [
    "pause",
    "resume",
    "preload",
    "cleanup",
    "onVisibilityChange",
    "onResize",
    "getMetrics"
  ]
};
function validateSlotInterface(obj) {
  const result = { valid: true, missing: [], optional: [], warnings: [] };
  SLOT_INTERFACE.required.forEach((method) => {
    if (typeof obj[method] !== "function") {
      result.valid = false;
      result.missing.push(method);
    }
  });
  SLOT_INTERFACE.optional.forEach((method) => {
    if (typeof obj[method] === "function") {
      result.optional.push(method);
    }
  });
  if (!result.optional.includes("pause") || !result.optional.includes("resume")) {
    result.warnings.push("Slot n\xE3o suporta pause/resume - conte\xFAdo pesado pode impactar performance");
  }
  if (!result.optional.includes("cleanup")) {
    result.warnings.push("Slot n\xE3o implementa cleanup - poss\xEDveis memory leaks");
  }
  return result;
}
function createSlot(config, contentFactory) {
  const validation = validateSlotConfig(config);
  if (!validation.valid) {
    throw new Error(`Invalid slot config: ${validation.errors.join(", ")}`);
  }
  const _config = validation.normalized;
  let _mounted = false;
  let _element = null;
  let _content = null;
  let _visible = true;
  let _retryCount = 0;
  let _state = "idle";
  let _error = null;
  let _metrics = { mountTime: 0, lastActivity: 0, errorCount: 0 };
  return {
    getId: () => _config.id,
    getType: () => _config.type,
    getConfig: () => ({ ..._config }),
    getState: () => ({
      mounted: _mounted,
      visible: _visible,
      state: _state,
      error: _error,
      retryCount: _retryCount
    }),
    async mount(targetElement) {
      if (_mounted) return this;
      const startTime = performance.now();
      _element = targetElement;
      _state = "mounting";
      try {
        if (_config.isolateErrors) {
          const boundary = document.createElement("div");
          boundary.className = "dsd-slot-boundary";
          boundary.setAttribute("data-slot-id", _config.id);
          boundary.setAttribute("data-slot-type", _config.type);
          _element.appendChild(boundary);
          _element = boundary;
        }
        if (_config.renderMode === RENDER_MODES.IMMEDIATE || _config.renderMode === RENDER_MODES.LAZY) {
          _content = await contentFactory(_element, _config);
        }
        _mounted = true;
        _state = "ready";
        _metrics.mountTime = performance.now() - startTime;
        _metrics.lastActivity = Date.now();
        _retryCount = 0;
        _error = null;
      } catch (e) {
        _error = e;
        _state = "error";
        _metrics.errorCount++;
        if (_retryCount < _config.maxRetries) {
          _retryCount++;
          setTimeout(() => this.mount(targetElement), _config.retryDelay * _retryCount);
        }
        throw e;
      }
      return this;
    },
    async unmount() {
      if (!_mounted) return this;
      _state = "unmounting";
      try {
        if (_content?.destroy) await _content.destroy();
        if (_config.destroyWhenUnmounted && _element) {
          _element.innerHTML = "";
        }
      } catch (e) {
        logger.error(`Error during unmount`, { slotId: _config.id, error: e.message });
      }
      _mounted = false;
      _content = null;
      _state = "idle";
      return this;
    },
    pause() {
      if (!_mounted || _state === "paused") return this;
      if (_content?.pause) _content.pause();
      _state = "paused";
      return this;
    },
    resume() {
      if (!_mounted || _state !== "paused") return this;
      if (_content?.resume) _content.resume();
      _state = "ready";
      return this;
    },
    preload() {
      if (_config.renderMode === RENDER_MODES.ON_DEMAND) {
        _state = "preloading";
      }
      return this;
    },
    cleanup() {
      if (_content?.cleanup) _content.cleanup();
      _metrics.lastActivity = Date.now();
      return this;
    },
    onVisibilityChange(visible) {
      _visible = visible;
      if (_config.pauseWhenHidden) {
        visible ? this.resume() : this.pause();
      }
      if (_content?.onVisibilityChange) _content.onVisibilityChange(visible);
      return this;
    },
    onResize(dimensions) {
      if (_content?.onResize) _content.onResize(dimensions);
      return this;
    },
    getMetrics: () => ({ ..._metrics }),
    getContent: () => _content,
    healthCheck() {
      const contentHealth = _content?.healthCheck?.() || { status: "N/A" };
      return {
        status: _error ? "ERROR" : _mounted ? "HEALTHY" : "IDLE",
        slotId: _config.id,
        slotType: _config.type,
        mounted: _mounted,
        state: _state,
        error: _error?.message || null,
        retryCount: _retryCount,
        metrics: _metrics,
        content: contentHealth
      };
    }
  };
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    slotTypes: Object.keys(SLOT_TYPES).length,
    renderModes: Object.keys(RENDER_MODES).length,
    loadPriorities: Object.keys(LOAD_PRIORITY).length
  };
}
function healthCheck() {
  return {
    status: "HEALTHY",
    version: VERSION,
    moduleId: MODULE_ID
  };
}
var slot_contract_default = {
  VERSION,
  MODULE_ID,
  SLOT_TYPES,
  RENDER_MODES,
  LOAD_PRIORITY,
  SLOT_CONFIG_SCHEMA,
  validateSlotConfig,
  validateSlotInterface,
  createSlot,
  SLOT_INTERFACE,
  info,
  healthCheck
};
export {
  LOAD_PRIORITY,
  MODULE_ID,
  RENDER_MODES,
  SLOT_CONFIG_SCHEMA,
  SLOT_INTERFACE,
  SLOT_TYPES,
  VERSION,
  createSlot,
  slot_contract_default as default,
  healthCheck,
  info,
  validateSlotConfig,
  validateSlotInterface
};
