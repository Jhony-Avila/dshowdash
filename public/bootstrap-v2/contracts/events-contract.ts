
// Events Contract — Contrato Formal de Políticas de Eventos
// @version 1.0.0
// @description Define regras, políticas e validadores para eventos do bootstrap
// @principle "Evento informa. Comando decide." (Briefing linha 522)
// @changelog v1.0.0: Criação do contrato formal de eventos
//
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.0.0)
// ═══════════════════════════════════════════════════════════════
// IMPORTS: None (self-contained, defines policies)
// PROVIDES:
//   EVENT_ROLE                — Papéis que eventos podem ter
//   EVENT_POLICY              — Políticas de emissão
//   EVENT_CATEGORIES          — Categorias de eventos
//   FORBIDDEN_EVENT_BEHAVIORS — Comportamentos proibidos
//   REQUIRED_EVENT_FIELDS     — Campos obrigatórios por categoria
//   isEventAllowedToDecide()  — Verifica se evento pode decidir
//   isEventInformational()    — Verifica se evento é apenas informativo
//   validateEventPayload()    — Valida payload de evento
//   validateEventEmission()   — Valida emissão de evento
//   createEventPayload()      — Factory para payload padronizado
//   getEventPolicy()          — Obtém política para evento
//   info()                    — Informações do módulo
// WINDOW ACCESS: None
// SIDE-EFFECTS: None — pure functions only
// ═══════════════════════════════════════════════════════════════
'use strict';

const MODULE_ID = 'events-contract';
const VERSION = '1.0.0';

// ═══════════════════════════════════════════════════════════════
// EVENT_ROLE — Papéis que eventos podem ter
// ═══════════════════════════════════════════════════════════════
// Regra fundamental (Briefing linha 522):
// "Evento informa. Comando decide."

export const EVENT_ROLE = Object.freeze({
  // PERMITIDOS
  INFORMATIONAL: 'informational',     // Apenas informa sobre algo que aconteceu
  OBSERVABILITY: 'observability',     // Telemetria, métricas, logging
  NOTIFICATION: 'notification',       // Notifica UI sobre estado
  PROGRESS: 'progress',               // Indica progresso de operação
  
  // RESTRITOS (requerem justificativa)
  COORDINATION: 'coordination',       // Coordena múltiplos módulos (usar com cuidado)
  
  // PROIBIDOS (violam princípio arquitetural)
  DECISIONAL: 'decisional',           // Evento que decide fluxo — PROIBIDO
  COMMAND: 'command'                  // Evento que executa ação — PROIBIDO (use commands)
});

// ═══════════════════════════════════════════════════════════════
// EVENT_CATEGORIES — Categorias de eventos do bootstrap
// ═══════════════════════════════════════════════════════════════

export const EVENT_CATEGORIES = Object.freeze({
  PRE_BOOT: 'pre-boot',
  ORCHESTRATOR: 'orchestrator',
  PHASE: 'phase',
  MODULE: 'module',
  BOOTSTRAP: 'bootstrap',
  PROGRESS: 'progress',
  HEALTH: 'health',
  DEGRADATION: 'degradation',
  KERNEL: 'kernel',
  ROLLBACK: 'rollback'
});

// ═══════════════════════════════════════════════════════════════
// EVENT_POLICY — Políticas de emissão por categoria
// ═══════════════════════════════════════════════════════════════

