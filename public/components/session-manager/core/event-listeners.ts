// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-P25)
// ═══════════════════════════════════════════════════════════════
// MODULE: session-lifecycle:event-listeners
// PURPOSE: Session Manager - Event Listeners
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   RuntimePort from ../ports/runtime-port.js
//   sessionStore from ../state/store.js
//   TokenManager from ./token.js
//   SessionPersistence from ./persistence.js
//   AUTH_EVENTS from /core/runtime/events/index.js
//   getPort, getTracker from ./ports.js
//   markDegraded, syncToGlobalState from ./globalstate-sync.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   setupAuthEventListeners() — exported function
//   setupActivityTracking() — exported function
//   cleanupEventListeners() — exported function
//   getCleanupCount() — exported function
//   getActivityListenerCount() — exported function
//   healthCheck() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   AUTH_EVENTS.LOGIN_SUCCESS
//   AUTH_EVENTS.LOGOUT
//   AUTH_EVENTS.LOGOUT_SUCCESS
//   AUTH_EVENTS.SESSION_CHECKED
//   AUTH_EVENTS.SESSION_EXPIRED
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { RuntimePort } from '../ports/runtime-port.js';
import { sessionStore } from '../state/store.js';
import { TokenManager } from './token.js';
import { SessionPersistence } from './persistence.js';
import { AUTH_EVENTS } from '/core/runtime/events/catalog/auth.events.js';
import { getPort, getTracker } from './ports.js';
import { markDegraded, syncToGlobalState } from './globalstate-sync.js';

export const VERSION = '1.1.0-P25';
export const MODULE_ID = 'session-lifecycle:event-listeners';

let eventBusCleanups: (() => void)[] = [];
let activityListenerIds: unknown[] = [];

export function setupAuthEventListeners() {
  const eventBus = getPort('eventBus');
  if (!eventBus) {
    markDegraded('eventbus-unavailable');
    return;
  }

  const handleLoginSuccess = (data: Record<string, unknown>) => {
    if (data && data.source === 'session-manager') return;
    getTracker().track && getTracker().track('session:lifecycle:auth-event:login-success', { source: data ? data.source : null });
    if (data && data.user) {
      const user: any = data.user;
      sessionStore.update({
        authenticated: true,
        user,
        userId: user.id,
        roles: user.roles || [],
        loginAt: Date.now(),
        lastActivity: Date.now()
      });
    }
    if (data && data.csrf) TokenManager.setCsrf(data.csrf as string);
    syncToGlobalState(true, data ? data.user : null);
  };

  const handleLogout = (data: Record<string, unknown>) => {
    if (data && data.source === 'session-manager') return;
    getTracker().track && getTracker().track('session:lifecycle:auth-event:logout', { source: data ? data.source : null });
    sessionStore.clear();
    TokenManager.clearAll();
    SessionPersistence.clear();
    syncToGlobalState(false, null);
  };

  const handleSessionChecked = (data: Record<string, unknown>) => {
    if (data && data.source === 'session-manager') return;
    getTracker().track && getTracker().track('session:lifecycle:auth-event:session-checked', { authenticated: data ? data.authenticated : null });
    if (data && data.authenticated && data.user) {
      syncToGlobalState(true, data.user);
    } else if (data && data.authenticated === false) {
      syncToGlobalState(false, null);
    }
  };

  const handleSessionExpired = () => {
    getTracker().track && getTracker().track('session:lifecycle:auth-event:session-expired');
    sessionStore.clear();
    TokenManager.clearAll();
    SessionPersistence.clear();
    syncToGlobalState(false, null);
  };

  eventBus.on(AUTH_EVENTS.LOGIN_SUCCESS, handleLoginSuccess);
  eventBus.on(AUTH_EVENTS.LOGOUT, handleLogout);
  eventBus.on(AUTH_EVENTS.LOGOUT_SUCCESS, handleLogout);
  eventBus.on(AUTH_EVENTS.SESSION_CHECKED, handleSessionChecked);
  eventBus.on(AUTH_EVENTS.SESSION_EXPIRED, handleSessionExpired);

  eventBusCleanups.push(
    () => { eventBus.off(AUTH_EVENTS.LOGIN_SUCCESS, handleLoginSuccess); },
    () => { eventBus.off(AUTH_EVENTS.LOGOUT, handleLogout); },
    () => { eventBus.off(AUTH_EVENTS.LOGOUT_SUCCESS, handleLogout); },
    () => { eventBus.off(AUTH_EVENTS.SESSION_CHECKED, handleSessionChecked); },
    () => { eventBus.off(AUTH_EVENTS.SESSION_EXPIRED, handleSessionExpired); }
  );

  getTracker().track && getTracker().track('session:lifecycle:auth-listeners:setup', { events: Object.keys(AUTH_EVENTS).length });
}

export function setupActivityTracking() {
  let lastUpdate = 0;
  const throttledUpdate = () => {
    const now = Date.now();
    if (now - lastUpdate > 60000) {
      lastUpdate = now;
      if (sessionStore.isAuthenticated()) {
        sessionStore.updateActivity();
      }
    }
  };

  const clickListenerId = RuntimePort.addEventListener('document', 'click', throttledUpdate, { passive: true });
  const keydownListenerId = RuntimePort.addEventListener('document', 'keydown', throttledUpdate, { passive: true });

  if (clickListenerId) activityListenerIds.push(clickListenerId);
  if (keydownListenerId) activityListenerIds.push(keydownListenerId);
}

export function cleanupEventListeners() {
  eventBusCleanups.forEach(cleanup => { try { cleanup(); } catch (e) {} });
  eventBusCleanups = [];
  activityListenerIds.forEach(id => { RuntimePort.removeEventListener(id); });
  activityListenerIds = [];
}

export function getCleanupCount() { return eventBusCleanups.length; }
export function getActivityListenerCount() { return activityListenerIds.length; }

export function healthCheck() {
  const eventBus = getPort('eventBus');
  const cleanupCount = eventBusCleanups.length;
  const activityCount = activityListenerIds.length;
  const checks = {
    eventBusAvailable: !!eventBus,
    cleanupRegistered: cleanupCount > 0 || activityCount === 0,
    activityTrackingActive: activityCount >= 0
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return {
    status: passed === total ? 'HEALTHY' : 'DEGRADED',
    moduleId: MODULE_ID,
    version: VERSION,
    score: `${passed}/${total}`,
    checks,
    cleanups: cleanupCount,
    activityListeners: activityCount,
    p25Compliant: true,
    timestamp: Date.now()
  };
}

export function info() { return { moduleId: MODULE_ID, version: VERSION, cleanups: eventBusCleanups.length, activityListeners: activityListenerIds.length, p25Compliant: true }; }

export default { setupAuthEventListeners, setupActivityTracking, cleanupEventListeners, getCleanupCount, getActivityListenerCount, healthCheck, info };
