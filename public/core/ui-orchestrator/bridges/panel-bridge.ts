// OWNER_OK_P14: PanelBridgeOwner — panel navigation via RouterGlobal (reason=bridge-owner, emits=none, scope=navigation-only)
// DEPENDENCY CONTRACT — UI Orchestrator module
// UI Orchestrator - Panel Open Bridge
// @version 2.0.1-PHANTOM-FIX
// @changelog v2.0.1-PHANTOM-FIX - Fix: OPEN_REQUESTED/CLOSE_REQUESTED → OPEN_REQUEST/CLOSE_REQUEST (phantom constants)
// @changelog v2.0.0-PORTSFACTORY - Migração para PortsFactory (elimina window.Logger)
// @changelog v1.3.0-ENTERPRISE - ES6 modernization (const/let, arrow functions, template literals, for...of)
// Bridge: EventBus 'panel:open' → Main.openSecondary()
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { PANEL_EVENTS } from '/core/runtime/events/catalog/panels.events.js';

export const VERSION = '2.0.1-PHANTOM-FIX';
export const MODULE_ID = 'core.ui-orchestrator.bridges.panel-bridge';

const Ports = createCorePorts({ moduleId: MODULE_ID });

const _initPorts = () => { Ports.init(); };
const _getPort = (name: string) => Ports.get(name);
export const injectPorts = (p: Record<string, unknown>) => Ports.inject(p);
export const getPorts = () => Ports.snapshot();

let _initialized = false;
let _eventBus: { on?: (...args: unknown[]) => unknown; off?: (...args: unknown[]) => void } | null = null;
let _cleanups: (() => void)[] = [];
const _metrics = { received: 0, executed: 0, skipped: 0, errors: 0 };

const _log = (level: string, message: string, data: Record<string, unknown> = {}) => {
  const logger = _getPort('logger');
  if (logger?.[level]) logger[level](`[${MODULE_ID}] ${message}`, data);
};

const _handlePanelOpen = (data: unknown) => {
  _metrics.received++;
  const d = data as Record<string, unknown>;
  const panel = d?.panel as Record<string, unknown> | undefined;
  const panelId = d?.panelId || panel?.id;
  const region = d?.region || 'main';
  const source = d?.source || 'unknown';
  if (!panelId) { _log('warn', 'Panel open request without panelId', { data }); _metrics.skipped++; return; }
  if (source === MODULE_ID || d?.__viaBridge) { _log('debug', 'Skipping to avoid loop', { panelId, source }); _metrics.skipped++; return; }
  try {
    if (region === 'main') {
      const route = (panel?.path as string) || `#/${(panelId as string).replace('panel-', '')}`;
      const router = _getPort('router') as Record<string, unknown> & { navigate?: (...args: unknown[]) => void } | null;
      if (router?.navigate) { router.navigate(route, { source: MODULE_ID, __viaBridge: true }); _metrics.executed++; _log('info', 'Panel opened via navigation', { panelId, route }); }
      return;
    }
    if (window.Main?.openSecondary) { window.Main.openSecondary(panelId, { region, payload: d?.payload, source: MODULE_ID, __viaBridge: true }); _metrics.executed++; _log('info', 'Panel opened via Main.openSecondary', { panelId, region }); }
    else { _log('warn', 'Main.openSecondary not available', { panelId }); _metrics.skipped++; }
  } catch (error: any) { _metrics.errors++; _log('error', 'Panel open failed', { panelId, error: (error as Error).message }); }
};

const _handlePanelClose = (data: unknown) => {
  const d = data as Record<string, unknown>;
  const panelId = d?.panelId;
  const source = d?.source || 'unknown';
  if (source === MODULE_ID || d?.__viaBridge) return;
  try { if (window.Main?.closeSecondary) { window.Main.closeSecondary(panelId); _log('info', 'Panel closed via Main.closeSecondary', { panelId }); } }
  catch (error: any) { _log('error', 'Panel close failed', { panelId, error: error.message }); }
};

export const init = (options: Record<string, unknown> = {}) => {
  if (_initialized) return { success: true, alreadyInitialized: true };
  _initPorts();
  if (options.ports) injectPorts(options.ports as Record<string, unknown>);
  _eventBus = _getPort('eventBus') as typeof _eventBus;
  if (!_eventBus?.on) { _log('error', 'EventBus not available'); return { success: false, error: 'EventBus required' }; }
  const c1 = _eventBus.on(PANEL_EVENTS.OPEN, _handlePanelOpen);
  const c2 = _eventBus.on(PANEL_EVENTS.CLOSE, _handlePanelClose);
  const c3 = _eventBus.on(PANEL_EVENTS.OPEN_REQUEST, _handlePanelOpen);
  const c4 = _eventBus.on(PANEL_EVENTS.CLOSE_REQUEST, _handlePanelClose);
  for (const c of [c1, c2, c3, c4]) { if (typeof c === 'function') _cleanups.push(c as () => void); }
  _initialized = true;
  _log('info', 'Panel Bridge initialized');
  return { success: true, version: VERSION };
};

export const destroy = () => { for (const fn of _cleanups) { try { fn(); } catch(e) {} } _cleanups = []; _initialized = false; _eventBus = null; _log('info', 'Panel Bridge destroyed'); };

export const healthCheck = () => ({
  status: _initialized ? 'HEALTHY' : 'NOT_INITIALIZED',
  moduleId: MODULE_ID,
  version: VERSION,
  metrics: { ..._metrics },
  hasEventBus: !!_eventBus,
  hasMain: !!(window.Main?.openSecondary),
  portsInitialized: Ports.isInitialized()
});

export const getMetrics = () => ({ ..._metrics });

export const info = () => ({
  version: VERSION,
  moduleId: MODULE_ID,
  initialized: _initialized,
  metrics: _metrics,
  listenedEvents: [PANEL_EVENTS.OPEN, PANEL_EVENTS.CLOSE, PANEL_EVENTS.OPEN_REQUEST, PANEL_EVENTS.CLOSE_REQUEST],
  portsInitialized: Ports.isInitialized()
});

export default { VERSION, MODULE_ID, init, destroy, healthCheck, getMetrics, info, injectPorts, getPorts };
