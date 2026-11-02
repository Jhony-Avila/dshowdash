// UI Orchestrator - UI Action Bridge
// DEPENDENCY CONTRACT — UI Orchestrator module
// @version 3.0.1-PHANTOM-FIX
// @changelog v3.0.1-PHANTOM-FIX - Fix: HEADER_EVENTS.REFRESH_REQUESTED → REFRESH_TRIGGERED (phantom constant)
// @changelog v3.0.0-PORTSFACTORY - Migração para PortsFactory (elimina window.Logger)
// @changelog v2.0.0-P0-NAVIGATE - P0 FIX: emit ROUTER_EVENTS.NAVIGATE instead of ROUTE_CHANGED
// @changelog v1.9.0-ENTERPRISE - ES6 modernization
// BRIDGE_INTERNAL_P15: Esta bridge do UIOrchestrator traduz ui:action → router:navigate
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { UI_EVENTS } from '/core/runtime/events/catalog/ui.events.js';
import { HEADER_EVENTS } from '/core/runtime/events/catalog/header.events.js';
import { ROUTER_EVENTS } from '/core/runtime/events/catalog/router.events.js';
import { AUTH_EVENTS } from '/core/runtime/events/catalog/auth.events.js';
import { APP_EVENTS } from '/core/runtime/events/catalog/app.events.js';
import { ORCHESTRATOR_EVENTS } from '/core/runtime/events/catalog/orchestrator.events.js';
// USER_MENU_EVENTS removido: import fantasma (não existe em nenhum catálogo)

export const VERSION = '3.0.1-PHANTOM-FIX';
export const MODULE_ID = 'core.ui-orchestrator.bridges.ui-action-bridge';

const Ports = createCorePorts({ moduleId: MODULE_ID });

const _initPorts = () => { Ports.init(); };
const _getPort = (name: string) => Ports.get(name);
export const injectPorts = (p: Record<string, unknown>) => Ports.inject(p);
export const getPorts = () => Ports.snapshot();

let _initialized = false;
let _eventBus: { on?: (event: string, handler: (data: unknown) => void) => (() => void); emit?: (event: string, data: unknown) => unknown } | null = null;
let _cleanups: (() => void)[] = [];
const _metrics = { received: 0, translated: 0, skipped: 0, errors: 0, navrailActions: 0 };

const _emitMetrics: { total: number; byEvent: Record<string, number>; lastEmitAt: number | null } = { total: 0, byEvent: {}, lastEmitAt: null };
const _trackEmit = (eventName: string) => { _emitMetrics.total++; _emitMetrics.byEvent[eventName] = (_emitMetrics.byEvent[eventName] || 0) + 1; _emitMetrics.lastEmitAt = Date.now(); };

const ACTION_TO_INTENT: Record<string, string> = {
  'fullscreen': 'action:fullscreen',
  'fullscreen-action:toggle': 'action:fullscreen',
  'refresh': 'action:refresh',
  'refresh-action:refresh': 'action:refresh',
  'logout': 'auth:logout',
  'user-menu:logout': 'auth:logout',
  'toggle-sidebar': 'layout:toggle-sidebar',
  'sidebar:toggle': 'layout:toggle-sidebar',
  'sidebar:navigate': 'navigate:path',
  'nav-rail:navigate': 'navigate:path',
  'navrail:navigate': 'navigate:path',
  'navrail:toggle-sidebar': 'layout:toggle-sidebar',
  'toggle-theme': 'layout:toggle-theme',
  'theme:toggle': 'layout:toggle-theme',
  'notifications': 'panel:notifications',
  'notifications:open': 'panel:notifications',
  'settings': 'panel:settings',
  'settings:open': 'panel:settings'
};

const _log = (level: string, message: string, data: Record<string, unknown> = {}) => {
  const logger = _getPort('logger') as Record<string, ((...a: unknown[]) => void) | undefined> | null;
  const fn = logger?.[level];
  if (typeof fn === 'function') fn(`[${MODULE_ID}] ${message}`, data);
};

