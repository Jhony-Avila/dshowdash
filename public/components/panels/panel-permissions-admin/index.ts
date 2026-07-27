// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (9.1.0-VISIBILITY-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-permissions-admin
// PURPOSE: Panel Permissions Admin - UARPS Governance Console
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createPanelPorts from /core/runtime/ports-profiles.js
//   PANEL_EVENTS, LIFECYCLE_EVENTS, PERMISSIONS_EVENTS, UARPS_EVENTS from /core/r...
//   Store from ./state/store.js
//   Renderer from ./ui/renderer.js
//   Controller from ./core/controller.js
//   Telemetry from ./telemetry/tracker.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   getVersion() — exported function
//   injectPorts() — exported function
//   getPorts() — exported function
//   mount() — exported function
//   unmount() — exported function
//   destroy() — exported function
//   getController() — exported function
//   getStore() — exported function
//   healthCheck() — exported function
//   info() — exported function
//   MIN_ACCESS_LEVEL — exported value
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   PERMISSIONS_EVENTS.CHANGED
//   UARPS_EVENTS.USER_SELECTED
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createPanelPorts } from '/core/runtime/ports-profiles.js';
import { PANEL_EVENTS } from '/core/runtime/events/catalog/panels.events.js';
import { LIFECYCLE_EVENTS } from '/core/runtime/events/catalog/lifecycle.events.js';
import { PERMISSIONS_EVENTS } from '/core/runtime/events/catalog/permissions.events.js';
import { UARPS_EVENTS } from '/core/runtime/events/catalog/uarps.events.js';
import { Store } from './state/store.js';
import { Renderer } from './ui/renderer.js';
import { Controller } from './core/controller.js';
import { Telemetry } from './telemetry/tracker.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-permissions-admin';
const PANEL_ID = MODULE_ID;
const MIN_ACCESS_LEVEL = 100;

export const getVersion = () => VERSION;

const Ports = createPanelPorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const _getPort = (name: string) => Ports.get(name);

export const injectPorts = (p: Record<string, unknown>) => Ports.inject(p);
export const getPorts = () => Ports.snapshot();

let _container: HTMLElement | null = null;
let _mounted = false;
interface PanelModule { [key: string]: unknown; refresh?(): void; destroy?(): void; render?(): Promise<void>; init?(): void; loadInitialData?(): Promise<void>; selectUser?(id: unknown): void; }
let _controller: PanelModule | null = null;
let _renderer: PanelModule | null = null;
let _cleanups: Array<() => void> = [];

const _isAuthenticated = () => { const auth = _getPort('auth'); return auth?.isAuthenticated?.() ?? false; };
const _isDocumentVisible = () => typeof document !== 'undefined' && !document.hidden;
const _canRefresh = () => _mounted && _isDocumentVisible() && _isAuthenticated();

const _checkAccess = () => { if (!_isAuthenticated()) return false; const auth = _getPort('auth'); if (auth?.canAccessPanel) return auth.canAccessPanel(MODULE_ID); if (auth?.can) return auth.can('permissions:admin') || auth.can('admin:full'); return (auth?.getLevel?.() ?? 0) >= MIN_ACCESS_LEVEL; };

const _renderAuthBlocked = (container: HTMLElement) => {
  container.innerHTML = '<div class="panel-auth-blocked" style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;min-height:200px;color:#64748b;text-align:center;padding:2rem;"><div style="margin-bottom:1rem;"><svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg></div><h3 style="margin:0 0 0.5rem;color:#334155;">Acesso Restrito</h3><p style="margin:0;font-size:0.875rem;">Faça login para visualizar este conteúdo</p></div>';
};

const _emit = (event: string, data: Record<string, unknown> = {}) => { try { const eventBus = _getPort('eventBus'); eventBus?.emit?.(event, data); } catch (e) {} };

const _loadStyles = () => new Promise((resolve) => {
  const styleId = 'uarps-admin-styles';

  // @ts-expect-error TS migration - TS2794
  if (document.getElementById(styleId)) { resolve(); return; }

  // @ts-expect-error TS migration - TS2794
  try { const link = document.createElement('link'); link.id = styleId; link.rel = 'stylesheet'; link.href = '/components/panels/panel-permissions-admin/styles/main.css'; document.head.appendChild(link); link.onload = resolve; link.onerror = resolve; setTimeout(resolve, 1000); } catch (e) { resolve(); }
});

