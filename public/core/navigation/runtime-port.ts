// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.3.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: core.navigation.runtime-port
// PURPOSE: Abstração read-only centralizada de window.location/history
// ───────────────────────────────────────────────────────────────
// @contract LOCATION_PORT - Único acesso autorizado a window.location
// @contract HISTORY_PORT - Único acesso autorizado a window.history
// @contract SSR_SAFE - Guards para SSR/Node safety
// ───────────────────────────────────────────────────────────────
// IMPORTS: None (standalone port)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   getLocation() — snapshot de location
//   getOrigin() — origin atual
//   getHash() — hash atual
//   getSearchParams() — URLSearchParams
//   supportsHistory() — verifica suporte
//   isBrowser() — verifica ambiente
//   getHistoryState() — state do history
//   getHistoryLength() — length do history
//   healthCheck() — status de saúde
//   info() — informações do módulo
//
// WINDOW ACCESS:
//   - window.location.* → BROWSER API LEGITIMA
//   - window.history.* → BROWSER API LEGITIMA
//
// @changelog v1.3.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT
// @changelog v1.2.0-ENTERPRISE: ES6 modernization
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '1.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'core.navigation.runtime-port';

const _metrics = { locationReads: 0, originReads: 0, historyChecks: 0 };

// SSR Guard
const _hasWindow = () => typeof window !== 'undefined';
const _hasHistory = () => _hasWindow() && typeof window.history !== 'undefined'; // OWNER_OK_P14: RuntimePortOwner — history check (source=runtime-port)

// Retorna objeto com path, hash, search, origin, href
export const getLocation = () => {
  _metrics.locationReads++;
  if (!_hasWindow()) return { path: '/', hash: '', search: '', origin: '', href: '', protocol: '', host: '', pathname: '/' };
  const loc = window.location; // OWNER_OK_P14: RuntimePortOwner — location read centralizado (source=runtime-port)
  return { path: loc.pathname || '/', pathname: loc.pathname || '/', hash: loc.hash || '', search: loc.search || '', origin: loc.origin || '', href: loc.href || '', protocol: loc.protocol || '', host: loc.host || '' };
};

// Retorna apenas origin
export const getOrigin = () => { _metrics.originReads++; if (!_hasWindow()) return ''; return window.location.origin || ''; }; // OWNER_OK_P14: RuntimePortOwner — origin read (source=runtime-port)

// Retorna hash sem #
export const getHash = () => { if (!_hasWindow()) return ''; const hash = window.location.hash || ''; return hash.startsWith('#') ? hash.substring(1) : hash; }; // OWNER_OK_P14: RuntimePortOwner — hash read (source=runtime-port)

// Retorna search params como objeto
export const getSearchParams = (): Record<string, string> => { if (!_hasWindow()) return {}; const params = new URLSearchParams(window.location.search); const result: Record<string, string> = {}; params.forEach((value: string, key: string) => { result[key] = value; }); return result; }; // OWNER_OK_P14: RuntimePortOwner — search read (source=runtime-port)

// Verifica suporte a History API
export const supportsHistory = () => { _metrics.historyChecks++; return _hasHistory() && typeof window.history.pushState === 'function'; }; // OWNER_OK_P14: RuntimePortOwner — history capability check (source=runtime-port)

// Verifica se está em ambiente browser
export const isBrowser = () => _hasWindow();

// Retorna estado atual do history
export const getHistoryState = () => { if (!_hasHistory()) return null; return window.history.state; }; // OWNER_OK_P14: RuntimePortOwner — history.state read (source=runtime-port)

// Retorna length do history
export const getHistoryLength = () => { if (!_hasHistory()) return 0; return window.history.length; }; // OWNER_OK_P14: RuntimePortOwner — history.length read (source=runtime-port)

// Info
export const info = () => ({ moduleId: MODULE_ID, version: VERSION, isBrowser: isBrowser(), supportsHistory: supportsHistory(), currentLocation: getLocation(), metrics: { ..._metrics } });

// Health check
export const healthCheck = () => { const browser = isBrowser(); const history = supportsHistory(); return { status: browser ? 'HEALTHY' : 'DEGRADED', version: VERSION, moduleId: MODULE_ID, checks: { isBrowser: browser, supportsHistory: history }, metrics: { ..._metrics } }; };

export default { getLocation, getOrigin, getHash, getSearchParams, supportsHistory, isBrowser, getHistoryState, getHistoryLength, info, healthCheck, VERSION, MODULE_ID };
