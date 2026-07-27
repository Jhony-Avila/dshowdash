// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (9.3.1-CSS-PATH-FIX)
// ═══════════════════════════════════════════════════════════════
// IMPORTS:
//   createPanelPorts from /core/runtime/ports-profiles.js
//   isStrict, recordViolation from /core/runtime/enterprise/strict-mode.js
//   AUTH_EVENTS from /core/runtime/events/catalog/auth.events.js
//   PANEL_ID, CSS_PATH, REFRESH_INTERVAL from ./core/constants.js
//   CONFIG from ./core/config.js
//   STATES, StateMachine from ./core/states.js
//   renderStructure from ./core/template.js
//   DataLoader from ./core/data-loader.js
//   apiClient from ./services/api.js
//   store from ./state/store.js
//   PanelTelemetryTracker from ./telemetry/tracker.js
//   ErrorBoundary from ./ui/error-boundary.js
//   renderKPISkeleton from ./ui/render/skeleton.js
//   Storage from ./utils/storage.js
//   initPerformance, destroyPerformance from ./init/performance.js
//   initCoreComponents, initTableExtensions, initUIExtensions,
//     initUtilsExtensions, initServices, destroyComponents from ./init/components.js
//   handleSort, handleKeyboardAction, handleContextAction,
//     handleDrawerAction, handleBulkAction, handleWebSocketMessage from ./handlers/events.js
//   loadAllData, loadRequisicoes, executeSearch, loadDetail from ./handlers/data.js
//   saveInlineEdit, saveBulkEdit, applyView, duplicateItem from ./handlers/edit.js
//   showBulkEditDialog, showImportDialog, showSaveViewDialog, showTagDialog from ./handlers/dialogs.js
//   exportCSV, exportPDF, exportSinglePDF, print, printSingle from ./handlers/export.js
//   createAutoRefreshManager from ./handlers/auto-refresh.js
//   saveState, restoreState from ./state/persistence.js
//   handleStateChange from ./render/state-handler.js
//
// PROVIDES: Panel01Controller class (mount/unmount/refresh/getStatus/
//   getVersion/healthCheck/info/emit/on), mount/unmount/refresh/getStatus/
//   getVersion/healthCheck/info/emit/on/getEmitMetrics,
//   PANEL_ID, MODULE_ID, PANEL_EVENTS, VERSION, injectPorts, getPorts
//
// RECEIVES (via mount):
//   container — DOM Element or selector
//   config — panel configuration
//
// WINDOW ACCESS (legítimo — auth fallback + legacy bridge):
//   window.SessionManager (auth fallback check)
//   window.dispatchEvent(CustomEvent) (legacy event bridge)
//
// BROWSER APIs (legítimo — panel DOM + lifecycle):
//   document.querySelector, document.createElement, document.head.appendChild,
//   document.addEventListener('visibilitychange'), document.body.dataset
// ═══════════════════════════════════════════════════════════════
// Panel-01 - Gestao de Requisicoes
// @version 9.3.1-CSS-PATH-FIX
// @changelog v9.3.1-CSS-PATH-FIX - CRITICAL: Fixed import that aliased VERSION as CSS_PATH,
//   preventing stylesheet from loading. Fixed tagged template literal syntax in querySelector calls.
// @changelog v9.3.0-P2-ENTERPRISE - Previous version
// @changelog v8.9.0-STRICT-MODE - Migração para strict mode (NR-FULL)
// @changelog v8.8.0-AUTH-GATING - CRITICAL: Added auth gating before mount to prevent API calls without authentication
// @changelog v8.7.0-ENTERPRISE - Removed console.* from _log, use Logger only
'use strict';

