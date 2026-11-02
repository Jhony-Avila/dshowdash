// Phase Registry
// @version 2.6.1-CONTRACTS
// @changelog v2.6.1-CONTRACTS: Dependency Contract formalizado
//
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v2.6.1)
// ═══════════════════════════════════════════════════════════════
// IMPORTS:
//   getPhaseOrder from ../../boot-manifest/index.js
//   PHASE_MAP, CONFIG_KEY_MAP from ./phase-map.js
// RECEIVES: config, dependencyGraph (params)
// PROVIDES: registerPhases(), getPhaseIds()
// WINDOW ACCESS: None
// ═══════════════════════════════════════════════════════════════
'use strict';

import { getPhaseOrder } from '../../boot-manifest/index.js';
import { PHASE_MAP, CONFIG_KEY_MAP } from './phase-map.js';

export const VERSION = '1.0.0-P4-ENTERPRISE';
export const MODULE_ID = 'bootstrap-v2.module.phases.phase-registry';

interface PhaseImpl {
  id: string;
  name: string;
  critical: boolean;
  dependsOn?: string[];
  [key: string]: unknown;
}

interface DependencyGraph {
  addNode?: (id: string, meta: Record<string, unknown>) => void;
  addEdge?: (from: string, to: string) => void;
}

export function registerPhases(config: { phases: Record<string, boolean> }, dependencyGraph: DependencyGraph | null) {
  const phases: PhaseImpl[] = [];
  const phaseOrder = getPhaseOrder();

  for (let i = 0; i < phaseOrder.length; i++) {
    const phaseId = phaseOrder[i] as keyof typeof PHASE_MAP;
    const phaseImpl = PHASE_MAP[phaseId];

    if (phaseImpl) {
      const cfgKey = CONFIG_KEY_MAP[phaseId as keyof typeof CONFIG_KEY_MAP];
      if (cfgKey && config.phases[cfgKey] !== false) {
        phases.push(phaseImpl);

        if (dependencyGraph && dependencyGraph.addNode) {
          dependencyGraph.addNode(phaseId, {
            name: phaseImpl.name,
            critical: phaseImpl.critical
          });

          if (phaseImpl.dependsOn) {
            for (let j = 0; j < phaseImpl.dependsOn.length; j++) {
              // @ts-expect-error strict migration — TS2722
              dependencyGraph.addEdge(phaseImpl.dependsOn[j], phaseId);
            }
          }
        }
      }
    }
  }

  return phases;
}

export function getPhaseIds(phases: PhaseImpl[]) {
  return phases.map(function(p: PhaseImpl) { return p.id; });
}

export default { registerPhases, getPhaseIds };
