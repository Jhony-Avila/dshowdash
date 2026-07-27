// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.8.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: index
// PURPOSE: Panel-06 - Configurações do Sistema
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanelPorts from /core/runtime/ports-profiles.js
//   PANEL_EVENTS from /core/runtime/events/catalog/panels.events.js
//   SETTINGS_EVENTS from /core/runtime/events/catalog/settings.events.js
//   AUTH_INTENTS from /core/runtime/events/catalog/auth.events.js
//   VERSION as MODULE_ID, PANEL_ID, createInitialState, createMetrics, logger, is...
//   setupEventHandlers from ./ui/events.js
//
// PROVIDES:
//   VERSION — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   mount() — exported function
//   unmount() — exported function
//   destroy() — exported function
//   MODULE_ID — module constant
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   eventName
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (window as any).Panel06
//   (window as any).PanelSettings
//   window.__dev
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createPanelPorts } from '/core/runtime/ports-profiles.js';
import { isStrict, recordViolation } from '/core/runtime/enterprise/strict-mode.js';
import { PANEL_EVENTS } from '/core/runtime/events/catalog/panels.events.js';
import { SETTINGS_EVENTS } from '/core/runtime/events/catalog/settings.events.js';
import { AUTH_INTENTS } from '/core/runtime/events/catalog/auth.events.js';
import { VERSION as MODULE_ID, PANEL_ID, createInitialState, createMetrics, logger, isAuthenticated, ensureAuth, trackTelemetry, showToast } from './state/state.js';
import * as api from './services/settings-api.js';
import * as renderModule from './ui/render.js';
import { setupEventHandlers } from './ui/events.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';

const LOCK_SVG = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;margin-right:4px;"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>';

const hasWindow = typeof window !== 'undefined';
const hasDocument = typeof document !== 'undefined';

const Ports = createPanelPorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const _getPort = (name: string) => Ports.get(name);
const _isDocumentVisible = () => typeof document !== 'undefined' && !document.hidden;

export const injectPorts = (p: Record<string, unknown>) => Ports.inject(p);
export const getPorts = () => Ports.snapshot();

const _emit = (eventName: string, data?: Record<string, unknown>) => { const eb = _getPort('eventBus'); if (eb?.emit) eb.emit(eventName, { ...(data || {}), source: MODULE_ID, timestamp: Date.now() }); };
const _loadCSS = (cssPath: string) => { const al = _getPort('assetLoader'); if (al?.loadCSS) al.loadCSS(cssPath); else if (hasDocument && !document.querySelector(`link[href="${cssPath}"]`)) { const link = document.createElement('link'); link.rel = 'stylesheet'; link.href = cssPath; document.head.appendChild(link); } };