import { createPanelPorts } from '/core/runtime/ports-profiles.js';
import { isStrict, recordViolation } from '/core/runtime/enterprise/strict-mode.js';
import { AUTH_EVENTS as P18_AUTH_EVENTS } from '/core/runtime/events/catalog/auth.events.js';
import { PANEL_ID, CSS_PATH, REFRESH_INTERVAL } from './core/constants.js';
import { CONFIG } from './core/config.js';
import { STATES, StateMachine } from './core/states.js';
import { renderStructure } from './core/template.js';
import { DataLoader } from './core/data-loader.js';
import { apiClient } from './services/api.js';
import { store } from './state/store.js';
import { PanelTelemetryTracker } from './telemetry/tracker.js';
import { ErrorBoundary } from './ui/error-boundary.js';
import { renderKPISkeleton } from './ui/render/skeleton.js';
import * as Storage from './utils/storage.js';
import { initPerformance, destroyPerformance } from './init/performance.js';
import { initCoreComponents, initTableExtensions, initUIExtensions, initUtilsExtensions, initServices, destroyComponents } from './init/components.js';
import { handleSort, handleKeyboardAction, handleContextAction, handleDrawerAction, handleBulkAction, handleWebSocketMessage } from './handlers/events.js';
import { loadAllData, loadRequisicoes, executeSearch, loadDetail } from './handlers/data.js';
import { saveInlineEdit, saveBulkEdit, applyView, duplicateItem } from './handlers/edit.js';
import { showBulkEditDialog, showImportDialog, showSaveViewDialog, showTagDialog } from './handlers/dialogs.js';
import { exportCSV, exportPDF, exportSinglePDF, print, printSingle } from './handlers/export.js';
import { createAutoRefreshManager } from './handlers/auto-refresh.js';
import { saveState, restoreState } from './state/persistence.js';
import { handleStateChange } from './render/state-handler.js';

const MODULE_ID = 'panel-01';
export const VERSION = '9.3.1-CSS-PATH-FIX';

const Ports = createPanelPorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const _getPort = (name: string) => Ports.get(name);
export const injectPorts = (p: unknown) => Ports.inject(p);
export const getPorts = () => Ports.snapshot();

const PANEL_EVENTS = Object.freeze({ MOUNTED: 'panel-01:mounted', READY: 'panel-01:ready', UNMOUNTED: 'panel-01:unmounted', ERROR: 'panel-01:error', DATA_LOADED: 'panel-01:data:loaded', DATA_ERROR: 'panel-01:data:error', SELECTION_CHANGED: 'panel-01:selection:changed', FILTER_CHANGED: 'panel-01:filter:changed', REFRESH: 'panel-01:refresh', AUTH_REQUIRED: 'panel-01:auth:required' });

const LOCK_SVG = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:8px;"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>';

let _emitMetrics: { total: number; byEvent: Record<string, number>; lastEmitAt: number | null } = { total: 0, byEvent: {}, lastEmitAt: null };
const _trackEmit = (eventName: string) => { _emitMetrics.total++; _emitMetrics.byEvent[eventName] = (_emitMetrics.byEvent[eventName] || 0) + 1; _emitMetrics.lastEmitAt = Date.now(); };
const _log = (level: string, ...args: unknown[]) => { const prefix = `[${MODULE_ID}]`; const logger = _getPort('logger') as Record<string, ((...a: unknown[]) => void) | undefined> | null; if (logger?.[level]) logger[level]!(prefix, ...args); };

const EventBusHelper = {
  emit: (event: string, data: Record<string, unknown>) => { _trackEmit(event); const eb = _getPort('eventBus') as Record<string, ((...a: unknown[]) => void) | undefined> | null; if (eb?.emit) { try { eb.emit(event, { ...data, source: MODULE_ID, timestamp: Date.now() }); } catch (e) { _log('warn', 'EventBus emit failed:', (e as Error).message); } } try { window.dispatchEvent(new CustomEvent(event, { detail: data })); } catch {} },
  on: (event: string, handler: (...args: unknown[]) => unknown) => { const eb = _getPort('eventBus') as Record<string, ((...a: unknown[]) => void) | undefined> | null; if (eb?.on) { try { eb.on(event, handler); return true; } catch (e) { _log('warn', 'EventBus on failed:', (e as Error).message); } } return false; },
  off: (event: string, handler: (...args: unknown[]) => unknown) => { const eb = _getPort('eventBus') as Record<string, ((...a: unknown[]) => void) | undefined> | null; if (eb?.off) { try { eb.off(event, handler); } catch {} } }
};

