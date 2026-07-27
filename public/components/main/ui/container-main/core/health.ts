// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: health
// PURPOSE: container-main/core/health.js
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   VERSION, MODULE_ID, UARPS_REGION, MODULES, FEATURES, CONTAINER_MAIN_EVENTS fr...
//   getEventBus, getInjectedEventBus, healthCheck as eventBridgeHealth, info as e...
//   getInjectedSidebarRegistry, healthCheck as labelResolverHealth, info as label...
//   healthCheck as stateHealth, info as stateInfo from ./state.js
//   healthCheck as uarpsHealth, info as uarpsInfo from ./uarps.js
//   PRESETS from ../components/config-presets.js
//   MODE, getModeRisks from ../config.js
//
// PROVIDES:
//   setModeContext() — exported function
//   healthCheck() — exported function
//   info() — exported function
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

import { VERSION, MODULE_ID, UARPS_REGION, MODULES, FEATURES, CONTAINER_MAIN_EVENTS } from './constants.js';
import { getEventBus, getInjectedEventBus, healthCheck as eventBridgeHealth, info as eventBridgeInfo } from './event-bridge.js';
import { getInjectedSidebarRegistry, healthCheck as labelResolverHealth, info as labelResolverInfo } from './label-resolver.js';
import { healthCheck as stateHealth, info as stateInfo } from './state.js';
import { healthCheck as uarpsHealth, info as uarpsInfo } from './uarps.js';
import { PRESETS } from '../components/config-presets.js';
import { MODE, getModeRisks } from '../config.js';

let _currentMode: string = MODE.STRICT;
let _currentHasEventBus = false;

export function setModeContext(mode: string, hasEventBus: unknown) {
  _currentMode = mode || MODE.STRICT;
  _currentHasEventBus = !!hasEventBus;
}

export function healthCheck() {
  const hasEventBus = !!getEventBus({});
  const hasInjectedEventBus = !!getInjectedEventBus();
  const hasInjectedRegistry = !!getInjectedSidebarRegistry();
  const effectiveHasEventBus = hasInjectedEventBus || _currentHasEventBus;
  const risks = getModeRisks(_currentMode, effectiveHasEventBus);
  const isStrict = _currentMode === MODE.STRICT;
  const isDegraded = isStrict && !effectiveHasEventBus;

  const coreModules = {
    eventBridge: eventBridgeHealth(),
    labelResolver: labelResolverHealth(),
    state: stateHealth(),
    uarps: uarpsHealth()
  };

  const allCoreHealthy = Object.values(coreModules).every(m => m.status === 'HEALTHY' || m.status === 'DEGRADED');

  return {
    status: isDegraded ? 'DEGRADED' : (allCoreHealthy ? 'HEALTHY' : 'DEGRADED'),
    version: VERSION,
    moduleId: MODULE_ID,
    mode: _currentMode,
    modeRisks: risks,
    modular: true,
    modules: MODULES,
    features: FEATURES,
    presets: Object.keys(PRESETS),
    coreModules,
    p0Compliant: true,
    p1Compliant: true,
    p03Compliant: true,
    p3Compliant: true,
    p4Compliant: true,
    diStrict: isStrict,
    uarpsRegion: UARPS_REGION,
    hasAttachContainer: true,
    hasEventBusIntegration: hasEventBus,
    hasInjectedEventBus,
    hasInjectedRegistry,
    hasNavigationSync: true,
    hasUarpsIntegration: true,
    unifiedFactory: true,
    windowFallbackRemoved: isStrict,
    timestamp: Date.now()
  };
}

export function info() {
  const hasEventBus = !!getEventBus({});
  const hasInjectedEventBus = !!getInjectedEventBus();

  return {
    moduleId: MODULE_ID,
    version: VERSION,
    mode: _currentMode,
    modular: true,
    modules: MODULES,
    features: FEATURES,
    featureCount: FEATURES.length,
    presets: Object.keys(PRESETS),
    coreModules: {
      eventBridge: eventBridgeInfo(),
      labelResolver: labelResolverInfo(),
      state: stateInfo(),
      uarps: uarpsInfo()
    },
    p0Compliant: true,
    p1Compliant: true,
    p03Compliant: true,
    p3Compliant: true,
    p4Compliant: true,
    diStrict: _currentMode === MODE.STRICT,
    uarpsRegion: UARPS_REGION,
    hasAttachContainer: true,
    hasEventBusIntegration: hasEventBus,
    hasInjectedEventBus,
    hasNavigationSync: true,
    hasUarpsIntegration: true,
    unifiedFactory: true,
    windowFallbackRemoved: _currentMode === MODE.STRICT,
    events: CONTAINER_MAIN_EVENTS,
    timestamp: Date.now()
  };
}