export const EVENT_POLICY = Object.freeze({
  // PRE-BOOT: Apenas informacional
  [EVENT_CATEGORIES.PRE_BOOT]: {
    allowedRoles: [EVENT_ROLE.INFORMATIONAL, EVENT_ROLE.PROGRESS],
    forbiddenRoles: [EVENT_ROLE.DECISIONAL, EVENT_ROLE.COMMAND],
    requiredFields: ['timestamp'],
    optionalFields: ['source', 'time', 'modules'],
    canTriggerUIChange: false,
    canTriggerFlowChange: false,
    description: 'Pre-boot events are purely informational'
  },

  // ORCHESTRATOR: Informacional + coordenação limitada
  [EVENT_CATEGORIES.ORCHESTRATOR]: {
    allowedRoles: [EVENT_ROLE.INFORMATIONAL, EVENT_ROLE.OBSERVABILITY, EVENT_ROLE.COORDINATION],
    forbiddenRoles: [EVENT_ROLE.DECISIONAL, EVENT_ROLE.COMMAND],
    requiredFields: ['phaseId', 'timestamp'],
    optionalFields: ['result', 'error', 'time', 'name'],
    canTriggerUIChange: false,
    canTriggerFlowChange: false, // Fluxo é decidido pelo orchestrator, não pelo evento
    description: 'Orchestrator events inform about phase execution'
  },

  // PHASE: Informacional
  [EVENT_CATEGORIES.PHASE]: {
    allowedRoles: [EVENT_ROLE.INFORMATIONAL, EVENT_ROLE.PROGRESS],
    forbiddenRoles: [EVENT_ROLE.DECISIONAL, EVENT_ROLE.COMMAND],
    requiredFields: ['phaseId', 'timestamp'],
    optionalFields: ['phaseName', 'phaseIndex', 'totalPhases', 'percentage'],
    canTriggerUIChange: false,
    canTriggerFlowChange: false,
    description: 'Phase events track phase lifecycle'
  },

  // MODULE: Observabilidade
  [EVENT_CATEGORIES.MODULE]: {
    allowedRoles: [EVENT_ROLE.OBSERVABILITY, EVENT_ROLE.INFORMATIONAL],
    forbiddenRoles: [EVENT_ROLE.DECISIONAL, EVENT_ROLE.COMMAND],
    requiredFields: ['moduleId', 'timestamp'],
    optionalFields: ['time', 'error', 'metrics'],
    canTriggerUIChange: false,
    canTriggerFlowChange: false,
    description: 'Module events are for telemetry only'
  },

  // BOOTSTRAP: Pode notificar UI (após boot completo)
  [EVENT_CATEGORIES.BOOTSTRAP]: {
    allowedRoles: [EVENT_ROLE.INFORMATIONAL, EVENT_ROLE.NOTIFICATION],
    forbiddenRoles: [EVENT_ROLE.DECISIONAL, EVENT_ROLE.COMMAND],
    requiredFields: ['timestamp'],
    optionalFields: ['totalTime', 'phases', 'context', 'health', 'result'],
    canTriggerUIChange: true, // Apenas para indicar fim do boot
    canTriggerFlowChange: false,
    description: 'Bootstrap events can notify UI about boot completion'
  },

  // PROGRESS: Pode atualizar UI (progresso visual)
  [EVENT_CATEGORIES.PROGRESS]: {
    allowedRoles: [EVENT_ROLE.PROGRESS, EVENT_ROLE.NOTIFICATION],
    forbiddenRoles: [EVENT_ROLE.DECISIONAL, EVENT_ROLE.COMMAND],
    requiredFields: ['percentage', 'timestamp'],
    optionalFields: ['phase', 'phaseName', 'phaseIndex', 'totalPhases'],
    canTriggerUIChange: true, // Atualiza barra de progresso
    canTriggerFlowChange: false,
    description: 'Progress events update UI progress indicators'
  },

  // HEALTH: Observabilidade
  [EVENT_CATEGORIES.HEALTH]: {
    allowedRoles: [EVENT_ROLE.OBSERVABILITY, EVENT_ROLE.INFORMATIONAL],
    forbiddenRoles: [EVENT_ROLE.DECISIONAL, EVENT_ROLE.COMMAND],
    requiredFields: ['status', 'timestamp'],
    optionalFields: ['score', 'checkNumber', 'details'],
    canTriggerUIChange: false,
    canTriggerFlowChange: false,
    description: 'Health events are for monitoring only'
  },

  // DEGRADATION: Pode notificar UI
  [EVENT_CATEGORIES.DEGRADATION]: {
    allowedRoles: [EVENT_ROLE.NOTIFICATION, EVENT_ROLE.INFORMATIONAL],
    forbiddenRoles: [EVENT_ROLE.DECISIONAL, EVENT_ROLE.COMMAND],
    requiredFields: ['type', 'timestamp'],
    optionalFields: ['message', 'phaseId', 'severity', 'recoverable'],
    canTriggerUIChange: true, // Mostra banner/toast de degradação
    canTriggerFlowChange: false, // Degradação é decidida pelo contrato, não pelo evento
    description: 'Degradation events notify UI about degraded state'
  },

  // KERNEL: Informacional + coordenação limitada
  [EVENT_CATEGORIES.KERNEL]: {
    allowedRoles: [EVENT_ROLE.INFORMATIONAL, EVENT_ROLE.COORDINATION],
    forbiddenRoles: [EVENT_ROLE.DECISIONAL, EVENT_ROLE.COMMAND],
    requiredFields: ['timestamp'],
    optionalFields: ['mode', 'state', 'capability', 'health'],
    canTriggerUIChange: false,
    canTriggerFlowChange: false,
    description: 'Kernel events inform about kernel state changes'
  },

  // ROLLBACK: Informacional
  [EVENT_CATEGORIES.ROLLBACK]: {
    allowedRoles: [EVENT_ROLE.INFORMATIONAL, EVENT_ROLE.OBSERVABILITY],
    forbiddenRoles: [EVENT_ROLE.DECISIONAL, EVENT_ROLE.COMMAND],
    requiredFields: ['phaseId', 'timestamp'],
    optionalFields: ['effects', 'error', 'time'],
    canTriggerUIChange: false,
    canTriggerFlowChange: false,
    description: 'Rollback events inform about rollback execution'
  }
});