class Panel01Controller {
  [key: string]: any;
  constructor() {
    this._container = null; this._wrapper = null; this._contentEl = null; this._paginationEl = null; this._kpisEl = null;
    this._stateMachine = new StateMachine(STATES.IDLE); this._dataLoader = null; this._telemetry = null; this._unsubscribe = null;
    this._errorBoundary = null; this._autoRefresh = null; this._core = {}; this._perf = {}; this._tableExt = {}; this._uiExt = {};
    this._utilsExt = {}; this._services = {}; this._density = Storage.getDensity(); this._autoRefreshEnabled = CONFIG.features.autoRefresh;
    this._initialized = false; this._authConnected = false; this._authHandlers = {};
    this._visibilityHandler = null; this._abortController = null;
  }

  _getContext() {
    return { wrapper: this._wrapper, contentEl: this._contentEl, paginationEl: this._paginationEl, kpisEl: this._kpisEl, density: this._density, autoRefreshEnabled: this._autoRefreshEnabled, dataLoader: this._dataLoader, telemetry: this._telemetry, haptic: this._utilsExt.haptic, table: this._core.table, drawer: this._core.drawer, selection: this._core.selection, pagination: this._core.pagination, multiSort: this._tableExt.multiSort, stickyColumns: this._tableExt.stickyColumns, virtualScroll: this._perf.virtualScroll, bulkEdit: this._uiExt.bulkEdit, savedViews: this._uiExt.savedViews, tags: this._uiExt.tags, preview: this._uiExt.preview, badgeNew: this._uiExt.badgeNew, animations: this._uiExt.animations, importManager: this._utilsExt.importManager, pdfExporter: this._utilsExt.pdfExporter, duplicateManager: this._utilsExt.duplicateManager, fuzzySearch: this._perf.fuzzySearch, indexedDBCache: this._perf.indexedDBCache, workerManager: this._perf.workerManager, loadAllData: () => loadAllData(this._getContext()), loadRequisicoes: () => loadRequisicoes(this._getContext()), saveState: () => saveState(), setDensity: (d: string) => this._setDensity(d) };
  }

  _isAuthenticated() {
    const auth = _getPort('auth');
    if (auth?.isAuthenticated?.()) return true;
    if (typeof window === 'undefined') return false;
    const strictMode = isStrict();
    if (window.Core?.windowAdapter?.get) {
      const sm = window.Core.windowAdapter.get('SessionManager');
      if (sm?.isAuthenticated?.()) return true;
    }
    if (strictMode) return false;
    if (window.SessionManager?.isAuthenticated?.()) {
      recordViolation('WINDOW_SESSIONMANAGER_FALLBACK', { module: MODULE_ID, method: '_isAuthenticated' });
      return true;
    }
    const doc = typeof document !== 'undefined' ? document : null;
    const authState = doc?.body?.dataset?.state;
    if (authState === 'authenticated') return true;
    return false;
  }

  _renderAuthRequired(container: HTMLElement) {
    container.innerHTML = `
      <div class="p01-auth-required" style="display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:300px;padding:2rem;text-align:center;color:rgba(255,255,255,0.7);">
        <div style="font-size:3rem;margin-bottom:1rem;color:#F59E0B;">${LOCK_SVG.replace('width="20" height="20"', 'width="48" height="48"')}</div>
        <h3 style="margin:0 0 0.5rem;font-size:1.25rem;font-weight:600;color:rgba(255,255,255,0.9);">Autenticação Necessária</h3>
        <p style="margin:0;font-size:0.875rem;opacity:0.7;">Faça login para acessar este painel</p>
      </div>
    `;
    _log('info', 'Auth required - panel not mounted');
    EventBusHelper.emit(PANEL_EVENTS.AUTH_REQUIRED, { version: VERSION });
  }

