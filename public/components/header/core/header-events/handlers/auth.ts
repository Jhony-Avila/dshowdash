// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v6.2.0-ES6)
// ═══════════════════════════════════════════════════════════════
// MODULE: header-events/handlers/auth
// PURPOSE: Handles auth lifecycle events (login, logout, session, permissions)
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   HEADER_EVENTS from /core/runtime/events/catalog/header.events.js
//   AUTH_EVENTS from /core/runtime/events/catalog/auth.events.js
//   PERMISSIONS_EVENTS from /core/runtime/events/catalog/permissions.events.js
//   MODULE_ID from ../constants.js
//   getPort from ../ports.js
//   log from ../helpers/logger.js
//   safeOn from ../helpers/event-bus.js
//   getUserMenu, updateUserMenu from ../user-menu/updater.js
// PROVIDES:
//   handleLoginSuccess(header, data) — updates user-menu and emits AUTH_LOGIN_UPDATED
//   handleSessionStarted(header, metrics, data) — processes session start with user data
//   handleLogout(header, data) — clears user-menu and emits AUTH_LOGOUT_UPDATED
//   handleAuthStateChange(header, data) — updates data-auth-state attribute on header
//   handleSessionExpired(header, data) — clears user and shows fallback message
//   handlePermissionsReady(header, data) — syncs header with UARPS permission model
//   setupAuthEventHandlers(headerEvents) — registers all auth event listeners
//   cleanupAuthEvents(headerEvents) — removes all auth event listeners
// EMITS (eventos):
//   HEADER_EVENTS.AUTH_LOGIN_UPDATED — on login/session/permissions ready
//   HEADER_EVENTS.AUTH_LOGOUT_UPDATED — on logout
// LISTENS (eventos):
//   AUTH_EVENTS.LOGIN_SUCCESS — triggers handleLoginSuccess
//   AUTH_EVENTS.SESSION_STARTED — triggers handleSessionStarted
//   AUTH_EVENTS.LOGOUT — triggers handleLogout
//   AUTH_EVENTS.STATE_CHANGED — triggers handleAuthStateChange
//   AUTH_EVENTS.SESSION_EXPIRED — triggers handleSessionExpired
//   PERMISSIONS_EVENTS.READY — triggers handlePermissionsReady
// ═══════════════════════════════════════════════════════════════
// Header Events - Auth Handlers
// @version 6.2.0-ES6
// @changelog v6.2.0-ES6 - Task 10.1 B08: var → const/let
// @changelog v6.1.0-UARPS-SOBERANO - Adicionado listener PERMISSIONS_EVENTS.READY
// @rule AUTH_EVENTS mantidos para handlers especializados (login, logout, session expired)
// @rule PERMISSIONS_EVENTS.READY adicionado para sincronizar modelo resolvido (AAA+ Governance)
'use strict';

import { HEADER_EVENTS } from '/core/runtime/events/catalog/header.events.js';
import { AUTH_EVENTS } from '/core/runtime/events/catalog/auth.events.js';
import { PERMISSIONS_EVENTS } from '/core/runtime/events/catalog/permissions.events.js';
import { MODULE_ID } from '../constants.js';
import { getPort } from '../ports.js';
import { log } from '../helpers/logger.js';
import { safeOn } from '../helpers/event-bus.js';
import { getUserMenu, updateUserMenu } from '../user-menu/updater.js';

export const VERSION = '1.1.0-ES6';

// ═══════════════════════════════════════════════════════════════
// AUTH EVENT HANDLERS (mantidos - ações especializadas)
// ═══════════════════════════════════════════════════════════════

