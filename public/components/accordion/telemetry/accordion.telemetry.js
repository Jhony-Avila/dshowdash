import { ACCORDION_EVENTS } from "/core/runtime/events/catalog/sidebar.events.js";
import { TELEMETRY_EVENTS } from "/core/runtime/events/catalog/telemetry.events.js";
const VERSION = "1.2.0-P2-ENTERPRISE";
const MODULE_ID = "components.accordion.telemetry";
class AccordionTelemetry {
  _eventBus;
  _telemetryCore;
  _enabled;
  _debugMode;
  _unsubs;
  _initialized;
  _metrics;
  _interactionLimit;
  constructor(options = {}) {
    this._eventBus = options.eventBus ?? null;
    this._telemetryCore = options.telemetryCore ?? null;
    this._enabled = options.enabled !== false;
    this._debugMode = options.debug ?? false;
    this._unsubs = [];
    this._initialized = false;
    this._metrics = {
      sessionStart: Date.now(),
      sectionToggles: 0,
      sectionExpands: 0,
      sectionCollapses: 0,
      itemSelections: 0,
      itemsBlocked: 0,
      persistSuccess: 0,
      persistFail: 0,
      restoreSuccess: 0,
      restoreFail: 0,
      errors: 0,
      renders: 0,
      interactions: []
    };
    this._interactionLimit = options.interactionLimit ?? 100;
  }
  // ─────────────────────────────────────────────────────────────
  // INITIALIZATION
  // ─────────────────────────────────────────────────────────────
  init() {
    if (this._initialized) {
      return { success: true, message: "Already initialized" };
    }
    if (!this._enabled) {
      this._initialized = true;
      return { success: true, message: "Telemetry disabled" };
    }
    this._setupListeners();
    this._initialized = true;
    this._track("accordion.telemetry.init", { timestamp: Date.now() });
    return { success: true };
  }
  // ─────────────────────────────────────────────────────────────
  // EVENT LISTENERS
  // ─────────────────────────────────────────────────────────────
  _setupListeners() {
    if (!this._eventBus) return;
    const handlers = [
      [ACCORDION_EVENTS.SECTION_TOGGLED, this._onSectionToggled.bind(this)],
      [ACCORDION_EVENTS.ITEM_SELECTED, this._onItemSelected.bind(this)],
      [ACCORDION_EVENTS.ITEM_BLOCKED, this._onItemBlocked.bind(this)],
      [ACCORDION_EVENTS.STATE_CHANGED, this._onStateChanged.bind(this)],
      [ACCORDION_EVENTS.PERSIST_OK, this._onPersistOk.bind(this)],
      [ACCORDION_EVENTS.PERSIST_FAIL, this._onPersistFail.bind(this)],
      [ACCORDION_EVENTS.RESTORE_OK, this._onRestoreOk.bind(this)],
      [ACCORDION_EVENTS.RESTORE_FAIL, this._onRestoreFail.bind(this)],
      [ACCORDION_EVENTS.ERROR, this._onError.bind(this)]
    ];
    handlers.forEach(([event, handler]) => {
      this._eventBus.on(event, handler);
      this._unsubs.push(() => this._eventBus.off(event, handler));
    });
  }
  // ─────────────────────────────────────────────────────────────
  // EVENT HANDLERS
  // ─────────────────────────────────────────────────────────────
  _onSectionToggled(payload) {
    this._metrics.sectionToggles++;
    if (payload.expanded) {
      this._metrics.sectionExpands++;
    } else {
      this._metrics.sectionCollapses++;
    }
    this._recordInteraction({
      type: "section_toggle",
      sectionId: payload.sectionId,
      expanded: payload.expanded,
      timestamp: Date.now()
    });
    this._track("accordion.section.toggled", {
      sectionId: payload.sectionId,
      expanded: payload.expanded
    });
  }
  _onItemSelected(payload) {
    this._metrics.itemSelections++;
    this._recordInteraction({
      type: "item_select",
      itemId: payload.itemId,
      itemType: payload.item?.type,
      timestamp: Date.now()
    });
    this._track("accordion.item.selected", {
      itemId: payload.itemId,
      itemType: payload.item?.type,
      target: payload.item?.target
    });
  }
  _onItemBlocked(payload) {
    this._metrics.itemsBlocked++;
    this._recordInteraction({
      type: "item_blocked",
      itemId: payload.itemId ?? payload.sectionId,
      reason: payload.reason,
      timestamp: Date.now()
    });
    this._track("accordion.item.blocked", {
      itemId: payload.itemId,
      sectionId: payload.sectionId,
      reason: payload.reason
    });
  }
  _onStateChanged(payload) {
    this._track("accordion.state.changed", {
      openSectionsCount: payload.nextState?.openSections?.length,
      activeItemId: payload.nextState?.activeItemId,
      mode: payload.nextState?.mode
    });
  }
  _onPersistOk(payload) {
    this._metrics.persistSuccess++;
    this._track("accordion.persist.ok", { timestamp: payload.timestamp });
  }
  _onPersistFail(payload) {
    this._metrics.persistFail++;
    this._track("accordion.persist.fail", { error: payload.error });
  }
  _onRestoreOk(payload) {
    this._metrics.restoreSuccess++;
    this._track("accordion.restore.ok", { timestamp: payload.timestamp });
  }
  _onRestoreFail(payload) {
    this._metrics.restoreFail++;
    this._track("accordion.restore.fail", { error: payload.error });
  }
  _onError(payload) {
    this._metrics.errors++;
    this._track("accordion.error", {
      error: payload.error,
      errors: payload.errors
    });
  }
  // ─────────────────────────────────────────────────────────────
  // INTERACTION RECORDING
  // ─────────────────────────────────────────────────────────────
  _recordInteraction(interaction) {
    if (this._metrics.interactions.length >= this._interactionLimit) {
      this._metrics.interactions.shift();
    }
    this._metrics.interactions.push(interaction);
  }
  // ─────────────────────────────────────────────────────────────
  // TRACK (Send to telemetry core)
  // ─────────────────────────────────────────────────────────────
  _track(eventName, data = {}) {
    if (!this._enabled) return;
    const payload = {
      event: eventName,
      source: MODULE_ID,
      ...data,
      timestamp: Date.now()
    };
    if (this._debugMode) {
      console.debug(`[AccordionTelemetry] ${eventName}`, payload);
    }
    if (this._telemetryCore?.track) {
      this._telemetryCore.track(eventName, payload);
    }
    if (this._eventBus?.emit) {
      this._eventBus.emit(TELEMETRY_EVENTS.TRACK, payload);
    }
  }
  // ─────────────────────────────────────────────────────────────
  // PUBLIC API
  // ─────────────────────────────────────────────────────────────
  trackRender(duration) {
    this._metrics.renders++;
    this._track("accordion.render", { duration });
  }
  trackCustomEvent(eventName, data = {}) {
    this._track(`accordion.custom.${eventName}`, data);
  }
  // ─────────────────────────────────────────────────────────────
  // METRICS & REPORTS
  // ─────────────────────────────────────────────────────────────
  getMetrics() {
    const sessionDuration = Date.now() - this._metrics.sessionStart;
    const interactionsPerMinute = this._metrics.interactions.length / (sessionDuration / 6e4) || 0;
    return {
      ...this._metrics,
      sessionDuration,
      interactionsPerMinute: Math.round(interactionsPerMinute * 100) / 100,
      interactionsCount: this._metrics.interactions.length,
      interactions: void 0
    };
  }
  getInteractions() {
    return [...this._metrics.interactions];
  }
  getReport() {
    const metrics = this.getMetrics();
    const recentInteractions = this._metrics.interactions.slice(-10);
    return {
      moduleId: MODULE_ID,
      version: VERSION,
      enabled: this._enabled,
      initialized: this._initialized,
      metrics,
      recentInteractions,
      summary: {
        totalToggles: metrics.sectionToggles,
        totalSelections: metrics.itemSelections,
        blockedAttempts: metrics.itemsBlocked,
        persistenceSuccess: metrics.persistSuccess,
        persistenceFailures: metrics.persistFail,
        errors: metrics.errors
      },
      generatedAt: (/* @__PURE__ */ new Date()).toISOString()
    };
  }
  // ─────────────────────────────────────────────────────────────
  // RESET & DESTROY
  // ─────────────────────────────────────────────────────────────
  reset() {
    this._metrics = {
      sessionStart: Date.now(),
      sectionToggles: 0,
      sectionExpands: 0,
      sectionCollapses: 0,
      itemSelections: 0,
      itemsBlocked: 0,
      persistSuccess: 0,
      persistFail: 0,
      restoreSuccess: 0,
      restoreFail: 0,
      errors: 0,
      renders: 0,
      interactions: []
    };
    this._track("accordion.telemetry.reset", { timestamp: Date.now() });
    return { success: true };
  }
  destroy() {
    this._unsubs.forEach((fn) => {
      try {
        fn();
      } catch {
      }
    });
    this._unsubs = [];
    this._track("accordion.telemetry.destroy", {
      finalMetrics: this.getMetrics()
    });
    this._eventBus = null;
    this._telemetryCore = null;
    this._initialized = false;
    return { success: true };
  }
  // ─────────────────────────────────────────────────────────────
  // HEALTH & INFO
  // ─────────────────────────────────────────────────────────────
  healthCheck() {
    const checks = {
      initialized: this._initialized,
      enabled: this._enabled,
      hasEventBus: this._eventBus !== null,
      noErrors: this._metrics.errors === 0
    };
    const passed = Object.values(checks).filter(Boolean).length;
    const total = Object.keys(checks).length;
    return {
      status: passed >= 3 ? "HEALTHY" : passed >= 2 ? "DEGRADED" : "UNHEALTHY",
      score: `${passed}/${total}`,
      checks,
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
      enabled: this._enabled,
      debugMode: this._debugMode,
      metrics: this.getMetrics(),
      healthCheck: this.healthCheck()
    };
  }
}
function createAccordionTelemetry(options = {}) {
  const telemetry = new AccordionTelemetry(options);
  telemetry.init();
  return telemetry;
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    classAvailable: true,
    factoryAvailable: true
  };
}
function healthCheck() {
  return {
    status: "HEALTHY",
    moduleId: MODULE_ID,
    version: VERSION,
    checks: {
      classAvailable: true,
      factoryAvailable: true
    },
    timestamp: Date.now()
  };
}
var accordion_telemetry_default = {
  VERSION,
  MODULE_ID,
  AccordionTelemetry,
  createAccordionTelemetry,
  info,
  healthCheck
};
export {
  AccordionTelemetry,
  MODULE_ID,
  VERSION,
  createAccordionTelemetry,
  accordion_telemetry_default as default,
  healthCheck,
  info
};
