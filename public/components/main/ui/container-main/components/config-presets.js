import { MAIN_EVENTS } from "/core/runtime/events/catalog/main.events.js";
const VERSION = "8.2.0-ENTERPRISE";
const MODULE_ID = "container-config-presets";
import { createLogger } from "../utils/logger.js";
const logger = createLogger(MODULE_ID);
let _injectedEventBus = null;
function injectEventBus(eventBus) {
  _injectedEventBus = eventBus;
}
function _getEventBus() {
  return _injectedEventBus;
}
function _emitPresetChange(container, payload) {
  const eb = _getEventBus();
  if (eb?.emit) {
    eb.emit(MAIN_EVENTS.PRESET_CHANGE, { source: MODULE_ID, timestamp: Date.now(), containerId: container.id, ...payload });
    return true;
  }
  return false;
}
function _validateOptions(options) {
  const errors = [];
  if (options.defaultPreset !== void 0 && typeof options.defaultPreset !== "string") errors.push("defaultPreset must be a string");
  if (options.onPresetChange !== void 0 && typeof options.onPresetChange !== "function") errors.push("onPresetChange must be a function");
  if (errors.length > 0) logger.warn("Invalid options", { errors });
  return errors.length === 0;
}
const PRESETS = {
  default: { name: "Padr\xE3o", description: "Configura\xE7\xE3o padr\xE3o do container", config: { draggable: true, resizable: true, minimizable: true, maximizable: true, closable: true, showHeader: true, showFooter: false, animation: true, borderRadius: 8, shadow: "medium" } },
  compact: { name: "Compacto", description: "Layout compacto com menos espa\xE7amento", config: { draggable: true, resizable: true, minimizable: true, maximizable: false, closable: true, showHeader: true, showFooter: false, animation: true, borderRadius: 4, shadow: "small" } },
  minimal: { name: "Minimalista", description: "Interface limpa e sem distra\xE7\xF5es", config: { draggable: true, resizable: false, minimizable: false, maximizable: false, closable: true, showHeader: false, showFooter: false, animation: false, borderRadius: 0, shadow: "none" } },
  modal: { name: "Modal", description: "Comportamento de janela modal", config: { draggable: true, resizable: false, minimizable: false, maximizable: false, closable: true, showHeader: true, showFooter: true, animation: true, borderRadius: 12, shadow: "large" } },
  fullscreen: { name: "Tela Cheia", description: "Ocupar toda a tela dispon\xEDvel", config: { draggable: false, resizable: false, minimizable: false, maximizable: false, closable: true, showHeader: true, showFooter: false, animation: false, borderRadius: 0, shadow: "none" } },
  dashboard: { name: "Dashboard", description: "Otimizado para pain\xE9is de dashboard", config: { draggable: true, resizable: true, minimizable: true, maximizable: true, closable: false, showHeader: true, showFooter: false, animation: true, borderRadius: 8, shadow: "medium" } }
};
function createConfigPresets(container, options = {}) {
  _validateOptions(options);
  const { defaultPreset = "default", onPresetChange, eventBus } = options;
  if (eventBus && !_injectedEventBus) _injectedEventBus = eventBus;
  let _initialized = false;
  let _currentPreset = defaultPreset;
  let _customPresets = {};
  function _getAllPresets() {
    return { ...PRESETS, ..._customPresets };
  }
  const presets = {
    init() {
      if (_initialized) return this;
      _initialized = true;
      return this;
    },
    getCurrentPreset() {
      return _currentPreset;
    },
    getPreset(name) {
      return _getAllPresets()[name] || null;
    },
    getPresetConfig(name) {
      return _getAllPresets()[name]?.config || null;
    },
    setPreset(name) {
      const allPresets = _getAllPresets();
      if (!allPresets[name]) return false;
      const prevPreset = _currentPreset;
      _currentPreset = name;
      onPresetChange?.(name, allPresets[name]?.config, prevPreset);
      _emitPresetChange(container, { preset: name, config: allPresets[name]?.config, prevPreset });
      return true;
    },
    listPresets() {
      const allPresets = _getAllPresets();
      return Object.entries(allPresets).map(([key, preset]) => ({ id: key, name: preset.name, description: preset.description, isCustom: !!_customPresets[key], isCurrent: key === _currentPreset }));
    },
    addCustomPreset(id, preset) {
      if (typeof id !== "string" || !id) return this;
      if (PRESETS[id]) throw new Error(`Cannot override built-in preset "${id}"`);
      _customPresets[id] = { name: preset.name || id, description: preset.description || "", config: { ...PRESETS.default.config, ...preset.config } };
      return this;
    },
    removeCustomPreset(id) {
      if (!_customPresets[id]) return false;
      delete _customPresets[id];
      if (_currentPreset === id) this.setPreset("default");
      return true;
    },
    mergeConfig(basePreset, overrides) {
      const base = this.getPresetConfig(basePreset);
      return base ? { ...base, ...overrides } : overrides;
    },
    exportPreset(name) {
      const preset = this.getPreset(name);
      return preset ? JSON.stringify(preset, null, 2) : null;
    },
    importPreset(id, json) {
      try {
        this.addCustomPreset(id, JSON.parse(json));
        return true;
      } catch {
        return false;
      }
    },
    isInitialized() {
      return _initialized;
    },
    destroy() {
      _initialized = false;
      _customPresets = {};
    },
    healthCheck() {
      return { status: _initialized ? "HEALTHY" : "NOT_INITIALIZED", version: VERSION, moduleId: MODULE_ID, currentPreset: _currentPreset, builtInPresets: Object.keys(PRESETS).length, customPresets: Object.keys(_customPresets).length, hasInjectedEventBus: !!_injectedEventBus, hasValidation: true };
    }
  };
  return presets;
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, hasInjectedEventBus: !!_injectedEventBus, presetsCount: Object.keys(PRESETS).length, hasValidation: true };
}
function healthCheck() {
  return { status: "HEALTHY", version: VERSION, moduleId: MODULE_ID, presetsCount: Object.keys(PRESETS).length, hasInjectedEventBus: !!_injectedEventBus, hasValidation: true };
}
var config_presets_default = { createConfigPresets, injectEventBus, healthCheck, info, VERSION, MODULE_ID, PRESETS };
export {
  MODULE_ID,
  PRESETS,
  VERSION,
  createConfigPresets,
  config_presets_default as default,
  healthCheck,
  info,
  injectEventBus
};
