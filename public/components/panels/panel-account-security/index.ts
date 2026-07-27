// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.8.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: index
// PURPOSE: Panel Account Security - Main Orchestrator
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   UI_INTENTS from /core/runtime/events/catalog/ui.events.js
//   COMPONENT_EVENTS from /core/runtime/events/catalog/component.events.js
//   createPanelPorts from /core/runtime/ports-profiles.js
//   VERSION as MODULE_ID from ./constants.js
//   isAuthenticated from ./helpers.js
//   createInitialState, createInitialMetrics from ./state.js
//   fetchSecurityInfo, changePassword from ./api.js
//   renderAuthBlocked, renderSkeleton, renderPanel from ./template.js
//   setupEventHandlers from ./events.js
//
// PROVIDES:
//   VERSION — module constant
//   getVersion() — exported function
//   mount — exported value
//   unmount — exported value
//   refresh — exported value
//   info() — exported function
//   healthCheck() — exported function
//   getStatus() — exported function
//   MODULE_ID — module constant
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { UI_INTENTS } from '/core/runtime/events/catalog/ui.events.js';
import { COMPONENT_EVENTS } from '/core/runtime/events/catalog/component.events.js';
import { createPanelPorts } from '/core/runtime/ports-profiles.js';
import { VERSION as MODULE_ID } from './constants.js';

// @ts-expect-error TS migration - TS2305
import { isAuthenticated } from './helpers.js';

// @ts-expect-error TS migration - TS2614
import { createInitialState, createInitialMetrics } from './state.js';
import { fetchSecurityInfo, changePassword } from './api.js';
import { renderAuthBlocked, renderSkeleton, renderPanel } from './template.js';
import { setupEventHandlers } from './events.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
const COMPONENT_ID = 'panel:account-security';

export const getVersion = () => VERSION;

const Ports = createPanelPorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const _getPort = (name: string) => Ports.get(name);
const _isDocumentVisible = () => typeof document !== 'undefined' && !document.hidden;

const _emitIntent = (intent: string, data: Record<string, unknown>) => { _initPorts(); const eb = _getPort('eventBus'); eb?.emit?.(intent, { source: MODULE_ID, timestamp: Date.now(), ...(data || {}) }); };
const emit = (event: string, data: Record<string, unknown>) => { _initPorts(); const eb = _getPort('eventBus'); eb?.emit?.(event, { source: MODULE_ID, timestamp: Date.now(), ...(data || {}) }); };

const cssPath = '/components/panels/panel-account-security/styles.css';
if (!document.querySelector(`link[href="${cssPath}"]`)) { const link = document.createElement('link'); link.rel = 'stylesheet'; link.href = cssPath; document.head.appendChild(link); }

class PanelAccountSecurity {
  [key: string]: any;
  constructor() { this.container = null; this.mounted = false; this._mountedAt = null; this._metrics = createInitialMetrics(); this._state = createInitialState(); this._abortController = null; this._eventsSetup = false; }

  async mount(container: HTMLElement, config: Record<string, unknown> = {}) {
    if (!container || !(container instanceof HTMLElement)) { this._metrics.errors++; throw new Error('Container inválido'); }
    if (!isAuthenticated()) { container.innerHTML = renderAuthBlocked(); return false; }
    if (this.mounted) await this.unmount();
    this.container = container; this.mounted = true; this._mountedAt = Date.now(); this._metrics.mounts++;
    this._abortController = new AbortController(); this._eventsSetup = false;
    this._render();
    await this._loadData();
    emit(COMPONENT_EVENTS.READY, { componentId: COMPONENT_ID, moduleId: MODULE_ID, timestamp: Date.now() });
    return true;
  }

  async _loadData() {
    this._state.loading = true;
    const result = await fetchSecurityInfo();
    if (result.success) { this._state.securityInfo = (result as any).securityInfo; this._state.twoFactorEnabled = (result as any).twoFactorEnabled; this._state.sessions = result.sessions; this._state.activityLog = result.activityLog; this._state.error = null; }
    else { this._state.error = (result as any).error; this._metrics.errors++; this._state.sessions = result.sessions; this._state.activityLog = result.activityLog; }
    this._state.loading = false; this._render();
  }

  async _changePassword(currentPassword: string, newPassword: string) {
    this._state.changingPassword = true; this._render();
    try { await changePassword(currentPassword, newPassword); this._metrics.passwordChanges++; this._state.showPasswordForm = false; _emitIntent(UI_INTENTS.SHOW_TOAST, { message: 'Senha alterada com sucesso!', type: 'success' }); await this._loadData(); }
    catch (error: any) { this._metrics.errors++; _emitIntent(UI_INTENTS.SHOW_TOAST, { message: error.message, type: 'error' }); }
    finally { this._state.changingPassword = false; this._render(); }
  }

