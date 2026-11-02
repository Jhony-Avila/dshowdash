// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.5.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: core.navigation.hard-nav-service
// PURPOSE: Owner único de hard navigation (redirect, reload, assign, replace)
// ───────────────────────────────────────────────────────────────
// @contract HARD_NAV_OWNER - Este módulo é o owner autorizado de hard navigation
// @contract P2_POLICY - Integrado com NavigationAccessPolicy
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//   UI_EVENTS from /core/runtime/events/index.js
//   recordNavigation, NAV_ACCESS_TYPES, NAV_SOURCES from /core/policies/navigation-access-policy.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   redirect(url, reason, source) — hard redirect
//   reload(reason, source) — page reload
//   assign(url, reason, source) — location.assign
//   replace(url, reason, source) — location.replace
//   getHistory() — navigation history
//   healthCheck() — module health status
//   info() — module info
//   injectPorts(p) — inject port dependencies
//   getPorts() — return ports snapshot
//
// EMITS (eventos):
//   UI_EVENTS.HARD_NAV — quando hard navigation é executada
//
// @changelog v1.5.0-P2-ENTERPRISE: Integrado NavigationAccessPolicy.recordNavigation (NR-FULL roadmap P2)
// @changelog v1.4.0-ENTERPRISE: ES6 modernization (const/let, arrow functions, template literals)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { UI_EVENTS } from '/core/runtime/events/catalog/ui.events.js';
import { recordNavigation, NAV_ACCESS_TYPES, NAV_SOURCES } from '/core/policies/navigation-access-policy.js';

export const VERSION = '1.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'core.navigation.hard-nav-service';

const Ports = createCorePorts({ moduleId: MODULE_ID });

const _initPorts = (): void => { Ports.init(); };
const _getPort = (name: string): unknown => Ports.get(name);
export const injectPorts = (p: Record<string, unknown>): boolean => Ports.inject(p);
export const getPorts = () => Ports.snapshot();

interface HardNavEntry {
  action: string;
  url: string;
  reason: string;
  source: string;
  timestamp: number;
}

const _metrics = { redirects: 0, reloads: 0, assigns: 0, replaces: 0, errors: 0 };
const _history: HardNavEntry[] = [];
const MAX_HISTORY = 20;

const _addToHistory = (entry: HardNavEntry): void => {
  _history.unshift(entry);
  if (_history.length > MAX_HISTORY) _history.pop();
};

/**
 * P2: Record navigation via NavigationAccessPolicy
 * @param {string} type - NAV_ACCESS_TYPES (hard, external)
 * @param {string} target - URL or action
 * @param {string} reason - Reason for navigation
 */
const _recordNav = (type: string, target: string, reason: string): void => {
  try {
    recordNavigation({
      type,
      source: NAV_SOURCES.HARD_NAV_SERVICE,
      target,
      reason: reason || 'hard-navigation',
      caller: MODULE_ID,
      moduleId: MODULE_ID,
      isUIComponent: false
    });
  } catch (e) {
    // Policy not initialized yet - silent fail
  }
};

const _emitHardNav = (action: string, url: string, reason: string, source: string): HardNavEntry => {
  const payload: HardNavEntry = {
    action,
    url: url || '',
    reason: reason || 'unknown',
    source: source || MODULE_ID,
    timestamp: Date.now()
  };
  _addToHistory(payload);

  const eb = _getPort('eventBus') as { emit?: (event: string, data: unknown) => void } | null;
  eb?.emit?.(UI_EVENTS.HARD_NAV, payload);

  const telemetry = _getPort('telemetry') as { track?: (event: string, data: unknown) => void } | null;
  telemetry?.track?.('navigation:hard-nav', payload);

  const logger = _getPort('logger') as { info?: (msg: string, data: unknown) => void } | null;
  logger?.info?.(`[HardNavService] ${action}`, payload);

  return payload;
};

/**
 * Redirect to URL (hard navigation)
 * @param {string} url - Target URL
 * @param {string} reason - Reason for redirect
 * @param {string} source - Source module
 * @returns {Object}
 */
