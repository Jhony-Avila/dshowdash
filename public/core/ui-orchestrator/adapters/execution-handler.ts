// UI Orchestrator - Execution Handler
// DEPENDENCY CONTRACT — UI Orchestrator module
// @version 3.0.0-PORTSFACTORY
// @changelog v3.0.0-PORTSFACTORY - Migração para PortsFactory (elimina window.Logger)
// @changelog v2.3.0-P18EC - Events Contracts Migration
// P18EC: Events Contracts Migration
// BRIDGE_INTERNAL_P15: Este módulo é bridge interna do UIOrchestrator
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { ORCHESTRATOR_EVENTS, REGIONS } from '../core/contracts.js';
import { ROUTER_EVENTS } from '/core/runtime/events/catalog/router.events.js';
import { PANEL_EVENTS } from '/core/runtime/events/catalog/panels.events.js';
import { UI_EVENTS } from '/core/runtime/events/catalog/ui.events.js';
import { APP_EVENTS } from '/core/runtime/events/catalog/app.events.js';

export const VERSION = '3.0.0-P2-ENTERPRISE';
export const MODULE_ID = 'core.ui-orchestrator.adapters.execution-handler';

const Ports = createCorePorts({ moduleId: MODULE_ID });

const _initPorts = () => { Ports.init(); };
const _getPort = (name: string) => Ports.get(name);
export const injectPorts = (p: Record<string, unknown>) => Ports.inject(p);
export const getPorts = () => Ports.snapshot();

let _initialized = false;
let _eventBus: { on?: (...args: unknown[]) => unknown; emit?: (...args: unknown[]) => unknown } | null = null;
let _cleanups: (() => void)[] = [];

const _metrics = {
  navigateRequests: 0,
  panelRequests: 0,
  actionsExecuted: 0,
  eventsEmitted: 0,
  errors: 0
};

const _log = (level: string, message: string, data: Record<string, unknown> = {}) => {
  const logger = _getPort('logger');
  if (logger?.[level]) logger[level](`[${MODULE_ID}] ${message}`, data);
};

export function init(options: Record<string, unknown> = {}) {
  if (_initialized) {
    _log('warn', 'Already initialized');
    return { success: true, alreadyInitialized: true };
  }

  try {
    _initPorts();
    if (options.ports) injectPorts(options.ports as Record<string, unknown>);
    _eventBus = _getPort('eventBus');

    if (!_eventBus) {
      throw new Error('EventBus not available');
    }

    _setupOrchestratorListeners();
    _setupLegacyListeners();

    _initialized = true;
    _log('info', 'Execution Handler initialized (P18EC compliant)');

    return { success: true, version: VERSION, mode: 'bridge-internal' };

  } catch (error: any) {
    _log('error', 'Init failed', { error: error.message });
    return { success: false, error: error.message };
  }
}

function _setupOrchestratorListeners() {
  const onNavigate = (data: unknown) => {
    const d = data as Record<string, unknown>;
    _log('debug', 'Navigate event received', { path: d?.path });
    _emitNavigate(data);
  };

  const onOpenPanel = (data: unknown) => {
    const d = data as Record<string, unknown>;
    const panel = d?.panel as Record<string, unknown> | undefined;
    _log('debug', 'Open panel event received', { panel: panel?.id, region: d?.region });
    _emitOpenPanel(data);
  };

  const onClosePanel = (data: unknown) => {
    const d = data as Record<string, unknown>;
    _log('debug', 'Close panel event received', { panelId: d?.panelId });
    _emitClosePanel(data);
  };

  const cleanup1 = _eventBus?.on?.(ORCHESTRATOR_EVENTS.NAVIGATE, onNavigate);
  const cleanup2 = _eventBus?.on?.(ORCHESTRATOR_EVENTS.OPEN_PANEL, onOpenPanel);
  const cleanup3 = _eventBus?.on?.(ORCHESTRATOR_EVENTS.CLOSE_PANEL, onClosePanel);

  [cleanup1, cleanup2, cleanup3].forEach(c => {
    if (typeof c === 'function') _cleanups.push(c as () => void);
  });
}

function _setupLegacyListeners() {
  const legacyActions = {
    'auth:logout': () => _emitAction('auth:logout'),
    'action:refresh-requested': () => _emitRefresh(),
    'action:fullscreen-requested': () => _emitFullscreen()
  };

  Object.entries(legacyActions).forEach(([event, handler]) => {
    const cleanup = _eventBus?.on?.(event, handler);
    if (typeof cleanup === 'function') _cleanups.push(cleanup as () => void);
  });
}

