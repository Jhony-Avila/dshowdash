// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (9.4.0-LIFECYCLE-CLEANUP)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-observability
// PURPOSE: Panel Observability - Painel Vivo P10.3 AAA
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanelPorts from /core/runtime/ports-profiles.js
//   ACTION_EVENTS from /core/runtime/events/catalog/action.events.js
//   PERSISTENCE_EVENTS from /core/runtime/events/catalog/persistence.events.js
//   OBSERVABILITY_EVENTS from /components/main/domain/observability/observability...
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   getVersion() — exported function
//   injectPorts() — exported function
//   getPorts() — exported function
//   createPanel() — exported function
//   mount() — exported function
//   unmount() — exported function
//   destroy() — exported function
//   PanelObservability — exported value
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   OBSERVABILITY_EVENTS.HEALTH_REQUEST
//   OBSERVABILITY_EVENTS.METRICS_REQUEST
// LISTENS (eventos):
//   ACTION_EVENTS.ACCEPTED
//   ACTION_EVENTS.COMPLETED
//   ACTION_EVENTS.ERROR
//   ACTION_EVENTS.REJECTED
//   OBSERVABILITY_EVENTS.HEALTH
//   OBSERVABILITY_EVENTS.METRICS
//   PERSISTENCE_EVENTS.REPLAY_COMPLETED
//   PERSISTENCE_EVENTS.SNAPSHOT_SAVED
// WINDOW ACCESS:
//   window.SessionManager
// @changelog v9.4.0-LIFECYCLE-CLEANUP: Export unmount() + destroy() no nível módulo (BRF PARTE 2 compliance)
// @changelog v9.3.0-P2-ENTERPRISE: Enterprise P2 compliance
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createPanelPorts } from '/core/runtime/ports-profiles.js';
import { isStrict, recordViolation } from '/core/runtime/enterprise/strict-mode.js';
import { ACTION_EVENTS } from '/core/runtime/events/catalog/action.events.js';
import { PERSISTENCE_EVENTS } from '/core/runtime/events/catalog/persistence.events.js';
import { OBSERVABILITY_EVENTS } from '/components/main/domain/observability/observability-contracts.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-observability';
export const getVersion = () => VERSION;

const Ports = createPanelPorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const _getPort = (name: string) => Ports.get(name);
export const injectPorts = (p: unknown) => Ports.inject(p);
export const getPorts = () => Ports.snapshot();

const _isAuthenticated = () => {
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
  return false;
};
const _isDocumentVisible = () => typeof document !== 'undefined' && !document.hidden;

const SVGS = {
  barChart: '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>',
  heart: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>',
  zap: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
  refresh: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.93 1 6.74 2.74L21 8"/><path d="M21 3v5h-5"/></svg>',
  camera: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 4h-5L7 7H4a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-3l-2.5-3z"/><circle cx="12" cy="13" r="3"/></svg>',
  siren: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M7 12a5 5 0 0 1 5-5v0a5 5 0 0 1 5 5v6H7v-6Z"/><path d="M5 20a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v1H5v-1Z"/><path d="M21 12h1"/><path d="M18.5 4.5 18 5"/><path d="M2 12h1"/><path d="M12 2v1"/><path d="M4.929 4.929l.707.707"/></svg>',
  check: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#28a745" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
  x: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#dc3545" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
  warning: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#ffc107" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>'
};

class PanelObservability {
  [key: string]: any;
  constructor() {
    _initPorts();
    this._contentEl = null; this._events = null; this._cleanups = []; this._refreshInterval = null;
    this._state = { actions: { total: 0, accepted: 0, rejected: 0, errors: 0, perMinute: 0 }, replays: { total: 0, lastAt: null }, snapshots: { total: 0, lastAt: null }, health: { status: 'unknown', modules: {} }, recentErrors: [], lastUpdate: null };
  }

  _canRefresh() {
    if (!this._contentEl) return false;
    if (!_isDocumentVisible()) return false;
    if (!_isAuthenticated()) return false;
    return true;
  }

  mount(contentEl: HTMLElement, config: Record<string, unknown> = {}) {
    this._contentEl = contentEl;
    if (!_isAuthenticated()) {
      this._contentEl.innerHTML = '<div style="padding:2rem;text-align:center;color:#F59E0B;">Faça login para acessar</div>';
      return this;
    }
    this._events = config.events || config.eventBus || _getPort('eventBus');
    this._render();
    this._setupListeners();
    this._requestMetrics();
    this._startRefresh();
    return this;
  }

