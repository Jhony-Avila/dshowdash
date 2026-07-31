// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (9.4.0-STRICT-MODE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-05
// PURPOSE: Painel Cliente 360 — orquestrador principal com KPIs,
//          tabela, charts, insights, funil, comparativo e churn
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanelPorts — from '/core/runtime/ports-profiles.js'
//   isStrict, recordViolation — from '/core/runtime/enterprise/strict-mode.js'
//   PANEL_EVENTS — from '/core/runtime/events/catalog/panels.events.js'
//   PANEL_ID, REFRESH_INTERVAL — from './core/constants.js'
//   mount (as bootstrapMount), unmount (as bootstrapUnmount) — from './bootstrap/mount.js'
//   store — from './state/store.js'
//   apiClient — from './services/api.js'
//   updateCountdown — from './renderer/status.js'
//   clear (as clearTable) — from './renderer/table.js'
//   stop (as stopScheduler) — from './scheduler/refresh.js'
//   Telemetry — from './telemetry/tracker.js'
//   toastManager — from './ui/toast.js'
//   chartsRenderer, insightsRenderer, funilRenderer,
//     advancedRenderer — from './ui/*.js'
//   modalsManager — from './ui/modals.js'
//   exportManager — from './utils/export-manager.js'
//   Favoritos — from './managers/favoritos.js'
//   ModalController — from './managers/modal-controller.js'
//   Cliente360View — from './managers/cliente360-view.js'
//   loadAllData, loadClientes — from './handlers/data.js'
//   handleClick, handleChange, handleInput, handleKeyboard,
//     clearSearchTimeout — from './handlers/events.js'
//   Subscriptions — from './handlers/subscriptions.js'
//   SectionRenderers — from './render/sections.js'
//
// PROVIDES:
//   mount(container, config) — monta painel
//   unmount() — desmonta painel
//   injectPorts(p) / getPorts() — ports API
//   getVersion() — retorna VERSION
//   MODULE_ID, VERSION — constantes
//
// RECEIVES (via init/options): container (DOM), config (object)
// EMITS (eventos):
//   PANEL_EVENTS.MOUNTING, PANEL_EVENTS.READY, PANEL_EVENTS.ERROR,
//   PANEL_EVENTS.VIEW_CHANGED
// LISTENS (eventos):
//   click, change, input, keydown — DOM events no container
// WINDOW ACCESS:
//   window.Toast — exposicao global do toast manager (permitido, é provider)
//   document.head — injecao de CSS
// ───────────────────────────────────────────────────────────────
// @changelog v9.4.0-STRICT-MODE - NR-FULL: Migração para strict mode
//            - Adicionado import de isStrict, recordViolation
//            - Este módulo PROVÊ window.Toast, então expor globalmente é permitido
//            - Logs internos usam _getLogger() com strict compliance
// @changelog v9.3.0-ENTERPRISE - Versão anterior
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createPanelPorts } from '/core/runtime/ports-profiles.js';
import { isStrict } from '/core/runtime/enterprise/strict-mode.js';
import { PANEL_EVENTS } from '/core/runtime/events/catalog/panels.events.js';
import { PANEL_ID, REFRESH_INTERVAL } from './core/constants.js';
import { mount as bootstrapMount, unmount as bootstrapUnmount } from './bootstrap/mount.js';
import { store } from './state/store.js';
import { apiClient } from './services/api.js';
import { updateCountdown } from './renderer/status.js';
import { clear as clearTable } from './renderer/table.js';
// `start` faltava: o mount chamava startScheduler(...) -> ReferenceError (ver .js).
import { start as startScheduler, stop as stopScheduler } from './scheduler/refresh.js';
import * as Telemetry from './telemetry/tracker.js';
import { toastManager } from './ui/toast.js';
import { chartsRenderer } from './ui/charts.js';
import { insightsRenderer } from './ui/insights.js';
import { funilRenderer } from './ui/funil.js';
import { advancedRenderer } from './ui/advanced.js';
import { modalsManager } from './ui/modals.js';
import { exportManager } from './utils/export-manager.js';
import * as Favoritos from './managers/favoritos.js';
import * as ModalController from './managers/modal-controller.js';
import * as Cliente360View from './managers/cliente360-view.js';
import { loadAllData, loadClientes } from './handlers/data.js';
import { handleClick, handleChange, handleInput, handleKeyboard, clearSearchTimeout } from './handlers/events.js';
import * as Subscriptions from './handlers/subscriptions.js';
import * as SectionRenderers from './render/sections.js';

export const MODULE_ID = 'panel-05';
export const VERSION = '9.3.0-P2-ENTERPRISE';

export const getVersion = () => VERSION;

const hasWindow = typeof window !== 'undefined';
const hasDocument = typeof document !== 'undefined';