const PanelSettings = (() => {
  let state = createInitialState();
  let container: HTMLElement | null = null;
  let abortController: AbortController | null = null;
  let isInitialized = false;
  let _metrics = createMetrics();

  // @ts-expect-error strict migration — TS2345
  const renderPanel = () => renderModule.render(container!, state, { setupEventHandlers: (c: HTMLElement) => setupEventHandlers(c, state, handlers) });

  const handlers = {
    render: renderPanel,
    saveAll: () => { if (!ensureAuth(_metrics, 'saveAll')) return Promise.resolve(false); if (Object.keys(state.changes).length === 0) return Promise.resolve(true); state.saving = true; renderPanel(); return api.bulkUpdate(state.changes, abortController!).then(() => { state.changes = {}; _metrics.saveCount++; return refresh(); }).then(() => true).catch((e: Error) => { _metrics.errorCount++; state.error = e.message; showToast(`Erro ao salvar: ${e.message}`, 'error'); return false; }).finally(() => { state.saving = false; renderPanel(); }); },
    saveSetting: (key: string, value: unknown) => { if (!ensureAuth(_metrics, 'saveSetting')) return Promise.resolve(false); return api.updateSetting(key, value, abortController!).then(() => { _metrics.saveCount++; delete state.changes[key]; return refresh(); }).then(() => true).catch((e: Error) => { _metrics.errorCount++; showToast(`Erro ao salvar: ${e.message}`, 'error'); return false; }); },
    createSetting: (settingData: Record<string, unknown>) => { if (!ensureAuth(_metrics, 'createSetting')) return Promise.resolve(false); return api.createSetting(settingData, abortController!).then(() => refresh()).then(() => true).catch((e: Error) => { _metrics.errorCount++; showToast(`Erro ao criar: ${e.message}`, 'error'); return false; }); },
    deleteSetting: (key: string) => { if (!ensureAuth(_metrics, 'deleteSetting')) return Promise.resolve(false); if (!confirm(`Remover configuração "${key}"?`)) return Promise.resolve(false); return api.deleteSetting(key, abortController!).then(() => refresh()).then(() => true).catch((e: Error) => { _metrics.errorCount++; showToast(`Erro ao remover: ${e.message}`, 'error'); return false; }); }
  };

  const refresh = () => {
    if (!ensureAuth(_metrics, 'refresh')) { state.loading = false; state.error = 'Sessão expirada. Faça login novamente.'; renderPanel(); return Promise.resolve(false); }
    state.loading = true; state.error = null; renderPanel();
    _metrics.loadCount++; _metrics.lastActivity = Date.now();

    return Promise.all([api.loadSettings(state, abortController!), api.loadCategories(state, abortController!)]).then(() => { trackTelemetry('refresh_success', { settingsCount: state.settings.length }); return true; }).catch((e: Error) => { _metrics.errorCount++; state.error = e.message; trackTelemetry('refresh_error', { error: e.message }); return false; }).finally(() => { state.loading = false; renderPanel(); });
  };

  const mount = (element: HTMLElement) => {

    if (!isAuthenticated()) { _metrics.authFailCount++; trackTelemetry('mount_blocked_no_auth'); element.innerHTML = `<div class="panel-error" style="padding: 2rem; text-align: center; color: #F59E0B;">${LOCK_SVG} Faça login para acessar este painel</div>`; _emit(AUTH_INTENTS.LOGIN, { reason: 'panel-mount-no-auth' }); return Promise.resolve(false); }
    container = element; container.setAttribute('data-panel', PANEL_ID); container.setAttribute('data-version', VERSION);
    abortController = new AbortController();
    _loadCSS('/components/panels/panel-06/styles/index.css');

    // @ts-expect-error TS migration - TS2339
    return refresh().then(() => { isInitialized = true; _metrics.mountCount++; _metrics.lastActivity = Date.now(); _emit(SETTINGS_EVENTS.MOUNTED, { panelId: PANEL_ID }); logger.debug('Montado'); _emit(PANEL_EVENTS.MOUNTED, { panelId: PANEL_ID, version: VERSION }); return true; });
  };


  // @ts-expect-error TS migration - TS2339
  const unmount = () => { if (abortController) { abortController.abort(); abortController = null; } container = null; state = createInitialState(); isInitialized = false; _metrics.unmountCount++; logger.debug('Desmontado'); _emit(PANEL_EVENTS.UNMOUNTED, { panelId: PANEL_ID }); };

  const healthCheck = () => { const checks = { initialized: isInitialized, containerPresent: !!container, authenticated: isAuthenticated(), abortControllerActive: !!abortController && !abortController.signal.aborted, hasSettings: state.settings.length > 0, noError: !state.error, lowErrorRate: _metrics.loadCount === 0 || (_metrics.errorCount / _metrics.loadCount) < 0.3, p18IntentsAvailable: true }; const passed = Object.values(checks).filter(Boolean).length; const total = Object.keys(checks).length; return { status: passed === total ? 'HEALTHY' : (passed >= total * 0.6 ? 'DEGRADED' : 'UNHEALTHY'), score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, metrics: { ..._metrics }, version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), p22Compliant: true, timestamp: Date.now() }; };
  const getStatus = () => ({ version: VERSION, moduleId: MODULE_ID, panelId: PANEL_ID, initialized: isInitialized, authenticated: isAuthenticated(), settingsCount: state.settings.length, pendingChanges: Object.keys(state.changes).length, portsInitialized: Ports.isInitialized(), usingP18Intents: true, p22Compliant: true, metrics: { ..._metrics } });
  const getMetrics = () => ({ ..._metrics });
  const info = () => ({ version: VERSION, moduleId: MODULE_ID, panelId: PANEL_ID, initialized: isInitialized, authenticated: isAuthenticated(), portsInitialized: Ports.isInitialized(), usingP18Intents: true, p22Compliant: true, metrics: { ..._metrics }, healthCheck: healthCheck() });

  return { mount, unmount, refresh, saveAll: handlers.saveAll, saveSetting: handlers.saveSetting, createSetting: handlers.createSetting, deleteSetting: handlers.deleteSetting, getState: () => ({ ...state }), getPanelId: () => PANEL_ID, getVersion: () => VERSION, getStatus, getMetrics, healthCheck, info };
})();

if (hasWindow && !isStrict()) { (window as any).PanelSettings = PanelSettings; (window as any).Panel06 = PanelSettings; const cfg = _getPort('config'); if (cfg?.app?.debug) { window.__dev = window.__dev || {}; window.__dev.PanelSettings = PanelSettings; } }

export { MODULE_ID };
export const mount = PanelSettings.mount;
export const unmount = PanelSettings.unmount;
export const destroy = () => unmount();

// @ts-expect-error TS migration - TS2339
export const healthCheck = () => { const hc = PanelSettings.healthCheck(); hc.isDocumentVisible = _isDocumentVisible(); return hc; };
export default PanelSettings;
