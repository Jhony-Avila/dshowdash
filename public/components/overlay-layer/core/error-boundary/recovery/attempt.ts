// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (UNKNOWN)
// ═══════════════════════════════════════════════════════════════
// MODULE: UNKNOWN
// PURPOSE: Error Boundary - Recovery Attempt
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   SEVERITY from ../constants.js
//   config, state, getRecoveryStrategies from ../state.js
//   log from ../helpers/logger.js
//
// PROVIDES:
//   attemptRecovery() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { SEVERITY } from '../constants.js';
import { config, state, getRecoveryStrategies } from '../state.js';
import { log } from '../helpers/logger.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '4.0.0-P4-ENTERPRISE';
export const MODULE_ID = 'overlay-layer.core.error-boundary.recovery.attempt';

export async function attemptRecovery(errorRecord: DynObj) {
  const strategies = getRecoveryStrategies();
  const strategy = (strategies as DynObj)[errorRecord.type];
  if (!strategy) return false;
  
  for (let attempt = 1; attempt <= config.recoverAttempts; attempt++) {
    errorRecord.recoveryAttempts = attempt;
    
    try {
      await new Promise(r => setTimeout(r, config.recoverDelay * attempt));
      
      const result = await strategy(errorRecord);
      
      if (result?.recovered) {
        errorRecord.recovered = true;
        state.recoveredErrors++;
        log('info', `Error recovered after ${attempt} attempts:`, errorRecord.id);
        return true;
      }
    } catch (e: any) {
      log('warn', `Recovery attempt ${attempt} failed:`, e.message);
    }
  }
  
  if (errorRecord.severity === SEVERITY.HIGH) {
    state.fatalErrors++;
  }
  
  return false;
}
