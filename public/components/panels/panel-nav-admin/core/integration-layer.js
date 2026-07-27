import { isEnabled } from "../config/feature-flags.js";
import { createErrorBoundary } from "./error-boundary.js";
import { createStateMachine, STATES } from "./state-machine.js";
import { createCircuitBreaker } from "../data/circuit-breaker.js";
import { createSmartCache } from "../data/smart-cache.js";
import { debounce } from "../data/debounced-request.js";
import { memoize } from "../data/memoize.js";
import { createFuzzySearch } from "../data/fuzzy-search.js";
import { createDeltaManager } from "../data/delta-updates.js";
import { createBulkOperations } from "../data/bulk-operations.js";
import { createSearchHistory } from "../data/search-history.js";
import { createToastManager } from "../ui/toast-manager.js";
import { createToolbar } from "../ui/toolbar.js";
import { createVirtualScroll } from "../ui/virtual-scroll.js";
import { createPagination } from "../ui/pagination.js";
import { createContextMenu } from "../ui/context-menu.js";
import { createDrawer } from "../ui/drawer.js";
import { createBadgeManager } from "../ui/badges.js";
import { createHighlightingRulesManager } from "../ui/highlighting.js";
import { FiltersOrchestrator } from "../ui/filters/index.js";
import { CardView } from "../ui/views/card-view.js";
import { SplitView } from "../ui/views/split-view.js";
import { HoverMenu } from "../ui/hover-menu.js";
import { StatePersistence } from "../state/persistence.js";
import { URLStateSync } from "../state/url-sync.js";
import { SavedViews } from "../state/saved-views.js";
import { escapeHtml } from "../security/escape-html.js";
import { exportAs, getAvailableFormats as getExportFormats } from "../data/export/index.js";
import { importFrom, validateRows, detectFormat, getAvailableFormats as getImportFormats } from "../data/import/index.js";
import { ImportPreviewModal } from "../ui/modals/import-preview.js";
import { createNavAdminEmitter, NAV_ADMIN_EVENTS } from "../events/event-emitter.js";
import { EventMetrics } from "../telemetry/event-metrics.js";
import { EventBindings } from "../events/event-bindings.js";
import { PercentileMetrics } from "../telemetry/percentile-metrics.js";
import { PerformanceMonitor } from "../performance/monitor.js";
import { Prefetch } from "../performance/prefetch.js";
import { IndexedDBCache } from "../performance/indexed-db-cache.js";
import { WorkerManager } from "../performance/worker.js";
import { ComparisonView } from "../ui/views/comparison-view.js";
import { TrendsView } from "../ui/views/trends-view.js";
import { WebSocketManager } from "../services/websocket-manager.js";
import { NotificationManager } from "../services/notification-manager.js";
import { ActivityLog } from "../collaboration/activity-log.js";
import { MentionManager } from "../collaboration/mentions.js";
const VERSION = "11.0.0-FULL-MIGRATION";
const MODULE_ID = "panel-nav-admin.core.integration-layer";
const _log = (level, ...args) => {
  const prefix = "[IntegrationLayer]";
  const logger = typeof window !== "undefined" && window.Logger;
  if (logger) {
    if (level === "error") logger.error?.(prefix, ...args);
    else if (level === "debug") logger.debug?.(prefix, ...args);
    else logger.info?.(prefix, ...args);
  } else {
    if (level === "error") console.error(prefix, ...args);
    else if (level === "debug") {
    } else console.info(prefix, ...args);
  }
};
function _safeInit(name, flagName, initFn, degradedList) {
  if (flagName && !isEnabled(flagName)) return null;
  try {
    return initFn();
  } catch (err) {
    _log("error", `Failed to init "${name}":`, err);
    degradedList.push({ name, error: err.message });
    return null;
  }
}
function initIntegration(options = {}) {
  const { store, tracker, navAdapter } = options;
  const _degraded = [];
  const startTime = performance.now();
  _log("info", "Initializing integration layer...");
  const stateMachine = _safeInit("stateMachine", "stateMachine", () => {
    return createStateMachine(STATES.IDLE);
  }, _degraded);
  const perfMonitor = _safeInit("perfMonitor", "performanceMonitor", () => {
    const pm = PerformanceMonitor({ slowThresholdMs: 500 });
    pm.markMountStart();
    return pm;
  }, _degraded);
  const circuitBreaker = _safeInit("circuitBreaker", "circuitBreaker", () => {
    return createCircuitBreaker({ maxFailures: 5, resetTimeoutMs: 3e4 });
  }, _degraded);
  const smartCache = _safeInit("smartCache", "smartCache", () => {
    return createSmartCache({ maxSize: 200, defaultTTL: 3e5 });
  }, _degraded);
  const fuzzySearch = _safeInit("fuzzySearch", "fuzzySearch", () => {
    return createFuzzySearch({ fields: ["label", "href", "icon", "section"] });
  }, _degraded);
  const deltaManager = _safeInit("deltaManager", "deltaUpdates", () => {
    return createDeltaManager({ idField: "id" });
  }, _degraded);
  const searchHistory = _safeInit("searchHistory", "searchHistory", () => {
    return createSearchHistory({ maxItems: 20, storageKey: "pna_search_history" });
  }, _degraded);
  const persistence = _safeInit("persistence", "statePersistence", () => {
    return StatePersistence();
  }, _degraded);
  const urlSync = _safeInit("urlSync", "urlStateSync", () => {
    return URLStateSync();
  }, _degraded);
  const savedViews = _safeInit("savedViews", "savedViews", () => {
    return SavedViews();
  }, _degraded);
  const emitter = _safeInit("emitter", "customEventEmitter", () => {
    return createNavAdminEmitter();
  }, _degraded);
  const eventMetrics = _safeInit("eventMetrics", "eventMetrics", () => {
    return EventMetrics({ rateWindowMs: 6e4, maxHistory: 500 });
  }, _degraded);
  const percentileMetrics = _safeInit("percentileMetrics", "percentileMetrics", () => {
    return PercentileMetrics({ maxSamples: 1e3 });
  }, _degraded);
  const prefetch = _safeInit("prefetch", "prefetch", () => {
    return Prefetch({ hoverDelayMs: 200, ttlMs: 3e4 });
  }, _degraded);
  const idbCache = _safeInit("idbCache", "indexedDBCache", () => {
    return IndexedDBCache({ defaultTTLMs: 36e5 });
  }, _degraded);
  const workerManager = _safeInit("workerManager", "webWorker", () => {
    const wm = WorkerManager({ timeoutMs: 1e4 });
    wm.init();
    return wm;
  }, _degraded);
  const wsManager = _safeInit("wsManager", "websocket", () => {
    return WebSocketManager({ reconnectDelayMs: 3e3, maxReconnectAttempts: 10 });
  }, _degraded);
  const notifManager = _safeInit("notifManager", "pushNotifications", () => {
    return NotificationManager({ soundEnabled: isEnabled("soundNotifications") });
  }, _degraded);
  const activityLog = _safeInit("activityLog", "activityLog", () => {
    return ActivityLog({ maxEntries: 500, persistToStorage: true });
  }, _degraded);
  const initDuration = performance.now() - startTime;
  _log("info", `Init complete in ${initDuration.toFixed(1)}ms. Degraded: ${_degraded.length}`);
  if (perfMonitor) perfMonitor.markMountEnd();
  return {
    _version: VERSION,
    _initTime: Date.now(),
    _initDuration: initDuration,
    _degraded,
    _options: options,
    // FASE 1
    stateMachine,
    // FASE 2
    circuitBreaker,
    smartCache,
    fuzzySearch,
    deltaManager,
    searchHistory,
    // FASE 5
    persistence,
    urlSync,
    savedViews,
    // FASE 7
    emitter,
    eventMetrics,
    percentileMetrics,
    // FASE 8
    perfMonitor,
    prefetch,
    idbCache,
    workerManager,
    // FASE 9
    wsManager,
    notifManager,
    activityLog,
    // UI components (created during mount)
    _ui: {}
  };
}
function mountIntegration(integration, refs, container) {
  if (!integration || !container) return;
  const _degraded = integration._degraded;
  const _ui = integration._ui;
  const _options = integration._options;
  const startTime = performance.now();
  _log("info", "Mounting integration UI...");
  _ui.errorBoundary = _safeInit("errorBoundary", "errorBoundary", () => {
    return createErrorBoundary(container, {
      onError: (err) => _log("error", "ErrorBoundary caught:", err)
    });
  }, _degraded);
  _ui.bulkOps = _safeInit("bulkOps", "bulkOperations", () => {
    return createBulkOperations({
      navAdapter: _options.navAdapter,
      store: _options.store
    });
  }, _degraded);
  _ui.toastManager = _safeInit("toastManager", "toastNotifications", () => {
    return createToastManager({ container, maxToasts: 5 });
  }, _degraded);
  _ui.toolbar = _safeInit("toolbar", "toolbar", () => {
    return createToolbar({ defaultDensity: "normal", defaultViewMode: "table" });
  }, _degraded);
  _ui.virtualScroll = _safeInit("virtualScroll", "virtualScroll", () => {
    const target = refs?.itemsList || refs?.itemsContainer;
    if (!target) return null;
    return createVirtualScroll(target, { itemHeight: 48, threshold: 50 });
  }, _degraded);
  _ui.pagination = _safeInit("pagination", "pagination", () => {
    return createPagination({ pageSize: 50 });
  }, _degraded);
  _ui.contextMenu = _safeInit("contextMenu", "contextMenu", () => {
    return createContextMenu({ container });
  }, _degraded);
  _ui.drawer = _safeInit("drawer", "drawer", () => {
    return createDrawer({ container, position: "right", width: "400px" });
  }, _degraded);
  _ui.badges = _safeInit("badges", "badges", () => {
    return createBadgeManager();
  }, _degraded);
  _ui.highlighting = _safeInit("highlighting", "highlighting", () => {
    return createHighlightingRulesManager();
  }, _degraded);
  _ui.filters = _safeInit("filters", "quickFilters", () => {
    return FiltersOrchestrator({ container });
  }, _degraded);
  _ui.cardView = _safeInit("cardView", "cardView", () => {
    return CardView({ container });
  }, _degraded);
  _ui.splitView = _safeInit("splitView", "splitView", () => {
    return SplitView({ container });
  }, _degraded);
  _ui.hoverMenu = _safeInit("hoverMenu", "hoverMenu", () => {
    return HoverMenu({ container });
  }, _degraded);
  _ui.importPreview = _safeInit("importPreview", "importCSV", () => {
    return ImportPreviewModal({ container });
  }, _degraded);
  _ui.eventBindings = _safeInit("eventBindings", "eventBindings", () => {
    return EventBindings(container, {}, { abortController: integration._abortController });
  }, _degraded);
  _ui.comparisonView = _safeInit("comparisonView", null, () => {
    return { factory: ComparisonView, container };
  }, _degraded);
  _ui.trendsView = _safeInit("trendsView", null, () => {
    return { factory: TrendsView, container };
  }, _degraded);
  _ui.mentionManager = _safeInit("mentionManager", "mentions", () => {
    return MentionManager();
  }, _degraded);
  const emitter = integration.emitter;
  const activityLog = integration.activityLog;
  const eventMetrics = integration.eventMetrics;
  const persistence = integration.persistence;
  const stateMachine = integration.stateMachine;
  if (emitter && activityLog) {
    const events = NAV_ADMIN_EVENTS;
    emitter.on(events.ITEM_CREATED, (data) => {
      const d = data;
      activityLog.log("item_created", { itemId: d?.id, itemLabel: d?.label });
    });
    emitter.on(events.ITEM_UPDATED, (data) => {
      const d = data;
      activityLog.log("item_updated", { itemId: d?.id, itemLabel: d?.label });
    });
    emitter.on(events.ITEM_DELETED, (data) => {
      const d = data;
      activityLog.log("item_deleted", { itemId: d?.id });
    });
  }
  if (emitter && eventMetrics) {
    const originalEmit = emitter.emit.bind(emitter);
    emitter.emit = (event, data) => {
      eventMetrics.record(event);
      return originalEmit(event, data);
    };
  }
  if (persistence && _options.store) {
    try {
      const restored = persistence.restoreState();
      if (restored && Object.keys(restored).length > 0) {
        _log("debug", "Restored persisted state:", Object.keys(restored));
      }
    } catch (err) {
      _log("debug", "State restore skipped:", err.message);
    }
  }
  const mountDuration = performance.now() - startTime;
  _log("info", `Mount complete in ${mountDuration.toFixed(1)}ms. UI modules: ${Object.keys(_ui).length}`);
  if (stateMachine) {
    try {
      stateMachine.transition(STATES.READY);
    } catch {
    }
  }
}
function unmountIntegration(integration) {
  if (!integration) return;
  _log("info", "Unmounting integration...");
  const _ui = integration._ui;
  const _options = integration._options;
  const persistence = integration.persistence;
  if (persistence && _options.store) {
    try {
      const storeObj = _options.store;
      const state = storeObj.getState?.();
      if (state) persistence.saveState(state);
    } catch {
    }
  }
  _safeDestroy("mentionManager", _ui.mentionManager, "detach");
  _safeDestroy("wsManager", integration.wsManager, "disconnect");
  _safeDestroy("notifManager", integration.notifManager, "destroy");
  _safeDestroy("workerManager", integration.workerManager, "destroy");
  _safeDestroy("idbCache", integration.idbCache, "destroy");
  _safeDestroy("prefetch", integration.prefetch, "destroy");
  _safeDestroy("perfMonitor", integration.perfMonitor, "destroy");
  if (_ui.eventBindings) {
    try {
      _ui.eventBindings.unbind();
    } catch {
    }
  }
  if (integration.emitter) {
    try {
      integration.emitter.removeAll();
    } catch {
    }
  }
  _safeDestroy("contextMenu", _ui.contextMenu, "destroy");
  _safeDestroy("drawer", _ui.drawer, "destroy");
  _safeDestroy("virtualScroll", _ui.virtualScroll, "destroy");
  _safeDestroy("importPreview", _ui.importPreview, "close");
  _safeDestroy("smartCache", integration.smartCache, "destroy");
  _safeDestroy("errorBoundary", _ui.errorBoundary, "destroy");
  const stateMachine = integration.stateMachine;
  if (stateMachine) {
    try {
      stateMachine.transition(STATES.DESTROYED);
    } catch {
    }
  }
  const uiObj = integration._ui;
  for (const key of Object.keys(uiObj)) {
    uiObj[key] = null;
  }
  _log("info", "Unmount complete");
}
function _safeDestroy(name, instance, method) {
  if (!instance) return;
  try {
    if (typeof instance[method] === "function") instance[method]();
  } catch (err) {
    _log("debug", `Destroy "${name}" failed:`, err.message);
  }
}
function getIntegrationHealth(integration) {
  if (!integration) return { status: "NOT_INITIALIZED", version: VERSION };
  const modules = {};
  let healthy = 0;
  let degraded = 0;
  let disabled = 0;
  let total = 0;
  const _ui = integration._ui || {};
  const checks = [
    ["stateMachine", integration.stateMachine, "stateMachine"],
    ["circuitBreaker", integration.circuitBreaker, "circuitBreaker"],
    ["smartCache", integration.smartCache, "smartCache"],
    ["fuzzySearch", integration.fuzzySearch, "fuzzySearch"],
    ["deltaManager", integration.deltaManager, "deltaUpdates"],
    ["searchHistory", integration.searchHistory, "searchHistory"],
    ["persistence", integration.persistence, "statePersistence"],
    ["urlSync", integration.urlSync, "urlStateSync"],
    ["savedViews", integration.savedViews, "savedViews"],
    ["emitter", integration.emitter, "customEventEmitter"],
    ["eventMetrics", integration.eventMetrics, "eventMetrics"],
    ["percentileMetrics", integration.percentileMetrics, "percentileMetrics"],
    ["perfMonitor", integration.perfMonitor, "performanceMonitor"],
    ["prefetch", integration.prefetch, "prefetch"],
    ["idbCache", integration.idbCache, "indexedDBCache"],
    ["workerManager", integration.workerManager, "webWorker"],
    ["wsManager", integration.wsManager, "websocket"],
    ["notifManager", integration.notifManager, "pushNotifications"],
    ["activityLog", integration.activityLog, "activityLog"],
    ["errorBoundary", _ui.errorBoundary, "errorBoundary"],
    ["bulkOps", _ui.bulkOps, "bulkOperations"],
    ["toastManager", _ui.toastManager, "toastNotifications"],
    ["toolbar", _ui.toolbar, "toolbar"],
    ["virtualScroll", _ui.virtualScroll, "virtualScroll"],
    ["pagination", _ui.pagination, "pagination"],
    ["contextMenu", _ui.contextMenu, "contextMenu"],
    ["drawer", _ui.drawer, "drawer"],
    ["badges", _ui.badges, "badges"],
    ["highlighting", _ui.highlighting, "highlighting"],
    ["filters", _ui.filters, "quickFilters"],
    ["cardView", _ui.cardView, "cardView"],
    ["splitView", _ui.splitView, "splitView"],
    ["hoverMenu", _ui.hoverMenu, "hoverMenu"],
    ["mentionManager", _ui.mentionManager, "mentions"]
  ];
  for (const [name, instance, flag] of checks) {
    total++;
    if (!isEnabled(flag)) {
      modules[name] = "DISABLED";
      disabled++;
    } else if (instance) {
      modules[name] = "HEALTHY";
      healthy++;
    } else {
      modules[name] = "DEGRADED";
      degraded++;
    }
  }
  const overallStatus = degraded > 0 ? "DEGRADED" : "HEALTHY";
  return {
    status: overallStatus,
    version: VERSION,
    initDuration: Math.round(integration._initDuration || 0),
    counts: { healthy, degraded, disabled, total },
    degradedModules: integration._degraded,
    modules
  };
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    totalModules: 55,
    phases: 9
  };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION };
}
var integration_layer_default = {
  initIntegration,
  mountIntegration,
  unmountIntegration,
  getIntegrationHealth,
  info,
  healthCheck,
  VERSION,
  MODULE_ID
};
export {
  MODULE_ID,
  NAV_ADMIN_EVENTS,
  VERSION,
  debounce,
  integration_layer_default as default,
  detectFormat,
  escapeHtml,
  exportAs,
  getExportFormats,
  getImportFormats,
  getIntegrationHealth,
  healthCheck,
  importFrom,
  info,
  initIntegration,
  memoize,
  mountIntegration,
  unmountIntegration,
  validateRows
};
