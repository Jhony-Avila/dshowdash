

// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (11.0.0-FULL-MIGRATION)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-nav-admin.core.integration-layer
// PURPOSE: Integration Layer — Orquestra 55 módulos migrados com o index.js
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   isEnabled from ../config/feature-flags.js
//   + 50 módulos migrados (FASES 1-9)
//
// PROVIDES:
//   VERSION, MODULE_ID
//   initIntegration(options) — Cria instâncias de todos os managers
//   mountIntegration(integration, refs, container) — Monta componentes UI
//   unmountIntegration(integration) — Destrói na ordem inversa
//   getIntegrationHealth(integration) — HealthCheck consolidado
//   info(), healthCheck()
//
// @origin New orchestrator for BRIEFING-INTEGRATION-NAV-ADMIN.md
// @changelog
//   11.0.0-FULL-MIGRATION: Initial creation — Integração completa
// ═══════════════════════════════════════════════════════════════
'use strict';

// ─── FASE 1 — Foundation ───
import { isEnabled } from '../config/feature-flags.js';
import { createErrorBoundary } from './error-boundary.js';
import { createStateMachine, STATES } from './state-machine.js';
import { initFeature, safeExecute } from './feature-registry.js';

// ─── FASE 2 — Data Layer ───
import { createCircuitBreaker } from '../data/circuit-breaker.js';
import { createSmartCache } from '../data/smart-cache.js';
import { createDebouncedFetch, debounce } from '../data/debounced-request.js';
import { memoize } from '../data/memoize.js';
import { createFuzzySearch } from '../data/fuzzy-search.js';
import { createDeltaManager } from '../data/delta-updates.js';
import { createBulkOperations } from '../data/bulk-operations.js';
import { createSearchHistory } from '../data/search-history.js';

// ─── FASE 3 — UI Core ───
import { createToastManager } from '../ui/toast-manager.js';
import { createToolbar } from '../ui/toolbar.js';
import { createVirtualScroll } from '../ui/virtual-scroll.js';
import { createPagination } from '../ui/pagination.js';
import { createContextMenu } from '../ui/context-menu.js';
import { createDrawer } from '../ui/drawer.js';
import { createBadgeManager } from '../ui/badges.js';
import { createHighlightingRulesManager } from '../ui/highlighting.js';

// ─── FASE 4 — Views + Filters ───
import { FiltersOrchestrator } from '../ui/filters/index.js';
import { CardView } from '../ui/views/card-view.js';
import { SplitView } from '../ui/views/split-view.js';
import { HoverMenu } from '../ui/hover-menu.js';

// ─── FASE 5 — State ───
import { StatePersistence } from '../state/persistence.js';
import { URLStateSync } from '../state/url-sync.js';
import { SavedViews } from '../state/saved-views.js';
import { escapeHtml } from '../security/escape-html.js';

// ─── FASE 6 — Export / Import ───
import { exportAs, getAvailableFormats as getExportFormats } from '../data/export/index.js';
import { importFrom, validateRows, detectFormat, getAvailableFormats as getImportFormats } from '../data/import/index.js';
import { ImportPreviewModal } from '../ui/modals/import-preview.js';

// ─── FASE 7 — Events & Telemetry ───
import { createNavAdminEmitter, NAV_ADMIN_EVENTS } from '../events/event-emitter.js';
import { EventMetrics } from '../telemetry/event-metrics.js';
import { EventBindings } from '../events/event-bindings.js';
import { PercentileMetrics } from '../telemetry/percentile-metrics.js';

// ─── FASE 8 — Performance ───
import { PerformanceMonitor } from '../performance/monitor.js';
import { Prefetch } from '../performance/prefetch.js';
import { IndexedDBCache } from '../performance/indexed-db-cache.js';
import { WorkerManager } from '../performance/worker.js';

// ─── FASE 9 — Advanced ───
import { ComparisonView } from '../ui/views/comparison-view.js';
import { TrendsView } from '../ui/views/trends-view.js';
import { WebSocketManager } from '../services/websocket-manager.js';
import { NotificationManager } from '../services/notification-manager.js';
import { ActivityLog } from '../collaboration/activity-log.js';
import { MentionManager } from '../collaboration/mentions.js';

export const VERSION = '11.0.0-FULL-MIGRATION';
export const MODULE_ID = 'panel-nav-admin.core.integration-layer';

