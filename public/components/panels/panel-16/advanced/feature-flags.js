import { EventBusPort, TelemetryPort, StoragePort, ConfigPort } from "../ports/index.js";
import { LIFECYCLE_EVENTS } from "/core/runtime/events/catalog/lifecycle.events.js";
const MODULE_ID = "panel-16:feature-flags";
const VERSION = "9.3.0-P2-ENTERPRISE";
const STORAGE_KEY = "p16_feature_flags";
const FEATURE_FLAGS_EVENTS = Object.freeze({
  CHANGED: "panel-16:feature-flags:changed"
});
const DEFAULT_FLAGS = Object.freeze({
  // UI Features
  infiniteScroll: { enabled: true, description: "Scroll infinito na listagem" },
  advancedFilters: { enabled: true, description: "Modal de filtros avan\xE7ados" },
  columnPinning: { enabled: true, description: "Fixar colunas esquerda/direita" },
  savedViews: { enabled: true, description: "Visualiza\xE7\xF5es salvas" },
  bulkActions: { enabled: true, description: "A\xE7\xF5es em lote na sele\xE7\xE3o" },
  keyboardNav: { enabled: true, description: "Navega\xE7\xE3o por teclado" },
  contextMenu: { enabled: true, description: "Menu de contexto (bot\xE3o direito)" },
  // Data Features
  autoRefresh: { enabled: true, description: "Atualiza\xE7\xE3o autom\xE1tica" },
  clientSideFilter: { enabled: true, description: "Filtro local instant\xE2neo" },
  dataCache: { enabled: true, description: "Cache de dados em mem\xF3ria" },
  // Advanced Features
  insights: { enabled: true, description: "Painel de insights e gr\xE1ficos" },
  riskAnalysis: { enabled: true, description: "Indicadores de risco" },
  exportPDF: { enabled: true, description: "Exporta\xE7\xE3o para PDF" },
  exportXLSX: { enabled: true, description: "Exporta\xE7\xE3o para Excel" },
  // Experimental
  darkMode: { enabled: false, description: "Tema escuro (experimental)" },
  animations: { enabled: true, description: "Anima\xE7\xF5es de transi\xE7\xE3o" },
  telemetryVerbose: { enabled: false, description: "Telemetria detalhada" },
  devTools: { enabled: false, description: "Ferramentas de desenvolvimento" }
});
class FeatureFlagsClass {
  constructor() {
    this._flags = {};
    this._overrides = /* @__PURE__ */ new Map();
    this._subscribers = /* @__PURE__ */ new Set();
    this._metrics = { checks: 0, toggles: 0, overrides: 0 };
  }
  // Inicializa com flags padrão e carrega persistidos
  init(customDefaults = {}) {
    this._flags = {};
    for (const [key, config] of Object.entries(DEFAULT_FLAGS)) {
      this._flags[key] = { ...config };
    }
    for (const [key, config] of Object.entries(customDefaults)) {
      this._flags[key] = { ...this._flags[key], ...config };
    }
    try {
      const saved = StoragePort.local.get(STORAGE_KEY);
      if (saved) {
        for (const [key, enabled] of Object.entries(saved)) {
          if (this._flags[key]) {
            this._flags[key].enabled = enabled;
          }
        }
      }
    } catch (e) {
    }
    const configFlags = ConfigPort.get("featureFlags.panel16");
    if (configFlags) {
      for (const [key, enabled] of Object.entries(configFlags)) {
        if (this._flags[key]) {
          this._flags[key].enabled = enabled;
          this._flags[key].source = "config";
        }
      }
    }
    TelemetryPort.track(LIFECYCLE_EVENTS.INIT, { feature: "feature-flags", count: Object.keys(this._flags).length });
    return this;
  }
  // Verifica se flag está habilitada
  isEnabled(flag) {
    this._metrics.checks++;
    if (this._overrides.has(flag)) {
      return this._overrides.get(flag);
    }
    return this._flags[flag]?.enabled ?? false;
  }
  // Alias
  is(flag) {
    return this.isEnabled(flag);
  }
  // Habilita flag
  enable(flag, options = {}) {
    return this._setFlag(flag, true, options);
  }
  // Desabilita flag
  disable(flag, options = {}) {
    return this._setFlag(flag, false, options);
  }
  // Toggle
  toggle(flag, options = {}) {
    const current = this.isEnabled(flag);
    return this._setFlag(flag, !current, options);
  }
  // Set flag value
  _setFlag(flag, enabled, options = {}) {
    if (!this._flags[flag]) {
      this._flags[flag] = { enabled, description: options.description || "Custom flag" };
    } else {
      this._flags[flag].enabled = enabled;
    }
    this._metrics.toggles++;
    if (options.persist !== false) {
      this._persist();
    }
    TelemetryPort.track(LIFECYCLE_EVENTS.UPDATED, { feature: "feature-flags", flag, enabled });
    EventBusPort.emit(FEATURE_FLAGS_EVENTS.CHANGED, { flag, enabled, source: MODULE_ID, timestamp: Date.now() });
    this._notify(flag, enabled);
    return this;
  }
  // Override temporário (não persiste)
  override(flag, enabled) {
    this._overrides.set(flag, enabled);
    this._metrics.overrides++;
    TelemetryPort.track(LIFECYCLE_EVENTS.UPDATED, { feature: "feature-flags", action: "override", flag, enabled });
    this._notify(flag, enabled);
    return this;
  }
  // Remove override
  clearOverride(flag) {
    const had = this._overrides.delete(flag);
    if (had) this._notify(flag, this._flags[flag]?.enabled);
    return had;
  }
  // Remove todos overrides
  clearAllOverrides() {
    this._overrides.clear();
    return this;
  }
  // Lista todas as flags
  list() {
    return Object.entries(this._flags).map(([key, config]) => ({
      key,
      enabled: this.isEnabled(key),
      // @ts-expect-error TS migration - TS2339
      description: config.description,
      hasOverride: this._overrides.has(key),
      // @ts-expect-error TS migration - TS2339
      source: config.source || "default"
    }));
  }
  // Obtém todas as flags habilitadas
  getEnabled() {
    return this.list().filter((f) => f.enabled).map((f) => f.key);
  }
  // Obtém todas as flags desabilitadas
  getDisabled() {
    return this.list().filter((f) => !f.enabled).map((f) => f.key);
  }
  // Batch enable/disable
  batch(flags) {
    for (const [flag, enabled] of Object.entries(flags)) {
      this._setFlag(flag, enabled, { persist: false });
    }
    this._persist();
    return this;
  }
  // Subscriber para mudanças
  subscribe(callback, flags = null) {
    const subscription = { callback, flags };
    this._subscribers.add(subscription);
    return () => this._subscribers.delete(subscription);
  }
  _notify(flag, enabled) {
    for (const sub of this._subscribers) {
      if (!sub.flags || sub.flags.includes(flag)) {
        try {
          sub.callback({ flag, enabled });
        } catch (e) {
        }
      }
    }
  }
  // Persistência
  _persist() {
    try {
      const toSave = {};
      for (const [key, config] of Object.entries(this._flags)) {
        if (config.enabled !== DEFAULT_FLAGS[key]?.enabled) {
          toSave[key] = config.enabled;
        }
      }
      StoragePort.local.set(STORAGE_KEY, toSave);
    } catch (e) {
    }
  }
  // Reset para defaults
  reset() {
    this._overrides.clear();
    for (const [key, config] of Object.entries(DEFAULT_FLAGS)) {
      this._flags[key] = { ...config };
    }
    StoragePort.local.remove(STORAGE_KEY);
    TelemetryPort.track(LIFECYCLE_EVENTS.DESTROYED, { feature: "feature-flags", action: "reset" });
    return this;
  }
  // Executa callback se flag habilitada
  when(flag, callback, fallback = null) {
    if (this.isEnabled(flag)) {
      return callback();
    }
    return fallback ? fallback() : void 0;
  }
  // Observability
  getMetrics() {
    return { ...this._metrics, flagCount: Object.keys(this._flags).length, overrideCount: this._overrides.size };
  }
  healthCheck() {
    return {
      status: "HEALTHY",
      moduleId: MODULE_ID,
      version: VERSION,
      checks: { initialized: Object.keys(this._flags).length > 0 },
      metrics: this.getMetrics(),
      p24Instrumented: true,
      timestamp: Date.now()
    };
  }
  info() {
    return {
      moduleId: MODULE_ID,
      version: VERSION,
      flags: this.list(),
      enabled: this.getEnabled(),
      disabled: this.getDisabled(),
      metrics: this.getMetrics()
    };
  }
}
const FeatureFlags = new FeatureFlagsClass();
var feature_flags_default = FeatureFlags;
export {
  FEATURE_FLAGS_EVENTS,
  FeatureFlags,
  MODULE_ID,
  VERSION,
  feature_flags_default as default
};
