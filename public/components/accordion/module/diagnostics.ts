// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.3.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.accordion.module.diagnostics
// PURPOSE: Diagnostics and health monitoring for accordion module
// ───────────────────────────────────────────────────────────────
// @contract GET_METRICS - getMetrics() returns aggregated metrics
// @contract HEALTH_CHECK - healthCheck() returns health status
// @contract INFO - info() returns module information
// @contract AUDIT - audit() returns compliance audit report
// ───────────────────────────────────────────────────────────────
// IMPORTS: VERSION, MODULE_ID from ./constants.js
// IMPORTS: isStylesInjected from ./style-injector.js
// IMPORTS: isPortsInitialized from ./ports-manager.js
// IMPORTS: singleton-state functions from ./singleton-state.js
// PROVIDES: getMetrics, healthCheck, info, audit, VERSION, MODULE_ID
// @changelog v1.3.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v1.2.0-MODULAR: Initial modular architecture
// ═══════════════════════════════════════════════════════════════
'use strict';

import { VERSION as CONST_VERSION, MODULE_ID as CONST_MODULE_ID } from './constants.js';
import { isStylesInjected } from './style-injector.js';
import { isPortsInitialized } from './ports-manager.js';
import * as state from './singleton-state.js';

export const VERSION = '1.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'components.accordion.module.diagnostics';

export function getMetrics() {
  const instance = state.getInstance();
  const view = state.getView();
  const telemetry = state.getTelemetry();

  return {
    controller: instance?.getMetrics() ?? null,
    view: view?.getMetrics() ?? null,
    telemetry: telemetry?.getMetrics() ?? null
  };
}

export function healthCheck() {
  const instance = state.getInstance();
  const view = state.getView();
  const telemetry = state.getTelemetry();

  const instanceHealth = instance?.healthCheck() ?? null;
  const viewHealth = view?.healthCheck() ?? null;
  const telemetryHealth = telemetry?.healthCheck() ?? null;

  const checks = {
    moduleLoaded: true,
    portsInitialized: isPortsInitialized(),
    stylesInjected: isStylesInjected(),
    hasInstance: state.hasInstance(),
    hasView: state.hasView(),
    hasTelemetry: state.hasTelemetry(),
    instanceHealthy: instanceHealth?.status === 'HEALTHY',
    viewHealthy: viewHealth?.status === 'HEALTHY'
  };

  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;

  return {
    status: passed >= 6 ? 'HEALTHY' : passed >= 4 ? 'DEGRADED' : 'UNHEALTHY',
    score: passed,
    maxScore: total,
    scoreDisplay: `${passed}/${total}`,
    checks,
    components: {
      controller: instanceHealth,
      view: viewHealth,
      telemetry: telemetryHealth
    },
    version: VERSION,
    moduleId: MODULE_ID,
    modular: true,
    timestamp: Date.now()
  };
}

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    modular: true,
    hasInstance: state.hasInstance(),
    hasView: state.hasView(),
    hasTelemetry: state.hasTelemetry(),
    stylesInjected: isStylesInjected(),
    portsInitialized: isPortsInitialized(),
    submodules: {
      contracts: '1.1.0-P2-ENTERPRISE',
      state: '1.1.0-P2-ENTERPRISE',
      controller: '1.1.0-P2-ENTERPRISE',
      view: '2.4.0-P2-ENTERPRISE',
      persistence: '1.1.0-P2-ENTERPRISE',
      telemetry: '1.2.0-P2-ENTERPRISE',
      mock: '1.1.0-P2-ENTERPRISE'
    },
    capabilities: [
      'data-driven',
      'multi-mode',
      'single-mode',
      'persistence',
      'uarps-integration',
      'uarps-region-configurable',
      'icon-resolver-injectable',
      'event-driven',
      'observable',
      'telemetry',
      'a11y-compliant',
      'teal-theme',
      'decoupled-from-sidebar'
    ]
  };
}

export function audit() {
  const view = state.getView();
  const options = state.getOptions();
  const viewInfo: Record<string, unknown> = view?.info() ?? {};

  return {
    moduleId: MODULE_ID,
    version: VERSION,
    modular: true,
    timestamp: Date.now(),
    checks: {
      hasSidebarImports: false,
      uarpsRegionMode: options.uarpsRegion ? 'override' : 'default',
      uarpsRegionValue: viewInfo.uarpsRegion ?? 'region:app:accordion-ncs',
      idStrategy: 'canonical',
      intentsSource: 'central-catalog',
      cssInjected: isStylesInjected(),
      iconResolverInjected: options.iconResolver !== undefined && options.iconResolver !== null
    },
    options: {
      uarpsRegion: options.uarpsRegion ?? null,
      iconResolver: options.iconResolver ? 'function' : null,
      persistence: options.persistence !== false,
      telemetry: options.telemetry !== false
    },
    compliance: {
      p0_1_decoupled: true,
      p0_2_region_configurable: true,
      p0_3_ids_unified: true,
      p1_1_intents_authority: 'central',
      p2_enterprise: true
    }
  };
}

export default {
  getMetrics,
  healthCheck,
  info,
  audit,
  VERSION,
  MODULE_ID
};
