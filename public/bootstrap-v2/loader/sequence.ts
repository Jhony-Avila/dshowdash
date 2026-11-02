// Bootstrap-V2 Loader - Boot Sequence
// @version 6.2.3-CONTRACTS
// @changelog v6.2.3-CONTRACTS: Dependency Contract formalizado
// @changelog v6.2.2-EVENTS-FORMALIZED - Migração string solta → constante BOOT_EVENTS.BOOT_LOOP_DETECTED
// @changelog v6.2.1 - Modular boot sequence
//
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v6.2.3)
// ═══════════════════════════════════════════════════════════════
// IMPORTS:
//   VERSION from ./constants.js
//   getPreBootResult, setBootResult from ./state.js
//   log from ./helpers/logger.js
//   emitBootEvent from ./helpers/events.js
//   executePreBoot, executeBootstrap, executePostBoot from ./stages/index.js
//   BOOT_EVENTS from /core/runtime/events/index.js
//   OpenTelemetryAdapter, BootCancellation, DegradationNotifier
// PROVIDES: executeFullBootSequence()
// WINDOW ACCESS: None
// ═══════════════════════════════════════════════════════════════
'use strict';

import { VERSION } from './constants.js';
import { getPreBootResult, setBootResult } from './state.js';
import { log } from './helpers/logger.js';
import { emitBootEvent } from './helpers/events.js';
import { executePreBoot, executeBootstrap, executePostBoot } from './stages/index.js';

import { BOOT_EVENTS } from '/core/runtime/events/catalog/boot.events.js';
import * as OpenTelemetryAdapter from '../adapters/OpenTelemetryAdapter.js';
import * as BootCancellation from '../domain/boot-cancellation.js';
import * as DegradationNotifier from '../domain/degradation-notifier.js';

export const MODULE_ID = 'bootstrap-v2.loader.sequence';

export function executeFullBootSequence() {
  const fullStartTime = performance.now();
  

  // @ts-expect-error TS migration - TS2554
  OpenTelemetryAdapter.startTrace('full-boot-sequence');
  
  log('info', 'Full Boot Sequence starting (Complete Stack)', { version: VERSION });
  
  return executePreBoot()
    .then(function(preBootResult) {
      if (BootCancellation.isCancelled()) {
        return { success: false, cancelled: true, reason: BootCancellation.getState().reason };
      }
      return executeBootstrap();
    })
    .then(function(bootResult) {
      setBootResult(bootResult);
      
      OpenTelemetryAdapter.endTrace();
      
      if (bootResult.cancelled) {
        log('info', 'Boot was cancelled', bootResult);
        return bootResult;
      }
      
      if (bootResult.bootLoopDetected) {
        log('error', 'Boot blocked by loop detection', bootResult);
        emitBootEvent(BOOT_EVENTS.BOOT_LOOP_DETECTED, bootResult);
        return bootResult;
      }
      
      if (!bootResult.success) {
        log('error', 'Boot failed', { errors: bootResult.errors || bootResult.error });
        throw new Error(bootResult.error || 'Boot failed');
      }
      
      const elapsed = Math.round(performance.now() - fullStartTime);
      log('info', 'Full Boot Sequence complete (Complete Stack)', {
        totalTime: elapsed,
        phases: bootResult.phases ? bootResult.phases.length : 0,
        health: bootResult.health,
        sprints: '1-9',
        improvements: 26
      });
      
      return executePostBoot(bootResult);
    })
    .then(function(bootResult) {
      const elapsed = Math.round(performance.now() - fullStartTime);
      
      emitBootEvent(BOOT_EVENTS.BOOTSTRAP_V2_COMPLETE, { 
        result: bootResult, 
        elapsed: elapsed,
        preBootResult: getPreBootResult(),
        complete: {
          sprints: 9,
          improvements: 26,
          version: VERSION
        }
      });
      
      return bootResult;
    });
}

export { DegradationNotifier };