  _setupAuthIntegration() {
    if (!P18_AUTH_EVENTS) { _log('warn', 'P18_AUTH_EVENTS not available'); return; }
    this._authHandlers.loginSuccess = (data: unknown) => { _log('info', 'Auth: Login detected, refreshing data'); this._telemetry?.track(P18_AUTH_EVENTS.LOGIN_DETECTED); if (this._initialized) loadAllData(this._getContext()); };
    this._authHandlers.logout = (data: unknown) => { _log('info', 'Auth: Logout detected, clearing panel'); this._telemetry?.track(P18_AUTH_EVENTS.LOGOUT_DETECTED); if (this._initialized) { store.reset(); this._core.selection?.deselectAll(); if (this._contentEl) this._contentEl.innerHTML = ''; this._autoRefresh?.stop(); } };
    this._authHandlers.sessionChecked = (data: Record<string, unknown> | null) => { if (data?.authenticated && this._initialized) _log('info', 'Auth: Session validated'); else if (data && !data.authenticated && this._initialized) { _log('info', 'Auth: Session invalid, clearing'); store.reset(); this._autoRefresh?.stop(); } };
    EventBusHelper.on(P18_AUTH_EVENTS.LOGIN_SUCCESS, this._authHandlers.loginSuccess);
    EventBusHelper.on(P18_AUTH_EVENTS.LOGOUT, this._authHandlers.logout);
    EventBusHelper.on(P18_AUTH_EVENTS.LOGOUT_SUCCESS, this._authHandlers.logout);
    EventBusHelper.on(P18_AUTH_EVENTS.SESSION_CHECKED, this._authHandlers.sessionChecked);
    this._authConnected = true; _log('info', 'Auth integration connected (P18EC catalog)');
  }

  _teardownAuthIntegration() {
    if (!this._authConnected || !P18_AUTH_EVENTS) return;
    if (this._authHandlers.loginSuccess) EventBusHelper.off(P18_AUTH_EVENTS.LOGIN_SUCCESS, this._authHandlers.loginSuccess);
    if (this._authHandlers.logout) { EventBusHelper.off(P18_AUTH_EVENTS.LOGOUT, this._authHandlers.logout); EventBusHelper.off(P18_AUTH_EVENTS.LOGOUT_SUCCESS, this._authHandlers.logout); }
    if (this._authHandlers.sessionChecked) EventBusHelper.off(P18_AUTH_EVENTS.SESSION_CHECKED, this._authHandlers.sessionChecked);
    this._authHandlers = {}; this._authConnected = false;
  }

  _setupVisibilityHandler() {
    if (this._visibilityHandler) return;
    this._visibilityHandler = () => {
      if (document.hidden) {
        this._autoRefresh?.pause();
        apiClient.cancel?.();
        _log('debug', 'Visibility hidden - paused refresh and cancelled requests');
      } else if (this._initialized && this._isAuthenticated()) {
        this._autoRefresh?.resume();
        _log('debug', 'Visibility visible - resumed refresh');
      }
    };
    if (!this._abortController) this._abortController = new AbortController();
    document.addEventListener('visibilitychange', this._visibilityHandler, { signal: this._abortController.signal });
  }

  _teardownVisibilityHandler() {
    if (this._abortController) {
      this._abortController.abort();
      this._abortController = null;
    }
    this._visibilityHandler = null;
  }

