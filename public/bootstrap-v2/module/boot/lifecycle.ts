// Boot Lifecycle Handlers
// @version 2.6.1-CONTRACTS
// @changelog v2.6.1-CONTRACTS: Dependency Contract formalizado
// @changelog v2.6.0-MODULAR: Versão inicial
//
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v2.6.1)
// ═══════════════════════════════════════════════════════════════
// IMPORTS: None (self-contained)
// RECEIVES (via function params):
//   stateMachine, healthAggregator, loggerAdapter
// PROVIDES: createPhaseStartHandler(), createPhaseCompleteHandler()
// WINDOW ACCESS: None (no window.* globals)
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '1.0.0-P4-ENTERPRISE';
export const MODULE_ID = 'bootstrap-v2.module.boot.lifecycle';

interface StateMachine {
  transitionToPhase: (phaseId: string) => { success: boolean; error?: string; [key: string]: unknown };
  transition: (state: string, metadata?: Record<string, unknown>) => { success: boolean; error?: string; [key: string]: unknown };
  getState: () => string;
  isReady: () => boolean;
  reset: () => void;
  STATES: { [key: string]: string };
  [key: string]: unknown;
}

interface HealthAggregator {
  capturePhaseMemory?: (phaseId: string, stage: string) => void;
  captureMemoryBaseline?: () => void;
  getStatus?: () => string;
  getScore?: () => number;
  calculate?: () => Record<string, unknown>;
  getPeriodicHistory?: () => Record<string, unknown>;
  getMemoryMetrics?: () => Record<string, unknown>;
  startPeriodicCheck?: (config: Record<string, unknown>) => { success: boolean };
  stopPeriodicCheck?: () => void;
}

interface LoggerAdapter {
  info: (message: string, data?: Record<string, unknown>) => void;
  warn: (message: string, data?: Record<string, unknown>) => void;
  error: (message: string, data?: Record<string, unknown>) => void;
}

interface PhaseEventData {
  phaseId: string;
  [key: string]: unknown;
}

export function createPhaseStartHandler(stateMachine: StateMachine, healthAggregator: HealthAggregator | null, loggerAdapter: LoggerAdapter) {
  return function(data: PhaseEventData) {
    const phaseId = data.phaseId;
    const result = stateMachine.transitionToPhase(phaseId);
    
    if (!result.success) {
      loggerAdapter.warn('StateMachine transition failed', {
        phaseId: phaseId,
        error: result.error,
        currentState: stateMachine.getState()
      });
    }
    
    // Capturar memória no início da fase
    if (healthAggregator && healthAggregator.capturePhaseMemory) {
      healthAggregator.capturePhaseMemory(phaseId, 'start');
    }
  };
}

export function createPhaseCompleteHandler(healthAggregator: HealthAggregator | null) {
  return function(data: PhaseEventData) {
    const phaseId = data.phaseId;
    
    // Capturar memória no fim da fase
    if (healthAggregator && healthAggregator.capturePhaseMemory) {
      healthAggregator.capturePhaseMemory(phaseId, 'end');
    }
  };
}

export default { createPhaseStartHandler, createPhaseCompleteHandler };