export function handleLoginSuccess(header: Record<string,unknown>, data: Record<string,unknown>) {
  try {
    const user = data && data.user ? data.user : null;
    // @ts-expect-error TS migration - TS2345
    updateUserMenu(header, user);
    
    // @ts-expect-error TS migration - TS2339
    if (header && header.eventBus && typeof header.eventBus.emit === 'function') {
      // @ts-expect-error TS migration - TS2339
      header.eventBus.emit(HEADER_EVENTS.AUTH_LOGIN_UPDATED, {
        authenticated: !!user,
        user,
        timestamp: Date.now(),
        source: MODULE_ID
      });
    }
  } catch (e: any) {
    log('error', '_handleLoginSuccess error', e.message);
  }
}

export function handleSessionStarted(header: Record<string,unknown>, metrics: Record<string,unknown>, data: Record<string,unknown>) {
  try {
    if (!data || !data.authenticated || !data.user) {
      log('debug', 'SESSION_STARTED sem usuário válido - mantendo estado atual');
      return;
    }
    
    // @ts-expect-error TS migration - TS2345
    updateUserMenu(header, data.user);
    // @ts-expect-error TS migration - TS2339
    log('info', 'User-menu atualizado via SESSION_STARTED', data.user.email);
    
    // @ts-expect-error TS migration - TS2339
    if (header && header.eventBus && typeof header.eventBus.emit === 'function') {
      // @ts-expect-error TS migration - TS2339
      header.eventBus.emit(HEADER_EVENTS.AUTH_LOGIN_UPDATED, {
        authenticated: true,
        user: data.user,
        source: 'session_started',
        timestamp: Date.now(),
        moduleId: MODULE_ID
      });
    }
  } catch (e: any) {
    log('error', '_handleSessionStarted error', e.message);
  }
}

export function handleLogout(header: Record<string,unknown>, data: Record<string,unknown>) {
  try {
    const userMenu = getUserMenu(header);
    if (userMenu) {
      if (typeof userMenu.clearUser === 'function') {
        userMenu.clearUser();
      } else {
        // @ts-expect-error strict migration — TS2345
        updateUserMenu(header, null);
      }
      log('debug', 'User-menu limpo via AUTH_EVENTS');
    }
    
    // @ts-expect-error TS migration - TS2339
    if (header && header.eventBus && typeof header.eventBus.emit === 'function') {
      // @ts-expect-error TS migration - TS2339
      header.eventBus.emit(HEADER_EVENTS.AUTH_LOGOUT_UPDATED, {
        authenticated: false,
        user: null,
        timestamp: Date.now(),
        source: MODULE_ID
      });
    }
  } catch (e: any) {
    log('error', '_handleLogout error', e.message);
  }
}

export function handleAuthStateChange(header: Record<string,unknown>, data: Record<string,unknown>) {
  try {
    const state = data ? (data.state || data.newState) : 'unknown';
    const headerEl = document.querySelector('.main-header');
    if (headerEl) {
      // @ts-expect-error TS migration - TS2345
      headerEl.setAttribute('data-auth-state', state);
    }
  } catch (e: any) {
    log('error', '_handleAuthStateChange error', e.message);
  }
}

export function handleSessionExpired(header: Record<string,unknown>, data: Record<string,unknown>) {
  try {
    // @ts-expect-error strict migration — TS2345
    updateUserMenu(header, null);
    
    // @ts-expect-error TS migration - TS2339
    if (header && header.announceManager && typeof header.announceManager.announce === 'function') {
      // @ts-expect-error TS migration - TS2339
      header.announceManager.announce('Sessão expirada. Por favor, faça login novamente.');
    }
    if (header && typeof header.showFallback === 'function') {
      header.showFallback('auth', 'Sessão expirada');
    }
  } catch (e: any) {
    log('error', '_handleSessionExpired error', e.message);
  }
}

// ═══════════════════════════════════════════════════════════════
// PERMISSIONS MODEL HANDLER (AAA+ Governance - Phase P0)
// ═══════════════════════════════════════════════════════════════

