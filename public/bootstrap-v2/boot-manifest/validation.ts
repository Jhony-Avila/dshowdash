// Boot Manifest - Validation
// @version 1.2.1-CONTRACTS
// @description Validação do manifest e dependências circulares
// @changelog v1.2.1-CONTRACTS: Dependency Contract formalizado
// #23: Validação de dependências circulares
//
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.2.1)
// ═══════════════════════════════════════════════════════════════
// IMPORTS:
//   createDependencyGraph from ../domain/dependency-graph.js
//   BOOT_MANIFEST from ./manifest-data.js
//   getPhaseById, getCriticalPhases from ./queries.js
// PROVIDES: validateManifest(), validateCircularDependencies()
// WINDOW ACCESS: None
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createDependencyGraph } from '../domain/dependency-graph.js';
import { BOOT_MANIFEST } from './manifest-data.js';
import { getPhaseById, getCriticalPhases } from './queries.js';

export const VERSION = '1.2.1-CONTRACTS';
export const MODULE_ID = 'boot-manifest:validation';

// #23: Validar dependências circulares usando dependency graph
export function validateCircularDependencies() {
  const graph = createDependencyGraph();

  // Adicionar todas as fases como nós
  for (let i = 0; i < BOOT_MANIFEST.phases.length; i++) {
    const phase = BOOT_MANIFEST.phases[i];
    graph.addNode(phase.id, {
      name: phase.name,
      critical: phase.critical,
      order: phase.order
    });
  }

  // Adicionar todas as dependências como arestas
  for (let j = 0; j < BOOT_MANIFEST.phases.length; j++) {
    const p = BOOT_MANIFEST.phases[j];
    if (p.dependsOn && p.dependsOn.length > 0) {
      for (let k = 0; k < p.dependsOn.length; k++) {
        graph.addEdge(p.dependsOn[k], p.id);
      }
    }
  }

  // Validar grafo completo
  return graph.validate();
}

export function validateManifest() {
  const errors: string[] = [];
  const warnings: string[] = [];
  const phaseIds: Record<string, boolean> = {};

  for (let i = 0; i < BOOT_MANIFEST.phases.length; i++) {
    const phase = BOOT_MANIFEST.phases[i];

    if (!phase.id) {
      errors.push('Phase at index ' + i + ' missing id');
      continue;
    }

    if (phaseIds[phase.id]) {
      errors.push('Duplicate phase id: ' + phase.id);
    }
    phaseIds[phase.id] = true;

    if (typeof phase.order !== 'number') {
      errors.push('Phase ' + phase.id + ' missing order');
    }

    if (phase.dependsOn && phase.dependsOn.length > 0) {
      for (let j = 0; j < phase.dependsOn.length; j++) {
        const dep = phase.dependsOn[j];
        const depPhase = getPhaseById(dep);
        if (!depPhase) {
          errors.push('Phase ' + phase.id + ' depends on unknown phase: ' + dep);
        } else if (depPhase.order >= phase.order) {
          errors.push('Phase ' + phase.id + ' depends on ' + dep + ' but has lower or equal order');
        }
      }
    }
  }

  // #23: Validar dependências circulares
  const circularValidation = validateCircularDependencies();
  if (circularValidation.hasCycle) {
    // @ts-expect-error strict migration — TS18047
    errors.push('Circular dependency detected: ' + circularValidation.cycleInfo.cycleString);
  }

  // Adicionar erros do grafo
  if (circularValidation.errors) {
    for (let k = 0; k < circularValidation.errors.length; k++) {
      const graphError = circularValidation.errors[k];
      if (graphError.type !== 'CIRCULAR_DEPENDENCY') {
        errors.push(graphError.message);
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors: errors,
    warnings: warnings,
    phaseCount: BOOT_MANIFEST.phases.length,
    criticalCount: getCriticalPhases().length,
    circularDependencyCheck: {
      performed: true,
      hasCycle: circularValidation.hasCycle,
      cycleInfo: circularValidation.cycleInfo
    }
  };
}

export default {
  VERSION,
  MODULE_ID,
  validateManifest,
  validateCircularDependencies
};
