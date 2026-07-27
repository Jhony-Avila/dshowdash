// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.2.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: header-components-navigation-helper
// PURPOSE: Header Components - Navigation Helper
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//   NAV_INTENTS from /core/runtime/events/catalog/nav.events.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   navigateToRoute() — exported function
//   navigateToPanel() — exported function
//   navigateToIntegration() — exported function
//   info() — exported function
//   healthCheck() — exported function
//   NAV_INTENTS — exported value
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createUiPorts } from '/core/runtime/ports-profiles.js';
import { NAV_INTENTS } from '/core/runtime/events/catalog/nav.events.js';
import NavigationAdapter, { requestNavigation, requestPanelNavigation, requestIntegrationNavigation } from '../../core/navigation-adapter.js';

export const VERSION = '2.2.0-ES6';
export const MODULE_ID = 'header-components-navigation-helper';

const Ports = createUiPorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }

export function injectPorts(p: Record<string,unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

// Re-export NAV_INTENTS do catálogo oficial
export { NAV_INTENTS };

// Navigate to a route - DELEGA para o adapter
export function navigateToRoute(route: string, source: string) {
  if (!route) return false;
  return requestNavigation({
    route,
    source: source || MODULE_ID
  });
}

// Navigate to a panel by ID - DELEGA para o adapter
export function navigateToPanel(panelId: string, source: string) {
  if (!panelId) return false;
  return requestPanelNavigation(panelId, source || MODULE_ID);
}

// Navigate to integration panel - DELEGA para o adapter
export function navigateToIntegration(integrationId: string, source: string) {
  if (!integrationId) return false;
  return requestIntegrationNavigation(integrationId, source || MODULE_ID);
}

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    eventFix: true,
    portsInitialized: Ports.isInitialized(),
    adapterVersion: NavigationAdapter.VERSION,
    delegatesTo: 'navigation-adapter',
    usesOfficialEvents: true
  };
}

export function healthCheck() {
  const adapterHealth = NavigationAdapter.healthCheck ? NavigationAdapter.healthCheck() : { status: 'UNKNOWN' };
  return {
    status: adapterHealth.status,
    version: VERSION,
    moduleId: MODULE_ID,
    eventFix: true,
    checks: {
      adapterAvailable: true,
      adapterHealthy: adapterHealth.status === 'HEALTHY',
      usesOfficialEvents: true
    },
    adapterHealth,
    portsInitialized: Ports.isInitialized()
  };
}

export default {
  VERSION,
  MODULE_ID,
  NAV_INTENTS,
  navigateToRoute,
  navigateToPanel,
  navigateToIntegration,
  info,
  healthCheck,
  injectPorts,
  getPorts
};