export function handlePermissionsReady(header: Record<string,unknown>, data: Record<string,unknown>) {
  try {
    const model = data && data.model ? data.model : null;
    // @ts-expect-error TS migration - TS2339
    if (!model || !model.resolved) {
      log('debug', 'PERMISSIONS_EVENTS.READY sem modelo válido');
      return;
    }

    const headerEl = document.querySelector('.main-header');
    if (headerEl) {
      // @ts-expect-error TS migration - TS2339
      const authState = model.auth.isAuthenticated ? 'authenticated' : 'unauthenticated';
      headerEl.setAttribute('data-auth-state', authState);
      
      // @ts-expect-error TS migration - TS2339
      if (model.access.level !== undefined) {
        // @ts-expect-error TS migration - TS2339
        headerEl.setAttribute('data-user-level', String(model.access.level));
      }
    }

    // @ts-expect-error TS migration - TS2339
    if (model.auth.isAuthenticated && model.auth.username) {
      const user = {
        // @ts-expect-error TS migration - TS2339
        id: model.auth.userId,
        // @ts-expect-error TS migration - TS2339
        username: model.auth.username,
        // @ts-expect-error TS migration - TS2339
        email: model.auth.email,
        // @ts-expect-error TS migration - TS2339
        level: model.access.level,
        // @ts-expect-error TS migration - TS2339
        roles: model.access.roles
      };
      updateUserMenu(header, user);
      log('info', 'UARPS Soberano: Header sincronizado via PERMISSIONS_EVENTS.READY', {
        // @ts-expect-error TS migration - TS2339
        username: model.auth.username,
        // @ts-expect-error TS migration - TS2339
        level: model.access.level
      });
    }

    // @ts-expect-error TS migration - TS2339
    if (header && header.eventBus && typeof header.eventBus.emit === 'function') {
      // @ts-expect-error TS migration - TS2339
      header.eventBus.emit(HEADER_EVENTS.AUTH_LOGIN_UPDATED, {
        // @ts-expect-error TS migration - TS2339
        authenticated: model.auth.isAuthenticated,
        // @ts-expect-error TS migration - TS2339
        user: model.auth.isAuthenticated ? {
          // @ts-expect-error TS migration - TS2339
          id: model.auth.userId,
          // @ts-expect-error TS migration - TS2339
          username: model.auth.username,
          // @ts-expect-error TS migration - TS2339
          email: model.auth.email
        } : null,
        source: 'permission-resolver',
        timestamp: Date.now(),
        moduleId: MODULE_ID
      });
    }

  } catch (e: any) {
    log('error', '_handlePermissionsReady error', e.message);
  }
}

// ═══════════════════════════════════════════════════════════════
// SETUP (registra todos os listeners)
// ═══════════════════════════════════════════════════════════════

