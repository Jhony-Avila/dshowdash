/* ═══════════════════════════════════════════════════════════════
 * DEPENDENCY CONTRACT — capability-manager/index.js
 * @version 1.1.0-EVENT-CONSTANTS
 * @batch Batch Z (Contract #205 of 217)
 *
 * IMPORTS (EXTERNAL):
 *   ./constants.js                          → { CAPABILITY_STATUS, DENIAL_REASONS, CAPABILITY_POLICIES }
 *   ./platform-config.js                    → { PLATFORM_CAPABILITIES, createPlatformConfig }
 *   ./capability-store.js                   → { createCapabilityStore }
 *   ./policy-validator.js                   → { createPolicyValidator }
 *   ./request-handler.js                    → { createRequestHandler }
 *   ./query-methods.js                      → { createQueryMethods }
 *   ./stats-reporter.js                     → { createStatsReporter, VERSION, MODULE_ID }
 *   /core/runtime/constants/event-names.js  → { CAPABILITY_EVENT_NAMES }
 *
 * EXPORTS (PUBLIC API):
 *   VERSION, MODULE_ID, CAPABILITY_STATUS, DENIAL_REASONS, CAPABILITY_POLICIES, PLATFORM_CAPABILITIES
 *   createCapabilityManager(options) factory
 *   getCapabilityManager(options) global singleton
 *   resetGlobalManager()
 *   info(), healthCheck()
 *   default: { all exports }
 *
 * BROWSER APIs:
 *   Date.now()
 *
 * PATTERNS:
 *   Factory pattern (createCapabilityManager) with modular sub-systems
 *   Capability grant/deny/revoke lifecycle with policy validation
 *   Platform capability configuration, global singleton management
 *   Event emission via CAPABILITY_EVENT_NAMES constants
 * ═══════════════════════════════════════════════════════════════ */
// Capability Manager - Sistema de gerenciamento de capacidades
// @version 1.1.0-EVENT-CONSTANTS
// @changelog v1.1.0-EVENT-CONSTANTS - Migrado strings hardcoded para CAPABILITY_EVENT_NAMES
// @changelog v1.0.0-MODULAR - Refatorado para arquitetura modular
// @description Gerencia concessão, revogação e verificação de capacidades para painéis
'use strict';

import { CAPABILITY_STATUS, DENIAL_REASONS, CAPABILITY_POLICIES } from './constants.js';
import { PLATFORM_CAPABILITIES, createPlatformConfig } from './platform-config.js';
import { createCapabilityStore } from './capability-store.js';
import { createPolicyValidator } from './policy-validator.js';
import { createRequestHandler } from './request-handler.js';
import { createQueryMethods } from './query-methods.js';
import { createStatsReporter, VERSION, MODULE_ID } from './stats-reporter.js';
import { CAPABILITY_EVENT_NAMES } from '/core/runtime/constants/event-names.js';

export { VERSION, MODULE_ID };
export { CAPABILITY_STATUS, DENIAL_REASONS, CAPABILITY_POLICIES } from './constants.js';
export { PLATFORM_CAPABILITIES } from './platform-config.js';

