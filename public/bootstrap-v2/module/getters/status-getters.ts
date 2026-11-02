// Status Getters
// @version 2.6.0-MODULAR
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v2.6.0)
// ═══════════════════════════════════════════════════════════════
// IMPORTS: getBootLoopStatus from boot-loop/index.js, getSingletonState from singleton/index.js
// PROVIDES: createStatusGetters(context)
// BROWSER-APIS: None
'use strict';

import { getBootLoopStatus } from '../boot-loop/index.js';
import { getSingletonState } from '../singleton/index.js';

export const VERSION = '1.0.0-P4-ENTERPRISE';
export const MODULE_ID = 'bootstrap-v2.module.getters.status-getters';

export function createStatusGetters(context: { globalTimeout: { getStatus: () => Record<string, unknown> } | null }) {
  const globalTimeout = context.globalTimeout;
  
  return {
    getBootLoopStatus: function() {
      return getBootLoopStatus();
    },
    
    getGlobalTimeoutStatus: function() {
      return globalTimeout ? globalTimeout.getStatus() : null;
    },
    
    getSingletonState: function() {
      return getSingletonState();
    }
  };
}

export default { createStatusGetters };
