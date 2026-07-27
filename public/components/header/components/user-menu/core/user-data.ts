// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: header/components/user-menu/core/user-data
// PURPOSE: User Menu - User Data Operations (Fetch, Set, Normalize, Logout)
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   StateValidators from ../state/validators.js
//   Formatters from ../utils/formatters.js
//   emitUIAction from ./actions.js
//   getPort, getHardNavService from ./ports.js
//   UI_EVENTS from /core/runtime/events/catalog/ui.events.js
//   COMPONENT_EVENTS from /core/runtime/events/catalog/component.events.js
//
// PROVIDES:
//   VERSION — module constant
//   normalizeUser() — exported function
//   initialFetch() — exported function
//   setUser() — exported function
//   clearUser() — exported function
//   handleLogout() — exported function
//   setDebug() — exported function
//   getLogs() — exported function
//   healthCheck() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): component context
// EMITS (eventos):
//   COMPONENT_EVENTS.DATA_UPDATED (via eventBus)
//   UI_EVENTS.ACTION (via eventBus)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none - delegates to ports.js hardNavService)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { StateValidators } from '../state/validators.js';
import { Formatters } from '../utils/formatters.js';
import { emitUIAction } from './actions.js';
import { getPort, getHardNavService } from './ports.js';
import { UI_EVENTS } from '/core/runtime/events/catalog/ui.events.js';
import { COMPONENT_EVENTS } from '/core/runtime/events/catalog/component.events.js';

export const VERSION = '1.1.0-ENTERPRISE';
export const MODULE_ID = 'header/components/user-menu/core/user-data';
const COMPONENT_MODULE_ID = 'header/components/user-menu';

let _debug = false;
// @ts-expect-error strict migration — TS7034
let _logBuffer = [];
function _log(level: string, ...args: unknown[]) {
  if (!_debug && level === 'debug') return;
  _logBuffer.push({ level, args, ts: Date.now() });
  // @ts-expect-error strict migration — TS7005
  if (_logBuffer.length > 50) _logBuffer.shift();
}

// ── User Normalization (DRY — single source of truth) ───────
export function normalizeUser(raw: unknown) {
  if (!raw) return null;
  return {
    // @ts-expect-error TS migration - TS2339
    id: raw.id,
    // @ts-expect-error TS migration - TS2339
    name: raw.name || raw.full_name || 'Usuário',
    // @ts-expect-error TS migration - TS2339
    fullName: raw.full_name || raw.name,
    // @ts-expect-error TS migration - TS2339
    email: raw.email,
    // @ts-expect-error TS migration - TS2339
    avatar: raw.avatar_url || raw.avatar,
    // @ts-expect-error TS migration - TS2339
    avatar_url: raw.avatar_url || raw.avatar,
    // @ts-expect-error TS migration - TS2339
    role: raw.role || 'user',
    // @ts-expect-error TS migration - TS2339
    roleDisplay: Formatters.formatRole(raw.role),
    // @ts-expect-error TS migration - TS2339
    funcao: raw.funcao,
    // @ts-expect-error TS migration - TS2339
    departamento: raw.departamento
  };
}

// ── Initial Fetch ───────────────────────────────────────────
export function initialFetch(component: Record<string,unknown>) {
  if (component.isDestroyed) return Promise.resolve();

  // @ts-expect-error TS migration - TS2339
  component._metrics.fetchCount++;

  // @ts-expect-error TS migration - TS2339
  return component.circuitBreaker.execute(() => component.api.fetchCurrentUser()).then((user: Record<string,unknown>) => {
    if (component.isDestroyed) return;
    if (user) {
      try {
        StateValidators.validateUser(user);
      } catch (e) {
        // @ts-expect-error TS migration - TS2349
        component._log('warn', 'User validation warning:', e.message);
      }

      // @ts-expect-error TS migration - TS2339
      component.store.setState({
        user: normalizeUser(user),
        status: 'ok'
      });
      // @ts-expect-error TS migration - TS2349
      component._log('debug', 'Usuário carregado:', user.name);
    } else {
      // @ts-expect-error TS migration - TS2339
      component.store.setState({ user: null, status: 'guest' });
      // @ts-expect-error TS migration - TS2349
      component._log('debug', 'Nenhum usuário autenticado');
    }
  }).catch((error: unknown) => {
    if (component.isDestroyed) return;
    // @ts-expect-error TS migration - TS2339
    component.store.setState({ user: null, status: 'error' });
    // @ts-expect-error TS migration - TS2349, TS2339
    component._log('warn', `Erro no fetch (Circuit Breaker state: ${component.circuitBreaker.getState()}):`, error);
  });
}

