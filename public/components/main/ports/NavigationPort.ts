// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.4.0-P2-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.main.ports.navigation
// PURPOSE: Main - Navigation Port
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//   ROUTER_EVENTS from /core/runtime/events/catalog/router.events.js
//   UI_EVENTS from /core/runtime/events/catalog/ui.events.js
//
// PROVIDES:
//   injectPorts() — exported function
//   getPorts() — exported function
//   createNavigationPort() — exported function
//   MODULE_ID — module constant
//   VERSION — module constant
//   init() — exported function
//   navigate() — exported function
//   back() — exported function
//   forward() — exported function
//   getCurrentPath() — exported function
//   healthCheck() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   ROUTER_EVENTS.NAVIGATE
//   UI_EVENTS.HARD_NAV
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   window.history
//   window.location
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { ROUTER_EVENTS } from '/core/runtime/events/catalog/router.events.js';
import { UI_EVENTS } from '/core/runtime/events/catalog/ui.events.js';

const MODULE_ID = 'components.main.ports.navigation';
const VERSION = '2.4.0-P2-HARDNAV';

interface RouterPort {
  navigate?(path: string, options?: Record<string, unknown>): unknown;
  [key: string]: unknown;
}

interface EventBusPort {
  emit?(event: string, data: Record<string, unknown>): void;
  [key: string]: unknown;
}

const Ports = createCorePorts({ moduleId: MODULE_ID });

function _initPorts(): void { Ports.init(); }
function _getPort(name: 'router'): RouterPort | null;
function _getPort(name: 'eventBus'): EventBusPort | null;
function _getPort(name: string): Record<string, unknown> | null;
function _getPort(name: string): Record<string, unknown> | null { return Ports.get(name) as Record<string, unknown> | null; }
export function injectPorts(p: Record<string, unknown>): boolean { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const _metrics = { navigations: 0, backs: 0, forwards: 0, hardNavs: 0 };

function navigate(path: string, options: Record<string, unknown> = {}) {
  _metrics.navigations++;
  const router = _getPort('router');
  if (router && router.navigate) return router.navigate(path, options);
  const eb = _getPort('eventBus');
  if (eb && eb.emit) {
    eb.emit(ROUTER_EVENTS.NAVIGATE, { path, options, source: MODULE_ID });
    return { ok: true, via: 'eventBus' };
  }
  if (typeof window !== 'undefined') {
    _metrics.hardNavs++;
    if (eb && eb.emit) {
      eb.emit(UI_EVENTS.HARD_NAV, { path, reason: 'No router or EventBus pipeline', source: MODULE_ID, timestamp: Date.now() });
    }
    window.location.hash = path;
    return { ok: true, via: 'hash' };
  }
  return { ok: false, error: 'No navigation method available' };
}

function back() { _metrics.backs++; if (typeof window !== 'undefined' && window.history) { window.history.back(); return { ok: true }; } return { ok: false }; }

function forward() { _metrics.forwards++; if (typeof window !== 'undefined' && window.history) { window.history.forward(); return { ok: true }; } return { ok: false }; }

function getCurrentPath() { if (typeof window !== 'undefined') return window.location.hash || '#/'; return '#/'; }

function init(ctx: Record<string, unknown> & { ports?: Record<string, unknown> }) { _initPorts(); if (ctx && ctx.ports) injectPorts(ctx.ports); return { ok: true, version: VERSION }; }
function healthCheck() { return { status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', score: 100, moduleId: MODULE_ID, version: VERSION, p2Compliant: true, checks: { hasRouter: { ok: !!_getPort('router'), severity: 'warn' }, portsInitialized: { ok: Ports.isInitialized(), severity: 'info' } }, metrics: _metrics }; }
function info() { return { moduleId: MODULE_ID, version: VERSION, p2Compliant: true, metrics: _metrics, currentPath: getCurrentPath(), portsInitialized: Ports.isInitialized() }; }

export function createNavigationPort(options: Record<string, unknown> & { ports?: Record<string, unknown> }) { options = options || {}; init(options); return { navigate, back, forward, getCurrentPath, healthCheck, info, VERSION, MODULE_ID }; }

export { MODULE_ID, VERSION, init, navigate, back, forward, getCurrentPath, healthCheck, info };
export default { MODULE_ID, VERSION, createNavigationPort, init, navigate, back, forward, getCurrentPath, healthCheck, info, injectPorts, getPorts };
