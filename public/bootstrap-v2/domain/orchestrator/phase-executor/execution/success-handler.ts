// Success Handler
// @version 3.1.1-CONTRACTS
// @changelog v3.1.1-CONTRACTS: Dependency Contract formalizado
//
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v3.1.1)
// ═══════════════════════════════════════════════════════════════
// IMPORTS: ORCHESTRATOR_STATES, ORCHESTRATOR_EVENTS from ../../constants.js
// RECEIVES (via createSuccessHandler options):
//   options.helpers, phaseMetrics, phaseResults
// PROVIDES: handle() — record successful phase execution
// WINDOW ACCESS: None
// ═══════════════════════════════════════════════════════════════
'use strict';

import { ORCHESTRATOR_STATES, ORCHESTRATOR_EVENTS } from '../../constants.js';

export const VERSION = '1.0.0-P4-ENTERPRISE';
export const MODULE_ID = 'bootstrap-v2.domain.orchestrator.phase-executor.execution.success-handler';

interface SuccessHandlerOptions {
  helpers: Record<string, Function>;
  phaseMetrics: Record<string, Function>;
  phaseResults: Record<string, unknown>;
}

interface SuccessContext {
  phaseId: string;
  phaseStart: number;
  result: unknown;
  critical: boolean;
  memoryStart: Record<string, unknown> | null;
  memoryEnd: Record<string, unknown> | null;
  bootContext: { setPhaseResult: (phaseId: string, result: Record<string, unknown>) => void } | null;
  setState: (state: string) => void;
}

export function createSuccessHandler(options: SuccessHandlerOptions) {
  const helpers = options.helpers;
  const phaseMetrics = options.phaseMetrics;
  const phaseResults = options.phaseResults;

  return {
    handle: function(context: SuccessContext) {
      const phaseId = context.phaseId;
      const phaseStart = context.phaseStart;
      const result = context.result;
      const critical = context.critical;
      const memoryStart = context.memoryStart;
      const memoryEnd = context.memoryEnd;
      const bootContext = context.bootContext;
      const setState = context.setState;

      const phaseTime = phaseMetrics.recordPhase(phaseId, phaseStart, 'success', result, critical, memoryStart, memoryEnd);

      phaseResults[phaseId] = { status: 'success', result: result, time: phaseTime };

      if (bootContext) {
        bootContext.setPhaseResult(phaseId, {
          success: true,
          recovered: false,
          degraded: false,
          time: phaseTime,
          memory: phaseMetrics.getPhaseMemory(phaseId)
        });
      }

      setState(ORCHESTRATOR_STATES.PHASE_COMPLETE);

      helpers.log('info', 'Phase ' + phaseId + ' complete', {
        time: phaseTime,
        memoryDelta: phaseMetrics.getPhaseMemory(phaseId) ? phaseMetrics.getPhaseMemory(phaseId).delta : null
      });
      
      helpers.emit(ORCHESTRATOR_EVENTS.PHASE_COMPLETE, { phaseId: phaseId, result: result, time: phaseTime });
      helpers.track('phase-complete', { phaseId: phaseId, time: phaseTime });

      return { success: true, result: result, time: phaseTime };
    }
  };
}

export default { createSuccessHandler };
