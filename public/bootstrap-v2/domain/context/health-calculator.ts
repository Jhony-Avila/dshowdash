// Context Health Calculator
// @version 1.1.1-CONTRACTS
// @changelog v1.1.1-CONTRACTS: Dependency Contract formalizado
//
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.1.1)
// ═══════════════════════════════════════════════════════════════
// IMPORTS: BOOT_HEALTH, getTotalHealthWeight, getPhaseById from ../../boot-manifest/index.js
// RECEIVES (via createHealthCalculator options):
//   options.stateStore — State store for health data
// PROVIDES: recalculate(), getHealth(), getHealthScore()
// WINDOW ACCESS: None
// ═══════════════════════════════════════════════════════════════
'use strict';

import { BOOT_HEALTH, getTotalHealthWeight, getPhaseById } from '../../boot-manifest/index.js';

export const VERSION = '1.0.0-P4-ENTERPRISE';
export const MODULE_ID = 'bootstrap-v2.domain.context.health-calculator';

interface PhaseState {
  success: boolean;
  recovered: boolean;
  degraded: boolean;
}

interface HealthCalcStateStore {
  getPhases(): Record<string, PhaseState>;
  getHealth(): string;
  getHealthScore(): number;
  setHealth(health: string, score: number): void;
}

interface HealthCalculatorOptions {
  stateStore?: HealthCalcStateStore;
}

export function createHealthCalculator(options: HealthCalculatorOptions) {
  if (options === undefined) options = {};
  const stateStore = options.stateStore!;

  return {
    recalculate: function() {
      const phases = stateStore.getPhases();
      const totalWeight = getTotalHealthWeight();
      let achievedWeight = 0;
      let hasCriticalFailure = false;

      for (const phaseId in phases) {
        if (phases.hasOwnProperty(phaseId)) {
          const phase = phases[phaseId];
          const config = getPhaseById(phaseId);
          const weight = config ? config.healthWeight || 0 : 0;

          if (phase.success || phase.recovered) {
            if (phase.degraded) {
              achievedWeight += weight * 0.5;
            } else {
              achievedWeight += weight;
            }
          } else if (config && config.critical) {
            hasCriticalFailure = true;
          }
        }
      }

      const healthScore = totalWeight > 0 ? Math.round((achievedWeight / totalWeight) * 100) : 0;
      let health;

      if (hasCriticalFailure) {
        health = BOOT_HEALTH.FAILED;
      } else if (healthScore >= 90) {
        health = BOOT_HEALTH.HEALTHY;
      } else if (healthScore >= 60) {
        health = BOOT_HEALTH.DEGRADED;
      } else {
        health = BOOT_HEALTH.UNHEALTHY;
      }

      stateStore.setHealth(health, healthScore);

      return { health: health, healthScore: healthScore };
    },

    getHealth: function() {
      return stateStore.getHealth();
    },

    getHealthScore: function() {
      return stateStore.getHealthScore();
    }
  };
}

export default { createHealthCalculator };