// ═══════════════════════════════════════════════════════════════
// FORBIDDEN_EVENT_BEHAVIORS — Comportamentos proibidos
// ═══════════════════════════════════════════════════════════════
// Baseado no Briefing linhas 399-419, 520-527

export const FORBIDDEN_EVENT_BEHAVIORS = Object.freeze([
  {
    behavior: 'event-decides-flow',
    description: 'Evento que decide se boot continua ou para',
    violation: 'Briefing linha 758: "Se um evento decide algo → erro arquitetural"',
    examples: ['auth:ready liberando UI', 'boot:complete encerrando preloader']
  },
  {
    behavior: 'event-triggers-state-change',
    description: 'Evento que muda estado do sistema diretamente',
    violation: 'Briefing linha 754-758: "Bootstrap executa, Contratos decidem, Eventos informam"',
    examples: ['shell:ready alterando layout', 'components:ready avançando fase']
  },
  {
    behavior: 'event-as-command',
    description: 'Evento usado como comando para executar ação',
    violation: 'Briefing linha 522: "Evento informa. Comando decide."',
    examples: ['emit("start-phase-3")', 'emit("close-preloader")']
  },
  {
    behavior: 'event-with-implicit-contract',
    description: 'Evento cujo payload é assumido sem documentação',
    violation: 'Briefing linha 433-440: contratos implícitos de payload',
    examples: ['listener assume campos extras', 'mudança silenciosa quebra consumidores']
  },
  {
    behavior: 'event-from-untrusted-source',
    description: 'Evento que confia em source sem validação',
    violation: 'Briefing linha 442-450: "trusted source" implícito',
    examples: ['source === "bootstrap-v2" como lista mágica']
  }
]);

// ═══════════════════════════════════════════════════════════════
// REQUIRED_EVENT_FIELDS — Campos obrigatórios em todo evento
// ═══════════════════════════════════════════════════════════════

export const REQUIRED_EVENT_FIELDS = Object.freeze({
  ALWAYS: ['timestamp'],
  PHASE_RELATED: ['phaseId', 'timestamp'],
  MODULE_RELATED: ['moduleId', 'timestamp'],
  ERROR_RELATED: ['error', 'timestamp']
});

// ═══════════════════════════════════════════════════════════════
// isEventAllowedToDecide — Verifica se evento pode decidir fluxo
// ═══════════════════════════════════════════════════════════════
// Resposta: NUNCA. Eventos não decidem.

export function isEventAllowedToDecide(eventName: string, context?: Record<string, unknown>) {
  // Regra fundamental: eventos NUNCA decidem
  // Se algo precisa decidir, use um contrato (decision-contract.js)
  return {
    allowed: false,
    reason: 'Events are informational only. Use decision-contract.js for decisions.',
    principle: 'Briefing linha 522: "Evento informa. Comando decide."'
  };
}

// ═══════════════════════════════════════════════════════════════
// isEventInformational — Verifica se evento é apenas informativo
// ═══════════════════════════════════════════════════════════════