const _isNavrailAction = (action: string) => {
  if (!action || typeof action !== 'string') return false;
  return action.indexOf('navrail:') === 0 && action !== 'navrail:navigate' && action !== 'navrail:toggle-sidebar';
};

const _extractNavrailRoute = (action: string, data: unknown) => {
  const d = data as Record<string, unknown>;
  const meta = d?.meta as Record<string, unknown> | undefined;
  if (meta?.route) return meta.route as string;
  if (d?.route) return d.route as string;
  const itemId = action.replace('navrail:', '');
  return `#/${itemId}`;
};

const _handleUIAction = (data: unknown) => {
  _metrics.received++;
  const d = data as Record<string, unknown>;
  const action = (d?.action || d?.actionId || d?.type) as string | undefined;
  const source = (d?.source || 'unknown') as string;
  if (!action) { _log('debug', 'UI action without action type', { data }); _metrics.skipped++; return; }
  if (source === MODULE_ID || source === 'ui-orchestrator' || source === 'execution-handler') { _log('debug', 'Skipping to avoid loop', { action, source }); _metrics.skipped++; return; }
  if (_isNavrailAction(action)) {
    _metrics.navrailActions++;
    const route = _extractNavrailRoute(action, data);
    _log('info', 'NavRail action detected', { action, route });
    _handleNavigationAction({ meta: { route }, source } as unknown, action, source);
    return;
  }
  const intentId = ACTION_TO_INTENT[action];
  if (!intentId) { _log('debug', 'No intent mapping for action', { action }); _metrics.skipped++; return; }
  if (intentId === 'navigate:path') { _handleNavigationAction(data, action, source); return; }
  try {
    if (window.UIOrchestrator?.emit) {
      const result = window.UIOrchestrator.emit(intentId, { ...(d as Record<string, unknown>), originalAction: action, bridgeSource: MODULE_ID }, source);
      _metrics.translated++;
      _log('info', 'UI action translated to intent', { action, intentId, result: (result as Record<string, unknown>)?.success });
    } else {
      if (_eventBus?.emit) {
        _trackEmit('INTENT_EMITTED');
        _eventBus.emit(ORCHESTRATOR_EVENTS.INTENT_EMITTED, { intentId, data: { ...(d as Record<string, unknown>), source: MODULE_ID, timestamp: Date.now() }, source: MODULE_ID });
      }
      _metrics.translated++;
      _log('info', 'UI action emitted directly (no Orchestrator)', { action, intentId });
    }
  } catch (error) { _metrics.errors++; _log('error', 'Failed to translate UI action', { action, error: (error as Error).message }); }
};

const _handleNavigationAction = (data: unknown, action: string, source: string) => {
  const d = data as Record<string, unknown>;
  const meta = d?.meta as Record<string, unknown> | undefined;
  const route = (meta?.route || d?.route || d?.path) as string | undefined;
  if (!route) { _log('warn', 'Navigation action without route', { action, data }); _metrics.skipped++; return; }
  try {
    if (_eventBus?.emit) {
      _trackEmit('NAVIGATE');
      _eventBus.emit(ROUTER_EVENTS.NAVIGATE, {
        path: route,
        options: { source, originalAction: action, bridgeSource: MODULE_ID },
        source: source || MODULE_ID,
        timestamp: Date.now()
      });
    }
    _metrics.translated++;
    _log('info', 'Navigation action translated via NAVIGATE', { action, route, source });
  } catch (error) { _metrics.errors++; _log('error', 'Navigation action failed', { action, route, error: (error as Error).message }); }
};

