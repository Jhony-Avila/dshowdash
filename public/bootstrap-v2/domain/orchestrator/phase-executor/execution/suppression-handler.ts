// Suppression Handler — Handle phase suppression for unauth scenarios
// @version 3.2.0-DECISION-CONTRACT
// @changelog v3.2.0-DECISION-CONTRACT: Usa resolveSuppressionDecision do decision-contract.js
// @changelog v3.1.1 - Fixed degradation-notifier import path to absolute
//
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v3.2.0)
// ═══════════════════════════════════════════════════════════════
// IMPORTS:
//   DegradationNotifier from /bootstrap-v2/domain/degradation-notifier.js
//   resolveSuppressionDecision, DECISION_OUTCOMES from ../../../../contracts/decision-contract.js
//
// RECEIVES (via createSuppressionHandler options):
//   options.helpers, phaseMetrics, phaseResults, bootContext,
//   options.degradationHandler, notificationsEnabled
//
// PROVIDES: handle() — handle suppression when unauth
// WINDOW ACCESS: None
// ═══════════════════════════════════════════════════════════════
'use strict';

import * as DegradationNotifier from '/bootstrap-v2/domain/degradation-notifier.js';
import { resolveSuppressionDecision, DECISION_OUTCOMES } from '../../../../contracts/decision-contract.js';

const MODULE_ID = 'suppression-handler';
const VERSION = '3.2.0-DECISION-CONTRACT';

interface SuppressionHandlerOptions {
  helpers: Record<string, Function>;
  phaseMetrics: Record<string, Function>;
  phaseResults: Record<string, Function>;
  degradationHandler: Record<string, Function> | null;
  notificationsEnabled?: boolean;
}

interface SuppressionContext {
  phaseId: string;
  phaseStart: number;
  manifestConfig: Record<string, unknown> & { suppressWhenUnauth?: boolean };
  bootContext: { registerSuppressedPhase: (phaseId: string, info: Record<string, unknown>) => void } | null;
  authenticated: boolean;
  error: Error;
  [key: string]: unknown;
}

export function createSuppressionHandler(options: SuppressionHandlerOptions) {
  const helpers = options.helpers;
  const phaseMetrics = options.phaseMetrics;
  const phaseResults = options.phaseResults;
  const degradationHandler = options.degradationHandler;
  const notificationsEnabled = options.notificationsEnabled !== false;

  return {
    /**
     * handle — Handle phase suppression
     * @param {Object} context - Phase context
     * @returns {Object} - Suppression result
     */
    handle: function(context: SuppressionContext) {
      const phaseId = context.phaseId;
      const phaseStart = context.phaseStart;
      const manifestConfig = context.manifestConfig;
      const bootContext = context.bootContext;
      const authenticated = context.authenticated;
      const error = context.error;

      const phaseTime = Date.now() - phaseStart;

      // v3.2.0: Use decision contract for suppression decision
      const suppressionDecision = resolveSuppressionDecision({
        phaseId: phaseId,
        authenticated: authenticated,
        suppressWhenUnauth: manifestConfig && manifestConfig.suppressWhenUnauth
      });

      helpers.log('info', 'Suppressing phase ' + phaseId + ' due to unauth', {
        decision: suppressionDecision.outcome,
        reason: suppressionDecision.reason
      });

      // Record in boot context
      if (bootContext) {
        bootContext.registerSuppressedPhase(phaseId, {
          reason: suppressionDecision.reason,
          decision: suppressionDecision.outcome,
          time: phaseTime,
          degraded: true
        });
      }

      // Apply degradation policy
      if (degradationHandler) {
        degradationHandler.applyPolicy(phaseId, manifestConfig);
      }

      // Notify UI if enabled
      if (notificationsEnabled && DegradationNotifier && DegradationNotifier.notifyPhaseDegraded) {
        DegradationNotifier.notifyPhaseDegraded(phaseId, 'Suppressed due to unauth');
      }

      // Record metrics
      phaseMetrics.record(phaseId, 'suppressed', phaseTime);

      // Store result
      const result = {
        success: true,
        recovered: true,
        degraded: true,
        suppressed: true,
        time: phaseTime,
        decision: suppressionDecision.outcome,
        reason: suppressionDecision.reason
      };

      phaseResults.set(phaseId, result);

      return {
        success: true,
        recovered: true,
        degraded: true,
        time: phaseTime,
        decision: suppressionDecision
      };
    },

    /**
     * shouldSuppress — Check if phase should be suppressed
     * @param {Object} context - Phase context
     * @returns {boolean}
     */
    shouldSuppress: function(context: { phaseId: string; authenticated: boolean; manifestConfig: Record<string, unknown> & { suppressWhenUnauth?: boolean } }) {
      const decision = resolveSuppressionDecision({
        phaseId: context.phaseId,
        authenticated: context.authenticated,
        suppressWhenUnauth: context.manifestConfig && context.manifestConfig.suppressWhenUnauth
      });

      return decision.shouldSuppress === true;
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

export default { createSuppressionHandler, MODULE_ID, VERSION };
