// Context Phase Manager
// @version 1.1.1-CONTRACTS
// @changelog v1.1.1-CONTRACTS: Dependency Contract formalizado
//
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.1.1)
// ═══════════════════════════════════════════════════════════════
// IMPORTS: getPhaseById from ../../boot-manifest/index.js
// RECEIVES (via createPhaseManager options):
//   options.stateStore, healthCalculator, progressTracker,
//   options.notifyListeners
// PROVIDES: setResult(), getPhase(), getPhases(), getPhasesCount()
// WINDOW ACCESS: None
// ═══════════════════════════════════════════════════════════════
'use strict';

import { getPhaseById } from '../../boot-manifest/index.js';

export const VERSION = '1.0.0-P4-ENTERPRISE';
export const MODULE_ID = 'bootstrap-v2.domain.context.phase-manager';

interface PhaseResult {
  success: boolean;
  recovered?: boolean;
  degraded?: boolean;
  suppressed?: boolean;
  time?: number;
  error?: string | null;
}

interface PhaseData {
  id: string;
  status: string;
  success: boolean;
  recovered: boolean;
  degraded: boolean;
  suppressed: boolean;
  time: number;
  error: string | null;
  timestamp: number;
}

interface PhaseManagerStateStore {
  getPhase(id: string): PhaseData | undefined;
  getPhases(): Record<string, PhaseData>;
  setPhase(id: string, data: PhaseData): void;
  incrementRecoveries(): void;
  incrementFailures(): void;
  addWarning(warn: { phase: string; type: string; message: string; originalError?: string | null; timestamp: number }): void;
  addDegradation(deg: { phase: string; mode: string; message: string; disabled: string[]; allowed: string[]; timestamp: number }): void;
  addError(err: { phase: string; error: string | null; critical: boolean; timestamp: number }): void;
}

interface PhaseManagerHealthCalculator {
  recalculate(): void;
}

interface PhaseManagerProgressTracker {
  onPhaseStart(phaseId: string): void;
  onPhaseComplete(phaseId: string): void;
}

interface PhaseManagerOptions {
  stateStore?: PhaseManagerStateStore;
  healthCalculator?: PhaseManagerHealthCalculator;
  progressTracker?: PhaseManagerProgressTracker;
  notifyListeners?: (type: string, data: Record<string, unknown>) => void;
}

export function createPhaseManager(options: PhaseManagerOptions) {
  if (options === undefined) options = {};
  const stateStore = options.stateStore!;
  const healthCalculator = options.healthCalculator!;
  const progressTracker = options.progressTracker!;
  const notifyListeners = options.notifyListeners!;

  return {
    setResult: function(phaseId: string, result: PhaseResult) {
      const phaseConfig = getPhaseById(phaseId);
      const existingPhase = stateStore.getPhase(phaseId);

      if (!existingPhase) {
        progressTracker.onPhaseStart(phaseId);
      }

      const phaseData = {
        id: phaseId,
        status: result.success ? (result.recovered ? 'recovered' : 'success') : 'failed',
        success: result.success,
        recovered: result.recovered || false,
        degraded: result.degraded || false,
        suppressed: result.suppressed || false,
        time: result.time || 0,
        error: result.error || null,
        timestamp: Date.now()
      };

      stateStore.setPhase(phaseId, phaseData);

      if (result.recovered) {
        stateStore.incrementRecoveries();

        stateStore.addWarning({
          phase: phaseId,
          type: 'recovery',
          message: (phaseConfig && phaseConfig.name ? phaseConfig.name : phaseId) + ' recovered from error',
          originalError: result.error,
          timestamp: Date.now()
        });

        if (phaseConfig && phaseConfig.onFail) {
          stateStore.addDegradation({
            phase: phaseId,
            mode: phaseConfig.onFail.mode,
            message: phaseConfig.onFail.message,
            disabled: phaseConfig.onFail.disable || [],
            allowed: phaseConfig.onFail.allow || [],
            timestamp: Date.now()
          });
        }
      }

      if (result.suppressed) {
        stateStore.addWarning({
          phase: phaseId,
          type: 'suppressed',
          message: (phaseConfig && phaseConfig.name ? phaseConfig.name : phaseId) + ' error suppressed (unauth)',
          originalError: result.error,
          timestamp: Date.now()
        });
      }

      if (!result.success && !result.recovered) {
        stateStore.incrementFailures();
        stateStore.addError({
          phase: phaseId,
          // @ts-expect-error strict migration — TS2322
          error: result.error,
          critical: phaseConfig ? phaseConfig.critical : false,
          timestamp: Date.now()
        });
      }

      healthCalculator.recalculate();

      notifyListeners('phase', { phaseId: phaseId, result: phaseData });

      progressTracker.onPhaseComplete(phaseId);
    },

    getPhase: function(phaseId: string) {
      return stateStore.getPhase(phaseId);
    },

    getPhases: function() {
      return Object.assign({}, stateStore.getPhases());
    },

    getPhasesCount: function() {
      return Object.keys(stateStore.getPhases()).length;
    }
  };
}

export default { createPhaseManager };
