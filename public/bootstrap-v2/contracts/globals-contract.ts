
// Globals Contract — Contrato Formal para Uso de window.*
// @version 1.0.0
// @description Define regras, políticas e validadores para uso de globais
// @principle "window.* é exceção, não regra" (Briefing linha 775)
// @changelog v1.0.0: Criação do contrato formal de globais
//
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.0.0)
// ═══════════════════════════════════════════════════════════════
// IMPORTS: None (self-contained, defines policies)
// PROVIDES:
//   GLOBAL_REGISTRY           — Registro de globais permitidos
//   GLOBAL_ACCESS_POLICY      — Políticas de acesso
//   GLOBAL_LIFECYCLE          — Ciclo de vida dos globais
//   isGlobalAllowed()         — Verifica se global é permitido
//   isGlobalDocumented()      — Verifica se global está documentado
//   getGlobalPolicy()         — Obtém política para global
//   validateGlobalAccess()    — Valida acesso a global
//   registerGlobalUsage()     — Registra uso de global (para auditoria)
//   getGlobalUsageReport()    — Relatório de uso de globais
//   createWindowAdapter()     — Factory para adapter de window
//   info()                    — Informações do módulo
// WINDOW ACCESS: Defines policies for window.* access
// ═══════════════════════════════════════════════════════════════
'use strict';

const MODULE_ID = 'globals-contract';
const VERSION = '1.0.0';

// ═══════════════════════════════════════════════════════════════
// GLOBAL_REGISTRY — Registro oficial de globais permitidos
// ═══════════════════════════════════════════════════════════════
// Briefing linha 775-778:
// "window.* é exceção, não regra"
// "permitido apenas para APIs públicas documentadas"

export const GLOBAL_REGISTRY = Object.freeze({
  // ─────────────────────────────────────────────────────────────
  // GLOBAIS PERMITIDOS (APIs públicas documentadas)
  // ─────────────────────────────────────────────────────────────
  ALLOWED: Object.freeze({
    'EventBus': {
      description: 'Central event bus for cross-module communication',
      owner: 'core/runtime/events',
      lifecycle: 'persistent',
      apiType: 'public',
      methods: ['emit', 'on', 'off', 'once'],
      documentation: '/core/runtime/events/README.md'
    },
    'Logger': {
      description: 'Centralized logging system',
      owner: 'core/runtime/logger',
      lifecycle: 'persistent',
      apiType: 'public',
      methods: ['info', 'warn', 'error', 'debug', 'log'],
      documentation: '/core/runtime/logger/README.md'
    },
    'Kernel': {
      description: 'Application kernel with capabilities and state',
      owner: 'bootstrap-v2/kernel',
      lifecycle: 'persistent',
      apiType: 'public',
      methods: ['getCapability', 'setCapability', 'getState', 'info'],
      documentation: '/bootstrap-v2/kernel/README.md'
    },
    'ApplicationKernel': {
      description: 'Alias for Kernel (legacy compatibility)',
      owner: 'bootstrap-v2/kernel',
      lifecycle: 'persistent',
      apiType: 'legacy-alias',
      aliasOf: 'Kernel',
      documentation: '/bootstrap-v2/kernel/README.md'
    },
    'Bootstrap': {
      description: 'Bootstrap API for external consumers',
      owner: 'bootstrap-v2/loader',
      lifecycle: 'persistent',
      apiType: 'public',
      methods: ['getBootResult', 'getKernel', 'info', 'healthCheck'],
      documentation: '/bootstrap-v2/README.md'
    }
  }),

  // ─────────────────────────────────────────────────────────────
  // GLOBAIS PROIBIDOS (não devem ser usados)
  // ─────────────────────────────────────────────────────────────
  FORBIDDEN: Object.freeze({
    '__BOOT_STATE__': 'Use BootContext instead',
    '__BOOTSTRAP_INSTANCE__': 'Use Bootstrap.getBootResult() instead',
    '__KERNEL_INSTANCE__': 'Use Kernel or window.Kernel instead',
    '__DEBUG_MODE__': 'Use DebugMode module instead'
  }),

  // ─────────────────────────────────────────────────────────────
  // GLOBAIS TEMPORÁRIOS (apenas durante boot)
  // ─────────────────────────────────────────────────────────────
  TEMPORARY: Object.freeze({
    '__BOOT_LOOP_TRACKER__': {
      description: 'Boot loop detection storage',
      lifecycle: 'boot-only',
      clearedAfter: 'boot-complete'
    },
    '__PRE_BOOT_RESULT__': {
      description: 'Pre-boot phase result',
      lifecycle: 'boot-only',
      clearedAfter: 'boot-complete'
    }
  })
});