export function createCapabilityManager(options: Record<string, any> = {}) {
  const {
    eventBus,
    policy = CAPABILITY_POLICIES.ON_DEMAND,
    whitelist = [],
    blacklist = [],
    onGrant,
    onDeny,
    onRevoke,
    onRequest
  } = options;

  let _destroyed = false;
  const _platformConfig = createPlatformConfig();

  const emitter = {
    emit(event: string, data: Record<string, unknown>) {
      if (eventBus?.emit) {
        eventBus.emit(event, { ...data, source: MODULE_ID, timestamp: Date.now() });
      }
    }
  };

  const store = createCapabilityStore();
  
  const validator = createPolicyValidator({
    policy, whitelist, blacklist,
    platformConfig: _platformConfig
  });

  const requestHandler = createRequestHandler({
    store, validator, emitter,
    onGrant, onDeny, onRevoke, onRequest
  });

  const queryMethods = createQueryMethods({ store, requestHandler });

  const statsReporter = createStatsReporter({
    store, validator,
    platformConfig: _platformConfig,
    isDestroyed: () => _destroyed
  });

  const manager = {
    registerPanel(panelId: string, declaredCapabilities: string[] = []) {
      if (_destroyed) return false;
      
      const record = store.getPanelRecord(panelId);
      
      declaredCapabilities.forEach((cap: string) => {
        if (!record.has(cap)) {
          record.set(cap, {
            status: CAPABILITY_STATUS.NOT_REQUESTED,
            declaredAt: Date.now(),
            grantedAt: null,
            revokedAt: null,
            denyReason: null
          });
        }
      });

      emitter.emit(CAPABILITY_EVENT_NAMES.PANEL_REGISTERED, { panelId, capabilities: declaredCapabilities });
      return true;
    },

    unregisterPanel(panelId: string) {
      const panels = store.getAllPanels();
      const record = panels.get(panelId);
      
      if (record) {
        record.forEach((state: Record<string, unknown>, cap: string) => {
          if (state.status === CAPABILITY_STATUS.GRANTED) {
            store.decrementCapabilityCount(cap);
          }
        });
        store.deletePanelRecord(panelId);
        emitter.emit(CAPABILITY_EVENT_NAMES.PANEL_UNREGISTERED, { panelId });
      }
      return true;
    },

    request(panelId: string, capability: string) {
      if (_destroyed) return { status: CAPABILITY_STATUS.DENIED, reason: 'manager-destroyed' };
      return requestHandler.request(panelId, capability);
    },

    requestMultiple(panelId: string, capabilities: string[]) {
      if (_destroyed) return {};
      return requestHandler.requestMultiple(panelId, capabilities);
    },

    revoke(panelId: string, capability: string, reason = DENIAL_REASONS.MANUAL) {
      if (_destroyed) return false;
      return requestHandler.revoke(panelId, capability, reason);
    },

    revokeAll(panelId: string, reason = DENIAL_REASONS.MANUAL) {
      if (_destroyed) return 0;
      return requestHandler.revokeAll(panelId, reason);
    },

    has: queryMethods.has.bind(queryMethods),
    hasAll: queryMethods.hasAll.bind(queryMethods),
    hasAny: queryMethods.hasAny.bind(queryMethods),
    ensure: queryMethods.ensure.bind(queryMethods),
    getStatus: queryMethods.getStatus.bind(queryMethods),
    getPanelCapabilities: queryMethods.getPanelCapabilities.bind(queryMethods),
    getGrantedCapabilities: queryMethods.getGrantedCapabilities.bind(queryMethods),
    getPanelsWithCapability: queryMethods.getPanelsWithCapability.bind(queryMethods),

    configurePlatformCapability(capability: string, config: Record<string, unknown>) {
      _platformConfig[capability] = { ..._platformConfig[capability], ...config };
      emitter.emit(CAPABILITY_EVENT_NAMES.PLATFORM_CONFIG_CHANGED, { capability, config });
    },

    setPlatformCapabilityAvailable(capability: string, available: unknown) {
      this.configurePlatformCapability(capability, { available });
      
      if (!available) {
        store.getAllPanels().forEach((record, panelId) => {
          if (record.get(capability)?.status === CAPABILITY_STATUS.GRANTED) {
            // @ts-expect-error strict migration — TS2345
            this.revoke(panelId, capability, DENIAL_REASONS.NOT_AVAILABLE);
          }
        });
      }
    },

    getPlatformConfig() { return { ..._platformConfig }; },

    getStats: statsReporter.getStats.bind(statsReporter),
    getHistory: statsReporter.getHistory.bind(statsReporter),
    healthCheck: statsReporter.healthCheck.bind(statsReporter),
    info: statsReporter.info.bind(statsReporter),

    destroy() {
      _destroyed = true;
      store.getAllPanels().forEach((record, panelId) => {

        // @ts-expect-error TS migration - TS2345
        requestHandler.revokeAll(panelId, 'manager-destroyed');
      });
      store.clear();
      emitter.emit(CAPABILITY_EVENT_NAMES.MANAGER_DESTROYED, {});
    }
  };

  return manager;
}

let _globalManager: ReturnType<typeof createCapabilityManager> | null = null;

export function getCapabilityManager(options: Record<string, unknown>) {
  if (!_globalManager) { _globalManager = createCapabilityManager(options); }
  return _globalManager;
}

export function resetGlobalManager() {
  if (_globalManager) { _globalManager.destroy(); _globalManager = null; }
}

export function info() {
  return { moduleId: MODULE_ID, version: VERSION, exports: ['createCapabilityManager', 'getCapabilityManager'], statuses: Object.keys(CAPABILITY_STATUS), policies: Object.keys(CAPABILITY_POLICIES), modular: true };
}

export function healthCheck() {
  return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID, hasGlobalManager: !!_globalManager, modular: true };
}

export default {
  VERSION, MODULE_ID, CAPABILITY_STATUS, DENIAL_REASONS, CAPABILITY_POLICIES, PLATFORM_CAPABILITIES,
  createCapabilityManager, getCapabilityManager, resetGlobalManager, info, healthCheck
};
