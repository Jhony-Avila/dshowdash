// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (6.0.0-P24)
// ═══════════════════════════════════════════════════════════════
// MODULE: global-state-auth-integration
// PURPOSE: Global State
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   from /core/runtime/events/index.js
//   from /core/runtime/ports-profiles.js
//   from ./logger.js
//
// PROVIDES:
//   VERSION
//   MODULE_ID
//   injectPorts
//   getPorts
//   setupAuthEventIntegration
//   retryAuthIntegration
//   emit
//   cleanupListeners
//   info
//   healthCheck
//   default export
// ═══════════════════════════════════════════════════════════════
'use strict';

import { AUTH_EVENTS } from '/core/runtime/events/catalog/auth.events.js';
import { GLOBAL_STATE_EVENTS } from '/core/runtime/events/catalog/state.events.js';
import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { _log } from './logger.js';

export const VERSION = '6.0.0-P24';
export const MODULE_ID = 'global-state-auth-integration';

const EVENTBUS_RETRY_MAX = 5;
const EVENTBUS_RETRY_DELAY = 300;

// P24: Ports via createCorePorts factory
const Ports = createCorePorts({ moduleId: MODULE_ID, allowWindowFallback: true });

export function injectPorts(ports: Record<string, unknown>) {
  return Ports.inject(ports);
}

export function getPorts() {
  return Ports.snapshot();
}

// P21: Long-lived listener tracking
let _listeners: { event: string; handler: string; registeredAt: number; cleanup: unknown }[] = [];
const _metrics = { listenersRegistered: 0, portResolutions: 0 };

function _getEventBus() {
  if (!Ports.isInitialized()) {
    Ports.init();
  }
  const eb = (Ports as any).getEventBus();
  if (eb && typeof eb.on === 'function') {
    _metrics.portResolutions++;
    return eb;
  }
  return null;
}

export function setupAuthEventIntegration(manager: Record<string, unknown>) {
  const m: any = manager;
  const eb = _getEventBus();
  if (!eb) {
    if ((m.eventBusRetryCount as number) < EVENTBUS_RETRY_MAX) {
      m.eventBusRetryCount = (m.eventBusRetryCount as number) + 1;
      const delay = EVENTBUS_RETRY_DELAY * (m.eventBusRetryCount as number);
      m.telemetry.track(AUTH_EVENTS.INTEGRATION_RETRY_SCHEDULED, { attempt: m.eventBusRetryCount, maxRetries: EVENTBUS_RETRY_MAX, delayMs: delay });
      m._retryTimeoutId = setTimeout(() => { setupAuthEventIntegration(manager); }, delay);
    } else {
      (_log as (...a: unknown[]) => void)('warn', `EventBus not available after ${EVENTBUS_RETRY_MAX} retries`);
      m.telemetry.track(AUTH_EVENTS.INTEGRATION_MAX_RETRIES, { attempts: m.eventBusRetryCount });
    }
    return;
  }

  if (m.authEventsConnected) {
    m.telemetry.track(AUTH_EVENTS.INTEGRATION_ALREADY_CONNECTED, {});
    return;
  }

  const signal: AbortSignal = (m.abortController as AbortController).signal;

  try {
    // P21: Track all listeners for long-lived audit
    const loginHandler = (data: Record<string, unknown>) => {
      if (signal.aborted) return;
      const d: any = data;
      m.telemetry.track(AUTH_EVENTS.LOGIN_RECEIVED, { source: d?.source });
      const sessionData = { isAuthenticated: true, userId: d?.user?.id || d?.userId, user: d?.user || null, token: d?.token || null, lastActivity: Date.now() };
      m.setSession(sessionData);
      emit(manager, GLOBAL_STATE_EVENTS.SESSION_SYNCED, { source: 'login-success' });
    };
    const c1 = eb.on(AUTH_EVENTS.LOGIN_SUCCESS, loginHandler);
    _listeners.push({ event: 'AUTH_EVENTS.LOGIN_SUCCESS', handler: 'loginHandler', registeredAt: Date.now(), cleanup: c1 });
    _metrics.listenersRegistered++;

    const handleLogout = (data: Record<string, unknown>) => {
      if (signal.aborted) return;
      m.telemetry.track(AUTH_EVENTS.LOGOUT_RECEIVED, { source: (data as any)?.source });
      m.clearSession();
      emit(manager, GLOBAL_STATE_EVENTS.SESSION_CLEARED, { source: 'logout' });
    };

    const c2 = eb.on(AUTH_EVENTS.LOGOUT, handleLogout);
    _listeners.push({ event: 'AUTH_EVENTS.LOGOUT', handler: 'handleLogout', registeredAt: Date.now(), cleanup: c2 });
    _metrics.listenersRegistered++;

    const c3 = eb.on(AUTH_EVENTS.LOGOUT_SUCCESS, handleLogout);
    _listeners.push({ event: 'AUTH_EVENTS.LOGOUT_SUCCESS', handler: 'handleLogout', registeredAt: Date.now(), cleanup: c3 });
    _metrics.listenersRegistered++;

    const sessionCheckedHandler = (data: Record<string, unknown>) => {
      if (signal.aborted) return;
      const d: any = data;
      m.telemetry.track(AUTH_EVENTS.SESSION_CHECKED_RECEIVED, { authenticated: d?.authenticated });
      if (d?.authenticated && d?.user) {
        m.setSession({ isAuthenticated: true, userId: d.user.id || d.userId, user: d.user, token: d.token || null, lastActivity: Date.now() });
        emit(manager, GLOBAL_STATE_EVENTS.SESSION_SYNCED, { source: 'session-checked' });
      } else if (!d?.authenticated) {
        m.clearSession();
        emit(manager, GLOBAL_STATE_EVENTS.SESSION_CLEARED, { source: 'session-checked-unauthenticated' });
      }
    };
    const c4 = eb.on(AUTH_EVENTS.SESSION_CHECKED, sessionCheckedHandler);
    _listeners.push({ event: 'AUTH_EVENTS.SESSION_CHECKED', handler: 'sessionCheckedHandler', registeredAt: Date.now(), cleanup: c4 });
    _metrics.listenersRegistered++;

    const stateChangedHandler = (data: Record<string, unknown>) => {
      if (signal.aborted) return;
      m.telemetry.track(AUTH_EVENTS.STATE_CHANGE_RECEIVED, { state: (data as any)?.state });
    };
    const c5 = eb.on(AUTH_EVENTS.STATE_CHANGED, stateChangedHandler);
    _listeners.push({ event: 'AUTH_EVENTS.STATE_CHANGED', handler: 'stateChangedHandler', registeredAt: Date.now(), cleanup: c5 });
    _metrics.listenersRegistered++;

    m.authEventsConnected = true;
    m.telemetry.track(AUTH_EVENTS.INTEGRATION_CONNECTED, { retriesNeeded: m.eventBusRetryCount, portsInitialized: Ports.isInitialized(), listenersRegistered: _metrics.listenersRegistered });
  } catch (error) {
    (_log as (...a: unknown[]) => void)('error', 'Auth integration error:', error);
    m.telemetry.track(AUTH_EVENTS.INTEGRATION_ERROR, { error: (error as Error).message });
    if ((m.eventBusRetryCount as number) < EVENTBUS_RETRY_MAX) {
      m.eventBusRetryCount = (m.eventBusRetryCount as number) + 1;
      const retryDelay = EVENTBUS_RETRY_DELAY * (m.eventBusRetryCount as number);
      m._retryTimeoutId = setTimeout(() => { setupAuthEventIntegration(manager); }, retryDelay);
    }
  }
}

