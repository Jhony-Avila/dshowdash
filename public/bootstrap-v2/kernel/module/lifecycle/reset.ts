// Kernel Reset
// @version 1.2.1-CONTRACTS
// @changelog v1.2.1-CONTRACTS: Dependency Contract formalizado
//
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.2.1)
// ═══════════════════════════════════════════════════════════════
// IMPORTS: KERNEL_MODES from ../../constants.js
// RECEIVES (via createResetter context):
//   context.log, cleanups, listeners, capabilityManager,
//   context.modeHistoryManager, resetState
// PROVIDES: cleanupAll(), reset()
// WINDOW ACCESS: None
// ═══════════════════════════════════════════════════════════════
'use strict';

import { KERNEL_MODES } from '../../constants.js';

var VERSION = '1.0.0-P4-ENTERPRISE';
var MODULE_ID = 'bootstrap-v2.kernel.module.lifecycle.reset';

interface ResetterContext {
  log: (level: string, message: string, data?: Record<string, unknown>) => void;
  cleanups: Array<Function>;
  listeners: unknown[];
  capabilityManager: { reset: () => void };
  modeHistoryManager: { reset: () => void };
  resetState: (state: Record<string, unknown>) => void;
}

export function createResetter(context: ResetterContext) {
  var log = context.log;
  var cleanups = context.cleanups;
  var listeners = context.listeners;
  var capabilityManager = context.capabilityManager;
  var modeHistoryManager = context.modeHistoryManager;
  var resetState = context.resetState;

  return {
    cleanupAll: function() {
      for (var i = 0; i < cleanups.length; i++) {
        try {
          if (typeof cleanups[i] === 'function') {
            cleanups[i]();
          }
        } catch (e: any) {
          log('warn', 'Cleanup failed', { index: i, error: e.message });
        }
      }
      cleanups.length = 0;
    },

    reset: function() {
      this.cleanupAll();

      capabilityManager.reset();
      modeHistoryManager.reset();
      listeners.length = 0;

      resetState({
        mode: KERNEL_MODES.INITIALIZING,
        initialized: false,
        initTimestamp: null,
        lastModeChange: null,
        syncEnabled: false,
        lastSyncedState: null,
        circuitBreakerEnabled: false,
        bootContext: null,
        healthAggregator: null,
        orchestrator: null,
        stateMachine: null
      });

      log('info', 'Kernel reset (with cleanup)');
    }
  };
}

export default { createResetter };
