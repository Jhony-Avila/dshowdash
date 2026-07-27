// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.2.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.accordion.telemetry
// PURPOSE: Metrics and observability for Accordion component
// ───────────────────────────────────────────────────────────────
// @contract ACCORDION_TELEMETRY - AccordionTelemetry class for metrics
// @contract INIT - init() sets up event listeners and starts tracking
// @contract TRACK - trackRender(duration), trackCustomEvent(name, data)
// @contract GET_METRICS - getMetrics() returns session metrics
// @contract GET_INTERACTIONS - getInteractions() returns interaction log
// @contract GET_REPORT - getReport() returns full telemetry report
// @contract RESET - reset() clears all metrics
// @contract DESTROY - destroy() cleans up listeners
// @contract HEALTH - healthCheck() and info() for observability
// @contract FACTORY - createAccordionTelemetry(options) factory function
// ───────────────────────────────────────────────────────────────
// IMPORTS: ACCORDION_EVENTS, TELEMETRY_EVENTS from /core/runtime/events/index.js
// PROVIDES: AccordionTelemetry, createAccordionTelemetry, healthCheck, info, VERSION, MODULE_ID
// @changelog v1.2.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v1.1.0-P18EC: Migrated 'telemetry:track' to TELEMETRY_EVENTS.TRACK
// ═══════════════════════════════════════════════════════════════
'use strict';

import { ACCORDION_EVENTS } from '/core/runtime/events/catalog/sidebar.events.js';
import { TELEMETRY_EVENTS } from '/core/runtime/events/catalog/telemetry.events.js';

export const VERSION = '1.2.0-P2-ENTERPRISE';
export const MODULE_ID = 'components.accordion.telemetry';

// ═══════════════════════════════════════════════════════════════
// TELEMETRY CLASS
// ═══════════════════════════════════════════════════════════════

export class AccordionTelemetry {
  _eventBus: { emit?: (event: string, data: unknown) => void; on?: (event: string, handler: Function) => void; off?: (event: string, handler: Function) => void } | null;
  _telemetryCore: { track?: (event: string, data: unknown) => void } | null;
  _enabled: boolean;
  _debugMode: boolean;
  _unsubs: Array<() => void>;
  _initialized: boolean;
  _metrics: { sessionStart: number; sectionToggles: number; sectionExpands: number; sectionCollapses: number; itemSelections: number; itemsBlocked: number; persistSuccess: number; persistFail: number; restoreSuccess: number; restoreFail: number; errors: number; renders: number; interactions: Array<Record<string, unknown>> };
  _interactionLimit: number;

  constructor(options: { eventBus?: Record<string, unknown>; telemetryCore?: Record<string, unknown>; enabled?: boolean; debug?: boolean; interactionLimit?: number } = {}) {
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
      return { success: true, message: 'Already initialized' };
    }

    if (!this._enabled) {
      this._initialized = true;
      return { success: true, message: 'Telemetry disabled' };
    }

    this._setupListeners();
    this._initialized = true;

    this._track('accordion.telemetry.init', { timestamp: Date.now() });

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

