// Skip Handler (Circuit Breaker OPEN)
// @version 3.2.0-DECISION-CONTRACT
// @changelog v3.2.0-DECISION-CONTRACT: Usa resolveSkipDecision do decision-contract.js
// @changelog v3.1.1-CONTRACTS: Dependency Contract formalizado
//
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v3.2.0)
// ═══════════════════════════════════════════════════════════════
// IMPORTS:
//   ORCHESTRATOR_EVENTS from ../../constants.js
//   resolveSkipDecision, DECISION_OUTCOMES from ../../../../contracts/decision-contract.js
//
// RECEIVES (via createSkipHandler options):
//   options.helpers, phaseMetrics, phaseResults, degradationHandler
//
// PROVIDES: handle() — skip phase when circuit breaker is open
// WINDOW ACCESS: None
// ═══════════════════════════════════════════════════════════════
'use strict';

import { ORCHESTRATOR_EVENTS } from '../../constants.js';
import { resolveSkipDecision, DECISION_OUTCOMES } from '../../../../contracts/decision-contract.js';

const MODULE_ID = 'skip-handler';
const VERSION = '3.2.0-DECISION-CONTRACT';

interface SkipHandlerOptions {
  helpers: Record<string, Function>;
  phaseMetrics: Record<string, Function>;
  phaseResults: Record<string, Function>;
  degradationHandler: Record<string, Function> | null;
}

interface SkipContext {
  phaseId: string;
  phaseStart: number;
  critical: boolean;
  manifestConfig: Record<string, unknown>;
  bootContext: { registerSkippedPhase: (phaseId: string, info: Record<string, unknown>) => void } | null;
  breakerState: string;
  memoryStart: Record<string, unknown> | null;
  memoryEnd: Record<string, unknown> | null;
}

export function createSkipHandler(options: SkipHandlerOptions) {
  const helpers = options.helpers;
  const phaseMetrics = options.phaseMetrics;
  const phaseResults = options.phaseResults;
  const degradationHandler = options.degradationHandler;

  return {
    /**
     * handle — Handle circuit breaker OPEN skip
     * @param {Object} context - Phase context
     * @returns {Object} - Skip result
     */
    handle: function(context: SkipContext) {
      const phaseId = context.phaseId;
      const phaseStart = context.phaseStart;
      const critical = context.critical;
      const manifestConfig = context.manifestConfig;
      const bootContext = context.bootContext;

      const phaseTime = Date.now() - phaseStart;

      // v3.2.0: Use decision contract for skip decision
      const skipDecision = resolveSkipDecision({
        circuitOpen: true,
        phaseId: phaseId,
        optional: !critical
      });

      // Log skip
      helpers.log('warn', 'Phase ' + phaseId + ' skipped (Circuit Breaker OPEN)', {
        decision: skipDecision.outcome,
        reason: skipDecision.reason
      });

      // Record metrics
      phaseMetrics.record(phaseId, 'skipped', phaseTime);

      // Emit skip event
      helpers.emit(ORCHESTRATOR_EVENTS.PHASE_SKIPPED, {
        phaseId: phaseId,
        reason: 'circuit-breaker-open',
        decision: skipDecision.outcome,
        time: phaseTime
      });

      // Register in boot context
      if (bootContext) {
        bootContext.registerSkippedPhase(phaseId, {
          reason: 'circuit-breaker-open',
          decision: skipDecision.outcome,
          time: phaseTime,
          degraded: true
        });
      }

      // Apply degradation policy
      if (degradationHandler) {
        degradationHandler.applyPolicy(phaseId, manifestConfig);
      }

      // Store result
      const result = {
        success: true,
        skipped: true,
        degraded: true,
        time: phaseTime,
        decision: skipDecision.outcome,
        reason: skipDecision.reason
      };

      phaseResults.set(phaseId, result);

      // Critical phase skipped = overall degraded
      if (critical) {
        helpers.log('error', 'Critical phase ' + phaseId + ' was skipped', {
          decision: skipDecision.outcome
        });

        return {
          success: true,
          skipped: true,
          degraded: true,
          critical: true,
          time: phaseTime,
          decision: skipDecision
        };
      }

      return {
        success: true,
        skipped: true,
        degraded: true,
        time: phaseTime,
        decision: skipDecision
      };
    },

    /**
     * info — Module info
     * @returns {Object}
     */
    info: function() {
      return {
        moduleId: MODULE_ID,
        version: VERSION,
        contractVersion: '1.0.0',
        usesDecisionContract: true
      };
    }
  };
}

export { MODULE_ID, VERSION };

export default { createSkipHandler, MODULE_ID, VERSION };