  mount(container: HTMLElement | string, config: Record<string, unknown>) {
    const doMount = (): Promise<unknown> => {
      if (this._initialized) return this.unmount().then(doMount);
      _initPorts(); this._stateMachine.transition(STATES.MOUNTING);
      this._container = typeof container === 'string' ? document.querySelector(container) : container;
      if (!this._container) { _log('error', 'Container not found'); EventBusHelper.emit(PANEL_EVENTS.ERROR, { error: 'Container not found' }); return Promise.resolve(false); }

      // AUTH GATING: Verificar autenticação ANTES de qualquer operação
      if (!this._isAuthenticated()) {
        this._renderAuthRequired(this._container);
        this._setupAuthIntegration();
        this._stateMachine.transition(STATES.IDLE);
        return Promise.resolve(false);
      }

      if (CONFIG.features.errorBoundary) { this._errorBoundary = new ErrorBoundary(this._container, { onError: (err: Error) => { this._telemetry?.trackError(err, 'errorBoundary'); EventBusHelper.emit(PANEL_EVENTS.ERROR, { error: err.message }); }, onRetry: () => loadAllData(this._getContext()) }); }
      return Promise.resolve().then(() => {
        this._loadCSS(); renderStructure(this._container);
        this._wrapper = this._container.querySelector('.p01-wrapper'); this._contentEl = this._container.querySelector(`#${PANEL_ID}-content`); this._paginationEl = this._container.querySelector('[data-pagination]'); this._kpisEl = this._container.querySelector('[data-kpis]');
        if (this._wrapper && this._density) this._wrapper.dataset.density = this._density;

        // @ts-expect-error TS migration - TS2554
        return initPerformance(this, (q, s) => executeSearch(this._getContext(), q, s));
      }).then((perf) => { this._perf = perf; return initUtilsExtensions({ loadAllData: () => loadAllData(this._getContext()) }); })

      // @ts-expect-error TS migration - TS2554
      .then((utilsExt) => { this._utilsExt = utilsExt; return initCoreComponents(this._getContext(), this._buildCoreHandlers()); })
      .then((core) => { this._core = core; const ctx = this._getContext(); this._tableExt = initTableExtensions({ table: this._core.table, contentEl: ctx.contentEl, loadRequisicoes: () => loadRequisicoes(ctx), saveInlineEdit: (d: { field: string; newValue: unknown; rowId: string | number }) => saveInlineEdit(ctx, d), haptic: this._utilsExt.haptic }); return initUIExtensions({ applyView: (c: Record<string, unknown>) => applyView(this._getContext(), c), saveBulkEdit: (d: { id: string | number; changes: Record<string, unknown> }) => saveBulkEdit(this._getContext(), d) }); })

      // @ts-expect-error TS migration - TS2554
      .then((uiExt) => { this._uiExt = uiExt; return initServices({ onWebSocketMessage: (d: { type: string; message?: string }) => handleWebSocketMessage(this._getContext(), d) }); })
      .then((services) => {

        // @ts-expect-error strict migration — TS7009
        this._services = services; this._telemetry = new PanelTelemetryTracker(PANEL_ID); this._telemetry.init(); this._dataLoader = new DataLoader();
        this._unsubscribe = store.subscribe((state: Record<string, unknown>) => handleStateChange(this._getContext(), state));
        this._autoRefresh = createAutoRefreshManager({ wrapper: this._wrapper, loadAllData: () => loadAllData(this._getContext()) });
        this._setupAuthIntegration(); this._setupVisibilityHandler(); restoreState(); if (this._kpisEl) this._kpisEl.innerHTML = renderKPISkeleton();
        EventBusHelper.emit(PANEL_EVENTS.MOUNTED, { version: VERSION }); return loadAllData(this._getContext());
      }).then(() => {
        this._autoRefresh.start(); this._initialized = true; this._stateMachine.transition(STATES.READY);
        EventBusHelper.emit(PANEL_EVENTS.READY, { version: VERSION, features: Object.keys(CONFIG.features).filter(k => (CONFIG.features as Record<string, boolean>)[k]) });
        _log('info', `Mounted v${VERSION} with auth gating and visibility handler`); return true;
      }).catch((error) => { _log('error', 'Mount failed', error); EventBusHelper.emit(PANEL_EVENTS.ERROR, { error: error.message, stack: error.stack }); this._errorBoundary?.handleError(error); this._stateMachine.transition(STATES.ERROR); return false; });
    };
    return doMount();
  }