const _handleHeaderRefresh = (data: unknown) => {
  _metrics.received++;
  const d = data as Record<string, unknown>;
  const source = (d?.source || 'header') as string;
  if (source === MODULE_ID) return;
  try {
    if (_eventBus?.emit) { _trackEmit('REFRESH'); _eventBus.emit(APP_EVENTS.REFRESH, { source: MODULE_ID, trigger: 'header', timestamp: Date.now() }); }
    _metrics.translated++;
    _log('info', 'Header refresh translated');
  } catch (error) { _metrics.errors++; _log('error', 'Header refresh failed', { error: (error as Error).message }); }
};

const _handleLogoutRequest = (data: unknown) => {
  _metrics.received++;
  const d = data as Record<string, unknown>;
  const source = (d?.source || 'user-menu') as string;
  if (source === MODULE_ID) return;
  try {
    if (_eventBus?.emit) { _trackEmit('LOGOUT'); _eventBus.emit(AUTH_EVENTS.LOGOUT, { source: MODULE_ID, trigger: source, timestamp: Date.now() }); }
    _metrics.translated++;
    _log('info', 'Logout request translated');
  } catch (error) { _metrics.errors++; _log('error', 'Logout request failed', { error: (error as Error).message }); }
};

export const init = (options: Record<string, unknown> = {}) => {
  if (_initialized) return { success: true, alreadyInitialized: true };
  _initPorts();
  if (options.ports) injectPorts(options.ports as Record<string, unknown>);
  _eventBus = _getPort('eventBus') as typeof _eventBus;
  if (!_eventBus?.on) { _log('error', 'EventBus not available'); return { success: false, error: 'EventBus required' }; }
  const c1 = _eventBus.on(UI_EVENTS.ACTION, _handleUIAction);
  const c2 = _eventBus.on(HEADER_EVENTS.REFRESH_TRIGGERED, _handleHeaderRefresh);
  // USER_MENU_EVENTS.LOGOUT_REQUESTED removido: import fantasma (listener era dead code)
  for (const c of [c1, c2]) { if (typeof c === 'function') _cleanups.push(c); }
  _initialized = true;
  _log('info', 'UI Action Bridge initialized (P0-NAVIGATE)', { mappings: Object.keys(ACTION_TO_INTENT).length });
  return { success: true, version: VERSION };
};

export const destroy = () => { for (const fn of _cleanups) { try { fn(); } catch(e) {} } _cleanups = []; _initialized = false; _eventBus = null; _log('info', 'UI Action Bridge destroyed'); };
export const getEmitMetrics = () => ({ ..._emitMetrics });

export const healthCheck = () => ({
  status: _initialized ? 'HEALTHY' : 'NOT_INITIALIZED',
  moduleId: MODULE_ID,
  version: VERSION,
  mode: 'P0-NAVIGATE',
  metrics: { ..._metrics },
  emitMetrics: { ..._emitMetrics },
  mappings: Object.keys(ACTION_TO_INTENT).length,
  hasEventBus: !!_eventBus,
  p0Compliant: true,
  navrailDynamicHandling: true,
  portsInitialized: Ports.isInitialized(),
  timestamp: Date.now()
});

export const getMetrics = () => ({ ..._metrics });
export const getMappings = () => ({ ...ACTION_TO_INTENT });
export const addMapping = (action: string, intentId: string) => { ACTION_TO_INTENT[action] = intentId; _log('info', 'Mapping added', { action, intentId }); };

export const info = () => ({
  version: VERSION,
  moduleId: MODULE_ID,
  initialized: _initialized,
  mode: 'P0-NAVIGATE',
  metrics: _metrics,
  emitMetrics: _emitMetrics,
  mappings: ACTION_TO_INTENT,
  listenedEvents: [UI_EVENTS.ACTION, HEADER_EVENTS.REFRESH_TRIGGERED],
  navrailDynamicHandling: true,
  portsInitialized: Ports.isInitialized()
});

export default { VERSION, MODULE_ID, init, destroy, getEmitMetrics, healthCheck, getMetrics, getMappings, addMapping, info, injectPorts, getPorts };