export function isEventInformational(eventRole: string) {
  const informationalRoles = [
    EVENT_ROLE.INFORMATIONAL,
    EVENT_ROLE.OBSERVABILITY,
    EVENT_ROLE.PROGRESS,
    EVENT_ROLE.NOTIFICATION
  ];
  
  return (informationalRoles as readonly string[]).indexOf(eventRole) !== -1;
}

// ═══════════════════════════════════════════════════════════════
// getEventCategory — Extrai categoria de um nome de evento
// ═══════════════════════════════════════════════════════════════

export function getEventCategory(eventName: string | null) {
  if (!eventName || typeof eventName !== 'string') {
    return null;
  }

  const lowerName = eventName.toLowerCase();

  if (lowerName.indexOf('pre-boot') !== -1 || lowerName.indexOf('preboot') !== -1) {
    return EVENT_CATEGORIES.PRE_BOOT;
  }
  if (lowerName.indexOf('orchestrator') !== -1) {
    return EVENT_CATEGORIES.ORCHESTRATOR;
  }
  if (lowerName.indexOf('phase') !== -1 && lowerName.indexOf('progress') === -1) {
    return EVENT_CATEGORIES.PHASE;
  }
  if (lowerName.indexOf('module') !== -1) {
    return EVENT_CATEGORIES.MODULE;
  }
  if (lowerName.indexOf('bootstrap') !== -1) {
    return EVENT_CATEGORIES.BOOTSTRAP;
  }
  if (lowerName.indexOf('progress') !== -1) {
    return EVENT_CATEGORIES.PROGRESS;
  }
  if (lowerName.indexOf('health') !== -1) {
    return EVENT_CATEGORIES.HEALTH;
  }
  if (lowerName.indexOf('degrad') !== -1) {
    return EVENT_CATEGORIES.DEGRADATION;
  }
  if (lowerName.indexOf('kernel') !== -1) {
    return EVENT_CATEGORIES.KERNEL;
  }
  if (lowerName.indexOf('rollback') !== -1) {
    return EVENT_CATEGORIES.ROLLBACK;
  }

  return null;
}

// ═══════════════════════════════════════════════════════════════
// getEventPolicy — Obtém política para categoria de evento
// ═══════════════════════════════════════════════════════════════

export function getEventPolicy(eventNameOrCategory: string) {
  let category: string | null = eventNameOrCategory;

  // Se for nome de evento, extrair categoria
  if (eventNameOrCategory && eventNameOrCategory.indexOf(':') !== -1) {
    category = getEventCategory(eventNameOrCategory);
  }

  return (category ? EVENT_POLICY[category as keyof typeof EVENT_POLICY] : null) || null;
}

// ═══════════════════════════════════════════════════════════════
// validateEventPayload — Valida payload de evento
// ═══════════════════════════════════════════════════════════════

export function validateEventPayload(eventName: string, payload: Record<string, unknown>) {
  const errors: string[] = [];
  const warnings: string[] = [];

  if (!payload || typeof payload !== 'object') {
    return {
      valid: false,
      errors: ['Payload must be an object'],
      warnings: [] as string[]
    };
  }

  // Campo timestamp é sempre obrigatório
  if (payload.timestamp === undefined) {
    errors.push('Missing required field: timestamp');
  }

  // Obter política para o evento
  const category = getEventCategory(eventName);
  const policy = category ? EVENT_POLICY[category as keyof typeof EVENT_POLICY] : null;

  if (policy) {
    // Validar campos obrigatórios da categoria
    for (let i = 0; i < policy.requiredFields.length; i++) {
      const field = policy.requiredFields[i];
      if (payload[field] === undefined) {
        errors.push('Missing required field for ' + category + ': ' + field);
      }
    }
  } else {
    warnings.push('Unknown event category for: ' + eventName);
  }

  return {
    valid: errors.length === 0,
    errors: errors,
    warnings: warnings,
    category: category,
    policy: policy ? policy.description : null
  };
}

// ═══════════════════════════════════════════════════════════════
// validateEventEmission — Valida se emissão de evento é apropriada
// ═══════════════════════════════════════════════════════════════