function _emitNavigate(data: unknown) {
  const d = data as Record<string, unknown>;
  const path = d?.path || d?.route;
  if (!path) {
    _log('warn', 'Navigate called without path');
    return;
  }

  _metrics.navigateRequests++;

  _eventBus?.emit?.(ROUTER_EVENTS.NAVIGATE, {
    path,
    source: MODULE_ID,
    options: (d?.options as Record<string, unknown>) || {},
    timestamp: Date.now()
  });
  
  _metrics.eventsEmitted++;
  _log('info', 'Navigate event emitted (bridge-internal)', { path, source: MODULE_ID });
}

function _emitOpenPanel(data: unknown) {
  const d = data as Record<string, unknown>;
  const panel = d?.panel as Record<string, unknown> | undefined;
  const panelId = panel?.id || d?.panelId;
  const region = d?.region || REGIONS.MAIN;

  if (!panelId) {
    _log('warn', 'Open panel called without panelId');
    return;
  }

  _metrics.panelRequests++;

  if (region === REGIONS.MAIN) {
    const route = (panel?.path as string) || `/${(panelId as string).replace('panel-', '')}`;
    _emitNavigate({ path: route });
    return;
  }

  _eventBus?.emit?.(PANEL_EVENTS.OPEN, {
    panelId,
    region,
    payload: d?.payload,
    source: MODULE_ID,
    timestamp: Date.now()
  });
  
  _metrics.eventsEmitted++;
  _log('info', 'Panel open event emitted', { panelId, region });
}

function _emitClosePanel(data: unknown) {
  const d = data as Record<string, unknown>;
  const panelId = d?.panelId;

  _eventBus?.emit?.(PANEL_EVENTS.CLOSE, {
    panelId,
    source: MODULE_ID,
    timestamp: Date.now()
  });
  
  _metrics.eventsEmitted++;
  _log('info', 'Panel close event emitted', { panelId });
}

function _emitAction(actionTarget: string) {
  _metrics.actionsExecuted++;

  _eventBus?.emit?.(UI_EVENTS.ACTION, {
    actionId: actionTarget,
    source: MODULE_ID,
    timestamp: Date.now()
  });
  
  _metrics.eventsEmitted++;
  _log('debug', 'Action event emitted', { actionTarget });
}

function _emitRefresh() {
  _metrics.actionsExecuted++;
  _eventBus?.emit?.(APP_EVENTS.REFRESH, { source: MODULE_ID });
  _metrics.eventsEmitted++;
  _log('debug', 'Refresh event emitted');
}

function _emitFullscreen() {
  _metrics.actionsExecuted++;
  
  try {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
    } else {
      document.exitFullscreen();
    }
    _log('debug', 'Fullscreen toggled');
  } catch (error: any) {
    _log('warn', 'Fullscreen toggle failed', { error: error.message });
  }
}

export function healthCheck() {
  return {
    status: _initialized ? 'HEALTHY' : 'NOT_INITIALIZED',
    moduleId: MODULE_ID,
    version: VERSION,
    mode: 'P18EC-BRIDGE_INTERNAL',
    metrics: { ..._metrics },
    hasEventBus: !!_eventBus,
    portsInitialized: Ports.isInitialized()
  };
}

export function getMetrics() {
  return { ..._metrics };
}

export function info() {
  return {
    version: VERSION,
    moduleId: MODULE_ID,
    initialized: _initialized,
    mode: 'P18EC-BRIDGE_INTERNAL',
    metrics: _metrics,
    listenedEvents: [
      ORCHESTRATOR_EVENTS.NAVIGATE,
      ORCHESTRATOR_EVENTS.OPEN_PANEL,
      ORCHESTRATOR_EVENTS.CLOSE_PANEL,
      'auth:logout',
      'action:refresh-requested',
      'action:fullscreen-requested'
    ],
    emittedEvents: [
      'router.navigate (ROUTER_EVENTS.NAVIGATE)',
      'panel.open (PANEL_EVENTS.OPEN)',
      'panel.close (PANEL_EVENTS.CLOSE)',
      'ui.action (UI_EVENTS.ACTION)',
      'app.refresh (APP_EVENTS.REFRESH)'
    ],
    portsInitialized: Ports.isInitialized()
  };
}

export function destroy() {
  _cleanups.forEach(fn => { try { fn(); } catch {} });
  _cleanups = [];
  _initialized = false;
  _eventBus = null;
  _log('info', 'Execution Handler destroyed');
}

export default Object.freeze({
  VERSION,
  MODULE_ID,
  init,
  healthCheck,
  getMetrics,
  info,
  destroy,
  injectPorts,
  getPorts
});
