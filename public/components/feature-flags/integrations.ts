// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.4.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.feature-flags.integrations
// PURPOSE: Global state and orchestrator integrations for feature flags
// ───────────────────────────────────────────────────────────────
// @contract SETUP_GLOBAL_STATE_INTEGRATION - setupGlobalStateIntegration(fetchFn)
// @contract CLEANUP_GLOBAL_STATE_INTEGRATION - cleanupGlobalStateIntegration()
// @contract SETUP_ORCHESTRATOR_INTEGRATION - setupOrchestratorIntegration()
// @contract CLEANUP_ORCHESTRATOR_INTEGRATION - cleanupOrchestratorIntegration()
// @contract GET_ORCHESTRATOR_CLEANUPS - getOrchestratorCleanups() returns cleanups
// @contract GET_GLOBAL_STATE_CLEANUPS - getGlobalStateCleanups() returns cleanups
// @contract HEALTH - info() for observability
// ───────────────────────────────────────────────────────────────
// IMPORTS: getPort from ./ports.js
// IMPORTS: featureFlagsStore from ./state/store.js
// IMPORTS: FlagRegistry from ./core/registry.js
// IMPORTS: trackFlagEvent from ./telemetry/tracker.js
// IMPORTS: FEATURE_FLAGS_EVENTS, ORCHESTRATOR_EVENTS from /core/runtime/events/index.js
// PROVIDES: setupGlobalStateIntegration, cleanupGlobalStateIntegration,
//           setupOrchestratorIntegration, cleanupOrchestratorIntegration,
//           getOrchestratorCleanups, getGlobalStateCleanups, info,
//           VERSION, MODULE_ID
// @changelog v1.4.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v1.3.0-P18EC: Corrigido import FlagRegistry e off() com handler
// ═══════════════════════════════════════════════════════════════
'use strict';

import { getPort } from './ports.js';
import { featureFlagsStore } from './state/store.js';
import FlagRegistry from './core/registry.js';
import { trackFlagEvent } from './telemetry/tracker.js';
import { FEATURE_FLAGS_EVENTS } from '/core/runtime/events/catalog/feature-flags.events.js';
import { ORCHESTRATOR_EVENTS } from '/core/runtime/events/catalog/orchestrator.events.js';

export const VERSION = '1.4.0-P2-ENTERPRISE';
export const MODULE_ID = 'components.feature-flags.integrations';

let orchestratorCleanups: (() => void)[] = [];
let globalStateCleanups: (() => void)[] = [];
let _presetHandler: ((data: Record<string, unknown>) => void) | null = null;

export function getOrchestratorCleanups() {
  return orchestratorCleanups;
}

export function getGlobalStateCleanups() {
  return globalStateCleanups;
}

export function setupGlobalStateIntegration(fetchFlagsFromServer: () => void): void {
  const globalState = getPort('globalState');
  if (!globalState) return;

  // @ts-expect-error strict migration — TS2722, TS18048
  const unsubscribeFlags = globalState.subscribe((featureFlags: Record<string, unknown>) => {
    if (featureFlags && typeof featureFlags === 'object') {
      for (const [name, value] of Object.entries(featureFlags)) {
        if (value) FlagRegistry.enable(name);
        else FlagRegistry.disable(name);
      }
      trackFlagEvent('flags.global-state.synced', {
        count: Object.keys(featureFlags).length
      });
    }
  }, 'flags.featureFlags');

  globalStateCleanups.push(unsubscribeFlags as unknown as () => void);

  // @ts-expect-error strict migration — TS2722, TS18048
  const unsubscribeSession = globalState.subscribe((session: Record<string, unknown> & { isAuthenticated?: boolean }) => {
    if (session?.isAuthenticated) {
      fetchFlagsFromServer();
    }
  }, 'session');

  globalStateCleanups.push(unsubscribeSession as unknown as () => void);
  trackFlagEvent('flags.global-state.connected');
}

export function cleanupGlobalStateIntegration() {
  globalStateCleanups.forEach((cleanup: () => void) => {
    if (typeof cleanup === 'function') cleanup();
  });
  globalStateCleanups = [];
}

export function setupOrchestratorIntegration() {
  const eventBus = getPort('eventBus');
  if (!eventBus) return;

  _presetHandler = (data: Record<string, unknown>) => {
    if (data?.flags) {
      for (const [name, value] of Object.entries(data.flags)) {
        if (value) FlagRegistry.enable(name);
        else FlagRegistry.disable(name);
      }
      trackFlagEvent('flags.orchestrator.preset-applied', { flags: data.flags });
    }
  };

  // @ts-expect-error strict migration — TS2722
  eventBus.on(ORCHESTRATOR_EVENTS.PRESET_APPLIED, _presetHandler);

  orchestratorCleanups.push(() => {
    const eb = getPort('eventBus');
    if (eb?.off && _presetHandler) {
      eb.off(ORCHESTRATOR_EVENTS.PRESET_APPLIED, _presetHandler);
    }
  });

  // @ts-expect-error strict migration — TS2345
  const unsubscribe = featureFlagsStore.subscribe((ref: { action: string; flag?: string }) => {
    const { action, flag } = ref;
    const eb = getPort('eventBus');

    if (action === 'flag-changed' && eb?.emit) {
      eb.emit(FEATURE_FLAGS_EVENTS.FLAG_CHANGED, {
        flag,
        timestamp: Date.now()
      });
    }
  });

  orchestratorCleanups.push(unsubscribe);
  trackFlagEvent('flags.orchestrator.connected');
}

export function cleanupOrchestratorIntegration() {
  orchestratorCleanups.forEach((cleanup: () => void) => {
    if (typeof cleanup === 'function') cleanup();
  });
  orchestratorCleanups = [];
  _presetHandler = null;
}

export function healthCheck() {
  const checks = {
    orchestratorConnected: orchestratorCleanups.length > 0,
    globalStateConnected: globalStateCleanups.length > 0
  };

  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;

  return {
    status: passed === total ? 'HEALTHY' : passed >= 1 ? 'DEGRADED' : 'UNHEALTHY',
    score: passed,
    maxScore: total,
    scoreDisplay: `${passed}/${total}`,
    checks,
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    orchestratorConnected: orchestratorCleanups.length > 0,
    globalStateConnected: globalStateCleanups.length > 0,
    healthCheck: healthCheck(),
    timestamp: Date.now()
  };
}

export default {
  setupGlobalStateIntegration,
  cleanupGlobalStateIntegration,
  setupOrchestratorIntegration,
  cleanupOrchestratorIntegration,
  getOrchestratorCleanups,
  getGlobalStateCleanups,
  healthCheck,
  info,
  VERSION,
  MODULE_ID
};