export function setupAuthEventHandlers(headerEvents: unknown) {
  const eb = getPort('eventBus');
  if (!eb) {
    log('warn', 'EventBus global não disponível - AUTH_EVENTS não configurados');
    return;
  }
  
  // @ts-expect-error TS migration - TS2339
  const header = headerEvents.header;
  // @ts-expect-error TS migration - TS2339
  const metrics = headerEvents._metrics;
  // @ts-expect-error TS migration - TS2339
  const cleanups = headerEvents._authCleanups;

  const onLoginSuccess = (data: Record<string,unknown>) => {
    metrics.authEventCount++;
    metrics.lastEventAt = Date.now();
    // @ts-expect-error TS migration - TS2339
    const userEmail = (data && data.user && data.user.email) ? data.user.email : 'user';
    log('info', 'AUTH: Login success recebido', userEmail);
    handleLoginSuccess(header, data);
  };

  const onSessionStarted = (data: Record<string,unknown>) => {
    metrics.authEventCount++;
    metrics.sessionStartedCount++;
    metrics.lastEventAt = Date.now();
    log('info', 'AUTH: Session started recebido');
    handleSessionStarted(header, metrics, data);
  };

  const onLogout = (data: Record<string,unknown>) => {
    metrics.authEventCount++;
    metrics.lastEventAt = Date.now();
    log('info', 'AUTH: Logout recebido');
    handleLogout(header, data);
  };

  const onAuthStateChange = (data: Record<string,unknown>) => {
    metrics.authEventCount++;
    metrics.lastEventAt = Date.now();
    const state = data ? (data.state || data.newState) : null;
    // @ts-expect-error TS migration - TS2345
    log('debug', 'AUTH: State change', state);
    handleAuthStateChange(header, data);
  };

  const onSessionExpired = (data: Record<string,unknown>) => {
    metrics.authEventCount++;
    metrics.lastEventAt = Date.now();
    log('warn', 'AUTH: Session expired');
    handleSessionExpired(header, data);
  };

  const cleanup1 = safeOn(eb, AUTH_EVENTS.LOGIN_SUCCESS, onLoginSuccess);
  const cleanup2 = safeOn(eb, AUTH_EVENTS.SESSION_STARTED, onSessionStarted);
  const cleanup3 = safeOn(eb, AUTH_EVENTS.LOGOUT, onLogout);
  const cleanup4 = safeOn(eb, AUTH_EVENTS.STATE_CHANGED, onAuthStateChange);
  const cleanup5 = safeOn(eb, AUTH_EVENTS.SESSION_EXPIRED, onSessionExpired);

  if (cleanup1) cleanups.push(typeof cleanup1 === 'function' ? cleanup1 : () => { const bus = getPort('eventBus'); if (bus && bus.off) bus.off(AUTH_EVENTS.LOGIN_SUCCESS, onLoginSuccess); });
  if (cleanup2) cleanups.push(typeof cleanup2 === 'function' ? cleanup2 : () => { const bus = getPort('eventBus'); if (bus && bus.off) bus.off(AUTH_EVENTS.SESSION_STARTED, onSessionStarted); });
  if (cleanup3) cleanups.push(typeof cleanup3 === 'function' ? cleanup3 : () => { const bus = getPort('eventBus'); if (bus && bus.off) bus.off(AUTH_EVENTS.LOGOUT, onLogout); });
  if (cleanup4) cleanups.push(typeof cleanup4 === 'function' ? cleanup4 : () => { const bus = getPort('eventBus'); if (bus && bus.off) bus.off(AUTH_EVENTS.STATE_CHANGED, onAuthStateChange); });
  if (cleanup5) cleanups.push(typeof cleanup5 === 'function' ? cleanup5 : () => { const bus = getPort('eventBus'); if (bus && bus.off) bus.off(AUTH_EVENTS.SESSION_EXPIRED, onSessionExpired); });

  const onPermissionsReady = (data: Record<string,unknown>) => {
    metrics.authEventCount++;
    metrics.lastEventAt = Date.now();
    log('info', 'UARPS: PERMISSIONS_EVENTS.READY recebido');
    handlePermissionsReady(header, data);
  };

  const cleanup6 = safeOn(eb, PERMISSIONS_EVENTS.READY, onPermissionsReady);
  if (cleanup6) cleanups.push(typeof cleanup6 === 'function' ? cleanup6 : () => { const bus = getPort('eventBus'); if (bus && bus.off) bus.off(PERMISSIONS_EVENTS.READY, onPermissionsReady); });

  log('info', `AUTH_EVENTS + PERMISSIONS_EVENTS configurados (${cleanups.length} listeners) - UARPS Soberano Phase P0`);
}

export function cleanupAuthEvents(headerEvents: unknown) {
  // @ts-expect-error TS migration - TS2339
  headerEvents._authCleanups.forEach((cleanup: () => void) => {
    try { if (typeof cleanup === 'function') cleanup(); } catch (e: any) { }
  });
  // @ts-expect-error TS migration - TS2339
  headerEvents._authCleanups = [];
  log('debug', 'AUTH_EVENTS + PERMISSIONS_EVENTS cleanup concluído');
}