const Ports = createPanelPorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const _getPort = (name: string) => Ports.get(name);
const _isAuthenticated = () => { const auth = _getPort('auth'); return auth?.isAuthenticated?.() ?? false; };
const _isDocumentVisible = () => typeof document !== 'undefined' && !document.hidden;
export const injectPorts = (p: Record<string, unknown>) => Ports.inject(p);
export const getPorts = () => Ports.snapshot();

const _getEventBus = () => {
  const eb = _getPort('eventBus');
  if (eb) return eb;
  if (window.Core?.windowAdapter?.get) {
    const web = window.Core.windowAdapter.get('EventBus');
    if (web) return web;
  }
  return null;
};

const _getLogger = () => {
  const logger = _getPort('logger');
  if (logger) return logger;
  if (window.Core?.windowAdapter?.get) {
    const wl = window.Core.windowAdapter.get('Logger');
    if (wl) return wl;
  }
  return null;
};

const _emitLifecycle = (event: string, data: Record<string, unknown> = {}) => { const eb = _getEventBus(); if (eb?.emit) eb.emit(event, { ...(data || {}), source: MODULE_ID, timestamp: Date.now() }); };
const _log = (level: string, msg: string, data: Record<string, unknown> = {}) => { const logger = _getLogger(); if (logger?.[level]) logger[level](`[${MODULE_ID}] ${msg}`, data || ''); };

let _refs: Record<string, unknown> | null = null;
let _initialized = false;
const _selectedIds = new Set<string>();
let _mountedAt: number | null = null;
let _abortController: AbortController | null = null;

const _getContext = () => ({ refs: _refs, moduleId: MODULE_ID, version: VERSION, renderKPIs: (data: unknown) => SectionRenderers.renderKPIs(_refs, data), renderCharts: (data: unknown) => SectionRenderers.renderCharts(_refs, data as Record<string, unknown> | null), renderInsights: (data: unknown) => SectionRenderers.renderInsights(_refs, data), renderComparativo: (data: unknown) => SectionRenderers.renderComparativo(_refs, data), renderFunil: (data: unknown) => SectionRenderers.renderFunil(_refs, data as Record<string, unknown> | null), renderChurn: (data: unknown) => SectionRenderers.renderChurn(_refs, data) });

const _initToast = () => {
  toastManager.init((_refs?.container as HTMLElement | undefined) ?? document.body);
  if (hasWindow) { window.Toast = { show: (opts: Record<string, unknown>) => { const type = (opts.type as string) || 'info'; const message = opts.message || ''; return toastManager[type] ? toastManager[type](message, opts) : toastManager.info(message, opts); }, success: (msg: unknown, opts: Record<string, unknown>) => toastManager.success(msg, opts), error: (msg: unknown, opts: Record<string, unknown>) => toastManager.error(msg, opts), warning: (msg: unknown, opts: Record<string, unknown>) => toastManager.warning(msg, opts), info: (msg: unknown, opts: Record<string, unknown>) => toastManager.info(msg, opts) }; }
};

export const mount = (container: HTMLElement, config: Record<string, unknown> = {}) => {
  _initPorts();
  if (!_isAuthenticated()) { return { success: false, moduleId: MODULE_ID, error: "not-authenticated" }; } 
  const doMount = async () => {

    _emitLifecycle(PANEL_EVENTS.MOUNTING);
    Telemetry.startTimer('mount');
    _abortController = new AbortController();
    const cssPath = '/components/panels/panel-05/styles/main.css';
    if (hasDocument && !document.querySelector(`link[href*="${cssPath}"]`)) { const link = document.createElement('link'); link.rel = 'stylesheet'; link.href = cssPath; document.head.appendChild(link); }
    Favoritos.load();
    const refs = await bootstrapMount(container) as Record<string, unknown> | null;

    if (!refs) { _log('error', 'Bootstrap failed'); _emitLifecycle(PANEL_EVENTS.ERROR, { error: 'bootstrap-failed' }); return false; }
    _refs = refs; _initToast();
    Cliente360View.init(_refs.cliente360 as HTMLElement, _refs, MODULE_ID, VERSION);
    Subscriptions.setup(_getContext());
    const ctx = _getContext();
    (_refs.container as HTMLElement).addEventListener('click', (e) => handleClick(e, ctx), { signal: _abortController.signal });
    (_refs.container as HTMLElement).addEventListener('change', (e) => handleChange(e, ctx), { signal: _abortController.signal });
    (_refs.container as HTMLElement).addEventListener('input', handleInput, { signal: _abortController.signal });

    document.addEventListener('click', (e) => { if ((e.target as Element).closest('[data-action="close-modal"]')) ModalController.close(); }, { signal: _abortController.signal });
    document.addEventListener('keydown', (e) => handleKeyboard(e, ctx), { signal: _abortController.signal });

    // O `@ts-expect-error TS2552 startScheduler not imported` que existia aqui estava
    // CERTO: o compilador apontou o ReferenceError e a supressao o escondeu. Import
    // corrigido no topo; o scheduler agora arranca so apos a carga inicial dar certo
    // (senao um setInterval orfao sobrevive a um mount falho). Ver .js irmao.
    try {
      await loadAllData(MODULE_ID, VERSION);
      startScheduler({ interval: config.refreshInterval || REFRESH_INTERVAL || 60000, onTick: (seconds: number | null) => updateCountdown(_refs, seconds), onRefresh: () => loadClientes() });
      _initialized = true; _mountedAt = Date.now();
      const duration = Telemetry.endTimer('mount');
      Telemetry.track('mount', { duration });
      _emitLifecycle(PANEL_EVENTS.MOUNTED, { duration });
      _emitLifecycle(PANEL_EVENTS.READY);
      _log('info', `Mounted v${VERSION}`);
      toastManager.success('Painel carregado');
      return true;
    } catch (err: unknown) { stopScheduler(); _log('error', 'Mount failed', { error: (err as Error)?.message }); _emitLifecycle(PANEL_EVENTS.ERROR, { error: (err as Error)?.message }); return false; }
  };
  if (_initialized) return unmount().then(doMount);
  return doMount();
};

