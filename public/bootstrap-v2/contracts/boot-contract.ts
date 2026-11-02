
// Boot Contract — Contrato Formal para Boot Determinístico
// @version 1.0.0
// @description Define estados, transições e regras para boot determinístico
// @principle "Boot determinístico = transições validadas, sem atalhos"
// @changelog v1.0.0: Criação do contrato formal de boot
//
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.0.0)
// ═══════════════════════════════════════════════════════════════
// IMPORTS: None (self-contained, defines boot rules)
// PROVIDES:
//   BOOT_STATES               — Estados do boot (unificado)
//   BOOT_PHASES               — Fases do boot
//   VALID_TRANSITIONS         — Transições válidas entre estados
//   PHASE_TO_STATE            — Mapeamento fase → estado
//   BOOT_INVARIANTS           — Invariantes que devem ser mantidos
//   BOOT_CHECKPOINTS          — Checkpoints obrigatórios
//   canTransition()           — Verifica se transição é válida
//   getNextValidStates()      — Obtém próximos estados válidos
//   validateBootSequence()    — Valida sequência de boot
//   createBootState()         — Factory para estado de boot
//   isBootComplete()          — Verifica se boot completou
//   isBootFailed()            — Verifica se boot falhou
//   getPhaseForState()        — Obtém fase para estado
//   info()                    — Informações do módulo
// WINDOW ACCESS: None
// ═══════════════════════════════════════════════════════════════
'use strict';

const MODULE_ID = 'boot-contract';
const VERSION = '1.0.0';

// ═══════════════════════════════════════════════════════════════
// BOOT_STATES — Estados unificados do boot
// ═══════════════════════════════════════════════════════════════
// Unifica ORCHESTRATOR_STATES e BOOT_STATES em um único contrato

export const BOOT_STATES = Object.freeze({
  // Estados iniciais
  COLD: 'cold',                       // Sistema não iniciado
  INITIALIZING: 'initializing',       // Preparando para boot
  
  // Estados de fase (correspondem às fases 0-6)
  PHASE_0_CRITICAL: 'phase-0-critical',   // EventBus, Logger
  PHASE_1_CORE: 'phase-1-core',           // Core services
  PHASE_2_AUTH: 'phase-2-auth',           // Authentication
  PHASE_3_SHELL: 'phase-3-shell',         // App shell
  PHASE_4_MAIN: 'phase-4-main',           // Main content
  PHASE_5_UI: 'phase-5-ui',               // UI components
  PHASE_6_PLATFORM: 'phase-6-platform',   // Platform features
  
  // Estados finais
  READY: 'ready',                     // Boot completo com sucesso
  DEGRADED: 'degraded',               // Boot completo mas degradado
  FAILED: 'failed',                   // Boot falhou
  
  // Estados de recuperação
  RECOVERING: 'recovering',           // Tentando recuperar
  ROLLING_BACK: 'rolling-back'        // Executando rollback
});

// ═══════════════════════════════════════════════════════════════
// BOOT_PHASES — Fases do boot
// ═══════════════════════════════════════════════════════════════

export const BOOT_PHASES = Object.freeze({
  PHASE_0: 'phase-0-critical',
  PHASE_1: 'phase-1-core',
  PHASE_2: 'phase-2-auth',
  PHASE_3: 'phase-3-shell',
  PHASE_4: 'phase-4-main',
  PHASE_5: 'phase-5-ui',
  PHASE_6: 'phase-6-platform'
});

// ═══════════════════════════════════════════════════════════════
// PHASE_ORDER — Ordem das fases (imutável)
// ═══════════════════════════════════════════════════════════════

export const PHASE_ORDER = Object.freeze([
  BOOT_PHASES.PHASE_0,
  BOOT_PHASES.PHASE_1,
  BOOT_PHASES.PHASE_2,
  BOOT_PHASES.PHASE_3,
  BOOT_PHASES.PHASE_4,
  BOOT_PHASES.PHASE_5,
  BOOT_PHASES.PHASE_6
]);

