// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (3.2.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: login-mfe/events
// PURPOSE: Login MFE Event Contracts
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION
//   MODULE_ID
//   MFE_ACTIONS
//   emit
//   subscribe
//   unsubscribeAll
//   default export
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '3.2.0-P2-ENTERPRISE';
export const MODULE_ID = 'login-mfe/events';

// P18G3: MFE_ACTIONS - internal MFE actions, not global event contracts
// EVENTS is a reserved name for /core/runtime/events/
// Global auth events should use AUTH_EVENTS from /core/runtime/events/index.js
export const MFE_ACTIONS = Object.freeze({
  INIT: 'mf:login:init',
  MOUNTED: 'mf:login:mounted',
  UNMOUNTED: 'mf:login:unmounted',
  DESTROYED: 'mf:login:destroyed',
  HYDRATE: 'mf:login:hydrate',
  UPDATE: 'mf:login:update',
  OPEN_MODAL: 'mf:login:open-modal',
  AUTH_SUCCESS: 'mf:login:auth-success',
  AUTH_FAILURE: 'mf:login:auth-failure',
  AUTH_SKIP: 'mf:login:auth-skip',
  FORGOT_PASSWORD: 'mf:login:forgot-password',
  SUPPORT: 'mf:login:support'
});

interface EventContext {
  eventBus?: { on?: (event: string, handler: (data: Record<string, unknown>) => void) => void; off?: (event: string, handler: (data: Record<string, unknown>) => void) => void; emit?: (event: string, payload: Record<string, unknown>) => void };
}

const _subscriptions: Array<() => void> = [];

export function emit(event: string, data: Record<string, unknown> = {}, context: EventContext | null = null) {
  const payload = { ...data, source: MODULE_ID, timestamp: Date.now() };
  if (context?.eventBus?.emit) { context.eventBus.emit(event, payload); }
}

export function subscribe(event: string, handler: (data: Record<string, unknown>) => void, context: EventContext | null = null) {
  if (context?.eventBus?.on && typeof handler === 'function') {
    context.eventBus.on(event, handler);
    // @ts-expect-error strict migration — TS18048
    const unsub = () => context.eventBus.off?.(event, handler);
    _subscriptions.push(unsub);
    return unsub;
  }
  return () => {};
}

export function unsubscribeAll() {
  _subscriptions.forEach(unsub => { try { unsub(); } catch(e) {} });
  _subscriptions.length = 0;
}

export default { MFE_ACTIONS, emit, subscribe, unsubscribeAll, VERSION, MODULE_ID };