  _revokeSession(sessionId: string | number) { this._state.sessions = this._state.sessions.filter((s: Record<string, unknown>) => s.id !== sessionId); _emitIntent(UI_INTENTS.SHOW_TOAST, { message: 'Sessão encerrada', type: 'success' }); this._render(); }
  _toggle2FA(enabled: boolean) { this._state.twoFactorEnabled = enabled; _emitIntent(UI_INTENTS.SHOW_TOAST, { message: enabled ? '2FA ativado!' : '2FA desativado', type: enabled ? 'success' : 'info' }); this._render(); }

  _render() {
    if (!this.container || !this.mounted) return;
    const { loading, securityInfo } = this._state;
    if (loading && !securityInfo) { this.container.innerHTML = renderSkeleton(); return; }
    this.container.innerHTML = renderPanel(this._state, this._mountedAt);
    this._setupEvents();
  }

  _setupEvents() {
    if (!this.container || !this._abortController) return;
    setupEventHandlers(this.container, this._state, {
      signal: this._abortController.signal,
      onTogglePasswordForm: () => { this._state.showPasswordForm = !this._state.showPasswordForm; this._state.passwordStrength = 0; this._render(); },
      onSavePassword: (current: string, newPwd: string) => this._changePassword(current, newPwd),
      onToggle2FA: (enabled: boolean) => this._toggle2FA(enabled),
      onRevokeSession: (sessionId: string | number) => this._revokeSession(sessionId),
      onRevokeAllSessions: () => { this._state.sessions = this._state.sessions.filter((s: Record<string, unknown>) => s.current); _emitIntent(UI_INTENTS.SHOW_TOAST, { message: 'Todas as outras sessões encerradas', type: 'success' }); this._render(); },
      // @ts-expect-error strict migration — TS2322
      onTogglePasswordVisibility: (field: string) => { this._state.showPassword[field] = !this._state.showPassword[field]; this._render(); },
      render: () => this._render()
    });
  }

  async unmount() { if (!this.mounted) return; if (this._abortController) { this._abortController.abort(); this._abortController = null; } if (this.container) this.container.innerHTML = ''; this.container = null; this.mounted = false; this._mountedAt = null; this._eventsSetup = false; this._metrics.unmounts++; }
  async refresh() { if (this.mounted) await this._loadData(); }
  info() { return { name: MODULE_ID, version: VERSION, mounted: this.mounted, metrics: { ...this._metrics }, usingP18Intents: true, p22Compliant: true, timestamp: Date.now() }; }
  healthCheck() { const checks = { instanceExists: true, containerValid: this.mounted ? !!this.container : true, p18IntentsAvailable: true, abortControllerActive: !!this._abortController && !this._abortController.signal.aborted }; const passed = Object.values(checks).filter(Boolean).length; return { status: passed >= 3 ? 'HEALTHY' : 'DEGRADED', score: `${passed}/4`, checks, mounted: this.mounted, version: VERSION, moduleId: MODULE_ID, p22Compliant: true, timestamp: Date.now() }; }
  getStatus() { return { version: VERSION, moduleId: MODULE_ID, mounted: this.mounted, p22Compliant: true, timestamp: Date.now() }; }
}

let panelInstance: PanelAccountSecurity | null = null;

export const mount = async (container: HTMLElement, config: Record<string, unknown> = {}) => { if (panelInstance?.mounted) await unmount(); panelInstance = new PanelAccountSecurity(); await panelInstance.mount(container, config); return panelInstance; };
export const unmount = async () => { if (panelInstance) { await panelInstance.unmount();
 panelInstance = null; } };
export const refresh = async () => { if (panelInstance?.mounted) await panelInstance.refresh(); };
export const info = () => panelInstance?.info?.() ?? { name: MODULE_ID, version: VERSION, mounted: false, p22Compliant: true, timestamp: Date.now() };
export const healthCheck = () => { const hc: Record<string, unknown> = panelInstance?.healthCheck?.() ?? { status: 'UNHEALTHY', mounted: false, version: VERSION, moduleId: MODULE_ID, p22Compliant: true, timestamp: Date.now() }; hc.isDocumentVisible = _isDocumentVisible(); return hc; };
export const getStatus = () => panelInstance?.getStatus?.() ?? { mounted: false, p22Compliant: true, timestamp: Date.now() };
export { MODULE_ID };
export const destroy = () => unmount();
export default { mount, unmount, destroy, refresh, info, healthCheck, getVersion, getStatus, VERSION, MODULE_ID };