// ═══════════════════════════════════════════════════════════════
// VALID_TRANSITIONS — Transições válidas (determinístico)
// ═══════════════════════════════════════════════════════════════
// Regra: Boot é uma sequência LINEAR com exceções para erro/recovery

export const VALID_TRANSITIONS = Object.freeze({
  // COLD só pode ir para INITIALIZING
  [BOOT_STATES.COLD]: [BOOT_STATES.INITIALIZING],
  
  // INITIALIZING → primeira fase ou erro
  [BOOT_STATES.INITIALIZING]: [BOOT_STATES.PHASE_0_CRITICAL, BOOT_STATES.FAILED],
  
  // Fases seguem ordem linear (ou erro)
  [BOOT_STATES.PHASE_0_CRITICAL]: [BOOT_STATES.PHASE_1_CORE, BOOT_STATES.FAILED, BOOT_STATES.DEGRADED],
  [BOOT_STATES.PHASE_1_CORE]: [BOOT_STATES.PHASE_2_AUTH, BOOT_STATES.FAILED, BOOT_STATES.DEGRADED],
  [BOOT_STATES.PHASE_2_AUTH]: [BOOT_STATES.PHASE_3_SHELL, BOOT_STATES.FAILED, BOOT_STATES.DEGRADED],
  [BOOT_STATES.PHASE_3_SHELL]: [BOOT_STATES.PHASE_4_MAIN, BOOT_STATES.FAILED, BOOT_STATES.DEGRADED],
  [BOOT_STATES.PHASE_4_MAIN]: [BOOT_STATES.PHASE_5_UI, BOOT_STATES.FAILED, BOOT_STATES.DEGRADED],
  [BOOT_STATES.PHASE_5_UI]: [BOOT_STATES.PHASE_6_PLATFORM, BOOT_STATES.READY, BOOT_STATES.DEGRADED],
  [BOOT_STATES.PHASE_6_PLATFORM]: [BOOT_STATES.READY, BOOT_STATES.DEGRADED],
  
  // Estados finais
  [BOOT_STATES.READY]: [], // Estado terminal
  [BOOT_STATES.DEGRADED]: [], // Estado terminal (mas funcional)
  [BOOT_STATES.FAILED]: [BOOT_STATES.RECOVERING, BOOT_STATES.COLD], // Pode tentar recuperar
  
  // Recovery
  [BOOT_STATES.RECOVERING]: [BOOT_STATES.INITIALIZING, BOOT_STATES.FAILED],
  [BOOT_STATES.ROLLING_BACK]: [BOOT_STATES.FAILED, BOOT_STATES.DEGRADED]
});

// ═══════════════════════════════════════════════════════════════
// PHASE_TO_STATE — Mapeamento fase → estado
// ═══════════════════════════════════════════════════════════════

export const PHASE_TO_STATE = Object.freeze({
  'phase-0-critical': BOOT_STATES.PHASE_0_CRITICAL,
  'phase-1-core': BOOT_STATES.PHASE_1_CORE,
  'phase-2-auth': BOOT_STATES.PHASE_2_AUTH,
  'phase-3-shell': BOOT_STATES.PHASE_3_SHELL,
  'phase-4-main': BOOT_STATES.PHASE_4_MAIN,
  'phase-5-ui': BOOT_STATES.PHASE_5_UI,
  'phase-6-platform': BOOT_STATES.PHASE_6_PLATFORM
});

// ═══════════════════════════════════════════════════════════════
// STATE_TO_PHASE — Mapeamento inverso estado → fase
// ═══════════════════════════════════════════════════════════════

