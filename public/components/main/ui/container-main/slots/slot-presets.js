import { createLogger } from "../utils/logger.js";
const VERSION = "1.0.0-PHASE4";
const MODULE_ID = "container-main:slot-presets";
const PRESET_CATEGORIES = Object.freeze({
  DASHBOARD: "dashboard",
  PANEL: "panel",
  WIDGET: "widget",
  MODAL: "modal",
  SIDEBAR: "sidebar",
  FULLSCREEN: "fullscreen",
  EMBEDDED: "embedded",
  CUSTOM: "custom"
});
const DEFAULT_PRESETS = Object.freeze({
  // Dashboard principal
  "dashboard-main": {
    id: "dashboard-main",
    name: "Dashboard Principal",
    category: PRESET_CATEGORIES.DASHBOARD,
    config: {
      type: "container",
      layout: "grid",
      columns: 12,
      gap: 16,
      padding: 24,
      responsive: true,
      breakpoints: { sm: 640, md: 768, lg: 1024, xl: 1280 }
    },
    capabilities: ["resize", "refresh", "export", "fullscreen"],
    lifecycle: { autoInit: true, lazyLoad: false, keepAlive: true },
    style: { background: "var(--bg-primary)", borderRadius: "8px" }
  },
  // Panel padrão
  "panel-default": {
    id: "panel-default",
    name: "Panel Padr\xE3o",
    category: PRESET_CATEGORIES.PANEL,
    config: {
      type: "panel",
      layout: "flex",
      direction: "column",
      padding: 16,
      responsive: true
    },
    capabilities: ["resize", "refresh", "minimize", "close"],
    lifecycle: { autoInit: true, lazyLoad: true, keepAlive: false },
    style: { background: "var(--bg-card)", borderRadius: "8px", boxShadow: "var(--shadow-sm)" }
  },
  // Panel com gráfico
  "panel-chart": {
    id: "panel-chart",
    name: "Panel de Gr\xE1fico",
    category: PRESET_CATEGORIES.PANEL,
    config: {
      type: "panel",
      layout: "flex",
      direction: "column",
      padding: 16,
      minHeight: 300,
      aspectRatio: "16/9"
    },
    capabilities: ["resize", "refresh", "export", "fullscreen", "zoom"],
    lifecycle: { autoInit: false, lazyLoad: true, keepAlive: true },
    style: { background: "var(--bg-card)", borderRadius: "8px" }
  },
  // Panel de tabela
  "panel-table": {
    id: "panel-table",
    name: "Panel de Tabela",
    category: PRESET_CATEGORIES.PANEL,
    config: {
      type: "panel",
      layout: "flex",
      direction: "column",
      padding: 0,
      overflow: "auto"
    },
    capabilities: ["resize", "refresh", "export", "filter", "sort", "paginate"],
    lifecycle: { autoInit: false, lazyLoad: true, keepAlive: false },
    style: { background: "var(--bg-card)", borderRadius: "8px" }
  },
  // Widget pequeno
  "widget-small": {
    id: "widget-small",
    name: "Widget Pequeno",
    category: PRESET_CATEGORIES.WIDGET,
    config: {
      type: "widget",
      layout: "flex",
      direction: "column",
      padding: 12,
      minWidth: 150,
      maxWidth: 300
    },
    capabilities: ["refresh"],
    lifecycle: { autoInit: true, lazyLoad: false, keepAlive: true },
    style: { background: "var(--bg-card)", borderRadius: "6px", boxShadow: "var(--shadow-xs)" }
  },
  // Widget KPI
  "widget-kpi": {
    id: "widget-kpi",
    name: "Widget KPI",
    category: PRESET_CATEGORIES.WIDGET,
    config: {
      type: "widget",
      layout: "flex",
      direction: "column",
      alignItems: "center",
      justifyContent: "center",
      padding: 16,
      minHeight: 120
    },
    capabilities: ["refresh", "drill-down"],
    lifecycle: { autoInit: true, lazyLoad: false, keepAlive: true },
    style: { background: "var(--bg-accent)", borderRadius: "8px", textAlign: "center" }
  },
  // Modal padrão
  "modal-default": {
    id: "modal-default",
    name: "Modal Padr\xE3o",
    category: PRESET_CATEGORIES.MODAL,
    config: {
      type: "modal",
      layout: "flex",
      direction: "column",
      padding: 24,
      maxWidth: 600,
      maxHeight: "90vh",
      centered: true,
      closeOnOverlay: true,
      closeOnEscape: true
    },
    capabilities: ["close", "resize"],
    lifecycle: { autoInit: false, lazyLoad: false, keepAlive: false },
    style: { background: "var(--bg-card)", borderRadius: "12px", boxShadow: "var(--shadow-lg)" }
  },
  // Modal de confirmação
  "modal-confirm": {
    id: "modal-confirm",
    name: "Modal de Confirma\xE7\xE3o",
    category: PRESET_CATEGORIES.MODAL,
    config: {
      type: "modal",
      layout: "flex",
      direction: "column",
      padding: 24,
      maxWidth: 400,
      centered: true,
      closeOnOverlay: false,
      closeOnEscape: false
    },
    capabilities: ["close"],
    lifecycle: { autoInit: false, lazyLoad: false, keepAlive: false },
    style: { background: "var(--bg-card)", borderRadius: "12px", boxShadow: "var(--shadow-lg)" }
  },
  // Sidebar
  "sidebar-default": {
    id: "sidebar-default",
    name: "Sidebar Padr\xE3o",
    category: PRESET_CATEGORIES.SIDEBAR,
    config: {
      type: "sidebar",
      layout: "flex",
      direction: "column",
      width: 280,
      minWidth: 200,
      maxWidth: 400,
      position: "left",
      collapsible: true,
      collapsedWidth: 64
    },
    capabilities: ["collapse", "resize"],
    lifecycle: { autoInit: true, lazyLoad: false, keepAlive: true },
    style: { background: "var(--bg-sidebar)", borderRight: "1px solid var(--border-color)" }
  },
  // Fullscreen
  "fullscreen-default": {
    id: "fullscreen-default",
    name: "Fullscreen Padr\xE3o",
    category: PRESET_CATEGORIES.FULLSCREEN,
    config: {
      type: "fullscreen",
      layout: "flex",
      direction: "column",
      padding: 0,
      zIndex: 9999
    },
    capabilities: ["close", "minimize"],
    lifecycle: { autoInit: false, lazyLoad: false, keepAlive: false },
    style: { background: "var(--bg-primary)", position: "fixed", inset: 0 }
  },
  // Embedded (iframe-like)
  "embedded-default": {
    id: "embedded-default",
    name: "Embedded Padr\xE3o",
    category: PRESET_CATEGORIES.EMBEDDED,
    config: {
      type: "embedded",
      layout: "block",
      padding: 0,
      aspectRatio: "16/9",
      sandbox: true
    },
    capabilities: ["refresh", "fullscreen"],
    lifecycle: { autoInit: false, lazyLoad: true, keepAlive: false },
    style: { background: "var(--bg-muted)", borderRadius: "4px", overflow: "hidden" }
  }
});
function createSlotPresets(options = {}) {
  const { customPresets = {}, allowOverride = true } = options;
  const _logger = createLogger(MODULE_ID);
  let _presets = /* @__PURE__ */ new Map();
  let _customPresets = /* @__PURE__ */ new Map();
  function _loadDefaults() {
    for (const [id, preset] of Object.entries(DEFAULT_PRESETS)) {
      _presets.set(id, { ...preset, isDefault: true });
    }
  }
  _loadDefaults();
  for (const [id, preset] of Object.entries(customPresets)) {
    _customPresets.set(id, { ...preset, isDefault: false, isCustom: true });
  }
  const presets = {
    // Obtém preset por ID
    get(presetId) {
      return _customPresets.get(presetId) || _presets.get(presetId) || null;
    },
    // Lista todos os presets
    list(category = null) {
      const all = [..._presets.values(), ..._customPresets.values()];
      if (category) {
        return all.filter((p) => p.category === category);
      }
      return all;
    },
    // Lista por categoria
    listByCategory() {
      const result = {};
      for (const category of Object.values(PRESET_CATEGORIES)) {
        result[category] = this.list(category);
      }
      return result;
    },
    // Registra preset customizado
    register(preset) {
      if (!preset.id || !preset.name) {
        _logger.error("Preset must have id and name");
        return false;
      }
      if (_presets.has(preset.id) && !allowOverride) {
        _logger.warn(`Cannot override default preset: ${preset.id}`, {});
        return false;
      }
      const fullPreset = {
        category: PRESET_CATEGORIES.CUSTOM,
        config: {},
        capabilities: [],
        lifecycle: { autoInit: true, lazyLoad: true, keepAlive: false },
        style: {},
        ...preset,
        isDefault: false,
        isCustom: true,
        registeredAt: Date.now()
      };
      _customPresets.set(preset.id, fullPreset);
      _logger.debug(`Preset registered: ${preset.id}`, {});
      return true;
    },
    // Remove preset customizado
    unregister(presetId) {
      if (_presets.has(presetId)) {
        _logger.warn(`Cannot remove default preset: ${presetId}`, {});
        return false;
      }
      return _customPresets.delete(presetId);
    },
    // Aplica preset a config de slot
    apply(presetId, overrides = {}) {
      const preset = this.get(presetId);
      if (!preset) {
        _logger.warn(`Preset not found: ${presetId}`, {});
        return null;
      }
      return {
        ...preset.config,
        ...overrides,
        _preset: presetId,
        _capabilities: [...preset.capabilities || []],
        _lifecycle: { ...preset.lifecycle },
        _style: { ...preset.style, ...overrides.style || {} }
      };
    },
    // Cria slot config a partir de preset
    createSlotConfig(presetId, slotId, overrides = {}) {
      const applied = this.apply(presetId, overrides);
      if (!applied) return null;
      return {
        id: slotId,
        preset: presetId,
        config: applied,
        capabilities: applied._capabilities,
        lifecycle: applied._lifecycle,
        style: applied._style
      };
    },
    // Merge presets
    merge(basePresetId, ...presetIds) {
      const base = this.get(basePresetId);
      if (!base) return null;
      let merged = { ...base };
      for (const id of presetIds) {
        const preset = this.get(id);
        if (preset) {
          merged = {
            ...merged,
            config: { ...merged.config, ...preset.config },
            capabilities: [.../* @__PURE__ */ new Set([...merged.capabilities, ...preset.capabilities])],
            lifecycle: { ...merged.lifecycle, ...preset.lifecycle },
            style: { ...merged.style, ...preset.style }
          };
        }
      }
      return merged;
    },
    // Clona preset com modificações
    clone(presetId, newId, modifications = {}) {
      const original = this.get(presetId);
      if (!original) return false;
      const cloned = {
        ...original,
        id: newId,
        name: modifications.name || `${original.name} (Clone)`,
        config: { ...original.config, ...modifications.config || {} },
        capabilities: modifications.capabilities || [...original.capabilities],
        lifecycle: { ...original.lifecycle, ...modifications.lifecycle || {} },
        style: { ...original.style, ...modifications.style || {} }
      };
      return this.register(cloned);
    },
    // Verifica se preset existe
    has(presetId) {
      return _presets.has(presetId) || _customPresets.has(presetId);
    },
    // Obtém categorias
    getCategories() {
      return Object.values(PRESET_CATEGORIES);
    },
    // Reset para padrões
    reset() {
      _customPresets.clear();
      _logger.debug("Custom presets cleared", {});
    },
    // Health check
    healthCheck() {
      return {
        status: "HEALTHY",
        version: VERSION,
        moduleId: MODULE_ID,
        defaultPresets: _presets.size,
        customPresets: _customPresets.size,
        totalPresets: _presets.size + _customPresets.size
      };
    },
    // Info
    info() {
      return {
        moduleId: MODULE_ID,
        version: VERSION,
        categories: Object.keys(PRESET_CATEGORIES),
        defaultPresets: Array.from(_presets.keys()),
        customPresets: Array.from(_customPresets.keys())
      };
    }
  };
  return presets;
}
let _instance = null;
function getSlotPresets(options = {}) {
  if (!_instance) {
    _instance = createSlotPresets(options);
  }
  return _instance;
}
function resetSlotPresets() {
  if (_instance) {
    _instance.reset();
    _instance = null;
  }
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, categories: Object.keys(PRESET_CATEGORIES) };
}
function healthCheck() {
  if (_instance) return _instance.healthCheck();
  return { status: "NOT_INITIALIZED", version: VERSION, moduleId: MODULE_ID };
}
var slot_presets_default = {
  VERSION,
  MODULE_ID,
  PRESET_CATEGORIES,
  DEFAULT_PRESETS,
  createSlotPresets,
  getSlotPresets,
  resetSlotPresets,
  info,
  healthCheck
};
export {
  DEFAULT_PRESETS,
  MODULE_ID,
  PRESET_CATEGORIES,
  VERSION,
  createSlotPresets,
  slot_presets_default as default,
  getSlotPresets,
  healthCheck,
  info,
  resetSlotPresets
};