// ── Set User ────────────────────────────────────────────────
export function setUser(component: Record<string,unknown>, userData: Record<string,unknown>) {
  if (component.isDestroyed) return;

  // @ts-expect-error TS migration - TS2339
  component._metrics.setUserCount++;
  // @ts-expect-error TS migration - TS2339
  component._metrics.lastSetUserAt = Date.now();

  if (userData) {
    try {
      StateValidators.validateUser(userData);
    } catch (e) {
      // @ts-expect-error TS migration - TS2349
      component._log('warn', 'User validation warning:', e.message);
    }

    // @ts-expect-error TS migration - TS2339
    component.store.setState({
      user: normalizeUser(userData),
      status: 'ok'
    });
    // @ts-expect-error TS migration - TS2349
    component._log('info', 'Estado atualizado via setUser:', userData.name);
    // @ts-expect-error TS migration - TS2349
    component._announce(`Usuário atualizado: ${userData.name || 'Usuário'}`);

    const eb = getPort('eventBus');
    if (eb && eb.emit) {
      eb.emit(COMPONENT_EVENTS.DATA_UPDATED, {
        // @ts-expect-error TS migration - TS2339
        componentId: component.constructor._exportId || 'user-menu',
        moduleId: COMPONENT_MODULE_ID,
        data: { user: userData },
        timestamp: Date.now()
      });
    }
  } else {
    // @ts-expect-error TS migration - TS2339
    component.store.setState({ user: null, status: 'guest' });
    // @ts-expect-error TS migration - TS2349
    component._log('info', 'Estado atualizado: guest');
  }
}

// ── Clear User ──────────────────────────────────────────────
export function clearUser(component: Record<string,unknown>) {
  // @ts-expect-error strict migration — TS2345
  setUser(component, null);
}

// ── Handle Logout ───────────────────────────────────────────
export function handleLogout(component: Record<string,unknown>) {
  if (component.isDestroyed) return Promise.resolve();

  // @ts-expect-error TS migration - TS2349
  component._announce('Saindo da conta...');
  emitUIAction('logout', { confirmed: true });

  const eb = getPort('eventBus');
  if (eb && eb.emit) {
    eb.emit(UI_EVENTS.ACTION, {
      action: 'logout',
      source: COMPONENT_MODULE_ID,
      timestamp: Date.now()
    });
  }

  // @ts-expect-error TS migration - TS2339
  return component.circuitBreaker.execute(() => component.api.logout()).then(() => {
    clearUser(component);
    const hns = getHardNavService();
    hns.redirect('/login', 'logout', COMPONENT_MODULE_ID);
  }).catch((error: unknown) => {
    // @ts-expect-error TS migration - TS2349
    component._log('error', 'Erro logout:', error);
    // @ts-expect-error TS migration - TS2349
    component._announce('Erro ao sair. Tente novamente.');
  });
}

// ── Observability ───────────────────────────────────────────
export function healthCheck() {
  const checks = { ready: true };
  const passed = Object.values(checks).filter(Boolean).length;
  return {
    status: passed === 1 ? 'HEALTHY' : 'DEGRADED',
    score: passed,
    maxScore: 1,
    scoreDisplay: `${passed}/1`,
    checks,
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: new Date().toISOString()
  };
}

export function info() {
  return {
    version: VERSION,
    moduleId: MODULE_ID,
    healthCheck: healthCheck()
  };
}

export function setDebug(enabled: boolean) { _debug = !!enabled; }
// @ts-expect-error strict migration — TS7005
export function getLogs() { return [..._logBuffer]; }