export const redirect = (url: string, reason: string, source: string): { ok: boolean; action?: string; payload?: HardNavEntry; error?: string } => {
  if (!url) {
    _metrics.errors++;
    return { ok: false, error: 'URL required' };
  }

  _metrics.redirects++;

  // P2: Record navigation
  _recordNav(NAV_ACCESS_TYPES.HARD, url, reason);

  const payload = _emitHardNav('redirect', url, reason, source);

  if (typeof window !== 'undefined') {
    window.location.href = url;
  }

  return { ok: true, action: 'redirect', payload };
};

/**
 * Reload current page
 * @param {string} reason - Reason for reload
 * @param {string} source - Source module
 * @returns {Object}
 */
export const reload = (reason: string, source: string): { ok: boolean; action?: string; payload?: HardNavEntry } => {
  _metrics.reloads++;

  const currentHref = typeof window !== 'undefined' ? window.location.href : '';

  // P2: Record navigation
  _recordNav(NAV_ACCESS_TYPES.HARD, currentHref, reason || 'reload');

  const payload = _emitHardNav('reload', currentHref, reason, source);

  if (typeof window !== 'undefined') {
    window.location.reload();
  }

  return { ok: true, action: 'reload', payload };
};

/**
 * Assign new URL (adds to history)
 * @param {string} url - Target URL
 * @param {string} reason - Reason for assign
 * @param {string} source - Source module
 * @returns {Object}
 */
export const assign = (url: string, reason: string, source: string): { ok: boolean; action?: string; payload?: HardNavEntry; error?: string } => {
  if (!url) {
    _metrics.errors++;
    return { ok: false, error: 'URL required' };
  }

  _metrics.assigns++;

  // P2: Record navigation
  _recordNav(NAV_ACCESS_TYPES.HARD, url, reason);

  const payload = _emitHardNav('assign', url, reason, source);

  if (typeof window !== 'undefined') {
    window.location.assign(url);
  }

  return { ok: true, action: 'assign', payload };
};

/**
 * Replace current URL (no history entry)
 * @param {string} url - Target URL
 * @param {string} reason - Reason for replace
 * @param {string} source - Source module
 * @returns {Object}
 */
export const replace = (url: string, reason: string, source: string): { ok: boolean; action?: string; payload?: HardNavEntry; error?: string } => {
  if (!url) {
    _metrics.errors++;
    return { ok: false, error: 'URL required' };
  }

  _metrics.replaces++;

  // P2: Record navigation
  _recordNav(NAV_ACCESS_TYPES.HARD, url, reason);

  const payload = _emitHardNav('replace', url, reason, source);

  if (typeof window !== 'undefined') {
    window.location.replace(url);
  }

  return { ok: true, action: 'replace', payload };
};

/**
 * Get navigation history
 * @returns {Array}
 */
export const getHistory = (): HardNavEntry[] => _history.slice();

/**
 * Module info
 * @returns {Object}
 */
export const info = () => ({
  moduleId: MODULE_ID,
  version: VERSION,
  metrics: { ..._metrics },
  historySize: _history.length,
  lastHardNav: _history[0] || null,
  portsInitialized: Ports.isInitialized()
});

/**
 * Health check
 * @returns {Object}
 */
export const healthCheck = () => {
  _initPorts();

  const hasEventBus = !!_getPort('eventBus');
  const total = _metrics.redirects + _metrics.reloads + _metrics.assigns + _metrics.replaces;
  const errorRate = total > 0 ? (_metrics.errors / total) * 100 : 0;

  const checks = {
    hasEventBus: { ok: hasEventBus, severity: 'warn' },
    lowErrorRate: { ok: errorRate < 10, severity: 'warn' },
    portsInitialized: { ok: Ports.isInitialized(), severity: 'info' }
  };

  const passed = Object.values(checks).filter(c => c.ok).length;
  const total_checks = Object.keys(checks).length;

  return {
    status: passed >= total_checks - 1 ? 'HEALTHY' : 'DEGRADED',
    version: VERSION,
    moduleId: MODULE_ID,
    score: `${passed}/${total_checks}`,
    checks,
    metrics: { ..._metrics },
    errorRate: `${Math.round(errorRate)}%`
  };
};

export default {
  redirect,
  reload,
  assign,
  replace,
  getHistory,
  injectPorts,
  getPorts,
  info,
  healthCheck,
  VERSION,
  MODULE_ID
};
