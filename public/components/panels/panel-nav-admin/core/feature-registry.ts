// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (10.2.0-ROUTE-SELECT)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-nav-admin.core.feature-registry
// PURPOSE: Feature Registry + Loader — Registro de features com lazy loading
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanelPorts from /core/runtime/ports-profiles.js
//   isEnabled from ../config/feature-flags.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   FeatureModules — exported value (map of all import functions)
//   Categories — exported value (features organized by category)
//   loadFeature() — exported function (lazy load with caching)
//   safeExecute() — exported function (error-safe wrapper)
//   initFeature() — exported function (sync safe init)
//   initFeatureAsync() — exported function (async safe init)
//   getLoadedFeatures() — exported function
//   isFeatureLoaded() — exported function
//   getFeatureStatus() — exported function
//   clearFeatures() — exported function
//   getModuleCount() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos): (none)
// LISTENS (eventos): (none)
// WINDOW ACCESS: (none)
//
// @origin Combined from panel-01/init/feature-registry.js + feature-loader.js
// @changelog
//   10.2.0-ROUTE-SELECT: Added routeSelect handler to Handlers catalog.
//   10.1.0-MIGRATION-PHASE1: Initial creation — FASE 1 A.1
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createPanelPorts } from '/core/runtime/ports-profiles.js';
import { isEnabled } from '../config/feature-flags.js';

export var VERSION = '10.2.0-ROUTE-SELECT';
export var MODULE_ID = 'panel-nav-admin.core.feature-registry';

var Ports = createPanelPorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: unknown) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

var _log = function(level: string, ...rest: any[]) {
    var args = rest;
    var logger = _getPort('logger');
    if (!logger) return;
    var prefix = '[FeatureRegistry]';
    if (level === 'error' && logger.error) logger.error.apply(logger, [prefix].concat(args));
    else if (level === 'warn' && logger.warn) logger.warn.apply(logger, [prefix].concat(args));
    else if (level === 'debug' && logger.debug) logger.debug.apply(logger, [prefix].concat(args));
    else if (logger.info) logger.info.apply(logger, [prefix].concat(args));
};

var _features = new Map<string, unknown>();
var _failedFeatures: string[] = [];

var CoreUI = {
    iconPicker:          function() { return import('../ui/icon-picker.js'); },
    diagnosticRenderer:  function() { return import('../ui/diagnostic-renderer.js'); },
    effects:             function() { return import('../renderer/effects.js'); },
    modals:              function() { return import('../ui/modals.js'); },
    renderer:            function() { return import('../ui/renderer.js'); },
    autocomplete:        function() { return import('../renderer/autocomplete.js'); }
};

var Handlers = {
    clickRouter:         function() { return import('../handlers/click-router.js'); },
    crud:                function() { return import('../handlers/crud.js'); },
    dragDrop:            function() { return import('../handlers/drag-drop.js'); },
    inlineEdit:          function() { return import('../handlers/inline-edit.js'); },
    routeSelect:         function() { return import('../handlers/route-select.js'); },
    exportImport:        function() { return import('../handlers/export-import.js'); },
    filterChips:         function() { return import('../handlers/filter-chips.js'); },
    keyboard:            function() { return import('../handlers/keyboard.js'); },
    uiActions:           function() { return import('../handlers/ui-actions.js'); },
    diagnostic:          function() { return import('../handlers/diagnostic.js'); }
};

var DataHandling = {
    circuitBreaker:      function() { return import('../data/circuit-breaker.js'); },
    smartCache:          function() { return import('../data/smart-cache.js'); },
    deltaUpdates:        function() { return import('../data/delta-updates.js'); },
    debouncedRequest:    function() { return import('../data/debounced-request.js'); },
    fuzzySearch:         function() { return import('../data/fuzzy-search.js'); },
    bulkOperations:      function() { return import('../data/bulk-operations.js'); },
    searchHistory:       function() { return import('../data/search-history.js'); },
    memoize:             function() { return import('../data/memoize.js'); }
};

var UIComponents = {
    virtualScroll:       function() { return import('../ui/virtual-scroll.js'); },
    skeletonLoader:      function() { return import('../ui/skeleton-loader.js'); },
    toastManager:        function() { return import('../ui/toast-manager.js'); },
    contextMenu:         function() { return import('../ui/context-menu.js'); },
    drawer:              function() { return import('../ui/drawer.js'); },
    toolbar:             function() { return import('../ui/toolbar.js'); },
    badges:              function() { return import('../ui/badges.js'); },
    highlighting:        function() { return import('../ui/highlighting.js'); },
    hoverMenu:           function() { return import('../ui/hover-menu.js'); },
    pagination:          function() { return import('../ui/pagination.js'); }
};

var Views = {
    cardView:            function() { return import('../ui/views/card-view.js'); },
    splitView:           function() { return import('../ui/views/split-view.js'); },
    comparisonView:      function() { return import('../ui/views/comparison-view.js'); },
    trendsView:          function() { return import('../ui/views/trends-view.js'); }
};

var Filters = {
    dateRange:           function() { return import('../ui/filters/date-range.js'); },
    multiSelect:         function() { return import('../ui/filters/multi-select.js'); },
    quickFilters:        function() { return import('../ui/filters/quick-filters.js'); },
    filterPresets:       function() { return import('../ui/filters/filter-presets.js'); }
};