// ─── Logger helper ───
const _log = (level: string, ...args: unknown[]) => {
  const prefix = '[IntegrationLayer]';
  const logger = typeof window !== 'undefined' && (window as any).Logger;
  if (logger) {
    if (level === 'error') logger.error?.(prefix, ...args);
    else if (level === 'debug') logger.debug?.(prefix, ...args);
    else logger.info?.(prefix, ...args);
  } else {
    if (level === 'error') console.error(prefix, ...args);
    else if (level === 'debug') { /* silent in prod */ }
    else console.info(prefix, ...args);
  }
};

/**
 * Safe init wrapper — graceful degradation.
 * If a module fails to initialize, log the error and return null.
 * The panel continues working.
 *
 * @private
 * @param {string} name — Module name for logging
 * @param {string} flagName — Feature flag name (null = always init)
 * @param {Function} initFn — Factory/init function
 * @param {Array} degradedList — Ref to degraded modules list
 * @returns {*|null} Module instance or null
 */
function _safeInit(name: string, flagName: string | null, initFn: () => unknown, degradedList: { name: string; error: string }[]) {
  if (flagName && !isEnabled(flagName)) return null;
  try {
    return initFn();
  } catch (err) {
    _log('error', `Failed to init "${name}":`, err);
    degradedList.push({ name, error: (err as Error).message });
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════
// initIntegration — Cria instâncias de todos os managers
// ═══════════════════════════════════════════════════════════════

/**
 * Initialize all migrated modules.
 * Creates instances respecting feature flags.
 * If a module fails, it is marked as degraded and the rest continue.
 *
 * @param {Object} [options]
 * @param {Object} [options.store] — State store reference
 * @param {Object} [options.tracker] — Telemetry tracker reference
 * @param {Object} [options.navAdapter] — Nav adapter for API calls
 * @returns {Object} Integration object with refs to all managers
 */
export function initIntegration(options: Record<string, unknown> = {}) {
  const { store, tracker, navAdapter } = options;
  const _degraded: { name: string; error: string }[] = [];
  const startTime = performance.now();

  _log('info', 'Initializing integration layer...');

  // ─── FASE 1 — Foundation ───
  const stateMachine = _safeInit('stateMachine', 'stateMachine', () => {
    return createStateMachine(STATES.IDLE);
  }, _degraded);

  const perfMonitor = _safeInit('perfMonitor', 'performanceMonitor', () => {
    const pm = PerformanceMonitor({ slowThresholdMs: 500 });
    pm.markMountStart();
    return pm;
  }, _degraded);

  // ─── FASE 2 — Data Layer ───
  const circuitBreaker = _safeInit('circuitBreaker', 'circuitBreaker', () => {
    return createCircuitBreaker({ maxFailures: 5, resetTimeoutMs: 30000 });
  }, _degraded);

  const smartCache = _safeInit('smartCache', 'smartCache', () => {
    return createSmartCache({ maxSize: 200, defaultTTL: 300000 });
  }, _degraded);

  const fuzzySearch = _safeInit('fuzzySearch', 'fuzzySearch', () => {
    return createFuzzySearch({ fields: ['label', 'href', 'icon', 'section'] });
  }, _degraded);

  const deltaManager = _safeInit('deltaManager', 'deltaUpdates', () => {
    return createDeltaManager({ idField: 'id' });
  }, _degraded);

  const searchHistory = _safeInit('searchHistory', 'searchHistory', () => {
    return createSearchHistory({ maxItems: 20, storageKey: 'pna_search_history' });
  }, _degraded);

  // ─── FASE 5 — State ───
  const persistence = _safeInit('persistence', 'statePersistence', () => {
    return StatePersistence();
  }, _degraded);

  const urlSync = _safeInit('urlSync', 'urlStateSync', () => {
    return URLStateSync();
  }, _degraded);

  const savedViews = _safeInit('savedViews', 'savedViews', () => {
    return SavedViews();
  }, _degraded);

  // ─── FASE 7 — Events & Telemetry ───
  const emitter = _safeInit('emitter', 'customEventEmitter', () => {
    return createNavAdminEmitter();
  }, _degraded);

  const eventMetrics = _safeInit('eventMetrics', 'eventMetrics', () => {
    return EventMetrics({ rateWindowMs: 60000, maxHistory: 500 });
  }, _degraded);

  const percentileMetrics = _safeInit('percentileMetrics', 'percentileMetrics', () => {
    return PercentileMetrics({ maxSamples: 1000 });
  }, _degraded);

  // ─── FASE 8 — Performance (non-DOM) ───
  const prefetch = _safeInit('prefetch', 'prefetch', () => {
    return Prefetch({ hoverDelayMs: 200, ttlMs: 30000 });
  }, _degraded);

  const idbCache = _safeInit('idbCache', 'indexedDBCache', () => {
    return IndexedDBCache({ defaultTTLMs: 3600000 });
  }, _degraded);

  const workerManager = _safeInit('workerManager', 'webWorker', () => {
    const wm = WorkerManager({ timeoutMs: 10000 });
    wm.init();
    return wm;
  }, _degraded);

  // ─── FASE 9 — Services ───
  const wsManager = _safeInit('wsManager', 'websocket', () => {
    return WebSocketManager({ reconnectDelayMs: 3000, maxReconnectAttempts: 10 });
  }, _degraded);

  const notifManager = _safeInit('notifManager', 'pushNotifications', () => {
    return NotificationManager({ soundEnabled: isEnabled('soundNotifications') });
  }, _degraded);

  const activityLog = _safeInit('activityLog', 'activityLog', () => {
    return ActivityLog({ maxEntries: 500, persistToStorage: true });
  }, _degraded);

  const initDuration = performance.now() - startTime;
  _log('info', `Init complete in ${initDuration.toFixed(1)}ms. Degraded: ${_degraded.length}`);

  if (perfMonitor) (perfMonitor as Record<string, () => void>).markMountEnd();

  return {
    _version: VERSION,
    _initTime: Date.now(),
    _initDuration: initDuration,
    _degraded,
    _options: options,
    // FASE 1
    stateMachine,
    // FASE 2
    circuitBreaker, smartCache, fuzzySearch, deltaManager, searchHistory,
    // FASE 5
    persistence, urlSync, savedViews,
    // FASE 7
    emitter, eventMetrics, percentileMetrics,
    // FASE 8
    perfMonitor, prefetch, idbCache, workerManager,
    // FASE 9
    wsManager, notifManager, activityLog,
    // UI components (created during mount)
    _ui: {}
  };
}

// ═══════════════════════════════════════════════════════════════
// mountIntegration — Monta componentes UI
// ═══════════════════════════════════════════════════════════════

/**
 * Mount all UI components into the DOM.
 * Called after the main panel has mounted and refs are available.
 *
 * @param {Object} integration — Object returned by initIntegration
 * @param {Object} refs — DOM references from the main panel
 * @param {HTMLElement} container — Root container element
 */
export function mountIntegration(integration: Record<string, unknown>, refs: Record<string, unknown>, container: HTMLElement) {
  if (!integration || !container) return;

  const _degraded = integration._degraded as { name: string; error: string }[];
  const _ui = integration._ui as Record<string, unknown>;
  const _options = integration._options as Record<string, unknown>;
  const startTime = performance.now();

  _log('info', 'Mounting integration UI...');

  // ─── FASE 1 — Error Boundary (wraps container) ───
  _ui.errorBoundary = _safeInit('errorBoundary', 'errorBoundary', () => {
    return createErrorBoundary(container, {
      onError: (err: Error) => _log('error', 'ErrorBoundary caught:', err)
    });
  }, _degraded);

  // ─── FASE 2 — Bulk Operations (needs deps) ───
  _ui.bulkOps = _safeInit('bulkOps', 'bulkOperations', () => {
    return createBulkOperations({
      navAdapter: _options.navAdapter,
      store: _options.store
    });
  }, _degraded);

  // ─── FASE 3 — UI Components ───
  _ui.toastManager = _safeInit('toastManager', 'toastNotifications', () => {
    return createToastManager({ container, maxToasts: 5 });
  }, _degraded);

  _ui.toolbar = _safeInit('toolbar', 'toolbar', () => {
    return createToolbar({ defaultDensity: 'normal', defaultViewMode: 'table' });
  }, _degraded);

  _ui.virtualScroll = _safeInit('virtualScroll', 'virtualScroll', () => {
    const target = (refs?.itemsList || refs?.itemsContainer) as HTMLElement | undefined;
    if (!target) return null;
    return createVirtualScroll(target, { itemHeight: 48, threshold: 50 });
  }, _degraded);

  _ui.pagination = _safeInit('pagination', 'pagination', () => {
    return createPagination({ pageSize: 50 });
  }, _degraded);

  _ui.contextMenu = _safeInit('contextMenu', 'contextMenu', () => {
    return createContextMenu({ container });
  }, _degraded);

  _ui.drawer = _safeInit('drawer', 'drawer', () => {
    return createDrawer({ container, position: 'right', width: '400px' });
  }, _degraded);

  _ui.badges = _safeInit('badges', 'badges', () => {
    return (createBadgeManager as any)();
  }, _degraded);

  _ui.highlighting = _safeInit('highlighting', 'highlighting', () => {
    return (createHighlightingRulesManager as any)();
  }, _degraded);

  // ─── FASE 4 — Views + Filters ───
  _ui.filters = _safeInit('filters', 'quickFilters', () => {
    return FiltersOrchestrator({ container });
  }, _degraded);

  _ui.cardView = _safeInit('cardView', 'cardView', () => {
    return CardView({ container });
  }, _degraded);

  _ui.splitView = _safeInit('splitView', 'splitView', () => {
    return SplitView({ container });
  }, _degraded);

  _ui.hoverMenu = _safeInit('hoverMenu', 'hoverMenu', () => {
    return HoverMenu({ container });
  }, _degraded);

  // ─── FASE 6 — Import Preview Modal ───
  _ui.importPreview = _safeInit('importPreview', 'importCSV', () => {
    return ImportPreviewModal({ container });
  }, _degraded);

  // ─── FASE 7 — Event Bindings ───
  _ui.eventBindings = _safeInit('eventBindings', 'eventBindings', () => {
    // Event bindings are declarative — will be bound when handlers are ready
    // For now, create with empty handlers (the panel's existing click-router handles actions)
    return EventBindings(container, {}, { abortController: integration._abortController });
  }, _degraded);

  // ─── FASE 9 — Advanced UI ───
  _ui.comparisonView = _safeInit('comparisonView', null, () => {
    // Comparison view is on-demand, just store the factory ref
    return { factory: ComparisonView, container };
  }, _degraded);

  _ui.trendsView = _safeInit('trendsView', null, () => {
    // Trends view is on-demand, just store the factory ref
    return { factory: TrendsView, container };
  }, _degraded);

  _ui.mentionManager = _safeInit('mentionManager', 'mentions', () => {
    return MentionManager();
  }, _degraded);

  // ─── Wire emitter to activity log ───
  const emitter = integration.emitter as Record<string, (...args: unknown[]) => unknown> | null;
  const activityLog = integration.activityLog as Record<string, (...args: unknown[]) => unknown> | null;
  const eventMetrics = integration.eventMetrics as Record<string, (...args: unknown[]) => unknown> | null;
  const persistence = integration.persistence as Record<string, (...args: unknown[]) => unknown> | null;
  const stateMachine = integration.stateMachine as Record<string, (...args: unknown[]) => unknown> | null;

  if (emitter && activityLog) {
    const events = NAV_ADMIN_EVENTS;
    emitter.on(events.ITEM_CREATED, (data: unknown) => {
      const d = data as Record<string, unknown> | null;
      activityLog.log('item_created', { itemId: d?.id, itemLabel: d?.label });
    });
    emitter.on(events.ITEM_UPDATED, (data: unknown) => {
      const d = data as Record<string, unknown> | null;
      activityLog.log('item_updated', { itemId: d?.id, itemLabel: d?.label });
    });
    emitter.on(events.ITEM_DELETED, (data: unknown) => {
      const d = data as Record<string, unknown> | null;
      activityLog.log('item_deleted', { itemId: d?.id });
    });
  }

  // ─── Wire emitter to event metrics ───
  if (emitter && eventMetrics) {
    const originalEmit = emitter.emit.bind(emitter);
    emitter.emit = (event: unknown, data: unknown) => {
      eventMetrics.record(event);
      return originalEmit(event, data);
    };
  }

  // ─── Restore persisted state ───
  if (persistence && _options.store) {
    try {
      const restored = persistence.restoreState() as Record<string, unknown> | null;
      if (restored && Object.keys(restored).length > 0) {
        _log('debug', 'Restored persisted state:', Object.keys(restored));
      }
    } catch (err) {
      _log('debug', 'State restore skipped:', (err as Error).message);
    }
  }

  const mountDuration = performance.now() - startTime;
  _log('info', `Mount complete in ${mountDuration.toFixed(1)}ms. UI modules: ${Object.keys(_ui).length}`);

  // Update state machine
  if (stateMachine) {
    try { stateMachine.transition(STATES.READY); } catch { /* ignore */ }
  }
}

// ═══════════════════════════════════════════════════════════════
// unmountIntegration — Destrói na ordem inversa
// ═══════════════════════════════════════════════════════════════

/**
 * Unmount and destroy all integration modules.
 * Called before the main panel cleans up refs.
 * Destroys in reverse order (FASE 9 → FASE 1).
 *
 * @param {Object} integration — Object returned by initIntegration
 */
export function unmountIntegration(integration: Record<string, unknown>) {
  if (!integration) return;

  _log('info', 'Unmounting integration...');

  const _ui = integration._ui as Record<string, unknown>;
  const _options = integration._options as Record<string, unknown>;

  // ─── Save state before unmount ───
  const persistence = integration.persistence as Record<string, (...args: unknown[]) => unknown> | null;
  if (persistence && _options.store) {
    try {
      const storeObj = _options.store as Record<string, (...args: unknown[]) => unknown>;
      const state = storeObj.getState?.();
      if (state) persistence.saveState(state);
    } catch { /* ignore */ }
  }

  // ─── FASE 9 — Advanced (destroy first) ───
  _safeDestroy('mentionManager', _ui.mentionManager as Record<string, unknown>, 'detach');
  _safeDestroy('wsManager', integration.wsManager as Record<string, unknown>, 'disconnect');
  _safeDestroy('notifManager', integration.notifManager as Record<string, unknown>, 'destroy');

  // ─── FASE 8 — Performance ───
  _safeDestroy('workerManager', integration.workerManager as Record<string, unknown>, 'destroy');
  _safeDestroy('idbCache', integration.idbCache as Record<string, unknown>, 'destroy');
  _safeDestroy('prefetch', integration.prefetch as Record<string, unknown>, 'destroy');
  _safeDestroy('perfMonitor', integration.perfMonitor as Record<string, unknown>, 'destroy');

  // ─── FASE 7 — Events ───
  if (_ui.eventBindings) {
    try { (_ui.eventBindings as Record<string, () => void>).unbind(); } catch { /* ignore */ }
  }
  if (integration.emitter) {
    try { (integration.emitter as Record<string, () => void>).removeAll(); } catch { /* ignore */ }
  }

  // ─── FASE 3-6 — UI Components ───
  _safeDestroy('contextMenu', _ui.contextMenu as Record<string, unknown>, 'destroy');
  _safeDestroy('drawer', _ui.drawer as Record<string, unknown>, 'destroy');
  _safeDestroy('virtualScroll', _ui.virtualScroll as Record<string, unknown>, 'destroy');
  _safeDestroy('importPreview', _ui.importPreview as Record<string, unknown>, 'close');

  // ─── FASE 2 — Data Layer ───
  _safeDestroy('smartCache', integration.smartCache as Record<string, unknown>, 'destroy');

  // ─── FASE 1 — Foundation ───
  _safeDestroy('errorBoundary', _ui.errorBoundary as Record<string, unknown>, 'destroy');
  const stateMachine = integration.stateMachine as Record<string, (...args: unknown[]) => unknown> | null;
  if (stateMachine) {
    try { stateMachine.transition(STATES.DESTROYED); } catch { /* ignore */ }
  }

  // Clear all UI refs
  const uiObj = integration._ui as Record<string, unknown>;
  for (const key of Object.keys(uiObj)) {
    uiObj[key] = null;
  }

  _log('info', 'Unmount complete');
}

/**
 * Safely call a destroy/cleanup method on a module.
 * @private
 * @param {string} name
 * @param {Object|null} instance
 * @param {string} method
 */
function _safeDestroy(name: string, instance: Record<string, unknown> | null | undefined, method: string) {
  if (!instance) return;
  try {
    if (typeof instance[method] === 'function') (instance[method] as () => void)();
  } catch (err) {
    _log('debug', `Destroy "${name}" failed:`, (err as Error).message);
  }
}

// ═══════════════════════════════════════════════════════════════
// getIntegrationHealth — HealthCheck consolidado
// ═══════════════════════════════════════════════════════════════

/**
 * Get consolidated health check of all integration modules.
 *
 * @param {Object} integration — Object returned by initIntegration
 * @returns {Object} Health check result
 */
export function getIntegrationHealth(integration: Record<string, unknown> | null) {
  if (!integration) return { status: 'NOT_INITIALIZED', version: VERSION };

  const modules: Record<string, string> = {};
  let healthy = 0;
  let degraded = 0;
  let disabled = 0;
  let total = 0;

  const _ui = (integration._ui || {}) as Record<string, unknown>;

  // Check each module
  const checks: [string, unknown, string][] = [
    ['stateMachine', integration.stateMachine, 'stateMachine'],
    ['circuitBreaker', integration.circuitBreaker, 'circuitBreaker'],
    ['smartCache', integration.smartCache, 'smartCache'],
    ['fuzzySearch', integration.fuzzySearch, 'fuzzySearch'],
    ['deltaManager', integration.deltaManager, 'deltaUpdates'],
    ['searchHistory', integration.searchHistory, 'searchHistory'],
    ['persistence', integration.persistence, 'statePersistence'],
    ['urlSync', integration.urlSync, 'urlStateSync'],
    ['savedViews', integration.savedViews, 'savedViews'],
    ['emitter', integration.emitter, 'customEventEmitter'],
    ['eventMetrics', integration.eventMetrics, 'eventMetrics'],
    ['percentileMetrics', integration.percentileMetrics, 'percentileMetrics'],
    ['perfMonitor', integration.perfMonitor, 'performanceMonitor'],
    ['prefetch', integration.prefetch, 'prefetch'],
    ['idbCache', integration.idbCache, 'indexedDBCache'],
    ['workerManager', integration.workerManager, 'webWorker'],
    ['wsManager', integration.wsManager, 'websocket'],
    ['notifManager', integration.notifManager, 'pushNotifications'],
    ['activityLog', integration.activityLog, 'activityLog'],
    ['errorBoundary', _ui.errorBoundary, 'errorBoundary'],
    ['bulkOps', _ui.bulkOps, 'bulkOperations'],
    ['toastManager', _ui.toastManager, 'toastNotifications'],
    ['toolbar', _ui.toolbar, 'toolbar'],
    ['virtualScroll', _ui.virtualScroll, 'virtualScroll'],
    ['pagination', _ui.pagination, 'pagination'],
    ['contextMenu', _ui.contextMenu, 'contextMenu'],
    ['drawer', _ui.drawer, 'drawer'],
    ['badges', _ui.badges, 'badges'],
    ['highlighting', _ui.highlighting, 'highlighting'],
    ['filters', _ui.filters, 'quickFilters'],
    ['cardView', _ui.cardView, 'cardView'],
    ['splitView', _ui.splitView, 'splitView'],
    ['hoverMenu', _ui.hoverMenu, 'hoverMenu'],
    ['mentionManager', _ui.mentionManager, 'mentions']
  ];

  for (const [name, instance, flag] of checks) {
    total++;
    if (!isEnabled(flag)) {
      modules[name] = 'DISABLED';
      disabled++;
    } else if (instance) {
      modules[name] = 'HEALTHY';
      healthy++;
    } else {
      modules[name] = 'DEGRADED';
      degraded++;
    }
  }

  const overallStatus = degraded > 0 ? 'DEGRADED' : 'HEALTHY';

  return {
    status: overallStatus,
    version: VERSION,
    initDuration: Math.round((integration._initDuration as number) || 0),
    counts: { healthy, degraded, disabled, total },
    degradedModules: integration._degraded,
    modules
  };
}

// ═══════════════════════════════════════════════════════════════
// Re-exports — Utilities usáveis pelo index.js se necessário
// ═══════════════════════════════════════════════════════════════

export {
  escapeHtml,
  exportAs, getExportFormats,
  importFrom, validateRows, detectFormat, getImportFormats,
  memoize, debounce,
  NAV_ADMIN_EVENTS
};

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    totalModules: 55,
    phases: 9
  };
}

export function healthCheck() {
  return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION };
}

export default {
  initIntegration, mountIntegration, unmountIntegration, getIntegrationHealth,
  info, healthCheck, VERSION, MODULE_ID
};
