// State Snapshot Manager
// @version 1.2.1-CONTRACTS
// @changelog v1.2.1-CONTRACTS: Dependency Contract formalizado
// @changelog v1.2.0-MODULAR: Versão inicial
//
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.2.1)
// ═══════════════════════════════════════════════════════════════
// IMPORTS: None (self-contained)
// RECEIVES (via factory context):
//   context.getBootContext, context.getMode, context.isInitialized,
//   context.getInitTimestamp, context.getLastModeChange,
//   context.capabilityManager, context.healthManager,
//   context.getSyncEnabled, context.getLastSyncedState,
//   context.getCircuitBreakerEnabled, context.getCircuitBreakerStatus
// PROVIDES: createStateSnapshotManager() factory returning:
//   getState(), getSnapshot()
// WINDOW ACCESS: None (no window.* globals)
// ═══════════════════════════════════════════════════════════════
'use strict';

var VERSION = '1.0.0-P4-ENTERPRISE';
var MODULE_ID = 'bootstrap-v2.kernel.module.state.snapshot';

interface StateSnapshotContext {
  getBootContext: () => { getSnapshot?: () => Record<string, unknown>; [key: string]: unknown } | null;
  getMode: () => string;
  isInitialized: () => boolean;
  getInitTimestamp: () => number | null;
  getLastModeChange: () => number | null;
  capabilityManager: { getAll: () => Record<string, unknown>; getEnabled: () => string[] };
  healthManager: { getHealth: () => Record<string, unknown> | null };
  getSyncEnabled: () => boolean;
  getLastSyncedState: () => string | null;
  getCircuitBreakerEnabled: () => boolean;
  getCircuitBreakerStatus: () => Record<string, unknown>;
}

export function createStateSnapshotManager(context: StateSnapshotContext) {
  var getBootContext = context.getBootContext;
  var getMode = context.getMode;
  var isInitialized = context.isInitialized;
  var getInitTimestamp = context.getInitTimestamp;
  var getLastModeChange = context.getLastModeChange;
  var capabilityManager = context.capabilityManager;
  var healthManager = context.healthManager;
  var getSyncEnabled = context.getSyncEnabled;
  var getLastSyncedState = context.getLastSyncedState;
  var getCircuitBreakerEnabled = context.getCircuitBreakerEnabled;
  var getCircuitBreakerStatus = context.getCircuitBreakerStatus;

  return {
    getState: function() {
      var bootContext = getBootContext();
      if (bootContext && bootContext.getSnapshot) {
        return bootContext.getSnapshot();
      }
      return null;
    },

    getSnapshot: function() {
      return {
        mode: getMode(),
        initialized: isInitialized(),
        initTimestamp: getInitTimestamp(),
        lastModeChange: getLastModeChange(),
        capabilities: capabilityManager.getAll(),
        enabledCapabilities: capabilityManager.getEnabled(),
        health: healthManager.getHealth(),
        bootState: this.getState(),
        syncEnabled: getSyncEnabled(),
        lastSyncedState: getLastSyncedState(),
        circuitBreakerEnabled: getCircuitBreakerEnabled(),
        circuitBreakerStatus: getCircuitBreakerStatus(),
        timestamp: Date.now()
      };
    }
  };
}

export default { createStateSnapshotManager };