  _buildCoreHandlers() {
    return {
      onSort: (field: string, e: MouseEvent) => handleSort(this._getContext(), field, e?.shiftKey),
      onRowClick: (action: string, id: string | number) => { if (action === 'view') loadDetail(this._getContext(), id); },
      onRowContext: (e: MouseEvent, id: string | number) => { this._core.contextMenu?.show(e.clientX, e.clientY, { id }); },
      onPageChange: (page: number) => { store.setPage(page); loadRequisicoes(this._getContext()); const state = store.getState(); this._perf.prefetch?.prefetchNextPage(page, state.pagination.totalPages, state.filters); },
      onLimitChange: (limit: number) => { store.setLimit?.(limit); loadRequisicoes(this._getContext()); },
      onDrawerAction: (action: string, data: Record<string, unknown>) => handleDrawerAction(this._getContext(), action, data),
      onKeyboardAction: (action: string) => handleKeyboardAction({ ...this._getContext(), exportCSV: () => exportCSV(this._getContext()) }, action),
      onContextAction: (action: string, item: Record<string, unknown>) => handleContextAction(this._getContext(), action, item),
      onFilterChange: (key: string, value: unknown) => { store.setFilter(key, value); EventBusHelper.emit(PANEL_EVENTS.FILTER_CHANGED, { key, value: value as Record<string, unknown> }); if (key === 'q' && this._perf.debouncedSearch) this._perf.debouncedSearch.call(value); else loadRequisicoes(this._getContext()); },
      onFilterClear: () => { store.clearFilters(); loadRequisicoes(this._getContext()); },
      onDensityChange: (d: string) => this._setDensity(d),
      onBulkAction: (action: string) => handleBulkAction(this._getContext(), action),
      onSearch: (query: string) => { this._perf.debouncedSearch?.call(query); },
      onSearchClear: () => { store.setFilter('q', ''); loadRequisicoes(this._getContext()); },
      onToolbarAction: (action: string, value: unknown) => { const handlers = this._buildCoreHandlers().actionHandlers; (handlers as Record<string, ((v: unknown) => void) | undefined>)[action]?.(value); },
      onColumnsChange: (cols: unknown[]) => { if (this._core.table) { this._core.table.columns = cols; loadRequisicoes(this._getContext()); } },
      onInlineEdit: (data: { field: string; newValue: unknown; rowId: string | number }) => saveInlineEdit(this._getContext(), data),
      onGroupChange: (field: string) => _log('info', 'Group changed to:', field),
      onRetry: () => loadAllData(this._getContext()),
      actionHandlers: { 'refresh': () => { this._utilsExt.haptic?.click(); EventBusHelper.emit(PANEL_EVENTS.REFRESH, {}); loadAllData(this._getContext()); }, 'export': () => exportCSV(this._getContext()), 'export-pdf': () => exportPDF(this._getContext()), 'print': () => print(this._getContext()), 'toggle-auto-refresh': () => { this._autoRefresh?.toggle(); }, 'clear-filters': () => { this._core.filters?.clear(); store.clearFilters(); loadRequisicoes(this._getContext()); }, 'clear-selection': () => { this._core.selection?.deselectAll(); }, 'import': () => showImportDialog(this._getContext()), 'save-view': () => showSaveViewDialog(this._getContext()), 'bulk-edit': () => showBulkEditDialog(this._getContext()), 'set-density': (d: string) => this._setDensity(d) }
    };
  }

  _setDensity(density: string) { this._density = density; if (this._wrapper) this._wrapper.dataset.density = density; Storage.setDensity(density); if (this._wrapper) { const btns = this._wrapper.querySelectorAll('[data-density]'); btns.forEach((btn: Element) => (btn as HTMLElement).classList.toggle('active', (btn as HTMLElement).dataset.density === density)); } this._utilsExt.haptic?.click(); }
  _loadCSS() { if (document.querySelector(`link[href="${CSS_PATH}"]`)) return; const link = document.createElement('link'); link.rel = 'stylesheet'; link.href = CSS_PATH; link.setAttribute('data-panel', PANEL_ID); document.head.appendChild(link); }

  unmount() { EventBusHelper.emit(PANEL_EVENTS.UNMOUNTED, { version: VERSION }); this._teardownAuthIntegration(); this._teardownVisibilityHandler(); this._autoRefresh?.destroy(); this._unsubscribe?.(); destroyPerformance(this._perf); destroyComponents({ ...this._core, ...this._tableExt, ...this._services }); this._dataLoader?.destroy(); apiClient.cancel?.(); store.reset(); if (this._container) this._container.innerHTML = ''; this._container = null; this._wrapper = null; this._initialized = false; this._stateMachine.reset(); _log('info', 'Unmounted'); return Promise.resolve(); }