// ═══════════════════════════════════════════════════════════════
// GLOBAL_ACCESS_POLICY — Políticas de acesso
// ═══════════════════════════════════════════════════════════════

export const GLOBAL_ACCESS_POLICY = Object.freeze({
  // Quem pode LER globais
  READ: {
    allowed: ['adapters', 'ports', 'phases', 'loader'],
    restricted: ['domain', 'contracts'],
    forbidden: []
  },

  // Quem pode ESCREVER globais
  WRITE: {
    allowed: ['kernel', 'loader/global-api'],
    restricted: [],
    forbidden: ['domain', 'phases', 'contracts', 'adapters']
  },

  // Regras gerais
  RULES: Object.freeze([
    'Globais só podem ser escritos pelo owner registrado',
    'Leitura deve usar adapter quando disponível',
    'Acesso direto deve ser documentado no DEPENDENCY CONTRACT',
    'Globais temporários devem ser limpos após uso',
    'Novos globais requerem registro no GLOBAL_REGISTRY'
  ])
});

// ═══════════════════════════════════════════════════════════════
// GLOBAL_LIFECYCLE — Ciclo de vida dos globais
// ═══════════════════════════════════════════════════════════════

export const GLOBAL_LIFECYCLE = Object.freeze({
  PERSISTENT: 'persistent',       // Vive durante toda a sessão
  BOOT_ONLY: 'boot-only',         // Limpo após boot completo
  TEMPORARY: 'temporary',         // Limpo após uso específico
  DEPRECATED: 'deprecated'        // Marcado para remoção
});

// ═══════════════════════════════════════════════════════════════
// USAGE TRACKING (para auditoria)
// ═══════════════════════════════════════════════════════════════

interface UsageLogEntry {
  globalName: string;
  accessType: string;
  callerModule: string;
  timestamp: number;
  allowed: boolean;
}

let _usageLog: UsageLogEntry[] = [];
const _maxUsageLog = 500;

// ═══════════════════════════════════════════════════════════════
// isGlobalAllowed — Verifica se global é permitido
// ═══════════════════════════════════════════════════════════════

export function isGlobalAllowed(globalName: string) {
  if (!globalName || typeof globalName !== 'string') {
    return false;
  }

  // Verificar se está na lista de permitidos
  if ((GLOBAL_REGISTRY.ALLOWED as Record<string, unknown>)[globalName]) {
    return true;
  }

  // Verificar se é temporário permitido
  if ((GLOBAL_REGISTRY.TEMPORARY as Record<string, unknown>)[globalName]) {
    return true;
  }

  // Verificar se está proibido
  if ((GLOBAL_REGISTRY.FORBIDDEN as Record<string, unknown>)[globalName]) {
    return false;
  }

  // Default: não permitido (whitelist approach)
  return false;
}

// ═══════════════════════════════════════════════════════════════
// isGlobalDocumented — Verifica se global está documentado
// ═══════════════════════════════════════════════════════════════

export function isGlobalDocumented(globalName: string) {
  if (!globalName) return false;

  const allowedReg = GLOBAL_REGISTRY.ALLOWED as Record<string, { documentation?: string }>;
  const allowed = allowedReg[globalName];
  if (allowed && allowed.documentation) {
    return true;
  }

  const tempReg = GLOBAL_REGISTRY.TEMPORARY as Record<string, { description?: string }>;
  const temporary = tempReg[globalName];
  if (temporary && temporary.description) {
    return true;
  }

  return false;
}

// ═══════════════════════════════════════════════════════════════
// getGlobalPolicy — Obtém política para um global
// ═══════════════════════════════════════════════════════════════

