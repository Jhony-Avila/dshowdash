// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: main.feature.navigation-hooks
// PURPOSE: MainFeature: Navigation Hooks
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//   ROUTER_EVENTS from /core/runtime/events/catalog/router.events.js
//
// PROVIDES:
//   injectPorts() — exported function
//   getPorts() — exported function
//   init() — exported function
//   destroy() — exported function
//   cleanup — exported value
//   onBeforeNavigate() — exported function
//   onAfterNavigate() — exported function
//   onRouteChanged() — exported function
//   getMetrics() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   ROUTER_EVENTS.NAVIGATE
//   ROUTER_EVENTS.ROUTE_CHANGED
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { ROUTER_EVENTS } from '/core/runtime/events/catalog/router.events.js';

export const MODULE_ID = 'main.feature.navigation-hooks';
export const VERSION = '1.0.0-ENTERPRISE';

const Ports = createCorePorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

let _enabled = false;
let _cleanups: Array<() => void> = [];
let _hooks: Record<string, unknown[]> = { beforeNavigate: [] as unknown[], afterNavigate: [] as unknown[], onRouteChanged: [] as unknown[] };
let _metrics = { inits: 0, navigations: 0, hooksTriggered: 0, blockedNavigations: 0 };

async function _runHooks(type: string, ctx: Record<string, unknown>) {
  for (const h of _hooks[type] || []) {
    try {
      _metrics.hooksTriggered++;
// @ts-expect-error TS migration - TS2349
      const r = await Promise.resolve(h(ctx));
      if (type === 'beforeNavigate' && r === false) { _metrics.blockedNavigations++; return { blocked: true }; }
    } catch (e) {}
  }
  return { blocked: false };
}

export function init(options: Record<string, unknown> = {}) {
  if (_enabled) return { ok: true, alreadyInitialized: true };
  _initPorts();
  _metrics.inits++;
  const eb = _getPort('eventBus');
  if (eb?.on) {
    const navHandler = async (data: Record<string, unknown>) => { _metrics.navigations++; await _runHooks('beforeNavigate', data); };
    eb.on(ROUTER_EVENTS.NAVIGATE, navHandler);
    _cleanups.push(() => eb.off?.(ROUTER_EVENTS.NAVIGATE, navHandler));
    const routeHandler = async (data: Record<string, unknown>) => { await _runHooks('afterNavigate', data); await _runHooks('onRouteChanged', data); };
    eb.on(ROUTER_EVENTS.ROUTE_CHANGED, routeHandler);
    _cleanups.push(() => eb.off?.(ROUTER_EVENTS.ROUTE_CHANGED, routeHandler));
  }
  _enabled = true;
  return { ok: true, version: VERSION };
}

export function destroy() {
  for (const fn of _cleanups) { try { fn(); } catch (e) {} }
  _cleanups = [];
  _hooks = { beforeNavigate: [], afterNavigate: [], onRouteChanged: [] };
  _enabled = false;
  return { ok: true };
}

export const cleanup = destroy;

export function onBeforeNavigate(hook: unknown) { if (typeof hook === 'function') { _hooks.beforeNavigate.push(hook); return () => { const i = _hooks.beforeNavigate.indexOf(hook); if (i > -1) _hooks.beforeNavigate.splice(i, 1); }; } return () => {}; }
export function onAfterNavigate(hook: unknown) { if (typeof hook === 'function') { _hooks.afterNavigate.push(hook); return () => { const i = _hooks.afterNavigate.indexOf(hook); if (i > -1) _hooks.afterNavigate.splice(i, 1); }; } return () => {}; }
export function onRouteChanged(hook: unknown) { if (typeof hook === 'function') { _hooks.onRouteChanged.push(hook); return () => { const i = _hooks.onRouteChanged.indexOf(hook); if (i > -1) _hooks.onRouteChanged.splice(i, 1); }; } return () => {}; }
export function getMetrics() { return { ..._metrics }; }
export function info() { return { moduleId: MODULE_ID, version: VERSION, enabled: _enabled, metrics: getMetrics() }; }
export function healthCheck() {
  const checks = { enabled: _enabled, hasEventBus: !!_getPort('eventBus') };
  const passed = Object.values(checks).filter(Boolean).length;
  return { status: _enabled ? 'HEALTHY' : 'NOT_INITIALIZED', score: { passed, total: 2, percentage: passed * 50 }, moduleId: MODULE_ID, version: VERSION, checks, timestamp: Date.now() };
}
export default { MODULE_ID, VERSION, init, destroy, cleanup, onBeforeNavigate, onAfterNavigate, onRouteChanged, getMetrics, info, healthCheck, injectPorts, getPorts };