export const STATE_TO_PHASE = Object.freeze({
  [BOOT_STATES.PHASE_0_CRITICAL]: 'phase-0-critical',
  [BOOT_STATES.PHASE_1_CORE]: 'phase-1-core',
  [BOOT_STATES.PHASE_2_AUTH]: 'phase-2-auth',
  [BOOT_STATES.PHASE_3_SHELL]: 'phase-3-shell',
  [BOOT_STATES.PHASE_4_MAIN]: 'phase-4-main',
  [BOOT_STATES.PHASE_5_UI]: 'phase-5-ui',
  [BOOT_STATES.PHASE_6_PLATFORM]: 'phase-6-platform'
});

// ═══════════════════════════════════════════════════════════════
// BOOT_INVARIANTS — Invariantes que devem ser mantidos
// ═══════════════════════════════════════════════════════════════

export const BOOT_INVARIANTS = Object.freeze([
  {
    id: 'INV-001',
    name: 'sequential-phases',
    description: 'Fases devem ser executadas em ordem sequencial',
    rule: 'phase-N só pode começar após phase-(N-1) completar'
  },
  {
    id: 'INV-002',
    name: 'critical-first',
    description: 'Phase-0 (EventBus, Logger) é obrigatória antes de tudo',
    rule: 'Nenhuma outra fase pode executar sem phase-0 completa'
  },
  {
    id: 'INV-003',
    name: 'no-skip-without-degradation',
    description: 'Pular fase requer entrar em modo degradado',
    rule: 'Skip de fase obriga estado DEGRADED ou uso de circuit breaker'
  },
  {
    id: 'INV-004',
    name: 'single-terminal-state',
    description: 'Boot termina em exatamente um estado final',
    rule: 'Estado final é READY, DEGRADED ou FAILED'
  },
  {
    id: 'INV-005',
    name: 'deterministic-transitions',
    description: 'Transições são determinísticas e validadas',
    rule: 'Toda transição deve ser validada por canTransition()'
  }
]);

// ═══════════════════════════════════════════════════════════════
// BOOT_CHECKPOINTS — Checkpoints obrigatórios
// ═══════════════════════════════════════════════════════════════

export const BOOT_CHECKPOINTS = Object.freeze({
  EVENTBUS_READY: {
    afterPhase: 'phase-0-critical',
    validation: 'EventBus must be available',
    required: true
  },
  LOGGER_READY: {
    afterPhase: 'phase-0-critical',
    validation: 'Logger must be available',
    required: true
  },
  AUTH_RESOLVED: {
    afterPhase: 'phase-2-auth',
    validation: 'Auth state must be resolved (authenticated or guest)',
    required: true
  },
  SHELL_MOUNTED: {
    afterPhase: 'phase-3-shell',
    validation: 'App shell DOM must be mounted',
    required: false // Pode ser pulado se não autenticado
  },
  UI_READY: {
    afterPhase: 'phase-5-ui',
    validation: 'UI components must be initialized',
    required: false
  }
});

// ═══════════════════════════════════════════════════════════════
// TERMINAL STATES
// ═══════════════════════════════════════════════════════════════

const TERMINAL_STATES = [BOOT_STATES.READY, BOOT_STATES.DEGRADED, BOOT_STATES.FAILED];
const PHASE_STATES = [
  BOOT_STATES.PHASE_0_CRITICAL,
  BOOT_STATES.PHASE_1_CORE,
  BOOT_STATES.PHASE_2_AUTH,
  BOOT_STATES.PHASE_3_SHELL,
  BOOT_STATES.PHASE_4_MAIN,
  BOOT_STATES.PHASE_5_UI,
  BOOT_STATES.PHASE_6_PLATFORM
];

// ═══════════════════════════════════════════════════════════════
// canTransition — Verifica se transição é válida
// ═══════════════════════════════════════════════════════════════

export function canTransition(fromState: string, toState: string) {
  if (!fromState || !toState) {
    return false;
  }

  const validTargets = VALID_TRANSITIONS[fromState as keyof typeof VALID_TRANSITIONS];
  if (!validTargets) {
    return false;
  }

  // @ts-expect-error strict migration — TS2345
  return validTargets.indexOf(toState as typeof validTargets[number]) !== -1;
}

