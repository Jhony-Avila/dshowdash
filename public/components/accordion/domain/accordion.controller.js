import { createUiPorts } from "/core/runtime/ports-profiles.js";
import { SIDEBAR_INTENTS } from "/core/runtime/events/catalog/sidebar.events.js";
import { LOADING_STATE, ACCORDION_MODE, validateModel } from "./accordion.contracts.js";
import { createAccordionStateManager } from "./accordion.state.js";
import { VERSION, MODULE_ID, ACCORDION_INTENTS, ACCORDION_EVENTS } from "./accordion.constants.js";
import { createIntentHandlers } from "./accordion.intent-handlers.js";
import { createPersistenceHandler } from "./accordion.persistence-handler.js";
class AccordionController {
  _options;
  _stateManager;
  _structure;
  _renderer;
  _permissionsPort;
  _persistenceAdapter;
  _ports;
  _eventBus;
  _initialized;
  _destroyed;
  _unsubs;
  _intentHandlers;
  _persistenceHandler;
  _metrics;
  constructor(options = {}) {
    this._options = options;
    this._stateManager = null;
    this._structure = null;
    this._renderer = null;
    this._permissionsPort = null;
    this._persistenceAdapter = null;
    this._ports = createUiPorts({ moduleId: MODULE_ID });
    this._eventBus = null;
    this._initialized = false;
    this._destroyed = false;
    this._unsubs = [];
    this._intentHandlers = null;
    this._persistenceHandler = null;
    this._metrics = {
      intentsReceived: 0,
      intentsProcessed: 0,
      intentsBlocked: 0,
      stateUpdates: 0,
      renderRequests: 0,
      errors: 0
    };
  }
  // ─────────────────────────────────────────────────────────────
  // INITIALIZATION
  // ─────────────────────────────────────────────────────────────
  async init(config = {}) {
    if (this._initialized) {
      return { success: true, message: "Already initialized" };
    }
    try {
      this._ports.init();
      this._eventBus = this._ports.get("eventBus");
      this._permissionsPort = config.permissionsPort ?? this._ports.get("permissions");
      this._persistenceAdapter = config.persistenceAdapter ?? null;
      this._stateManager = createAccordionStateManager({
        mode: config.mode ?? ACCORDION_MODE.MULTI
      });
      if (config.structure) {
        const validation = validateModel(config.structure);
        if (!validation.valid) {
          this._emit(ACCORDION_EVENTS.ERROR, { errors: validation.errors });
          return { success: false, errors: validation.errors };
        }
        this._structure = config.structure;
        this._stateManager.init(this._structure);
      }
      this._initHandlers();
      this._setupIntentListeners();
      this._setupStateSubscription();
      if (config.autoRestore !== false && this._persistenceAdapter) {
        await this._persistenceHandler.restoreState();
      }
      this._initialized = true;
      this._stateManager.setLoadingState(LOADING_STATE.READY);
      this._emit(ACCORDION_EVENTS.READY, { version: VERSION });
      return { success: true, state: this._stateManager.getState() };
    } catch (error) {
      this._metrics.errors++;
      this._emit(ACCORDION_EVENTS.ERROR, { error: error.message });
      return { success: false, error: error.message };
    }
  }
  _initHandlers() {
    const self = this;
    this._intentHandlers = createIntentHandlers({
      stateManager: this._stateManager,
      structure: () => this._structure,
      permissionsPort: this._permissionsPort,
      metrics: this._metrics,
      emit: (event, data) => this._emit(event, data)
    });
    this._persistenceHandler = createPersistenceHandler({
      stateManager: this._stateManager,
      persistenceAdapter: this._persistenceAdapter,
      metrics: this._metrics,
      emit: (event, data) => this._emit(event, data)
    });
  }
  // ─────────────────────────────────────────────────────────────
  // STRUCTURE MANAGEMENT
  // ─────────────────────────────────────────────────────────────
  setStructure(structure) {
    const validation = validateModel(structure);
    if (!validation.valid) {
      return { success: false, errors: validation.errors };
    }
    this._structure = structure;
    this._stateManager.init(this._structure);
    this._requestRender();
    return { success: true };
  }
  getStructure() {
    return this._structure;
  }
  // ─────────────────────────────────────────────────────────────
  // RENDERER BINDING
  // ─────────────────────────────────────────────────────────────
  setRenderer(renderer) {
    this._renderer = renderer;
    this._requestRender();
    return { success: true };
  }
  _requestRender() {
    this._metrics.renderRequests++;
    if (this._renderer?.render) {
      this._renderer.render(this._structure, this._stateManager.getState());
    }
  }
  // ─────────────────────────────────────────────────────────────
  // INTENT LISTENERS SETUP
  // ─────────────────────────────────────────────────────────────
  _setupIntentListeners() {
    if (!this._eventBus) return;
    const h = this._intentHandlers;
    const handlers = [
      [ACCORDION_INTENTS.TOGGLE_SECTION, h.handleToggleSection],
      [ACCORDION_INTENTS.EXPAND_SECTION, h.handleExpandSection],
      [ACCORDION_INTENTS.COLLAPSE_SECTION, h.handleCollapseSection],
      [ACCORDION_INTENTS.SELECT_ITEM, h.handleSelectItem],
      [ACCORDION_INTENTS.SET_MODE, h.handleSetMode],
      // @ts-expect-error strict migration — TS2531
      [ACCORDION_INTENTS.RESTORE_STATE, () => this._persistenceHandler.restoreState()],
      // @ts-expect-error strict migration — TS2531
      [ACCORDION_INTENTS.PERSIST_STATE, () => this._persistenceHandler.persistState()],
      [SIDEBAR_INTENTS.NAVIGATE, h.handleNavigate]
    ];
    handlers.forEach(([event, handler]) => {
      this._eventBus.on(event, handler);
      this._unsubs.push(() => this._eventBus.off(event, handler));
    });
  }
  _setupStateSubscription() {
    const unsub = this._stateManager.subscribe(({ prevState, nextState }) => {
      this._metrics.stateUpdates++;
      this._emit(ACCORDION_EVENTS.STATE_CHANGED, { prevState, nextState });
      this._requestRender();
      if (this._options.autoPersist !== false && this._persistenceHandler) {
        this._persistenceHandler.debouncedPersist();
      }
    });
    this._unsubs.push(unsub);
  }
  // ─────────────────────────────────────────────────────────────
  // HELPERS
  // ─────────────────────────────────────────────────────────────
  _emit(event, data) {
    if (!this._eventBus?.emit) return;
    this._eventBus.emit(event, {
      source: MODULE_ID,
      ...data,
      timestamp: Date.now()
    });
  }
  // ─────────────────────────────────────────────────────────────
  // PUBLIC API (Programmatic access)
  // ─────────────────────────────────────────────────────────────
  toggleSection(sectionId) {
    this._intentHandlers?.handleToggleSection({ sectionId });
  }
  expandSection(sectionId) {
    this._intentHandlers?.handleExpandSection({ sectionId });
  }
  collapseSection(sectionId) {
    this._intentHandlers?.handleCollapseSection({ sectionId });
  }
  selectItem(itemId) {
    this._intentHandlers?.handleSelectItem({ itemId });
  }
  setMode(mode) {
    this._intentHandlers?.handleSetMode({ mode });
  }
  getState() {
    return this._stateManager?.getState() ?? null;
  }
  getStateManager() {
    return this._stateManager;
  }
  // ─────────────────────────────────────────────────────────────
  // DESTROY
  // ─────────────────────────────────────────────────────────────
  destroy() {
    if (this._destroyed) return { success: true };
    this._persistenceHandler?.clearDebounceTimer();
    this._unsubs.forEach((fn) => {
      try {
        fn();
      } catch {
      }
    });
    this._unsubs = [];
    this._stateManager?.destroy();
    this._stateManager = null;
    this._structure = null;
    this._renderer = null;
    this._eventBus = null;
    this._intentHandlers = null;
    this._persistenceHandler = null;
    this._destroyed = true;
    this._initialized = false;
    return { success: true };
  }
  // ─────────────────────────────────────────────────────────────
  // HEALTH & INFO
  // ─────────────────────────────────────────────────────────────
  getMetrics() {
    return {
      ...this._metrics,
      stateMetrics: this._stateManager?.getMetrics() ?? null
    };
  }
  healthCheck() {
    const stateHealth = this._stateManager?.healthCheck() ?? { status: "UNHEALTHY" };
    const checks = {
      initialized: this._initialized,
      notDestroyed: !this._destroyed,
      hasStateManager: this._stateManager !== null,
      hasStructure: this._structure !== null,
      stateHealthy: stateHealth.status === "HEALTHY",
      eventBusConnected: this._eventBus !== null,
      portsInitialized: this._ports.isInitialized(),
      hasIntentHandlers: this._intentHandlers !== null,
      hasPersistenceHandler: this._persistenceHandler !== null
    };
    const passed = Object.values(checks).filter(Boolean).length;
    const total = Object.keys(checks).length;
    return {
      status: passed === total ? "HEALTHY" : passed >= 6 ? "DEGRADED" : "UNHEALTHY",
      score: passed,
      maxScore: total,
      scoreDisplay: `${passed}/${total}`,
      checks,
      stateHealth,
      metrics: this.getMetrics(),
      version: VERSION,
      moduleId: MODULE_ID,
      timestamp: Date.now()
    };
  }
  info() {
    return {
      moduleId: MODULE_ID,
      version: VERSION,
      initialized: this._initialized,
      destroyed: this._destroyed,
      hasStructure: this._structure !== null,
      hasRenderer: this._renderer !== null,
      hasPersistence: this._persistenceAdapter !== null,
      state: this._stateManager?.getState() ?? null,
      metrics: this.getMetrics(),
      healthCheck: this.healthCheck()
    };
  }
}
function createAccordionController(options = {}) {
  return new AccordionController(options);
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    classAvailable: true,
    factoryAvailable: true,
    intents: Object.keys(ACCORDION_INTENTS),
    events: Object.keys(ACCORDION_EVENTS)
  };
}
function healthCheck() {
  const checks = {
    classAvailable: typeof AccordionController === "function",
    factoryAvailable: typeof createAccordionController === "function",
    intentsValid: Object.keys(ACCORDION_INTENTS).length > 0,
    eventsValid: Object.keys(ACCORDION_EVENTS).length > 0
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return {
    status: passed === total ? "HEALTHY" : "DEGRADED",
    score: passed,
    maxScore: total,
    scoreDisplay: `${passed}/${total}`,
    checks,
    moduleId: MODULE_ID,
    version: VERSION,
    timestamp: Date.now()
  };
}
var accordion_controller_default = {
  VERSION,
  MODULE_ID,
  ACCORDION_INTENTS,
  ACCORDION_EVENTS,
  AccordionController,
  createAccordionController,
  info,
  healthCheck
};
export {
  ACCORDION_EVENTS,
  ACCORDION_INTENTS,
  AccordionController,
  MODULE_ID,
  VERSION,
  createAccordionController,
  accordion_controller_default as default,
  healthCheck,
  info
};
