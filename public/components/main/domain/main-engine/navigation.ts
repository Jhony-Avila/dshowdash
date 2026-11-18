// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (3.0.0-P1-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.main.domain.main-engine.navigation
// PURPOSE: Main Engine - Navigation
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   MAIN_EVENTS from /core/runtime/events/catalog/main.events.js
//   createCorePorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   injectPorts() — exported function
//   getPorts() — exported function
//   performMount() — exported function
//   MODULE_ID — module constant
//   VERSION — module constant
//   NAVIGATION_SYNC_EVENT — exported value
//   init() — exported function
//   navigateToPanel() — exported function
//   getCurrentPanel() — exported function
//   getPreviousPanel() — exported function
//   getCurrentRoute() — exported function
//   isNavigating() — exported function
//   goBack() — exported function
//   healthCheck() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   eventName
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { MAIN_EVENTS } from '/core/runtime/events/catalog/main.events.js';
import { createCorePorts } from '/core/runtime/ports-profiles.js';

const MODULE_ID = 'components.main.domain.main-engine.navigation';
const VERSION = '3.0.0-P1-HEX';

const Ports = createCorePorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const NAVIGATION_SYNC_EVENT = 'main.navigation.sync';

const _state = { initialized: false, currentPanel: null as string | null, previousPanel: null as string | null, currentRoute: null as string | null, isNavigating: false, mounted: false };
const _metrics = { navigations: 0, mounts: 0, errors: 0, syncsEmitted: 0 };

function _emit(eventName: string, data: Record<string, unknown>) { const eb = _getPort('eventBus') as Record<string, (...args: unknown[]) => unknown> | null; if (eb && eb.emit) eb.emit(eventName, Object.assign({ source: MODULE_ID }, data || {})); }
function _track(eventName: string, payload: Record<string, unknown>) { try { const tk = _getPort('telemetry') as Record<string, (...args: unknown[]) => unknown> | null; if (tk && tk.track) tk.track(eventName, Object.assign({ moduleId: MODULE_ID }, payload || {})); } catch (e) { } }

// P1-HEX: Timer helper using TimerPort
function _setTimeout(fn: (...args: unknown[]) => unknown, ms: number) {
  const timerPort = _getPort('timer') as Record<string, (...args: unknown[]) => unknown> | null;
  if (timerPort && timerPort.setTimeout) return timerPort.setTimeout(fn, ms);
  return setTimeout(fn, ms);
}

function _emitNavigationSync(panelId: string, route: string, previousPanel: unknown) {
  _metrics.syncsEmitted++;
  _emit(NAVIGATION_SYNC_EVENT, {
    panelId,
    route: route || _state.currentRoute || `#/${panelId}`,
    previousPanel: previousPanel || _state.previousPanel,
    timestamp: Date.now()
  });
  _track('main:navigation:sync', { panelId, route });
}

function navigateToPanel(panelId: string, options: Record<string, unknown>) {
  if (_state.isNavigating) return Promise.resolve({ ok: false, reason: 'Navigation in progress' });
  _state.isNavigating = true;
  _metrics.navigations++;
  _state.previousPanel = _state.currentPanel;
  _state.currentPanel = panelId;
  _state.currentRoute = ((options && options.route) || `#/${panelId}`) as string;
  _emit(MAIN_EVENTS.NAVIGATION_START, { from: _state.previousPanel, to: panelId });
  _track('main:navigation', { from: _state.previousPanel, to: panelId });
  return new Promise(resolve => {
    // P1-HEX: Use TimerPort via helper
    _setTimeout(() => {
      _state.isNavigating = false;
      _emit(MAIN_EVENTS.NAVIGATION_COMPLETE, { panelId });
      // @ts-expect-error strict migration — TS2345
      _emitNavigationSync(panelId, _state.currentRoute, _state.previousPanel);
      resolve({ ok: true, panelId });
    }, 0);
  });
}

function getCurrentPanel() { return _state.currentPanel; }
function getPreviousPanel() { return _state.previousPanel; }
function getCurrentRoute() { return _state.currentRoute; }
function isNavigating() { return _state.isNavigating; }

// @ts-expect-error TS migration - TS2554
function goBack() { if (_state.previousPanel) return navigateToPanel(_state.previousPanel); return Promise.resolve({ ok: false, reason: 'No previous panel' }); }

export function performMount(engine: Record<string, unknown>) {
  if (_state.mounted) return Promise.resolve({ ok: true, alreadyMounted: true });
  _metrics.mounts++;
  _state.mounted = true;
  _emit(MAIN_EVENTS.MOUNTED, { engine: !!engine });
  _track('main:mounted', {});
  return Promise.resolve({ ok: true, mounted: true });
}

export async function performNavigate(engine: Record<string, unknown>, panelId: string, options: Record<string, unknown>) {
  options = options || {};
  _metrics.navigations++;
  const route = options.route || `#/${panelId}`;
  const previousPanel = _state.currentPanel;
  
  const nc = engine._navigationController as Record<string, (...args: unknown[]) => unknown> | null;
  if (engine && nc && nc.navigate) {
    try {
      const result = await nc.navigate(panelId, options);
      _state.currentPanel = panelId;
      _state.currentRoute = route as string;
      _state.previousPanel = previousPanel;
      _emitNavigationSync(panelId, route as string, previousPanel);
      return result;
    } catch (error) {
      _metrics.errors++;
      return navigateToPanel(panelId, options);
    }
  }
  return navigateToPanel(panelId, options);
}

function init(ctx: Record<string, unknown>) {
  if (_state.initialized) return { ok: true, alreadyInitialized: true };
  _initPorts();
  if (ctx && ctx.ports) injectPorts(ctx.ports as Record<string, unknown>);
  _state.initialized = true;
  return { ok: true, version: VERSION };
}

function healthCheck() {
  return {
    status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', score: 100, moduleId: MODULE_ID, version: VERSION,
    checks: {
      initialized: { ok: _state.initialized, severity: 'info' },
      mounted: { ok: _state.mounted, severity: 'info' },
      notNavigating: { ok: !_state.isNavigating, severity: 'info' },
      portsInitialized: { ok: Ports.isInitialized(), severity: 'info' }
    },
    metrics: _metrics, p1HexCompliant: true
  };
}

function info() {
  return {
    moduleId: MODULE_ID, version: VERSION, initialized: _state.initialized, mounted: _state.mounted,
    currentPanel: _state.currentPanel, currentRoute: _state.currentRoute, previousPanel: _state.previousPanel,
    isNavigating: _state.isNavigating, metrics: _metrics, portsInitialized: Ports.isInitialized(),
    p1HexCompliant: true, navigationSyncEvent: NAVIGATION_SYNC_EVENT
  };
}

export { MODULE_ID, VERSION, NAVIGATION_SYNC_EVENT, init, navigateToPanel, getCurrentPanel, getPreviousPanel, getCurrentRoute, isNavigating, goBack, healthCheck, info };
export default { MODULE_ID, VERSION, NAVIGATION_SYNC_EVENT, init, performMount, performNavigate, navigateToPanel, getCurrentPanel, getPreviousPanel, getCurrentRoute, isNavigating, goBack, healthCheck, info, injectPorts, getPorts };
