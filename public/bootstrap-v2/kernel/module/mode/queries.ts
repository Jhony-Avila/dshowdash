// Mode Queries
// @version 1.2.1-CONTRACTS
// @changelog v1.2.1-CONTRACTS: Dependency Contract formalizado
//
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.2.1)
// ═══════════════════════════════════════════════════════════════
// IMPORTS: KERNEL_MODES from ../../constants.js
// RECEIVES (via createModeQueries context):
//   context.getMode, context.isInitialized
// PROVIDES: isReady(), isDegraded(), isNormal(), isFailed(), isInRecovery(), isInMaintenance()
// WINDOW ACCESS: None
// ═══════════════════════════════════════════════════════════════
'use strict';

import { KERNEL_MODES } from '../../constants.js';

export const VERSION = '1.0.0-P4-ENTERPRISE';
export const MODULE_ID = 'bootstrap-v2.kernel.module.mode.queries';

interface ModeQueriesContext {
  getMode: () => string;
  isInitialized: () => boolean;
}

export function createModeQueries(context: ModeQueriesContext) {
  const getMode = context.getMode;
  const isInitialized = context.isInitialized;

  return {
    isReady: function() {
      const mode = getMode();
      return isInitialized() && (mode === KERNEL_MODES.NORMAL || mode === KERNEL_MODES.DEGRADED);
    },

    isDegraded: function() {
      return getMode() === KERNEL_MODES.DEGRADED;
    },

    isNormal: function() {
      return getMode() === KERNEL_MODES.NORMAL;
    },

    isFailed: function() {
      return getMode() === KERNEL_MODES.FAILED;
    },

    isInRecovery: function() {
      return getMode() === KERNEL_MODES.RECOVERY;
    },

    isInMaintenance: function() {
      return getMode() === KERNEL_MODES.MAINTENANCE;
    }
  };
}

export default { createModeQueries };
