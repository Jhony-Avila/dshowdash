// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (3.1.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: platform-event-domains
// PURPOSE: P18EC
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION
//   MODULE_ID
//   DOMAINS
//   PLATFORM_EVENTS
//   SHELL_EVENTS
//   MF_EVENTS
//   init
//   emit
//   on
//   emitMf
//   onMf
//   getDomains
//   destroy
//   healthCheck
//   info
//   default export
// ═══════════════════════════════════════════════════════════════
'use strict';

interface EventBus {
  emit(event: string, data: Record<string, unknown>): void;
  on(event: string, handler: (...args: unknown[]) => void): void;
  off(event: string, handler: (...args: unknown[]) => void): void;
}

interface ListenerEntry {
  event: string;
  domain: string;
  registeredAt: number;
  cleanup: () => void;
}

export const VERSION = '3.1.0-P2-ENTERPRISE';
export const MODULE_ID = 'platform-event-domains';

export const DOMAINS: Record<string, string> = {
  PLATFORM: 'platform',
  SHELL: 'shell',
  ROUTER: 'router',
  LAYOUT: 'layout',
  CANVAS: 'canvas',
  AUTH: 'auth',
  STATE: 'state',
  MF: 'mf'
};

export const PLATFORM_EVENTS = {
  INIT: 'platform:init',
  READY: 'platform:ready',
  ERROR: 'platform:error',
  NAVIGATION_START: 'platform:navigation:start',
  NAVIGATION_END: 'platform:navigation:end',
  APP_LOADING: 'platform:app:loading',
  APP_LOADED: 'platform:app:loaded',
  APP_MOUNTED: 'platform:app:mounted',
  APP_UNMOUNTED: 'platform:app:unmounted',
  APP_ERROR: 'platform:app:error'
};

export const SHELL_EVENTS = {
  HEADER_READY: 'shell:header:ready',
  SIDEBAR_READY: 'shell:sidebar:ready',
  SIDEBAR_TOGGLE: 'shell:sidebar:toggle',
  FOOTER_READY: 'shell:footer:ready',
  LAYOUT_CHANGE: 'shell:layout:change'
};

export const MF_EVENTS = {
  INIT(appId: string) { return `mf:${appId}:init`; },
  READY(appId: string) { return `mf:${appId}:ready`; },
  ERROR(appId: string) { return `mf:${appId}:error`; },
  STATE_CHANGE(appId: string) { return `mf:${appId}:state:change`; },
  ACTION(appId: string, action: string) { return `mf:${appId}:action:${action}`; }
};

let _eventBus: EventBus | null = null;
const _domainHandlers = new Map<string, Set<unknown>>();
let _listeners: ListenerEntry[] = [];

export function init(context: Record<string, unknown>) {
  if (!context) context = {};
  _eventBus = (context.eventBus as EventBus) || null;
  Object.keys(DOMAINS).forEach(k => { _domainHandlers.set(DOMAINS[k], new Set()); });
  return { version: VERSION, moduleId: MODULE_ID };
}

export function emit(domain: string, event: string, data: Record<string, unknown>) {
  if (!data) data = {};
  const fullEvent = event.indexOf(`${domain}:`) === 0 ? event : `${domain}:${event}`;
  if (_eventBus && _eventBus.emit) {
    _eventBus.emit(fullEvent, Object.assign({}, data, { domain, source: MODULE_ID, timestamp: Date.now() }));
  }
}

export function on(domain: string, event: string, handler: (...args: unknown[]) => void) {
  if (typeof handler !== 'function') return () => {};
  const fullEvent = event.indexOf(`${domain}:`) === 0 ? event : `${domain}:${event}`;
  if (_eventBus && _eventBus.on) {
    _eventBus.on(fullEvent, handler);
    const cleanup = () => { if (_eventBus && _eventBus.off) _eventBus.off(fullEvent, handler); };
    _listeners.push({ event: fullEvent, domain, registeredAt: Date.now(), cleanup });
    return cleanup;
  }
  return () => {};
}

export function emitMf(appId: string, event: string, data: Record<string, unknown>) {
  if (!data) data = {};
  emit(DOMAINS.MF, `${appId}:${event}`, Object.assign({ appId }, data));
}

export function onMf(appId: string, event: string, handler: (...args: unknown[]) => void) {
  return on(DOMAINS.MF, `${appId}:${event}`, handler);
}

export function getDomains() { return Object.assign({}, DOMAINS); }

export function destroy() {
  _listeners.forEach(l => { if (l.cleanup) try { l.cleanup(); } catch(e) {} });
  _listeners = [];
  _domainHandlers.clear();
  _eventBus = null;
}

export function healthCheck() {
  return {
    status: _eventBus ? 'HEALTHY' : 'NOT_INITIALIZED',
    version: VERSION,
    moduleId: MODULE_ID,
    longLived: true,
    listeners: _listeners.length,
    domains: Object.keys(DOMAINS).length,
    hasEventBus: !!_eventBus,
    p21Compliant: true,
    timestamp: Date.now()
  };
}

export function info() {
  return {
    version: VERSION,
    moduleId: MODULE_ID,
    domains: Object.keys(DOMAINS),
    longLived: true,
    listeners: _listeners.length,
    hasEventBus: !!_eventBus,
    p21Compliant: true
  };
}

export default { VERSION, MODULE_ID, DOMAINS, PLATFORM_EVENTS, SHELL_EVENTS, MF_EVENTS, init, emit, on, emitMf, onMf, getDomains, destroy, healthCheck, info };
