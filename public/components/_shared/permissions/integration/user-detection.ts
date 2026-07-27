// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.2.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components._shared.permissions.integration.user-detection
// PURPOSE: User detection from GlobalState, API, or sessionStorage
// ───────────────────────────────────────────────────────────────
// @contract DETECT_CURRENT_USER - detectCurrentUser(log) detects user ID
// @contract PORTS - injectPorts()/getPorts() for dependency injection
// ───────────────────────────────────────────────────────────────
// IMPORTS: createCorePorts from /core/runtime/ports-profiles.js
// PROVIDES: detectCurrentUser, injectPorts, getPorts, VERSION, MODULE_ID
// @changelog v1.2.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v1.2.0-P17WI: PortsFactory/PortsProfiles migration
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';

export const MODULE_ID = 'components._shared.permissions.integration.user-detection';
export const VERSION = '1.2.0-P2-ENTERPRISE';

const Ports = createCorePorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

export function detectCurrentUser(log: ((event: string, data?: unknown) => void) | null) {
  _initPorts();

  const gs = _getPort('globalState');
  if (gs && gs.getState) {
    try {
      const state = gs.getState();
      const userId = (state && state.auth && state.auth.user && state.auth.user.id) ||
                     (state && state.user && state.user.id) ||
                     (state && state.session && state.session.userId);
      if (userId) {
        if (log) log('user-detected', { userId: String(userId), source: 'GlobalState' });
        return Promise.resolve(String(userId));
      }
    } catch (e) { /* ignore */ }
  }

  return fetch('/api/auth/check.php', {
    credentials: 'include',
    headers: { 'Accept': 'application/json' }
  })
    .then(response => {
      if (response.ok) {
        return response.json().then(data => {
          if (data.ok && data.authenticated && data.user && data.user.id) {
            if (log) log('user-detected', { userId: String(data.user.id), source: 'auth-api' });
            return String(data.user.id);
          }
          return null;
        });
      }
      return null;
    })
    .catch((e): null => {
      if (log) log('user-detect-api-error', e.message);
      return null;
    })
    .then(result => {
      if (result) return result;
      try {
        const sessionData = sessionStorage.getItem('dsd_session');
        if (sessionData) {
          const parsed = JSON.parse(sessionData);
          if (parsed.userId) {
            if (log) log('user-detected', { userId: String(parsed.userId), source: 'sessionStorage' });
            return String(parsed.userId);
          }
        }
      } catch (e) { /* ignore */ }
      if (log) log('user-fallback', { userId: 'anonymous' });
      return 'anonymous';
    });
}

export function info() {
  return { moduleId: MODULE_ID, version: VERSION, timestamp: Date.now() };
}

export function healthCheck() {
  const ps = Ports.snapshot();
  return {
    status: 'HEALTHY',
    moduleId: MODULE_ID,
    version: VERSION,
    portsInitialized: ps._initialized,
    timestamp: Date.now()
  };
}

export default { MODULE_ID, VERSION, detectCurrentUser, injectPorts, getPorts, info, healthCheck };