// ═══════════════════════════════════════════════════════════════
// getNextValidStates — Obtém próximos estados válidos
// ═══════════════════════════════════════════════════════════════

export function getNextValidStates(currentState: string) {
  if (!currentState) {
    return [];
  }

  return VALID_TRANSITIONS[currentState as keyof typeof VALID_TRANSITIONS] || [];
}

// ═══════════════════════════════════════════════════════════════
// validateTransition — Valida transição com detalhes
// ═══════════════════════════════════════════════════════════════

export function validateTransition(fromState: string, toState: string, context?: { phase0Complete?: boolean; skippedPhases?: string[] }) {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Verificar se estados são válidos
  const allStates: readonly string[] = Object.values(BOOT_STATES);
  if (allStates.indexOf(fromState) === -1) {
    errors.push('Invalid fromState: ' + fromState);
  }
  if (allStates.indexOf(toState) === -1) {
    errors.push('Invalid toState: ' + toState);
  }

  if (errors.length > 0) {
    return { valid: false, errors: errors, warnings: warnings };
  }

  // Verificar se transição é permitida
  if (!canTransition(fromState, toState)) {
    errors.push('Transition not allowed: ' + fromState + ' → ' + toState);
    errors.push('Valid targets from ' + fromState + ': ' + getNextValidStates(fromState).join(', '));
  }

  // Verificar invariantes
  if (context) {
    // INV-002: Critical first
    if (toState !== BOOT_STATES.PHASE_0_CRITICAL && 
        toState !== BOOT_STATES.COLD && 
        toState !== BOOT_STATES.INITIALIZING &&
        toState !== BOOT_STATES.FAILED) {
      if (!context.phase0Complete) {
        warnings.push('INV-002: Phase-0 should complete before proceeding');
      }
    }

    // INV-003: Skip requires degradation
    if (context.skippedPhases && context.skippedPhases.length > 0) {
      if (toState === BOOT_STATES.READY) {
        warnings.push('INV-003: Skipped phases detected, consider DEGRADED state');
      }
    }
  }

  return {
    valid: errors.length === 0,
    errors: errors,
    warnings: warnings,
    fromState: fromState,
    toState: toState
  };
}

// ═══════════════════════════════════════════════════════════════
// validateBootSequence — Valida sequência completa de boot
// ═══════════════════════════════════════════════════════════════

export function validateBootSequence(stateHistory: string[]) {
  if (!stateHistory || !Array.isArray(stateHistory) || stateHistory.length === 0) {
    return {
      valid: false,
      errors: ['Empty or invalid state history'],
      warnings: [] as string[]
    };
  }

  const errors = [];
  const warnings = [];

  // Verificar que começa em COLD
  if (stateHistory[0] !== BOOT_STATES.COLD) {
    errors.push('Boot must start in COLD state, found: ' + stateHistory[0]);
  }

  // Verificar cada transição
  for (let i = 0; i < stateHistory.length - 1; i++) {
    const from = stateHistory[i];
    const to = stateHistory[i + 1];

    if (!canTransition(from, to)) {
      errors.push('Invalid transition at step ' + i + ': ' + from + ' → ' + to);
    }
  }

  // Verificar estado final
  const finalState = stateHistory[stateHistory.length - 1];
  if ((TERMINAL_STATES as readonly string[]).indexOf(finalState) === -1) {
    warnings.push('Boot did not reach terminal state, current: ' + finalState);
  }

  // Verificar se passou por phase-0
  const hasPhase0 = stateHistory.indexOf(BOOT_STATES.PHASE_0_CRITICAL) !== -1;
  if (!hasPhase0 && finalState !== BOOT_STATES.FAILED) {
    errors.push('INV-002 violated: Boot must pass through phase-0-critical');
  }

  return {
    valid: errors.length === 0,
    errors: errors,
    warnings: warnings,
    statesVisited: stateHistory.length,
    finalState: finalState,
    isComplete: (TERMINAL_STATES as readonly string[]).indexOf(finalState) !== -1
  };
}

