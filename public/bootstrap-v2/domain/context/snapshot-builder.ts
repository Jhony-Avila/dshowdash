// Context Snapshot Builder
// @version 1.2.1-CONTRACTS
// @changelog v1.2.1-CONTRACTS: Dependency Contract formalizado
// @changelog v1.2.0-QUALITY: #21 Snapshot imutável com deep clone
// @changelog v1.1.0-MODULAR: Versão modular inicial
//
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.2.1)
// ═══════════════════════════════════════════════════════════════
// IMPORTS: VERSION, CONTEXT_STATES from ./constants.js
// RECEIVES (via createSnapshotBuilder options):
//   options.stateStore       — State store for reading state
//   options.freezeSnapshots  — Whether to freeze (default true)
// PROVIDES: build(), buildMutable(), deepClone, deepFreeze
// WINDOW ACCESS: None
// ═══════════════════════════════════════════════════════════════
'use strict';

import { VERSION, CONTEXT_STATES } from './constants.js';

export const MODULE_ID = 'bootstrap-v2.domain.context.snapshot-builder';

// #21: Deep clone para garantir imutabilidade
function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }

  if (obj instanceof Date) {
    return new Date(obj.getTime()) as unknown as T;
  }

  if (Array.isArray(obj)) {
    var arrCopy: unknown[] = [];
    for (var i = 0; i < obj.length; i++) {
      arrCopy[i] = deepClone(obj[i]);
    }
    return arrCopy as unknown as T;
  }

  if (obj instanceof Object) {
    var objCopy: Record<string, unknown> = {};
    for (var key in obj) {
      if (obj.hasOwnProperty(key)) {
        objCopy[key] = deepClone((obj as Record<string, unknown>)[key]);
      }
    }
    return objCopy as unknown as T;
  }

  return obj;
}

// #21: Freeze recursivo para tornar objeto completamente imutável
function deepFreeze<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') {
    return obj;
  }
  
  // Freeze o próprio objeto
  Object.freeze(obj);
  
  // Freeze propriedades recursivamente
  for (var key in obj) {
    if (obj.hasOwnProperty(key)) {
      var value = obj[key];
      if (value !== null && typeof value === 'object' && !Object.isFrozen(value)) {
        deepFreeze(value);
      }
    }
  }
  
  return obj;
}

interface SnapshotStateStore {
  getStatus(): string;
  getMetrics(): { totalTime: number; phaseTimings: Record<string, number>; recoveries: number; failures: number };
  getDegradations(): Array<Record<string, unknown>>;
  getHealth(): string;
  getHealthScore(): number;
  getAuth(): Record<string, unknown>;
  getPermissions(): Record<string, unknown>;
  getNavigation(): Record<string, unknown>;
  getUI(): Record<string, unknown>;
  getPhases(): Record<string, unknown>;
  getErrors(): Array<Record<string, unknown>>;
  getWarnings(): Array<Record<string, unknown>>;
  getProgress(): Record<string, unknown>;
}

interface SnapshotBuilderOptions {
  stateStore?: SnapshotStateStore;
  freezeSnapshots?: boolean;
}

export function createSnapshotBuilder(options: SnapshotBuilderOptions) {
  if (options === undefined) options = {};
  var stateStore = options.stateStore;
  
  // #21: Configuração de imutabilidade
  var freezeSnapshots = options.freezeSnapshots !== false; // true por padrão

  return {
    // #21: Build retorna cópia profunda imutável
    build: function() {
      var status = stateStore!.getStatus();
      var metrics = stateStore!.getMetrics();
      var degradations = stateStore!.getDegradations();

      var snapshot = {
        // Estado principal
        state: status,
        success: status === CONTEXT_STATES.READY || status === CONTEXT_STATES.DEGRADED,

        // Saúde
        health: stateStore!.getHealth(),
        healthScore: stateStore!.getHealthScore(),
        degraded: status === CONTEXT_STATES.DEGRADED || degradations.length > 0,

        // Autenticação - deep clone
        auth: deepClone(stateStore!.getAuth()),

        // Permissões - deep clone
        permissions: deepClone(stateStore!.getPermissions()),

        // Navegação - deep clone
        navigation: deepClone(stateStore!.getNavigation()),

        // UI - deep clone
        ui: deepClone(stateStore!.getUI()),

        // Fases - deep clone
        phases: deepClone(stateStore!.getPhases()),
        phasesCompleted: Object.keys(stateStore!.getPhases()).length,

        // Degradações - deep clone
        degradations: deepClone(degradations),
        degradationCount: degradations.length,

        // Erros - deep clone
        errors: deepClone(stateStore!.getErrors()),
        errorCount: stateStore!.getErrors().length,

        // Warnings - deep clone
        warnings: deepClone(stateStore!.getWarnings()),
        warningCount: stateStore!.getWarnings().length,

        // Progresso - deep clone
        progress: deepClone(stateStore!.getProgress()),

        // Métricas - deep clone
        metrics: {
          totalTime: metrics.totalTime,
          phaseTimings: deepClone(metrics.phaseTimings),
          recoveries: metrics.recoveries,
          failures: metrics.failures
        },

        // Meta
        timestamp: Date.now(),
        version: VERSION,
        immutable: freezeSnapshots,
        snapshotVersion: '1.2.0-QUALITY'
      };
      
      // #21: Freeze se habilitado (torna completamente imutável)
      if (freezeSnapshots) {
        return deepFreeze(snapshot);
      }
      
      return snapshot;
    },
    
    // #21: Método para obter cópia mutável (uso interno)
    buildMutable: function() {
      var originalFreeze = freezeSnapshots;
      freezeSnapshots = false;
      var snapshot = this.build();
      freezeSnapshots = originalFreeze;
      return snapshot;
    },
    
    // #21: Verificar se snapshot é imutável
    isImmutable: function(snapshot: Record<string, unknown>) {
      return snapshot && Object.isFrozen(snapshot);
    },
    
    // #21: Info do builder
    info: function() {
      return {
        moduleId: 'snapshot-builder',
        version: '1.2.1-CONTRACTS',
        freezeSnapshots: freezeSnapshots,
        improvements: ['#21-ImmutableSnapshot']
      };
    }
  };
}

// #21: Exportar utilitários para uso externo
export { deepClone, deepFreeze };

export default { createSnapshotBuilder, deepClone, deepFreeze };
