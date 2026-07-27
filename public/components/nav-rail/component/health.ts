// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (5.1.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: navrail-component-health
// PURPOSE: NavRail Component - Health
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   MODULE_ID from ../core/constants.js
//   NavRailRegistry from ../registry/index.js
//   NavRailRender from ../ui/render.js
//   NavRailEvents from ../core/events.js
//   NavRailLifecycle from ../core/lifecycle.js
//   NavRailTracker from ../telemetry/tracker.js
//   NavRailBehaviors from ../ui/behaviors.js
//   NavRailComponentMounter from ../core/component-mounter.js
//   NavRailFeatureLoader from ../core/feature-loader.js
//   CircuitBreaker from ../core/circuit-breaker.js
//   RecoveryManager from ../core/recovery-manager.js
//   getPort, isPortsInitialized from ../ports.js
//
// PROVIDES:
//   healthCheck() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): (see init function if present)
//
// EMITS (eventos):
//   (none)
//
// LISTENS (eventos):
//   (none)
//
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { MODULE_ID } from '../core/constants.js';
import { NavRailRegistry } from '../registry/index.js';
import { NavRailRender } from '../ui/render.js';
import { NavRailEvents } from '../core/events.js';
import { NavRailLifecycle } from '../core/lifecycle.js';
import { NavRailTracker } from '../telemetry/tracker.js';
import { NavRailBehaviors } from '../ui/behaviors.js';
import { NavRailComponentMounter } from '../core/component-mounter.js';
import { NavRailFeatureLoader } from '../core/feature-loader.js';
import { CircuitBreaker } from '../core/circuit-breaker.js';
import { RecoveryManager } from '../core/recovery-manager.js';
import { getPort, isPortsInitialized } from '../ports.js';

const NAVRAIL_VERSION = '5.1.0';

export function healthCheck(component: Record<string, unknown>) {
  const logger = getPort('logger');
  const componentState = NavRailComponentMounter.getComponentState();
  const featureHealth = NavRailFeatureLoader.healthCheck();

  const checks = {
    initialized: component._initialized,
    componentsMounted: component._componentsMounted,
    featuresMounted: component._featuresMounted,
    hasRoot: !!component._root,
    hasConfig: !!component._config,
    registryLoaded: NavRailRegistry.isLoaded(),
    loggerAvailable: !!logger,
    notInDegradedMode: !component._degradedMode,
    noErrorState: !component._errorState,
    circuitsClosed: Object.keys(CircuitBreaker._failures).every(s => !CircuitBreaker.isOpen(s)),
    notRecovering: !RecoveryManager._isRecovering,
    noFailedComponents: componentState.failed.length === 0,
    featuresHealthy: featureHealth.status !== 'UNHEALTHY'
  };

  const score = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;

  let status = 'HEALTHY';
  if (component._degradedMode) status = 'DEGRADED';
  else if (component._errorState) status = 'ERROR';
  else if (componentState.failed.length > 0) status = 'DEGRADED';
  else if (score < total) status = score >= total - 2 ? 'DEGRADED' : 'UNHEALTHY';

  return {
    status,
    score: `${score}/${total}`,
    checks,
    degradedMode: component._degradedMode,
    errorState: component._errorState,
    registrySource: component._registrySource,
    offlineMode: NavRailRegistry.isOfflineMode(),
    lifecycle: NavRailLifecycle.info(),
    registry: NavRailRegistry.healthCheck(),
    events: NavRailEvents.healthCheck(),
    components: NavRailComponentMounter.healthCheck(),
    features: featureHealth,
    failedComponents: componentState.failed,
    metrics: NavRailTracker.getMetrics(),
    mode: NavRailRender.getCurrentMode(),
    behaviors: NavRailBehaviors.healthCheck(),
    circuitBreaker: CircuitBreaker.getStatus(),
    recovery: RecoveryManager.getStatus(),
    version: NAVRAIL_VERSION,
    moduleId: MODULE_ID,
    portsInitialized: isPortsInitialized(),
    timestamp: Date.now()
  };
}

export function info(component: Record<string, unknown>) {
  return {
    moduleId: MODULE_ID,
    version: NAVRAIL_VERSION,
    initialized: component._initialized,
    componentsMounted: component._componentsMounted,
    featuresMounted: component._featuresMounted,
    registrySource: component._registrySource,
    degradedMode: component._degradedMode,
    offlineMode: NavRailRegistry.isOfflineMode(),
    errorState: component._errorState,
    config: component._config,
    root: (component._root as HTMLElement)?.tagName || null,
    events: NavRailEvents.info(),
    components: NavRailComponentMounter.info(),
    features: NavRailFeatureLoader.info(),
    registry: NavRailRegistry.info(),
    behaviors: NavRailBehaviors.info(),
    circuitBreaker: CircuitBreaker.getStatus(),
    recovery: RecoveryManager.getStatus(),
    capabilities: [
      'init', 'reinit', 'refresh', 'recover', 'destroy',
      'degradedMode', 'retryComponent', 'retryFailed',
      'offlineMode', 'lazyLoading',
      'loadFeature', 'registerFeature', 'registerFeatures'
    ],
    portsInitialized: isPortsInitialized()
  };
}
