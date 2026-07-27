// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v2.2.0-P17WI)
// ═══════════════════════════════════════════════════════════════
// MODULE: header-core-global-state-integration
// PURPOSE: Integrates header with GlobalState for theme and auth session sync
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//   log, _integrationsStatus from ./logger.js
// PROVIDES:
//   setupGlobalStateIntegration(headerInstance) — subscribe to global theme/auth changes
//   updateUserDisplay(session) — update DOM user info from session data
//   cleanupGlobalStateIntegration(cleanups) — cleanup subscriptions
//   injectPorts(p) — inject port dependencies
//   getPorts() — return ports snapshot
//   getVersion() — return module version
//   healthCheck() — return module health status
//   info() — return module diagnostic info
//   VERSION — module version constant
//   MODULE_ID — module identifier constant
// WINDOW ACCESS:
//   document.querySelector — query user display DOM elements
//   document.documentElement — set data-theme attribute
// ═══════════════════════════════════════════════════════════════

// Header GlobalState Integration - Enterprise Autocontained
// @version 2.2.0-P17WI
// P17WI: PortsFactory/PortsProfiles
'use strict';

import { createUiPorts } from '/core/runtime/ports-profiles.js';
import { log, _integrationsStatus } from './logger.js';

export const VERSION = '2.2.0-P17WI';
export const MODULE_ID = 'header-core-global-state-integration';

const Ports = createUiPorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }

export function injectPorts(p: Record<string,unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

export function setupGlobalStateIntegration(headerInstance: Record<string,unknown>) {
  const gs = _getPort('globalState');
  if (!gs) { log('warn', 'GlobalState não disponível'); return []; }
  _integrationsStatus.globalStateConnected = true;
  const cleanups = [];
  // @ts-expect-error TS migration - TS2345
  const unsubscribeTheme = gs.subscribe((theme: unknown) => { log('debug', 'Tema global alterado:', theme); document.documentElement.setAttribute('data-theme', theme); }, 'preferences.theme');
  cleanups.push(unsubscribeTheme);
  const unsubscribeAuth = gs.subscribe((session: Record<string,unknown>) => { if (session.isAuthenticated) { log('debug', 'Sessão autenticada detectada'); updateUserDisplay(session); } }, 'session');
  cleanups.push(unsubscribeAuth);
  log('info', 'Global State integration configurada (P17WI)');
  return cleanups;
}


// @ts-expect-error TS migration - TS2339
export function updateUserDisplay(session) { const userNameEl = document.querySelector('.header-user-name'); if (userNameEl) { const displayName = session.user?.name || session.user?.username || session.userId || 'Usuário'; userNameEl.textContent = displayName; } const avatarEl = document.querySelector('.header-user-avatar img'); if (avatarEl && session.user?.avatar_url) { avatarEl.src = session.user.avatar_url; avatarEl.alt = session.user?.name || 'Avatar'; } const userRoleEl = document.querySelector('.header-user-role'); if (userRoleEl && session.user?.funcao) { userRoleEl.textContent = session.user.funcao; } const userDeptEl = document.querySelector('.header-user-dept'); if (userDeptEl && session.user?.departamento) { userDeptEl.textContent = session.user.departamento; } }

export function cleanupGlobalStateIntegration(cleanups: (()=>void)[]) { if (Array.isArray(cleanups)) { cleanups.forEach(cleanup => { if (typeof cleanup === 'function') cleanup(); }); } }
export function getVersion() { return VERSION; }

export function healthCheck() { const checks = { globalStateAvailable: !!_getPort('globalState'), integrationsStatusTracked: !!_integrationsStatus }; const passed = Object.values(checks).filter(Boolean).length; const total = Object.keys(checks).length; return { status: passed === total ? 'HEALTHY' : 'DEGRADED', score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), timestamp: new Date().toISOString() }; }

export function info() { return { version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), globalStateConnected: _integrationsStatus.globalStateConnected, healthCheck: healthCheck() }; }

export default { setupGlobalStateIntegration, updateUserDisplay, cleanupGlobalStateIntegration, getVersion, healthCheck, info };