const _setupEventListeners = () => {
  const bus = _getPort('eventBus');
  if (!bus?.on) return;
  const onPermissionsChanged = () => { if (_canRefresh()) _controller?.refresh?.(); };
  bus.on(PERMISSIONS_EVENTS.CHANGED, onPermissionsChanged);
  _cleanups.push(() => bus.off(PERMISSIONS_EVENTS.CHANGED, onPermissionsChanged));
  const onUserSelected = (data: Record<string, unknown>) => { if (_canRefresh() && _controller?.selectUser && data) (_controller.selectUser as (id: unknown) => void)(data.userId); };
  bus.on(UARPS_EVENTS.USER_SELECTED, onUserSelected);
  _cleanups.push(() => bus.off(UARPS_EVENTS.USER_SELECTED, onUserSelected));
};

export const mount = (container: HTMLElement, options: Record<string, unknown> = {}) => {
  _initPorts();
  if (_mounted) return Promise.resolve({ success: true, cached: true });
  if (!container) return Promise.resolve({ success: false, error: 'Container required' });
  if (!_isAuthenticated()) { Telemetry.track(LIFECYCLE_EVENTS.MOUNT_FAILED, { reason: 'auth-blocked', panelId: PANEL_ID }); _renderAuthBlocked(container); return Promise.resolve({ success: false, error: 'AUTH_REQUIRED' }); }
  if (!_checkAccess()) { Telemetry.track(LIFECYCLE_EVENTS.MOUNT_FAILED, { reason: 'access-denied', panelId: PANEL_ID }); container.innerHTML = '<div class="panel-access-denied" style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:100%;min-height:200px;color:#f87171;text-align:center;padding:2rem;"><div style="font-size:3rem;margin-bottom:1rem;">⛔</div><h3 style="margin:0 0 0.5rem;color:#ef4444;">Acesso Negado</h3><p style="margin:0;font-size:0.875rem;">Você não tem permissão para acessar este painel</p></div>'; return Promise.resolve({ success: false, error: 'ACCESS_DENIED' }); }
  _container = container; const startTime = performance.now();

  // @ts-expect-error TS migration - TS2339
  return _loadStyles().then(() => { Store.init(true); _controller = Controller.create({ store: Store }); _controller.init(); _renderer = Renderer.create({ container: _container, store: Store, controller: _controller }); return _renderer.render(); }).then(() => _controller.loadInitialData()).then(() => {
    _setupEventListeners(); _mounted = true; const duration = Math.round(performance.now() - startTime);
    _emit(PANEL_EVENTS.MOUNTED, { panelId: PANEL_ID, version: VERSION, duration, timestamp: Date.now(), source: MODULE_ID });
    return { success: true, duration };
  }).catch((error) => { Telemetry.track(LIFECYCLE_EVENTS.MOUNT_FAILED, { panelId: PANEL_ID, error: error.message }); _emit(PANEL_EVENTS.ERROR, { panelId: PANEL_ID, version: VERSION, error: error.message, timestamp: Date.now(), source: MODULE_ID }); return { success: false, error: error.message }; });
};

export const unmount = () => {
  if (!_mounted) return Promise.resolve({ success: true }
);
  return Promise.resolve().then(() => {
    _cleanups.forEach((fn) => { try { fn(); } catch (e) {} }); _cleanups = [];
    _renderer?.destroy?.(); _renderer = null; _controller?.destroy?.(); _controller = null;

    // @ts-expect-error TS migration - TS2339
    Store.saveToCache(); Store.reset();
    if (_container) _container.innerHTML = ''; _container = null; _mounted = false;
    _emit(PANEL_EVENTS.UNMOUNTED, { panelId: PANEL_ID, timestamp: Date.now(), source: MODULE_ID });
    return { success: true };
  }).catch((error) => ({ success: false, error: error.message }));
};

export const getController = () => _controller;
export const getStore = () => Store;


// @ts-expect-error TS migration - TS2339
export const healthCheck = () => { const auth = _getPort('auth'); return { status: _mounted ? 'HEALTHY' : 'DEGRADED', version: VERSION, moduleId: MODULE_ID, mounted: _mounted, authenticated: _isAuthenticated(), isDocumentVisible: _isDocumentVisible(), hasAccess: _checkAccess(), storeHealth: Store.healthCheck(), portsInitialized: Ports.isInitialized(), authPortAvailable: !!auth, p22Compliant: true, timestamp: Date.now() }; };

// @ts-expect-error TS migration - TS2339
export const info = () => ({ version: VERSION, moduleId: MODULE_ID, mounted: _mounted, isAuthenticated: _isAuthenticated(), isDocumentVisible: _isDocumentVisible(), portsInitialized: Ports.isInitialized(), store: Store.info(), controller: _controller?.info?.() ?? null, p22Compliant: true });

export { MIN_ACCESS_LEVEL };
export const destroy = () => unmount();
export default { mount, unmount, destroy, healthCheck, info, getController, getStore, getVersion, injectPorts, getPorts, VERSION, MODULE_ID };