// ═══════════════════════════════════════════════════════════════
// createBootState — Factory para estado de boot
// ═══════════════════════════════════════════════════════════════

export function createBootState(opts?: { state?: string; phase?: string | null; timestamp?: number; previousState?: string | null; metadata?: Record<string, unknown> }) {
  if (!opts) opts = {};

  return {
    state: opts.state || BOOT_STATES.COLD,
    phase: opts.phase || null,
    timestamp: opts.timestamp || Date.now(),
    previousState: opts.previousState || null,
    metadata: opts.metadata || {}
  };
}

// ═══════════════════════════════════════════════════════════════
// isBootComplete — Verifica se boot completou
// ═══════════════════════════════════════════════════════════════

export function isBootComplete(state: string) {
  return state === BOOT_STATES.READY || state === BOOT_STATES.DEGRADED;
}

// ═══════════════════════════════════════════════════════════════
// isBootFailed — Verifica se boot falhou
// ═══════════════════════════════════════════════════════════════

export function isBootFailed(state: string) {
  return state === BOOT_STATES.FAILED;
}

// ═══════════════════════════════════════════════════════════════
// isPhaseState — Verifica se estado é de fase
// ═══════════════════════════════════════════════════════════════

export function isPhaseState(state: string) {
  return (PHASE_STATES as readonly string[]).indexOf(state) !== -1;
}

// ═══════════════════════════════════════════════════════════════
// isTerminalState — Verifica se estado é terminal
// ═══════════════════════════════════════════════════════════════

export function isTerminalState(state: string) {
  return (TERMINAL_STATES as readonly string[]).indexOf(state) !== -1;
}

// ═══════════════════════════════════════════════════════════════
// getPhaseForState — Obtém fase para estado
// ═══════════════════════════════════════════════════════════════

export function getPhaseForState(state: string) {
  return STATE_TO_PHASE[state as keyof typeof STATE_TO_PHASE] || null;
}

// ═══════════════════════════════════════════════════════════════
// getStateForPhase — Obtém estado para fase
// ═══════════════════════════════════════════════════════════════

export function getStateForPhase(phaseId: string) {
  return PHASE_TO_STATE[phaseId as keyof typeof PHASE_TO_STATE] || null;
}

// ═══════════════════════════════════════════════════════════════
// getPhaseIndex — Obtém índice da fase
// ═══════════════════════════════════════════════════════════════

export function getPhaseIndex(phaseId: string) {
  return (PHASE_ORDER as readonly string[]).indexOf(phaseId);
}

// ═══════════════════════════════════════════════════════════════
// INFO
// ═══════════════════════════════════════════════════════════════

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    principle: 'Boot determinístico = transições validadas, sem atalhos',
    states: Object.keys(BOOT_STATES).length,
    phases: PHASE_ORDER.length,
    transitions: Object.keys(VALID_TRANSITIONS).length,
    invariants: BOOT_INVARIANTS.length,
    checkpoints: Object.keys(BOOT_CHECKPOINTS).length,
    terminalStates: TERMINAL_STATES.slice()
  };
}

// ═══════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════

export { MODULE_ID, VERSION, TERMINAL_STATES, PHASE_STATES };

export default {
  MODULE_ID,
  VERSION,
  BOOT_STATES,
  BOOT_PHASES,
  PHASE_ORDER,
  VALID_TRANSITIONS,
  PHASE_TO_STATE,
  STATE_TO_PHASE,
  BOOT_INVARIANTS,
  BOOT_CHECKPOINTS,
  TERMINAL_STATES,
  PHASE_STATES,
  canTransition,
  getNextValidStates,
  validateTransition,
  validateBootSequence,
  createBootState,
  isBootComplete,
  isBootFailed,
  isPhaseState,
  isTerminalState,
  getPhaseForState,
  getStateForPhase,
  getPhaseIndex,
  info
};