export function getGlobalPolicy(globalName: string) {
  if (!globalName) return null;

  const allowedReg = GLOBAL_REGISTRY.ALLOWED as Record<string, { lifecycle?: string; [k: string]: unknown }>;
  const tempReg = GLOBAL_REGISTRY.TEMPORARY as Record<string, { description?: string; lifecycle?: string; clearedAfter?: string }>;
  const forbiddenReg = GLOBAL_REGISTRY.FORBIDDEN as Record<string, string>;

  // Verificar em ALLOWED
  if (allowedReg[globalName]) {
    return {
      status: 'allowed',
      details: allowedReg[globalName],
      lifecycle: allowedReg[globalName].lifecycle
    };
  }

  // Verificar em TEMPORARY
  if (tempReg[globalName]) {
    return {
      status: 'temporary',
      details: tempReg[globalName],
      lifecycle: GLOBAL_LIFECYCLE.BOOT_ONLY
    };
  }

  // Verificar em FORBIDDEN
  if (forbiddenReg[globalName]) {
    return {
      status: 'forbidden',
      reason: forbiddenReg[globalName],
      lifecycle: null as string | null
    };
  }

  return {
    status: 'unknown',
    reason: 'Global not registered in contract',
    lifecycle: null as string | null
  };
}

// ═══════════════════════════════════════════════════════════════
// validateGlobalAccess — Valida acesso a global
// ═══════════════════════════════════════════════════════════════

export function validateGlobalAccess(globalName: string, accessType: string, callerModule: string) {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Verificar se global é permitido
  if (!isGlobalAllowed(globalName)) {
    const policy = getGlobalPolicy(globalName);
    if (policy && policy.status === 'forbidden' && 'reason' in policy) {
      errors.push('Global "' + globalName + '" is forbidden: ' + policy.reason);
    } else {
      errors.push('Global "' + globalName + '" is not registered in GLOBAL_REGISTRY');
    }
  }

  // Verificar política de acesso
  const accessPolicy = GLOBAL_ACCESS_POLICY[accessType.toUpperCase() as keyof typeof GLOBAL_ACCESS_POLICY] as { allowed?: string[]; restricted?: string[]; forbidden?: string[] } | undefined;
  if (accessPolicy && callerModule) {
    // Extrair categoria do módulo (ex: "domain/boot-orchestrator" → "domain")
    const category = callerModule.split('/')[0];

    if (accessPolicy.forbidden && accessPolicy.forbidden.indexOf(category) !== -1) {
      errors.push('Module category "' + category + '" is forbidden from ' + accessType + ' access to globals');
    }

    if (accessPolicy.restricted && accessPolicy.restricted.indexOf(category) !== -1) {
      warnings.push('Module category "' + category + '" has restricted ' + accessType + ' access - use adapter instead');
    }
  }

  // Verificar documentação
  if (!isGlobalDocumented(globalName)) {
    warnings.push('Global "' + globalName + '" is not documented');
  }

  return {
    valid: errors.length === 0,
    errors: errors,
    warnings: warnings,
    globalName: globalName,
    accessType: accessType
  };
}

// ═══════════════════════════════════════════════════════════════
// registerGlobalUsage — Registra uso de global (para auditoria)
// ═══════════════════════════════════════════════════════════════

export function registerGlobalUsage(globalName: string, accessType: string, callerModule: string) {
  const entry = {
    globalName: globalName,
    accessType: accessType,
    callerModule: callerModule,
    timestamp: Date.now(),
    allowed: isGlobalAllowed(globalName)
  };

  _usageLog.push(entry);

  // Limitar tamanho do log
  if (_usageLog.length > _maxUsageLog) {
    _usageLog = _usageLog.slice(-_maxUsageLog);
  }

  return entry;
}

// ═══════════════════════════════════════════════════════════════
// getGlobalUsageReport — Relatório de uso de globais
// ═══════════════════════════════════════════════════════════════

export function getGlobalUsageReport() {
  const report: {
    totalAccesses: number;
    byGlobal: Record<string, { reads: number; writes: number }>;
    byModule: Record<string, number>;
    violations: UsageLogEntry[];
  } = {
    totalAccesses: _usageLog.length,
    byGlobal: {},
    byModule: {},
    violations: []
  };

  for (let i = 0; i < _usageLog.length; i++) {
    const entry = _usageLog[i];

    // Por global
    if (!report.byGlobal[entry.globalName]) {
      report.byGlobal[entry.globalName] = { reads: 0, writes: 0 };
    }
    if (entry.accessType === 'read') {
      report.byGlobal[entry.globalName].reads++;
    } else {
      report.byGlobal[entry.globalName].writes++;
    }

    // Por módulo
    if (!report.byModule[entry.callerModule]) {
      report.byModule[entry.callerModule] = 0;
    }
    report.byModule[entry.callerModule]++;

    // Violações
    if (!entry.allowed) {
      report.violations.push(entry);
    }
  }

  return report;
}

