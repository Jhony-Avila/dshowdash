import { CAPABILITY_STATUS, DENIAL_REASONS, CAPABILITY_POLICIES } from "./constants.js";
import { PLATFORM_CAPABILITIES, createPlatformConfig } from "./platform-config.js";
import { createCapabilityStore } from "./capability-store.js";
import { createPolicyValidator } from "./policy-validator.js";
import { createRequestHandler } from "./request-handler.js";
import { createQueryMethods } from "./query-methods.js";
import { createStatsReporter, VERSION, MODULE_ID } from "./stats-reporter.js";
import { CAPABILITY_EVENT_NAMES } from "/core/runtime/constants/event-names.js";
import { CAPABILITY_STATUS as CAPABILITY_STATUS2, DENIAL_REASONS as DENIAL_REASONS2, CAPABILITY_POLICIES as CAPABILITY_POLICIES2 } from "./constants.js";
import { PLATFORM_CAPABILITIES as PLATFORM_CAPABILITIES2 } from "./platform-config.js";
function createCapabilityManager(options = {}) {
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
    emit(event, data) {
      if (eventBus?.emit) {
        eventBus.emit(event, { ...data, source: MODULE_ID, timestamp: Date.now() });
      }
    }
  };
  const store = createCapabilityStore();
  const validator = createPolicyValidator({
    policy,
    whitelist,
    blacklist,
    platformConfig: _platformConfig
  });
  const requestHandler = createRequestHandler({
    store,
    validator,
    emitter,
    onGrant,
    onDeny,
    onRevoke,
    onRequest
  });
  const queryMethods = createQueryMethods({ store, requestHandler });
  const statsReporter = createStatsReporter({
    store,
    validator,
    platformConfig: _platformConfig,
    isDestroyed: () => _destroyed
  });
  const manager = {
    registerPanel(panelId, declaredCapabilities = []) {
      if (_destroyed) return false;
      const record = store.getPanelRecord(panelId);
      declaredCapabilities.forEach((cap) => {
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
    unregisterPanel(panelId) {
      const panels = store.getAllPanels();
      const record = panels.get(panelId);
      if (record) {
        record.forEach((state, cap) => {
          if (state.status === CAPABILITY_STATUS.GRANTED) {
            store.decrementCapabilityCount(cap);
          }
        });
        store.deletePanelRecord(panelId);
        emitter.emit(CAPABILITY_EVENT_NAMES.PANEL_UNREGISTERED, { panelId });
      }
      return true;
    },
    request(panelId, capability) {
      if (_destroyed) return { status: CAPABILITY_STATUS.DENIED, reason: "manager-destroyed" };
      return requestHandler.request(panelId, capability);
    },
    requestMultiple(panelId, capabilities) {
      if (_destroyed) return {};
      return requestHandler.requestMultiple(panelId, capabilities);
    },
    revoke(panelId, capability, reason = DENIAL_REASONS.MANUAL) {
      if (_destroyed) return false;
      return requestHandler.revoke(panelId, capability, reason);
    },
    revokeAll(panelId, reason = DENIAL_REASONS.MANUAL) {
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
    configurePlatformCapability(capability, config) {
      _platformConfig[capability] = { ..._platformConfig[capability], ...config };
      emitter.emit(CAPABILITY_EVENT_NAMES.PLATFORM_CONFIG_CHANGED, { capability, config });
    },
    setPlatformCapabilityAvailable(capability, available) {
      this.configurePlatformCapability(capability, { available });
      if (!available) {
        store.getAllPanels().forEach((record, panelId) => {
          if (record.get(capability)?.status === CAPABILITY_STATUS.GRANTED) {
            this.revoke(panelId, capability, DENIAL_REASONS.NOT_AVAILABLE);
          }
        });
      }
    },
    getPlatformConfig() {
      return { ..._platformConfig };
    },
    getStats: statsReporter.getStats.bind(statsReporter),
    getHistory: statsReporter.getHistory.bind(statsReporter),
    healthCheck: statsReporter.healthCheck.bind(statsReporter),
    info: statsReporter.info.bind(statsReporter),
    destroy() {
      _destroyed = true;
      store.getAllPanels().forEach((record, panelId) => {
        requestHandler.revokeAll(panelId, "manager-destroyed");
      });
      store.clear();
      emitter.emit(CAPABILITY_EVENT_NAMES.MANAGER_DESTROYED, {});
    }
  };
  return manager;
}
let _globalManager = null;
function getCapabilityManager(options) {
  if (!_globalManager) {
    _globalManager = createCapabilityManager(options);
  }
  return _globalManager;
}
function resetGlobalManager() {
  if (_globalManager) {
    _globalManager.destroy();
    _globalManager = null;
  }
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, exports: ["createCapabilityManager", "getCapabilityManager"], statuses: Object.keys(CAPABILITY_STATUS), policies: Object.keys(CAPABILITY_POLICIES), modular: true };
}
function healthCheck() {
  return { status: "HEALTHY", version: VERSION, moduleId: MODULE_ID, hasGlobalManager: !!_globalManager, modular: true };
}
var capability_manager_default = {
  VERSION,
  MODULE_ID,
  CAPABILITY_STATUS,
  DENIAL_REASONS,
  CAPABILITY_POLICIES,
  PLATFORM_CAPABILITIES,
  createCapabilityManager,
  getCapabilityManager,
  resetGlobalManager,
  info,
  healthCheck
};
export {
  CAPABILITY_POLICIES2 as CAPABILITY_POLICIES,
  CAPABILITY_STATUS2 as CAPABILITY_STATUS,
  DENIAL_REASONS2 as DENIAL_REASONS,
  MODULE_ID,
  PLATFORM_CAPABILITIES2 as PLATFORM_CAPABILITIES,
  VERSION,
  createCapabilityManager,
  capability_manager_default as default,
  getCapabilityManager,
  healthCheck,
  info,
  resetGlobalManager
};