var ExportImport = {
    exportCSV:           function() { return import('../data/export/csv.js'); },
    exportPDF:           function() { return import('../data/export/pdf.js'); },
    exportXLSX:          function() { return import('../data/export/xlsx.js'); },
    importCSV:           function() { return import('../data/import/csv.js'); },
    importXLSX:          function() { return import('../data/import/xlsx.js'); },
    importPreview:       function() { return import('../ui/modals/import-preview.js'); }
};

var StateNav = {
    urlSync:             function() { return import('../state/url-sync.js'); },
    savedViews:          function() { return import('../state/saved-views.js'); },
    persistence:         function() { return import('../state/persistence.js'); }
};

var Performance = {
    performanceMonitor:  function() { return import('../performance/monitor.js'); },
    prefetch:            function() { return import('../performance/prefetch.js'); },
    webWorker:           function() { return import('../performance/worker.js'); },
    indexedDBCache:       function() { return import('../performance/indexed-db-cache.js'); }
};

var Telemetry = {
    eventMetrics:        function() { return import('../telemetry/event-metrics.js'); },
    percentileMetrics:   function() { return import('../telemetry/percentile-metrics.js'); }
};

var Services = {
    websocketManager:    function() { return import('../services/websocket-manager.js'); },
    notificationManager: function() { return import('../services/notification-manager.js'); }
};

var Collaboration = {
    activityLog:         function() { return import('../collaboration/activity-log.js'); },
    mentions:            function() { return import('../collaboration/mentions.js'); }
};

var Security = {
    escapeHtml:          function() { return import('../security/escape-html.js'); }
};

export var FeatureModules = Object.assign({},
    CoreUI, Handlers, DataHandling, UIComponents, Views, Filters,
    ExportImport, StateNav, Performance, Telemetry, Services,
    Collaboration, Security
);

export var Categories = {
    CoreUI: Object.keys(CoreUI),
    Handlers: Object.keys(Handlers),
    DataHandling: Object.keys(DataHandling),
    UIComponents: Object.keys(UIComponents),
    Views: Object.keys(Views),
    Filters: Object.keys(Filters),
    ExportImport: Object.keys(ExportImport),
    StateNav: Object.keys(StateNav),
    Performance: Object.keys(Performance),
    Telemetry: Object.keys(Telemetry),
    Services: Object.keys(Services),
    Collaboration: Object.keys(Collaboration),
    Security: Object.keys(Security)
};

export async function loadFeature(name: string, importFn?: () => Promise<unknown>) {
    if (_features.has(name)) return _features.get(name);
    var loader = importFn || FeatureModules[name];
    if (!loader) {
        _log('warn', 'Unknown feature:', name);
        return null;
    }
    try {
        var module = await loader();
        _features.set(name, module);
        _log('debug', 'Loaded feature:', name);
        return module;
    } catch (e: any) {
        _log('warn', 'Failed to load feature:', name, e.message);
        _failedFeatures.push(name);
        return null;
    }
}

export async function loadIfEnabled(name: string, flagName?: string) {
    if (!isEnabled(flagName || name)) {
        _log('debug', 'Feature disabled by flag:', flagName || name);
        return null;
    }

    return loadFeature(name);
}

export function safeExecute(name: string, fn: () => unknown, options: Record<string, unknown> = {}) {
    if (!options) options = {};
    try {
        return fn();
    } catch (e: any) {
        _log('error', 'Error in', name + ':', e.message);
        return options.fallback !== undefined ? options.fallback : null;
    }
}

export function initFeature(name: string, initFn: () => unknown, options: Record<string, unknown> = {}) {
    if (!options) options = {};
    return safeExecute(name, initFn, options);
}

export async function initFeatureAsync(name: string, initFn: () => Promise<unknown>, options: Record<string, unknown> = {}) {
    if (!options) options = {};
    try {
        return await initFn();
    } catch (e: any) {
        _log('error', 'Async error in', name + ':', e.message);
        return options.fallback !== undefined ? options.fallback : null;
    }
}

export function getLoadedFeatures() { return Array.from(_features.keys()); }
export function isFeatureLoaded(name: string) { return _features.has(name); }

export function getFeatureStatus() {
    return {
        loaded: Array.from(_features.keys()),
        failed: _failedFeatures.slice()
    };
}

export function clearFeatures() {
    _features.clear();
    _failedFeatures.length = 0;
}

export function getModuleCount() { return Object.keys(FeatureModules).length; }

export function info() {
    return {
        moduleId: MODULE_ID,
        version: VERSION,
        totalModules: getModuleCount(),
        loadedModules: _features.size,
        failedModules: _failedFeatures.length,
        categories: Object.entries(Categories).map(function(entry) {
            return { name: entry[0], count: entry[1].length };
        }),
        portsInitialized: Ports.isInitialized()
    };
}

export function healthCheck() {
    return {
        status: _failedFeatures.length === 0
            ? (Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED')
            : 'DEGRADED',
        moduleId: MODULE_ID,
        version: VERSION,
        featuresLoaded: _features.size,
        featuresFailed: _failedFeatures.length,
        portsInitialized: Ports.isInitialized()
    };
}

export default {
    FeatureModules: FeatureModules, Categories: Categories,
    loadFeature: loadFeature, loadIfEnabled: loadIfEnabled, safeExecute: safeExecute, initFeature: initFeature, initFeatureAsync: initFeatureAsync,
    getLoadedFeatures: getLoadedFeatures, isFeatureLoaded: isFeatureLoaded, getFeatureStatus: getFeatureStatus, clearFeatures: clearFeatures, getModuleCount: getModuleCount,
    info: info, healthCheck: healthCheck, injectPorts: injectPorts, getPorts: getPorts, VERSION: VERSION, MODULE_ID: MODULE_ID
};