// ═══════════════════════════════════════════════════════════════
// clearUsageLog — Limpa log de uso
// ═══════════════════════════════════════════════════════════════

export function clearUsageLog() {
  const count = _usageLog.length;
  _usageLog = [];
  return count;
}

// ═══════════════════════════════════════════════════════════════
// createWindowAdapter — Factory para adapter de window
// ═══════════════════════════════════════════════════════════════
// Uso recomendado ao invés de acesso direto a window.*

export function createWindowAdapter(callerModule: string) {
  return {
    /**
     * get — Obtém global de window
     * @param {string} globalName - Nome do global
     * @returns {any} - Valor do global ou undefined
     */
    get: function(globalName: string) {
      // Validar acesso
      const validation = validateGlobalAccess(globalName, 'read', callerModule);
      if (!validation.valid) {
        console.warn('[globals-contract] Invalid access:', validation.errors.join(', '));
      }

      // Registrar uso
      registerGlobalUsage(globalName, 'read', callerModule);

      // Retornar valor
      if (typeof window !== 'undefined') {
        return (window as unknown as Record<string, unknown>)[globalName];
      }
      return undefined;
    },

    /**
     * has — Verifica se global existe
     * @param {string} globalName - Nome do global
     * @returns {boolean}
     */
    has: function(globalName: string) {
      if (typeof window !== 'undefined') {
        return (window as unknown as Record<string, unknown>)[globalName] !== undefined;
      }
      return false;
    },

    /**
     * getPolicy — Obtém política do global
     * @param {string} globalName - Nome do global
     * @returns {Object}
     */
    getPolicy: function(globalName: string) {
      return getGlobalPolicy(globalName);
    },

    /**
     * info — Informações do adapter
     * @returns {Object}
     */
    info: function() {
      return {
        callerModule: callerModule,
        allowedGlobals: Object.keys(GLOBAL_REGISTRY.ALLOWED),
        contractVersion: VERSION
      };
    }
  };
}

// ═══════════════════════════════════════════════════════════════
// getAllowedGlobals — Lista todos os globais permitidos
// ═══════════════════════════════════════════════════════════════

export function getAllowedGlobals() {
  return Object.keys(GLOBAL_REGISTRY.ALLOWED);
}

// ═══════════════════════════════════════════════════════════════
// getForbiddenGlobals — Lista todos os globais proibidos
// ═══════════════════════════════════════════════════════════════

export function getForbiddenGlobals() {
  return Object.keys(GLOBAL_REGISTRY.FORBIDDEN);
}

// ═══════════════════════════════════════════════════════════════
// INFO
// ═══════════════════════════════════════════════════════════════

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    principle: 'window.* é exceção, não regra',
    briefingReference: 'Linha 775-778',
    allowedGlobals: Object.keys(GLOBAL_REGISTRY.ALLOWED).length,
    forbiddenGlobals: Object.keys(GLOBAL_REGISTRY.FORBIDDEN).length,
    temporaryGlobals: Object.keys(GLOBAL_REGISTRY.TEMPORARY).length,
    usageLogSize: _usageLog.length,
    rules: GLOBAL_ACCESS_POLICY.RULES.length
  };
}

// ═══════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════

export { MODULE_ID, VERSION };

export default {
  MODULE_ID,
  VERSION,
  GLOBAL_REGISTRY,
  GLOBAL_ACCESS_POLICY,
  GLOBAL_LIFECYCLE,
  isGlobalAllowed,
  isGlobalDocumented,
  getGlobalPolicy,
  validateGlobalAccess,
  registerGlobalUsage,
  getGlobalUsageReport,
  clearUsageLog,
  createWindowAdapter,
  getAllowedGlobals,
  getForbiddenGlobals,
  info
};