export function retryAuthIntegration(manager: Record<string, unknown>) {
  manager.authEventsConnected = false;
  manager.eventBusRetryCount = 0;
  if (manager._retryTimeoutId) { clearTimeout(manager._retryTimeoutId as ReturnType<typeof setTimeout>); manager._retryTimeoutId = null; }
  setupAuthEventIntegration(manager);
}

export function emit(manager: Record<string, unknown>, eventName: string, data: unknown) {
  if (!data) data = {};
  const eb = _getEventBus();
  if (eb && typeof eb.emit === 'function') {

    try { eb.emit(eventName, Object.assign({}, data, { source: manager.moduleId })); } catch (e) { (_log as (...a: unknown[]) => void)('warn', 'EventBus emit failed:', e); }
  }
  try { window.dispatchEvent(new CustomEvent(eventName, { detail: data })); } catch (e) {}
}

export function cleanupListeners() {
  _listeners.forEach(l => {
    if (l.cleanup && typeof l.cleanup === 'function') {

      try { (l.cleanup as () => void)(); } catch (e) { (_log as (...a: unknown[]) => void)('warn', 'Listener cleanup failed:', e); }
    }
  });
  _listeners = [];
  _metrics.listenersRegistered = 0;
}

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    architecture: 'PORTS-FACTORY-P24',
    portsInitialized: Ports.isInitialized(),
    longLived: true,
    metrics: { listenersRegistered: _metrics.listenersRegistered, portResolutions: _metrics.portResolutions },
    listeners: _listeners.map(l => ({
      event: l.event,
      handler: l.handler,
      registeredAt: l.registeredAt
    })),
    timestamp: Date.now()
  };
}

export function healthCheck() {
  const eb = _getEventBus();
  const checks = {
    eventBusAvailable: !!eb,
    portsInitialized: Ports.isInitialized(),
    listenersActive: _listeners.length > 0,
    noWindowDirect: true
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return {
    status: passed === total ? 'HEALTHY' : passed >= 2 ? 'DEGRADED' : 'UNHEALTHY',
    score: passed,
    maxScore: total,
    scoreDisplay: `${passed}/${total}`,
    version: VERSION,
    moduleId: MODULE_ID,
    architecture: 'PORTS-FACTORY-P24',
    longLived: true,
    listeners: { registered: _metrics.listenersRegistered, active: _listeners.length },
    checks,
    timestamp: Date.now()
  };
}

export default { setupAuthEventIntegration, retryAuthIntegration, emit, cleanupListeners, injectPorts, getPorts, info, healthCheck, VERSION, MODULE_ID };
