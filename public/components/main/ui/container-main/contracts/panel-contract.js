import { LIFECYCLE_STATES, createLifecycleWrapper } from "./lifecycle-contract.js";
import { SLOT_TYPES, RENDER_MODES, LOAD_PRIORITY } from "./slot-contract.js";
import { createLogger } from "../utils/logger.js";
const VERSION = "1.1.0-LOGGER-INTEGRATED";
const MODULE_ID = "container-main:contracts:panel";
const logger = createLogger(MODULE_ID);
const PANEL_CATEGORIES = Object.freeze({
  STATIC: "static",
  DYNAMIC: "dynamic",
  MEDIA: "media",
  REALTIME: "realtime",
  INTERACTIVE: "interactive"
});
const PANEL_CAPABILITIES = Object.freeze({
  RESIZABLE: "resizable",
  DRAGGABLE: "draggable",
  CLOSABLE: "closable",
  REFRESHABLE: "refreshable",
  EXPORTABLE: "exportable",
  PRINTABLE: "printable",
  FULLSCREEN: "fullscreen",
  SPLIT_VIEW: "split-view"
});
const PANEL_CONFIG_SCHEMA = {
  id: { type: "string", required: true },
  title: { type: "string", default: "Panel" },
  category: { type: "enum", values: Object.values(PANEL_CATEGORIES), default: PANEL_CATEGORIES.STATIC },
  capabilities: { type: "array", default: [] },
  slotType: { type: "enum", values: Object.values(SLOT_TYPES), default: SLOT_TYPES.PANEL },
  renderMode: { type: "enum", values: Object.values(RENDER_MODES), default: RENDER_MODES.LAZY },
  priority: { type: "enum", values: Object.values(LOAD_PRIORITY), default: LOAD_PRIORITY.NORMAL },
  refreshInterval: { type: "number", default: 0 },
  cacheTimeout: { type: "number", default: 0 },
  minWidth: { type: "number", default: 200 },
  minHeight: { type: "number", default: 100 },
  maxRetries: { type: "number", default: 3 }
};
function validatePanelConfig(config) {
  const result = { valid: true, errors: [], normalized: {} };
  Object.entries(PANEL_CONFIG_SCHEMA).forEach(([key, schema]) => {
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
      result.errors.push(`Invalid value for ${key}: ${value}`);
      return;
    }
    if (schema.type === "array" && !Array.isArray(value)) {
      result.valid = false;
      result.errors.push(`Invalid type for ${key}: expected array`);
      return;
    }
    result.normalized[key] = value;
  });
  return result;
}
const PANEL_INTERFACE = {
  required: [
    "getId",
    "getTitle",
    "getCategory",
    "getConfig",
    "render",
    "destroy",
    "getState",
    "healthCheck"
  ],
  optional: [
    "refresh",
    "pause",
    "resume",
    "resize",
    "export",
    "print",
    "onActivate",
    "onDeactivate",
    "onError"
  ]
};
function validatePanelInterface(obj) {
  const result = { valid: true, missing: [], optional: [], warnings: [] };
  PANEL_INTERFACE.required.forEach((method) => {
    if (typeof obj[method] !== "function") {
      result.valid = false;
      result.missing.push(method);
    }
  });
  PANEL_INTERFACE.optional.forEach((method) => {
    if (typeof obj[method] === "function") {
      result.optional.push(method);
    }
  });
  return result;
}
function createPanel(config, implementation) {
  const validation = validatePanelConfig(config);
  if (!validation.valid) {
    throw new Error(`Invalid panel config: ${validation.errors.join(", ")}`);
  }
  const _config = validation.normalized;
  let _element = null;
  let _refreshTimer = null;
  let _state = {
    lifecycle: LIFECYCLE_STATES.IDLE,
    rendered: false,
    active: false,
    error: null,
    lastRefresh: null
  };
  const _panel = {
    getId: () => _config.id,
    getTitle: () => _config.title,
    getCategory: () => _config.category,
    getConfig: () => ({ ..._config }),
    getCapabilities: () => [..._config.capabilities],
    hasCapability: (cap) => _config.capabilities.includes(cap),
    getState: () => ({ ..._state }),
    async render(targetElement) {
      if (_state.rendered) return this;
      _element = targetElement;
      _state.lifecycle = LIFECYCLE_STATES.INITIALIZING;
      try {
        if (implementation.render) {
          await implementation.render(_element, _config);
        }
        _state.rendered = true;
        _state.lifecycle = LIFECYCLE_STATES.READY;
        _state.error = null;
        if (_config.refreshInterval > 0) {
          _refreshTimer = setInterval(() => _panel.refresh(), _config.refreshInterval);
        }
      } catch (e) {
        _state.error = e;
        _state.lifecycle = LIFECYCLE_STATES.ERROR;
        throw e;
      }
      return this;
    },
    async refresh() {
      if (!_state.rendered) return this;
      try {
        if (implementation.refresh) {
          await implementation.refresh(_element, _config);
        }
        _state.lastRefresh = Date.now();
        _state.error = null;
      } catch (e) {
        _state.error = e;
        implementation.onError?.(e);
      }
      return this;
    },
    async destroy() {
      if (_refreshTimer) {
        clearInterval(_refreshTimer);
        _refreshTimer = null;
      }
      _state.lifecycle = LIFECYCLE_STATES.DESTROYING;
      try {
        if (implementation.destroy) {
          await implementation.destroy();
        }
        if (_element) {
          _element.innerHTML = "";
        }
      } catch (e) {
        logger.error(`Error during destroy`, { panelId: _config.id, error: e.message });
      }
      _state.rendered = false;
      _state.active = false;
      _state.lifecycle = LIFECYCLE_STATES.DESTROYED;
      _element = null;
      return this;
    },
    pause() {
      if (_state.lifecycle !== LIFECYCLE_STATES.ACTIVE) return this;
      if (_refreshTimer) clearInterval(_refreshTimer);
      if (implementation.pause) implementation.pause();
      _state.lifecycle = LIFECYCLE_STATES.PAUSED;
      return this;
    },
    resume() {
      if (_state.lifecycle !== LIFECYCLE_STATES.PAUSED) return this;
      if (_config.refreshInterval > 0) {
        _refreshTimer = setInterval(() => _panel.refresh(), _config.refreshInterval);
      }
      if (implementation.resume) implementation.resume();
      _state.lifecycle = LIFECYCLE_STATES.ACTIVE;
      return this;
    },
    activate() {
      if (_state.lifecycle === LIFECYCLE_STATES.READY || _state.lifecycle === LIFECYCLE_STATES.PAUSED) {
        _state.lifecycle = LIFECYCLE_STATES.ACTIVE;
        _state.active = true;
        implementation.onActivate?.();
      }
      return this;
    },
    deactivate() {
      if (_state.lifecycle === LIFECYCLE_STATES.ACTIVE) {
        _state.active = false;
        implementation.onDeactivate?.();
      }
      return this;
    },
    resize(dimensions) {
      if (implementation.resize) {
        implementation.resize(dimensions);
      }
      return this;
    },
    async export(format = "json") {
      if (!_config.capabilities.includes(PANEL_CAPABILITIES.EXPORTABLE)) {
        throw new Error("Panel does not support export");
      }
      if (implementation.export) {
        return implementation.export(format);
      }
      return null;
    },
    getElement: () => _element,
    healthCheck() {
      const implHealth = implementation.healthCheck?.() || { status: "N/A" };
      return {
        status: _state.error ? "ERROR" : _state.rendered ? "HEALTHY" : "IDLE",
        panelId: _config.id,
        category: _config.category,
        lifecycle: _state.lifecycle,
        rendered: _state.rendered,
        active: _state.active,
        error: _state.error?.message || null,
        lastRefresh: _state.lastRefresh,
        capabilities: _config.capabilities,
        implementation: implHealth
      };
    }
  };
  return createLifecycleWrapper(_panel, { id: _config.id });
}
const _panelRegistry = /* @__PURE__ */ new Map();
function registerPanelDefinition(id, definition) {
  _panelRegistry.set(id, definition);
}
function getPanelDefinition(id) {
  return _panelRegistry.get(id);
}
function getRegisteredPanels() {
  return Array.from(_panelRegistry.keys());
}
function createPanelFromRegistry(id, configOverrides = {}) {
  const definition = _panelRegistry.get(id);
  if (!definition) {
    throw new Error(`Panel definition not found: ${id}`);
  }
  const config = { ...definition.config, ...configOverrides, id };
  return createPanel(config, definition.implementation);
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    categories: Object.keys(PANEL_CATEGORIES).length,
    capabilities: Object.keys(PANEL_CAPABILITIES).length,
    registeredPanels: _panelRegistry.size
  };
}
function healthCheck() {
  return {
    status: "HEALTHY",
    version: VERSION,
    moduleId: MODULE_ID,
    registeredPanels: _panelRegistry.size
  };
}
var panel_contract_default = {
  VERSION,
  MODULE_ID,
  PANEL_CATEGORIES,
  PANEL_CAPABILITIES,
  PANEL_CONFIG_SCHEMA,
  PANEL_INTERFACE,
  validatePanelConfig,
  validatePanelInterface,
  createPanel,
  registerPanelDefinition,
  getPanelDefinition,
  getRegisteredPanels,
  createPanelFromRegistry,
  info,
  healthCheck
};
export {
  MODULE_ID,
  PANEL_CAPABILITIES,
  PANEL_CATEGORIES,
  PANEL_CONFIG_SCHEMA,
  PANEL_INTERFACE,
  VERSION,
  createPanel,
  createPanelFromRegistry,
  panel_contract_default as default,
  getPanelDefinition,
  getRegisteredPanels,
  healthCheck,
  info,
  registerPanelDefinition,
  validatePanelConfig,
  validatePanelInterface
};