export function validateEventEmission(eventName: string, role: string, context?: { triggersFlowChange?: boolean; triggersUIChange?: boolean }) {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Obter política
  const category = getEventCategory(eventName);
  const policy = category ? EVENT_POLICY[category as keyof typeof EVENT_POLICY] : null;

  if (!policy) {
    warnings.push('No policy found for event: ' + eventName);
    return {
      valid: true, // Permitir eventos desconhecidos mas alertar
      errors: [] as string[],
      warnings: warnings
    };
  }

  // Verificar se role é permitido
  if ((policy.forbiddenRoles as readonly string[]).indexOf(role) !== -1) {
    errors.push('Role "' + role + '" is forbidden for ' + category + ' events');
  }

  if ((policy.allowedRoles as readonly string[]).indexOf(role) === -1) {
    warnings.push('Role "' + role + '" is not in allowed list for ' + category);
  }

  // Verificar se evento tenta decidir fluxo
  if (role === EVENT_ROLE.DECISIONAL || role === EVENT_ROLE.COMMAND) {
    errors.push('Events cannot have DECISIONAL or COMMAND role (Briefing principle)');
  }

  // Verificar contexto
  if (context) {
    if (context.triggersFlowChange && !policy.canTriggerFlowChange) {
      errors.push('Event ' + eventName + ' cannot trigger flow changes');
    }
    if (context.triggersUIChange && !policy.canTriggerUIChange) {
      warnings.push('Event ' + eventName + ' should not trigger UI changes');
    }
  }

  return {
    valid: errors.length === 0,
    errors: errors,
    warnings: warnings,
    category: category,
    policy: policy
  };
}

// ═══════════════════════════════════════════════════════════════
// createEventPayload — Factory para payload padronizado
// ═══════════════════════════════════════════════════════════════

export function createEventPayload(opts?: Record<string, unknown>) {
  if (!opts) opts = {};

  const payload: Record<string, unknown> = {
    timestamp: opts.timestamp || Date.now(),
    source: opts.source || 'bootstrap-v2'
  };

  // Copiar campos adicionais
  const reserved = ['timestamp', 'source'];
  for (const key in opts) {
    if (opts.hasOwnProperty(key) && reserved.indexOf(key) === -1) {
      payload[key] = opts[key];
    }
  }

  return payload;
}

// ═══════════════════════════════════════════════════════════════
// createInformationalEvent — Factory para evento informacional
// ═══════════════════════════════════════════════════════════════

export function createInformationalEvent(eventName: string, data?: Record<string, unknown>) {
  return {
    name: eventName,
    role: EVENT_ROLE.INFORMATIONAL,
    payload: createEventPayload(data),
    category: getEventCategory(eventName),
    emittedAt: Date.now()
  };
}

// ═══════════════════════════════════════════════════════════════
// createObservabilityEvent — Factory para evento de observabilidade
// ═══════════════════════════════════════════════════════════════

export function createObservabilityEvent(eventName: string, data?: Record<string, unknown>) {
  return {
    name: eventName,
    role: EVENT_ROLE.OBSERVABILITY,
    payload: createEventPayload(data),
    category: getEventCategory(eventName),
    emittedAt: Date.now()
  };
}

// ═══════════════════════════════════════════════════════════════
// INFO
// ═══════════════════════════════════════════════════════════════

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    principle: 'Evento informa. Comando decide.',
    briefingReference: 'Linha 522, 754-758',
    roles: Object.keys(EVENT_ROLE),
    categories: Object.keys(EVENT_CATEGORIES),
    policies: Object.keys(EVENT_POLICY).length,
    forbiddenBehaviors: FORBIDDEN_EVENT_BEHAVIORS.length
  };
}

// ═══════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════

export { MODULE_ID, VERSION };

export default {
  MODULE_ID,
  VERSION,
  EVENT_ROLE,
  EVENT_CATEGORIES,
  EVENT_POLICY,
  FORBIDDEN_EVENT_BEHAVIORS,
  REQUIRED_EVENT_FIELDS,
  isEventAllowedToDecide,
  isEventInformational,
  getEventCategory,
  getEventPolicy,
  validateEventPayload,
  validateEventEmission,
  createEventPayload,
  createInformationalEvent,
  createObservabilityEvent,
  info
};
