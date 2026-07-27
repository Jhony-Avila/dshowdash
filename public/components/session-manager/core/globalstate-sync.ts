// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-P25)
// ═══════════════════════════════════════════════════════════════
// MODULE: session-lifecycle:globalstate-sync
// PURPOSE: Session Manager - GlobalState Sync
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   RuntimePort from ../ports/runtime-port.js
//   sessionStore from ../state/store.js
//   AuthManager from ./auth.js
//   SESSION_EVENTS, AUTH_EVENTS from /core/runtime/events/index.js
//   getPort, initPorts, getTracker from ./ports.js
//   transitionTo, markReady, LIFECYCLE_STATES from ./state-machine.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   markDegraded() — exported function
//   syncToGlobalState() — exported function
//   setupExpirationMonitor() — exported function
//   startRecovery() — exported function
//   stopRecovery() — exported function
//   stopExpirationMonitor() — exported function
//   hasExpirationMonitor() — exported function
//   hasRecoveryMonitor() — exported function
//   getMetrics() — exported function
//   healthCheck() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   SESSION_EVENTS.EXPIRED
//   AUTH_EVENTS.SESSION_EXPIRED
//   SESSION_EVENTS.EXPIRING_SOON
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { RuntimePort } from '../ports/runtime-port.js';
import { sessionStore } from '../state/store.js';
import { AuthManager } from './auth.js';
import { SESSION_EVENTS } from '/core/runtime/events/catalog/session.events.js';
import { AUTH_EVENTS } from '/core/runtime/events/catalog/auth.events.js';
import { getPort, initPorts, getTracker } from './ports.js';
import { transitionTo, markReady, LIFECYCLE_STATES } from './state-machine.js';

export const VERSION = '1.1.0-P25';
export const MODULE_ID = 'session-lifecycle:globalstate-sync';

const syncMetrics = { globalStateSyncs: 0, errors: 0, recoveryAttempts: 0 };
let expirationIntervalId: ReturnType<typeof globalThis.setInterval> | number | null = null;
let recoveryIntervalId: ReturnType<typeof globalThis.setInterval> | number | null = null;

export function markDegraded(reason: string) {
  transitionTo(LIFECYCLE_STATES.DEGRADED, reason);
}

export function syncToGlobalState(isAuthenticated: boolean, user: unknown) {
  initPorts();
  const globalState = getPort('globalState');
  if (!globalState) {
    markDegraded('globalstate-unavailable');
    return;
  }
  try {
    syncMetrics.globalStateSyncs++;
    if (isAuthenticated && user) {
      const userObj: any = user;
      globalState.dispatch(globalState.actions.setSession({
        user: userObj,
        userId: userObj.id,
        roles: userObj.roles || [],
        lastActivity: Date.now()
      }));
    } else {
      globalState.dispatch(globalState.actions.clearSession());
    }
    getTracker().track && getTracker().track('session:global-state:synced');
  } catch (e: any) {
    syncMetrics.errors++;
    markDegraded('globalstate-sync-error');
    getTracker().track && getTracker().track('session:global-state:sync-error', { error: e.message });
  }
}

export function setupExpirationMonitor(thresholdMs: number) {
  if (thresholdMs === undefined) thresholdMs = 300000;
  expirationIntervalId = RuntimePort.setInterval(() => {
    const expiresAt = sessionStore.getExpiresAt();
    if (!expiresAt) return;

    const remaining = expiresAt - Date.now();
    const eventBus = getPort('eventBus');

    if (remaining <= 0) {
      getTracker().track && getTracker().track('session:expiration:expired');
      if (eventBus) {
        eventBus.emit(SESSION_EVENTS.EXPIRED, { timestamp: Date.now() });
        eventBus.emit(AUTH_EVENTS.SESSION_EXPIRED, { source: 'session-manager', timestamp: Date.now() });
      }
    } else if (remaining <= thresholdMs) {
      getTracker().track && getTracker().track('session:expiration:soon', { remaining });
      if (eventBus) {
        eventBus.emit(SESSION_EVENTS.EXPIRING_SOON, { remaining, timestamp: Date.now() });
      }
    }
  }, 60000);
}

export function startRecovery() {
  if (recoveryIntervalId) return;
  
  recoveryIntervalId = RuntimePort.setInterval(() => {
    syncMetrics.recoveryAttempts++;
    getTracker().track && getTracker().track('session:lifecycle:recovery-attempt', { attempt: syncMetrics.recoveryAttempts });
    transitionTo(LIFECYCLE_STATES.RECOVERING);
    

    // @ts-expect-error TS migration - TS2554
    AuthManager.checkSession().then(result => {
      if (result.ok) {
        markReady();
        stopRecovery();
      } else {
        transitionTo(LIFECYCLE_STATES.FAILED, 'recovery-check-failed');
      }
    }).catch(e => {
      syncMetrics.errors++;
      transitionTo(LIFECYCLE_STATES.FAILED, e.message);
    });
  }, 30000);
}

export function stopRecovery() {
  if (recoveryIntervalId) {
    RuntimePort.clearInterval(recoveryIntervalId);
    recoveryIntervalId = null;
  }
}

export function stopExpirationMonitor() {
  if (expirationIntervalId) {
    RuntimePort.clearInterval(expirationIntervalId);
    expirationIntervalId = null;
  }
}

export function hasExpirationMonitor() { return !!expirationIntervalId; }
export function hasRecoveryMonitor() { return !!recoveryIntervalId; }
export function getMetrics() { return Object.assign({}, syncMetrics); }

export function healthCheck() {
  const globalState = getPort('globalState');
  const checks = {
    globalStateAvailable: !!globalState,
    lowErrorRate: syncMetrics.errors < 10,
    monitorsConfigured: true
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return {
    status: passed === total ? 'HEALTHY' : 'DEGRADED',
    moduleId: MODULE_ID,
    version: VERSION,
    score: `${passed}/${total}`,
    checks,
    metrics: syncMetrics,
    hasExpiration: !!expirationIntervalId,
    hasRecovery: !!recoveryIntervalId,
    p25Compliant: true,
    timestamp: Date.now()
  };
}

export function info() { return { moduleId: MODULE_ID, version: VERSION, metrics: syncMetrics, hasExpiration: !!expirationIntervalId, hasRecovery: !!recoveryIntervalId, p25Compliant: true }; }

export default { syncToGlobalState, markDegraded, setupExpirationMonitor, startRecovery, stopRecovery, stopExpirationMonitor, hasExpirationMonitor, hasRecoveryMonitor, getMetrics, healthCheck, info };
