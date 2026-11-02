// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (3.2.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: platform-sdk
// PURPOSE: P18EC
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION
//   MODULE_ID
//   init
//   getContext
//   emit
//   on
//   navigate
//   getState
//   dispatch
//   track
//   toast
//   destroy
//   healthCheck
//   info
//   default export
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '3.2.0-P2-ENTERPRISE';
export const MODULE_ID = 'platform-sdk';

interface PlatformContext {
  eventBus?: {
    emit?: (event: string, data: Record<string, unknown>) => void;
    on?: (event: string, handler: (data: Record<string, unknown>) => void) => void;
    off?: (event: string, handler: (data: Record<string, unknown>) => void) => void;
  };
  router?: {
    navigate?: (route: string) => boolean;
  };
  stateEngine?: {
    select?: (selector: (state: Record<string, unknown>) => unknown) => unknown;
    dispatch?: (action: Record<string, unknown>) => void;
  };
  telemetry?: {
    track?: (event: string, data: Record<string, unknown>) => void;
  };
  services?: {
    toast?: {
      show?: (message: string, type: string) => void;
    };
  };
}

interface ListenerEntry {
  event: string;
  handler: string;
  registeredAt: number;
  cleanup: () => void;
}

let _context: PlatformContext | null = null;
let _listeners: ListenerEntry[] = [];

export function init(context: PlatformContext) { _context = context; return { version: VERSION }; }
export function getContext() { return _context; }

export function emit(event: string, data?: Record<string, unknown>) {
  if (!data) data = {};
  if (_context && _context.eventBus && _context.eventBus.emit) {
    _context.eventBus.emit(event, Object.assign({}, data, { source: MODULE_ID, timestamp: Date.now() }));
  }
}

export function on(event: string, handler: (data: Record<string, unknown>) => void) {
  if (_context && _context.eventBus && _context.eventBus.on) {
    _context.eventBus.on(event, handler);
    const cleanup = () => { if (_context && _context.eventBus && _context.eventBus.off) _context.eventBus.off(event, handler); };
    _listeners.push({ event, handler: 'handler', registeredAt: Date.now(), cleanup });
    return cleanup;
  }
  return () => {};
}

export function navigate(route: string) {
  if (_context && _context.router && _context.router.navigate) {
    return _context.router.navigate(route);
  }
  return false;
}

export function getState(key?: string) {
  if (_context && _context.stateEngine && _context.stateEngine.select) {
    return _context.stateEngine.select((state: Record<string, unknown>) => key ? state[key] : state);
  }
  return null;
}

export function dispatch(action: Record<string, unknown>) {
  if (_context && _context.stateEngine && _context.stateEngine.dispatch) {
    return _context.stateEngine.dispatch(action);
  }
}

export function track(event: string, data?: Record<string, unknown>) {
  if (!data) data = {};
  if (_context && _context.telemetry && _context.telemetry.track) {
    _context.telemetry.track(event, data);
  }
}

export function toast(message: string, type?: string) {
  if (!type) type = 'info';
  if (_context && _context.services && _context.services.toast && _context.services.toast.show) {
    _context.services.toast.show(message, type);
  }
}

export function destroy() {
  _listeners.forEach(l => { if (l.cleanup) try { l.cleanup(); } catch(_e: unknown) {} });
  _listeners = [];
  _context = null;
}

export function healthCheck() {
  return {
    status: _context ? 'HEALTHY' : 'NOT_INITIALIZED',
    version: VERSION,
    moduleId: MODULE_ID,
    longLived: true,
    listeners: _listeners.length,
    hasContext: !!_context,
    p21Compliant: true,
    timestamp: Date.now()
  };
}

export function info() {
  return {
    version: VERSION,
    moduleId: MODULE_ID,
    hasContext: !!_context,
    longLived: true,
    listeners: _listeners.length,
    p21Compliant: true
  };
}

export default { init, getContext, emit, on, navigate, getState, dispatch, track, toast, destroy, healthCheck, info, VERSION, MODULE_ID };