  _setupListeners() {
    if (!this._events?.on) return;
    const eb = this._events;
    const c1 = eb.on(OBSERVABILITY_EVENTS.METRICS, (p: unknown) => this._handleMetrics(p)); if (typeof c1 === 'function') this._cleanups.push(c1);
    const c2 = eb.on(OBSERVABILITY_EVENTS.HEALTH, (p: unknown) => this._handleHealth(p)); if (typeof c2 === 'function') this._cleanups.push(c2);
    const c3 = eb.on(ACTION_EVENTS.ACCEPTED, () => this._incrementAction('accepted')); if (typeof c3 === 'function') this._cleanups.push(c3);
    const c4 = eb.on(ACTION_EVENTS.REJECTED, () => this._incrementAction('rejected')); if (typeof c4 === 'function') this._cleanups.push(c4);
    const c5 = eb.on(ACTION_EVENTS.ERROR, (p: unknown) => this._handleError(p)); if (typeof c5 === 'function') this._cleanups.push(c5);
    const c6 = eb.on(ACTION_EVENTS.COMPLETED, () => this._incrementAction('completed')); if (typeof c6 === 'function') this._cleanups.push(c6);
    const c7 = eb.on(PERSISTENCE_EVENTS.REPLAY_COMPLETED, () => this._incrementReplay()); if (typeof c7 === 'function') this._cleanups.push(c7);
    const c8 = eb.on(PERSISTENCE_EVENTS.SNAPSHOT_SAVED, () => this._incrementSnapshot()); if (typeof c8 === 'function') this._cleanups.push(c8);
  }

  _startRefresh() {
    this._refreshInterval = setInterval(() => {
      if (this._canRefresh()) {
        this._requestMetrics();
        this._updateDisplay();
      }
    }, 5000);
  }

  _requestMetrics() { if (this._events?.emit && this._canRefresh()) { this._events.emit(OBSERVABILITY_EVENTS.METRICS_REQUEST, { source: MODULE_ID }); this._events.emit(OBSERVABILITY_EVENTS.HEALTH_REQUEST, { source: MODULE_ID }); } }
  _handleMetrics(payload: unknown) { if (!payload) return; const p = payload as Record<string, unknown>; this._state.actions = p.actions || this._state.actions; this._state.replays = p.replays || this._state.replays; this._state.snapshots = p.snapshots || this._state.snapshots; this._state.lastUpdate = Date.now(); this._updateDisplay(); }
  _handleHealth(payload: unknown) { if (!payload) return; this._state.health = payload; this._updateDisplay(); }
  _incrementAction(type: string) { this._state.actions.total++; if (type === 'accepted') this._state.actions.accepted++; if (type === 'rejected') this._state.actions.rejected++; this._updateDisplay(); }
  _handleError(payload: unknown) { const p = payload as Record<string, unknown> | undefined; this._state.actions.errors++; this._state.recentErrors.unshift({ timestamp: Date.now(), error: (p?.error as string) || 'Unknown error', actionId: ((p?.action as Record<string, unknown>)?.actionId as string) }); if (this._state.recentErrors.length > 10) this._state.recentErrors = this._state.recentErrors.slice(0, 10); this._updateDisplay(); }
  _incrementReplay() { this._state.replays.total++; this._state.replays.lastAt = Date.now(); this._updateDisplay(); }
  _incrementSnapshot() { this._state.snapshots.total++; this._state.snapshots.lastAt = Date.now(); this._updateDisplay(); }

  _render() {
    if (!this._contentEl) return;
    this._contentEl.innerHTML = `<div class="obs-panel" style="padding: 16px; font-family: system-ui, sans-serif;"><h2 style="margin: 0 0 16px; color: #333; display: flex; align-items: center; gap: 8px;">${SVGS.barChart} Observabilidade do Sistema</h2><div class="obs-grid" style="display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 16px;"><div class="obs-card obs-health" style="background: #f8f9fa; border-radius: 8px; padding: 16px; border-left: 4px solid #6c757d;"></div><div class="obs-card obs-actions" style="background: #f8f9fa; border-radius: 8px; padding: 16px; border-left: 4px solid #007bff;"></div><div class="obs-card obs-replays" style="background: #f8f9fa; border-radius: 8px; padding: 16px; border-left: 4px solid #17a2b8;"></div><div class="obs-card obs-snapshots" style="background: #f8f9fa; border-radius: 8px; padding: 16px; border-left: 4px solid #28a745;"></div></div><div class="obs-errors" style="margin-top: 16px; background: #fff5f5; border-radius: 8px; padding: 16px; border: 1px solid #f5c6cb;"></div><div class="obs-footer" style="margin-top: 16px; text-align: center; color: #666; font-size: 12px;">Atualização automática a cada 5s</div></div>`;
    this._updateDisplay();
  }

