const VERSION = "2.4.0-P2-ENTERPRISE";
const MODULE_ID = "components.accordion.ui.view";
import { buildItemTrigger, buildSectionTrigger, getDefaultRegion } from "./uarps-triggers.js";
import { buildHTML, buildErrorState, setIconResolver, setUarpsRegion } from "./html-builders.js";
import { createEventHandlers } from "./event-handlers.js";
class AccordionView {
  _container;
  _eventBus;
  _iconRegistry;
  _structure;
  _state;
  _initialized;
  _abortController;
  _uarpsEnabled;
  _uarpsRegion;
  _iconResolver;
  _eventHandlers;
  _metrics;
  constructor(options = {}) {
    this._container = null;
    this._eventBus = options.eventBus ?? null;
    this._iconRegistry = options.iconRegistry ?? null;
    this._structure = null;
    this._state = null;
    this._initialized = false;
    this._abortController = null;
    this._uarpsEnabled = options.uarpsEnabled !== false;
    this._uarpsRegion = options.uarpsRegion ?? null;
    this._iconResolver = options.iconResolver ?? null;
    this._eventHandlers = null;
    this._metrics = {
      renders: 0,
      clicks: 0,
      errors: 0
    };
    if (this._iconResolver) {
      setIconResolver(this._iconResolver);
    }
    if (this._uarpsRegion) {
      setUarpsRegion(this._uarpsRegion);
    }
  }
  // ─────────────────────────────────────────────────────────────
  // INITIALIZATION
  // ─────────────────────────────────────────────────────────────
  init(container) {
    if (this._initialized) {
      return { success: true, message: "Already initialized" };
    }
    if (!container) {
      return { success: false, error: "Container required" };
    }
    this._container = typeof container === "string" ? document.querySelector(container) : container;
    if (!this._container) {
      return { success: false, error: "Container not found" };
    }
    this._abortController = new AbortController();
    this._setupEventDelegation();
    this._initialized = true;
    return { success: true };
  }
  // ─────────────────────────────────────────────────────────────
  // RENDER (Main entry point)
  // ─────────────────────────────────────────────────────────────
  render(structure, state) {
    if (!this._initialized || !this._container) {
      this._metrics.errors++;
      return { success: false, error: "Not initialized" };
    }
    this._structure = structure;
    this._state = state;
    this._metrics.renders++;
    try {
      const html = buildHTML(structure, state, this._uarpsEnabled);
      this._container.innerHTML = html;
      return { success: true, rendered: true };
    } catch (error) {
      this._metrics.errors++;
      this._renderError(error.message);
      return { success: false, error: error.message };
    }
  }
  // ─────────────────────────────────────────────────────────────
  // EVENT DELEGATION
  // ─────────────────────────────────────────────────────────────
  _setupEventDelegation() {
    if (!this._container || !this._abortController) return;
    const self = this;
    this._eventHandlers = createEventHandlers({
      container: this._container,
      eventBus: this._eventBus,
      findItem(itemId) {
        return self._findItem(itemId);
      },
      metrics: this._metrics
    });
    this._eventHandlers.setup(this._abortController);
  }
  // ─────────────────────────────────────────────────────────────
  // UARPS HELPERS
  // ─────────────────────────────────────────────────────────────
  setUarpsEnabled(enabled) {
    this._uarpsEnabled = enabled;
  }
  isUarpsEnabled() {
    return this._uarpsEnabled;
  }
  setUarpsRegion(region) {
    this._uarpsRegion = region;
    setUarpsRegion(region);
  }
  getUarpsRegion() {
    return this._uarpsRegion || getDefaultRegion();
  }
  // ─────────────────────────────────────────────────────────────
  // ICON RESOLVER HELPERS
  // ─────────────────────────────────────────────────────────────
  setIconResolver(resolver) {
    this._iconResolver = resolver;
    setIconResolver(resolver);
  }
  getIconResolver() {
    return this._iconResolver;
  }
  // ─────────────────────────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────────────────────────
  _findItem(itemId) {
    if (!this._structure?.sections) return null;
    for (let i = 0; i < this._structure.sections.length; i++) {
      const section = this._structure.sections[i];
      const items = section.items || [];
      for (let j = 0; j < items.length; j++) {
        if (items[j].id === itemId) return items[j];
      }
    }
    return null;
  }
  _renderError(message) {
    if (!this._container) return;
    this._container.innerHTML = buildErrorState(this._uarpsEnabled);
  }
  // ─────────────────────────────────────────────────────────────
  // DESTROY
  // ─────────────────────────────────────────────────────────────
  destroy() {
    if (this._abortController) {
      this._abortController.abort();
      this._abortController = null;
    }
    if (this._container) {
      this._container.innerHTML = "";
    }
    this._container = null;
    this._structure = null;
    this._state = null;
    this._eventHandlers = null;
    this._initialized = false;
    return { success: true };
  }
  // ─────────────────────────────────────────────────────────────
  // METRICS
  // ─────────────────────────────────────────────────────────────
  getMetrics() {
    return { ...this._metrics };
  }
  // ─────────────────────────────────────────────────────────────
  // INSTANCE HEALTH & INFO
  // ─────────────────────────────────────────────────────────────
  healthCheck() {
    const checks = {
      initialized: this._initialized,
      hasContainer: this._container !== null,
      hasStructure: this._structure !== null,
      hasState: this._state !== null,
      noErrors: this._metrics.errors === 0,
      uarpsEnabled: this._uarpsEnabled,
      hasIconResolver: this._iconResolver !== null,
      uarpsRegionConfigured: this._uarpsRegion !== null
    };
    const passed = Object.values(checks).filter(Boolean).length;
    const total = Object.keys(checks).length;
    return {
      status: passed >= 6 ? "HEALTHY" : passed >= 4 ? "DEGRADED" : "UNHEALTHY",
      score: passed,
      maxScore: total,
      scoreDisplay: `${passed}/${total}`,
      checks,
      metrics: this.getMetrics(),
      version: VERSION,
      moduleId: MODULE_ID,
      uarpsRegion: this.getUarpsRegion(),
      triggerPattern: "trigger:navigation:item-{id}",
      timestamp: Date.now()
    };
  }
  info() {
    return {
      moduleId: MODULE_ID,
      version: VERSION,
      initialized: this._initialized,
      hasContainer: this._container !== null,
      sectionsCount: this._structure?.sections?.length ?? 0,
      uarpsEnabled: this._uarpsEnabled,
      uarpsRegion: this.getUarpsRegion(),
      hasIconResolver: this._iconResolver !== null,
      triggerPattern: "trigger:navigation:item-{id} | trigger:navigation:section-{id}",
      cssSource: "sidebar/styles/ (Single Source of Truth)",
      metrics: this.getMetrics(),
      healthCheck: this.healthCheck()
    };
  }
}
function createAccordionView(options = {}) {
  options = options || {};
  return new AccordionView(options);
}
function healthCheck() {
  const checks = {
    versionDefined: !!VERSION,
    moduleIdDefined: !!MODULE_ID,
    classAvailable: typeof AccordionView === "function",
    factoryAvailable: typeof createAccordionView === "function",
    uarpsIntegrated: true,
    uarpsRegionConfigurable: true,
    iconResolverInjectable: true,
    usesSidebarClasses: true,
    unifiedTriggerPattern: true,
    noSidebarImports: true
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return {
    status: passed === total ? "HEALTHY" : "DEGRADED",
    score: passed,
    maxScore: total,
    scoreDisplay: `${passed}/${total}`,
    checks,
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    classAvailable: true,
    factoryAvailable: true,
    uarpsIntegrated: true,
    uarpsRegionConfigurable: true,
    iconResolverInjectable: true,
    triggerPattern: "trigger:navigation:item-{id} | trigger:navigation:section-{id}",
    iconSource: "injected via options.iconResolver (decoupled from sidebar)",
    cssSource: "sidebar/styles/ (Single Source of Truth)",
    healthCheck: healthCheck(),
    timestamp: Date.now()
  };
}
var accordion_view_default = {
  VERSION,
  MODULE_ID,
  AccordionView,
  createAccordionView,
  buildItemTrigger,
  buildSectionTrigger,
  info,
  healthCheck
};
export {
  AccordionView,
  MODULE_ID,
  VERSION,
  buildItemTrigger,
  buildSectionTrigger,
  createAccordionView,
  accordion_view_default as default,
  healthCheck,
  info
};
