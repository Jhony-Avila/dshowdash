// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.2.0-P18EC)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.router.navigation.deep-link
// PURPOSE: Router Navigation - Deep Link Handler
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//   ROUTER_EVENTS from /core/runtime/events/catalog/router.events.js
//
// PROVIDES:
//   injectPorts() — exported function
//   getPorts() — exported function
//   MODULE_ID — module constant
//   VERSION — module constant
//   init() — exported function
//   cleanup() — exported function
//   parseDeepLink() — exported function
//   registerHandler() — exported function
//   unregisterHandler() — exported function
//   handleDeepLink() — exported function
//   processPending() — exported function
//   getPending() — exported function
//   clearPending() — exported function
//   healthCheck() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): (see init function)
// EMITS (eventos):
//   eventName
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { ROUTER_EVENTS } from '/core/runtime/events/catalog/router.events.js';

const MODULE_ID = 'components.router.navigation.deep-link';
const VERSION = '2.2.0-P18EC';

const Ports = createCorePorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const _state: { initialized: boolean; handlers: Record<string, (parsed: Record<string, unknown>, options: Record<string, unknown>) => void>; pending: { url: string; options: Record<string, unknown>; timestamp: number } | null } = { initialized: false, handlers: {}, pending: null };
const _metrics = { parsed: 0, handled: 0, deferred: 0, errors: 0 };

function _track(eventName: string, payload: Record<string, unknown>) { try { const tk = _getPort('telemetry'); if (tk && tk.track) tk.track(eventName, Object.assign({ moduleId: MODULE_ID }, payload || {})); } catch (e: any) { } }
function _emit(eventName: string, data: Record<string, unknown>) { const eb = _getPort('eventBus'); if (eb && eb.emit) eb.emit(eventName, Object.assign({ source: MODULE_ID }, data || {})); }


// @ts-expect-error TS migration - TS2339
function parseDeepLink(url: string) { _metrics.parsed++; if (!url) return null; try { const urlObj = typeof URL !== 'undefined' ? new URL(url, 'http://localhost') : { pathname: url, searchParams: { get() { return null; } } }; const path = urlObj.pathname || '/'; const params: Record<string, string> = {}; if (urlObj.searchParams) { urlObj.searchParams.forEach((value, key) => { params[key] = value; }); } return { path, params, raw: url }; } catch (e: any) { _metrics.errors++; return null; } }

function registerHandler(pattern: string, handler: (parsed: Record<string, unknown>, options: Record<string, unknown>) => void) { if (!pattern || typeof handler !== 'function') return { ok: false, error: 'Invalid arguments' }; _state.handlers[pattern] = handler; return { ok: true, pattern }; }
function unregisterHandler(pattern: string) { if (_state.handlers[pattern]) { delete _state.handlers[pattern]; return { ok: true }; } return { ok: false, reason: 'Handler not found' }; }

function handleDeepLink(url: string, options: Record<string, unknown> = {}) {
  const parsed = parseDeepLink(url);if (!parsed) return { ok: false, error: 'Invalid URL' };for (const pattern in _state.handlers) { if (_state.handlers.hasOwnProperty(pattern)) { const regex = new RegExp(`^${pattern.replace(/:\w+/g, '([^/]+)')}$`); if (regex.test(parsed.path)) { try { _state.handlers[pattern](parsed, options); _metrics.handled++; _track('router:deeplink:handled', { pattern, path: parsed.path }); _emit(ROUTER_EVENTS.DEEPLINK_HANDLED, { pattern, parsed }); return { ok: true, pattern, parsed }; } catch (e: any) { _metrics.errors++; return { ok: false, error: e.message }; } } } }if (options.defer) { _state.pending = { url, options, timestamp: Date.now() }; _metrics.deferred++; return { ok: true, deferred: true }; }return { ok: false, reason: 'No handler matched' };
}

function processPending() { if (!_state.pending) return { ok: false, reason: 'No pending deep link' }; const pending = _state.pending; _state.pending = null; return handleDeepLink(pending.url, Object.assign({}, pending.options, { defer: false })); }
function getPending() { return _state.pending; }
function clearPending() { _state.pending = null; return { ok: true }; }

function init(ctx: Record<string, unknown>) { if (_state.initialized) return { ok: true, alreadyInitialized: true }; _initPorts(); if (ctx && ctx.ports) injectPorts(ctx.ports as Record<string, unknown>); _state.initialized = true; _track('router:deep-link:init', { version: VERSION }); return { ok: true, version: VERSION }; }
function cleanup() { _state.handlers = {}; _state.pending = null; _state.initialized = false; return { ok: true }; }
function healthCheck() { return { status: Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', score: 100, moduleId: MODULE_ID, version: VERSION, checks: { initialized: { ok: _state.initialized, severity: 'info' }, hasPending: { ok: !_state.pending, severity: 'info' }, portsInitialized: { ok: Ports.isInitialized(), severity: 'info' } }, metrics: _metrics }; }
function info() { return { moduleId: MODULE_ID, version: VERSION, initialized: _state.initialized, handlersCount: Object.keys(_state.handlers).length, hasPending: !!_state.pending, metrics: _metrics, portsInitialized: Ports.isInitialized() }; }

export { MODULE_ID, VERSION, init, cleanup, parseDeepLink, registerHandler, unregisterHandler, handleDeepLink, processPending, getPending, clearPending, healthCheck, info };
export default { MODULE_ID, VERSION, init, cleanup, parseDeepLink, registerHandler, unregisterHandler, handleDeepLink, processPending, getPending, clearPending, healthCheck, info, injectPorts, getPorts };