  refresh() { if (!this._isAuthenticated()) { _log('warn', 'Refresh blocked - not authenticated'); return Promise.resolve(); } EventBusHelper.emit(PANEL_EVENTS.REFRESH, {}); return loadAllData(this._getContext()); }
  getStatus() { return { version: VERSION, moduleId: MODULE_ID, mounted: this._initialized, state: this._stateMachine.state, authConnected: this._authConnected, isAuthenticated: this._isAuthenticated(), circuitBreaker: this._dataLoader?.getCircuitState() ?? null, selection: this._core.selection?.count() ?? 0, features: Object.keys(CONFIG.features).filter(k => (CONFIG.features as Record<string, boolean>)[k]).length }; }
  getVersion() { return VERSION; }

  healthCheck() { const checks = { instanceExists: true, containerValid: this._initialized ? !!this._container : true, stateMachineReady: !!this._stateMachine, tableReady: !!this._core.table, dataLoaderReady: !!this._dataLoader, authConnected: this._authConnected, isAuthenticated: this._isAuthenticated(), eventBusAvailable: !!(_getPort('eventBus')?.emit), noErrors: !store.getState().error, performanceReady: !!this._perf.renderCache || !!this._perf.debouncedSearch, extensionsReady: !!this._uiExt.savedViews || !!this._uiExt.tags, abortControllerActive: !!this._abortController && !this._abortController.signal.aborted }; const score = Object.values(checks).filter(Boolean).length; const maxScore = Object.keys(checks).length; return { status: score === maxScore ? 'HEALTHY' : score >= maxScore - 2 ? 'DEGRADED' : 'UNHEALTHY', score: `${score}/${maxScore}`, checks, version: VERSION, moduleId: MODULE_ID, emitMetrics: { ..._emitMetrics }, timestamp: Date.now() }; }

  info() { return { name: MODULE_ID, version: VERSION, mounted: this._initialized, state: this._stateMachine.state, authConnected: this._authConnected, isAuthenticated: this._isAuthenticated(), metrics: this._telemetry?.getMetrics() ?? null, features: CONFIG.features, activeFeatures: Object.keys(CONFIG.features).filter(k => (CONFIG.features as Record<string, boolean>)[k]).length, events: PANEL_EVENTS, emitMetrics: { ..._emitMetrics }, timestamp: Date.now() }; }
  emit(event: string, data: Record<string, unknown>) { EventBusHelper.emit(event, data); }
  on(event: string, handler: (...args: unknown[]) => unknown) { return EventBusHelper.on(event, handler); }
}

let instance: Panel01Controller | null = null;
const mount = (container: HTMLElement | string, config: Record<string, unknown>) => { if (instance?._initialized) { return unmount().then(() => { instance = new Panel01Controller(); return instance.mount(container, config).then(() => instance); }); } instance = new Panel01Controller(); return instance.mount(container, config).then(() => instance); };
const unmount = () => { if (instance) return instance.unmount().then(() => { instance = null; }); return Promise.resolve(); };
const refresh = () => instance?.refresh() ?? Promise.resolve();
const getStatus = () => instance?.getStatus() ?? { mounted: false };
const getVersion = () => VERSION;
const healthCheck = () => instance?.healthCheck() ?? { status: 'UNHEALTHY', mounted: false, version: VERSION, timestamp: Date.now() };
const info = () => instance?.info() ?? { name: MODULE_ID, version: VERSION, mounted: false, emitMetrics: { ..._emitMetrics }, timestamp: Date.now() };
const emit = (event: string, data: Record<string, unknown>) => { instance?.emit(event, data); };
const on = (event: string, handler: (...args: unknown[]) => unknown) => EventBusHelper.on(event, handler);
const getEmitMetrics = () => ({ ..._emitMetrics });

const destroy = () => unmount();
export { PANEL_ID, MODULE_ID, PANEL_EVENTS, mount, unmount, destroy, refresh, getStatus, getVersion, healthCheck, info, emit, on, getEmitMetrics };
export default { mount, unmount, destroy, refresh, getStatus, getVersion, healthCheck, info, emit, on, getEmitMetrics, PANEL_EVENTS, VERSION, PANEL_ID, injectPorts, getPorts };