export const unmount = () => {
  _emitLifecycle(PANEL_EVENTS.UNMOUNTING);
  Telemetry.track('unmount', { uptime: _mountedAt ? Date.now() - _mountedAt : 0 });
  if (_abortController) { _abortController.abort(); _abortController = null; }
  stopScheduler(); Subscriptions.clear(); clearSearchTimeout(); ModalController.close();
  Cliente360View.destroy(); clearTable(); store.reset(); bootstrapUnmount();
  _refs = null; _initialized = false; Favoritos.clear(); _selectedIds.clear(); _mountedAt = null;
  _emitLifecycle(PANEL_EVENTS.UNMOUNTED); _log('info', 'Unmounted');
  return Promise.resolve();
};


export const refresh = () => { if (!_isDocumentVisible()) return Promise.resolve(); _emitLifecycle(PANEL_EVENTS.REFRESH_START); Telemetry.startTimer('refresh'); return loadAllData(MODULE_ID, VERSION).then(() => { const duration = Telemetry.endTimer('refresh'); _emitLifecycle(PANEL_EVENTS.REFRESH_DONE, { duration }); toastManager.success('Dados atualizados'); }); };

export const getState = () => store.getState();
export const getView = () => Cliente360View.getCurrentView();
export const getFavoritos = () => Favoritos.getAll();
export const getSelectedIds = () => Array.from(_selectedIds);

export const info = () => ({ moduleId: MODULE_ID, version: VERSION, mounted: _initialized, mountedAt: _mountedAt, uptime: _mountedAt ? Date.now() - _mountedAt : 0, view: Cliente360View.getCurrentView(), favoritos: Favoritos.count(), selected: _selectedIds.size, storeStatus: store.get('status'), cliente360: Cliente360View.info(), charts: chartsRenderer.info?.() ?? null, insights: insightsRenderer.info?.() ?? null, funil: funilRenderer.info?.() ?? null, advanced: advancedRenderer.info?.() ?? null, modals: modalsManager.info?.() ?? null, export: exportManager.info?.() ?? null, telemetry: Telemetry.getMetrics(), api: apiClient.getMetrics(), p22Compliant: true, timestamp: Date.now() });

export const healthCheck = () => { const checks = { initialized: _initialized, refsValid: !!(_refs?.container && _refs?.tbody), storeReady: store.get('status') !== 'error', cliente360Ready: !!Cliente360View.getInstance(), chartsReady: !!chartsRenderer, insightsReady: !!insightsRenderer, funilReady: !!funilRenderer, advancedReady: !!advancedRenderer, modalsReady: !!modalsManager, exportReady: !!exportManager, toastReady: !!toastManager, apiHealthy: apiClient.healthCheck().status === 'HEALTHY', telemetryOk: Telemetry.healthCheck().status !== 'UNHEALTHY', abortControllerActive: !!_abortController && !_abortController.signal.aborted }; const passed = Object.values(checks).filter(Boolean).length; const total = Object.keys(checks).length; return { status: passed === total ? 'HEALTHY' : passed >= 10 ? 'DEGRADED' : 'UNHEALTHY', score: `${passed}/${total}`, checks, moduleId: MODULE_ID, version: VERSION, p22Compliant: true, isDocumentVisible: _isDocumentVisible(), timestamp: Date.now() }; };

export { PANEL_ID };
export const destroy = () => unmount();
export default { mount, unmount, destroy, refresh, info, healthCheck, getVersion, getState, getView, VERSION, MODULE_ID, PANEL_ID, injectPorts, getPorts };
if (hasWindow && !isStrict()) { (window as any).Panel05 = { mount, unmount, refresh, info, healthCheck, getVersion, getState, getView }; }