    // @ts-expect-error strict migration — TS2345
    handlers.forEach(([event, handler]: [string, Function]) => {
      // @ts-expect-error strict migration — TS2531, TS2722
      this._eventBus.on(event, handler);
      // @ts-expect-error strict migration — TS2531, TS2722
      this._unsubs.push(() => this._eventBus.off(event, handler));
    });
  }

  // ─────────────────────────────────────────────────────────────
  // EVENT HANDLERS
  // ─────────────────────────────────────────────────────────────

  _onSectionToggled(payload: Record<string, any>) {
    this._metrics.sectionToggles++;
    if (payload.expanded) {
      this._metrics.sectionExpands++;
    } else {
      this._metrics.sectionCollapses++;
    }

    this._recordInteraction({
      type: 'section_toggle',
      sectionId: payload.sectionId,
      expanded: payload.expanded,
      timestamp: Date.now()
    });

    this._track('accordion.section.toggled', {
      sectionId: payload.sectionId,
      expanded: payload.expanded
    });
  }

  _onItemSelected(payload: Record<string, any>) {
    this._metrics.itemSelections++;

    this._recordInteraction({
      type: 'item_select',
      itemId: payload.itemId,
      itemType: payload.item?.type,
      timestamp: Date.now()
    });

    this._track('accordion.item.selected', {
      itemId: payload.itemId,
      itemType: payload.item?.type,
      target: payload.item?.target
    });
  }

  _onItemBlocked(payload: Record<string, any>) {
    this._metrics.itemsBlocked++;

    this._recordInteraction({
      type: 'item_blocked',
      itemId: payload.itemId ?? payload.sectionId,
      reason: payload.reason,
      timestamp: Date.now()
    });

    this._track('accordion.item.blocked', {
      itemId: payload.itemId,
      sectionId: payload.sectionId,
      reason: payload.reason
    });
  }

  _onStateChanged(payload: Record<string, any>) {
    this._track('accordion.state.changed', {
      openSectionsCount: payload.nextState?.openSections?.length,
      activeItemId: payload.nextState?.activeItemId,
      mode: payload.nextState?.mode
    });
  }

  _onPersistOk(payload: Record<string, any>) {
    this._metrics.persistSuccess++;
    this._track('accordion.persist.ok', { timestamp: payload.timestamp });
  }

  _onPersistFail(payload: Record<string, any>) {
    this._metrics.persistFail++;
    this._track('accordion.persist.fail', { error: payload.error });
  }

  _onRestoreOk(payload: Record<string, any>) {
    this._metrics.restoreSuccess++;
    this._track('accordion.restore.ok', { timestamp: payload.timestamp });
  }

  _onRestoreFail(payload: Record<string, any>) {
    this._metrics.restoreFail++;
    this._track('accordion.restore.fail', { error: payload.error });
  }

  _onError(payload: Record<string, any>) {
    this._metrics.errors++;
    this._track('accordion.error', {
      error: payload.error,
      errors: payload.errors
    });
  }

  // ─────────────────────────────────────────────────────────────
  // INTERACTION RECORDING
  // ─────────────────────────────────────────────────────────────

  _recordInteraction(interaction: Record<string, unknown>) {
    if (this._metrics.interactions.length >= this._interactionLimit) {
      this._metrics.interactions.shift();
    }
    this._metrics.interactions.push(interaction);
  }

  // ─────────────────────────────────────────────────────────────
  // TRACK (Send to telemetry core)
  // ─────────────────────────────────────────────────────────────

  _track(eventName: string, data: Record<string, unknown> = {}) {
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

    // P18EC: Use TELEMETRY_EVENTS.TRACK instead of hardcoded string
    if (this._eventBus?.emit) {
      this._eventBus.emit(TELEMETRY_EVENTS.TRACK, payload);
    }
  }

  // ─────────────────────────────────────────────────────────────
  // PUBLIC API
  // ─────────────────────────────────────────────────────────────

  trackRender(duration: number) {
    this._metrics.renders++;
    this._track('accordion.render', { duration });
  }

  trackCustomEvent(eventName: string, data: Record<string, unknown> = {}) {
    this._track(`accordion.custom.${eventName}`, data);
  }

  // ─────────────────────────────────────────────────────────────
  // METRICS & REPORTS
  // ─────────────────────────────────────────────────────────────

  getMetrics() {
    const sessionDuration = Date.now() - this._metrics.sessionStart;
    const interactionsPerMinute = this._metrics.interactions.length / (sessionDuration / 60000) || 0;

    return {
      ...this._metrics,
      sessionDuration,
      interactionsPerMinute: Math.round(interactionsPerMinute * 100) / 100,
      interactionsCount: this._metrics.interactions.length,
      interactions: undefined as undefined
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
      generatedAt: new Date().toISOString()
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

    this._track('accordion.telemetry.reset', { timestamp: Date.now() });

    return { success: true };
  }

  destroy() {
    this._unsubs.forEach((fn: () => void) => {
      try { fn(); } catch {}
    });
    this._unsubs = [];

    this._track('accordion.telemetry.destroy', {
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
      status: passed >= 3 ? 'HEALTHY' : passed >= 2 ? 'DEGRADED' : 'UNHEALTHY',
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

// ═══════════════════════════════════════════════════════════════
// FACTORY FUNCTION
// ═══════════════════════════════════════════════════════════════

export function createAccordionTelemetry(options: { eventBus?: Record<string, unknown>; telemetryCore?: Record<string, unknown>; enabled?: boolean; debug?: boolean; interactionLimit?: number } = {}) {
  const telemetry = new AccordionTelemetry(options);
  telemetry.init();
  return telemetry;
}

// ═══════════════════════════════════════════════════════════════
// MODULE LEVEL EXPORTS
// ═══════════════════════════════════════════════════════════════

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    classAvailable: true,
    factoryAvailable: true
  };
}

export function healthCheck() {
  return {
    status: 'HEALTHY',
    moduleId: MODULE_ID,
    version: VERSION,
    checks: {
      classAvailable: true,
      factoryAvailable: true
    },
    timestamp: Date.now()
  };
}

// ═══════════════════════════════════════════════════════════════
// DEFAULT EXPORT
// ═══════════════════════════════════════════════════════════════

export default {
  VERSION,
  MODULE_ID,
  AccordionTelemetry,
  createAccordionTelemetry,
  info,
  healthCheck
};
