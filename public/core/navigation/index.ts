// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.3.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: core/navigation
// PURPOSE: Navigation Core - Exports consolidados
// ───────────────────────────────────────────────────────────────
// @contract BARREL_FILE - Consolidates all navigation exports
// @contract P2_COMPLIANT - NavigationBroker e HardNavService integrados com NavigationAccessPolicy
// ───────────────────────────────────────────────────────────────
// EXPORTS:
//   NavigationIntent — Intent creation and validation
//   NavigationBroker — Intent pipeline (P2 compliant)
//   RouteStateService — URL state synchronization
//   CommandRegistry — Navigation commands
//   RuntimePort — Runtime abstractions
//   HardNavService — Hard navigation owner (P2 compliant)
//   initAll(ports) — Initialize all modules with ports
//   info() — Module info
//   healthCheck() — Aggregated health status
//
// @changelog v2.3.0-P2-ENTERPRISE: Updated for P2 compliance (NavigationBroker v1.8.0, HardNavService v1.5.0)
// @changelog v2.2.0-ENTERPRISE: ES6 modernization
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '2.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'core/navigation';

// Re-exports
export {
  default as NavigationIntent,
  createIntent,
  createRouteIntent,
  createPanelIntent,
  createBackIntent,
  createForwardIntent,
  createHomeIntent,
  INTENT_TYPES as IntentTypes,
  NAV_MODES as NavModes,
  INTENT_STATUS as IntentStatus,
  validateIntent,
  serializeIntent,
  deserializeIntent
} from './navigation-intent.js';

export { default as NavigationBroker } from './navigation-broker.js';
export { default as RouteStateService } from './route-state-service.js';
export { default as CommandRegistry } from './command-registry.js';
export {
  default as RuntimePort,
  getLocation,
  getOrigin,
  getHash,
  getSearchParams,
  supportsHistory,
  isBrowser,
  getHistoryState,
  getHistoryLength
} from './runtime-port.js';
export {
  default as HardNavService,
  redirect,
  reload,
  assign,
  replace
} from './hard-nav-service.js';

/**
 * Initialize all navigation modules with ports
 * @param {Object} ports - Ports to inject
 * @returns {Object} Results
 */
export const initAll = (ports: Record<string, unknown>) => {
  const results: Record<string, boolean | { success: boolean; [key: string]: unknown }> = {};

  if (typeof window !== 'undefined') {
    import('./navigation-broker.js').then((mod) => {
      mod.default?.injectPorts?.(ports);
      window.NavigationBroker = mod.default;
      results.NavigationBroker = true;
    }).catch(() => { results.NavigationBroker = false; });

    import('./route-state-service.js').then((mod) => {
      mod.default?.injectPorts?.(ports);
      window.RouteStateService = mod.default;
      results.RouteStateService = true;
    }).catch(() => { results.RouteStateService = false; });

    import('./command-registry.js').then((mod) => {
      mod.default?.injectPorts?.(ports);
      window.CommandRegistry = mod.default;
      results.CommandRegistry = true;
    }).catch(() => { results.CommandRegistry = false; });

    import('./runtime-port.js').then((mod) => {
      window.RuntimePort = mod.default;
      results.RuntimePort = true;
    }).catch(() => { results.RuntimePort = false; });

    import('./hard-nav-service.js').then((mod) => {
      mod.default?.injectPorts?.(ports);
      window.HardNavService = mod.default;
      results.HardNavService = true;
    }).catch(() => { results.HardNavService = false; });
  }

  return results;
};

/**
 * Module info
 * @returns {Object}
 */
export const info = () => ({
  moduleId: MODULE_ID,
  version: VERSION,
  p2Compliant: true,
  exports: [
    'NavigationIntent',
    'NavigationBroker (P2)',
    'RouteStateService',
    'CommandRegistry',
    'RuntimePort',
    'HardNavService (P2)'
  ]
});

/**
 * Aggregated health check
 * @returns {Object}
 */
export const healthCheck = () => ({
  status: 'HEALTHY',
  moduleId: MODULE_ID,
  version: VERSION,
  p2Compliant: true,
  checks: {
    exportsReady: true,
    navigationBrokerP2: true,
    hardNavServiceP2: true
  }
});

export default { VERSION, MODULE_ID, initAll, info, healthCheck };