  _updateDisplay() {
    if (!this._contentEl) return;
    const healthCard = this._contentEl.querySelector('.obs-health');
    if (healthCard) { const status = this._state.health.status || 'unknown'; const color = status === 'healthy' ? '#28a745' : status === 'degraded' ? '#ffc107' : '#dc3545'; healthCard.style.borderLeftColor = color; healthCard.innerHTML = `<h4 style="margin: 0 0 8px; color: #333; display: flex; align-items: center; gap: 6px;">${SVGS.heart} Saúde</h4><div style="font-size: 24px; font-weight: bold; color: ${color};">${status.toUpperCase()}</div><div style="font-size: 12px; color: #666; margin-top: 8px;">Módulos: ${Object.keys(this._state.health.modules || {}).length}</div>`; }
    const actionsCard = this._contentEl.querySelector('.obs-actions');
    if (actionsCard) actionsCard.innerHTML = `<h4 style="margin: 0 0 8px; color: #333; display: flex; align-items: center; gap: 6px;">${SVGS.zap} Ações</h4><div style="font-size: 24px; font-weight: bold; color: #007bff;">${this._state.actions.total}</div><div style="display: flex; gap: 12px; margin-top: 8px; font-size: 12px;"><span style="color: #28a745; display: flex; align-items: center; gap: 2px;">${SVGS.check} ${this._state.actions.accepted}</span><span style="color: #dc3545; display: flex; align-items: center; gap: 2px;">${SVGS.x} ${this._state.actions.rejected}</span><span style="color: #ffc107; display: flex; align-items: center; gap: 2px;">${SVGS.warning} ${this._state.actions.errors}</span></div>`;
    const replaysCard = this._contentEl.querySelector('.obs-replays');
    if (replaysCard) replaysCard.innerHTML = `<h4 style="margin: 0 0 8px; color: #333; display: flex; align-items: center; gap: 6px;">${SVGS.refresh} Replays</h4><div style="font-size: 24px; font-weight: bold; color: #17a2b8;">${this._state.replays.total}</div><div style="font-size: 12px; color: #666; margin-top: 8px;">Último: ${this._state.replays.lastAt ? new Date(this._state.replays.lastAt).toLocaleTimeString() : 'N/A'}</div>`;
    const snapshotsCard = this._contentEl.querySelector('.obs-snapshots');
    if (snapshotsCard) snapshotsCard.innerHTML = `<h4 style="margin: 0 0 8px; color: #333; display: flex; align-items: center; gap: 6px;">${SVGS.camera} Snapshots</h4><div style="font-size: 24px; font-weight: bold; color: #28a745;">${this._state.snapshots.total}</div><div style="font-size: 12px; color: #666; margin-top: 8px;">Último: ${this._state.snapshots.lastAt ? new Date(this._state.snapshots.lastAt).toLocaleTimeString() : 'N/A'}</div>`;
    const errorsSection = this._contentEl.querySelector('.obs-errors');
    if (errorsSection) { const errors: Array<{ timestamp: number; error: string; actionId?: string }> = this._state.recentErrors; let errorsHtml = `<h4 style="margin: 0 0 8px; color: #dc3545; display: flex; align-items: center; gap: 6px;">${SVGS.siren} Erros Recentes (${errors.length})</h4>`; if (errors.length === 0) errorsHtml += '<p style="color: #666; margin: 0;">Nenhum erro registrado</p>'; else errors.slice(0, 5).forEach((e: { timestamp: number; error: string; actionId?: string }) => { errorsHtml += `<div style="padding: 8px; background: white; border-radius: 4px; margin-bottom: 4px; font-size: 12px;"><span style="color: #666;">${new Date(e.timestamp).toLocaleTimeString()}</span><code style="margin-left: 8px;">${e.actionId || 'N/A'}</code><span style="margin-left: 8px; color: #dc3545;">${e.error}</span></div>`; }); errorsSection.innerHTML = errorsHtml; }
  }

  unmount() {
    if (this._refreshInterval) { clearInterval(this._refreshInterval); this._refreshInterval = null; }
    this._cleanups.forEach((fn: () => void) => { try { if (typeof fn === 'function') fn(); } catch(e) {} });
    this._cleanups = [];
    if (this._contentEl) this._contentEl.innerHTML = '';
    this._contentEl = null; this._events = null;
  }

  destroy() { this.unmount(); }
  healthCheck() { return { status: this._contentEl ? 'healthy' : 'unmounted', version: VERSION, moduleId: MODULE_ID, isAuthenticated: _isAuthenticated(), isDocumentVisible: _isDocumentVisible(), state: { actionsTotal: this._state.actions.total, errorsCount: this._state.recentErrors.length }, p21Compliant: true, p22Compliant: true, cleanups: this._cleanups.length }; }
  info() { return { version: VERSION, moduleId: MODULE_ID, mounted: !!this._contentEl, isAuthenticated: _isAuthenticated(), isDocumentVisible: _isDocumentVisible(), p21Compliant: true, p22Compliant: true }; }
}

let _currentInstance: PanelObservability | null = null;
export const createPanel = () => new PanelObservability();
export const mount = (contentEl: HTMLElement, config: Record<string, unknown>) => { _currentInstance = new PanelObservability(); return _currentInstance.mount(contentEl, config); };
export const unmount = () => { if (_currentInstance) { _currentInstance.unmount(); _currentInstance = null; } return Promise.resolve(); };
export const destroy = () => { if (_currentInstance) { _currentInstance.destroy(); _currentInstance = null; } return Promise.resolve(); };
export const healthCheck = () => _currentInstance?.healthCheck() ?? { status: 'UNHEALTHY', mounted: false, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
export { PanelObservability };
export default { PanelObservability, createPanel, mount, unmount, destroy, healthCheck, getVersion, VERSION, MODULE_ID, injectPorts, getPorts };
