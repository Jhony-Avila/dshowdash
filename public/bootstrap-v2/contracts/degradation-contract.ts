
// Degradation Contract — Contrato Formal de Degradação
// @version 1.0.0
// @description Define schema obrigatório, validação e factory para degradação padronizada
// @changelog v1.0.0: Criação do contrato formal de degradação
//
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.0.0)
// ═══════════════════════════════════════════════════════════════
// IMPORTS: DEGRADATION_MODES from ../boot-manifest/constants.js
// PROVIDES:
//   DEGRADATION_STATUS           — Estados de degradação válidos
//   DEGRADATION_SEVERITY         — Níveis de severidade
//   DEGRADATION_CONTRACT_FIELDS  — Campos obrigatórios/opcionais
//   createDegradationResult()    — Factory padronizada
//   validateDegradationResult()  — Validador de conformidade
//   mapModeToStatus()            — Converte mode → status
//   getSeverityForMode()         — Determina severidade por mode
//   isRecoverableMode()          — Verifica se mode é recuperável
//   isValidStatus()              — Verifica status válido
//   isValidMode()                — Verifica mode válido
//   info()                       — Informações do módulo
// WINDOW ACCESS: None
// ═══════════════════════════════════════════════════════════════
'use strict';

import { DEGRADATION_MODES } from '../boot-manifest/constants.js';

const MODULE_ID = 'degradation-contract';
const VERSION = '1.0.0';

// ═══════════════════════════════════════════════════════════════
// RE-EXPORT DEGRADATION_MODES como fonte única de verdade
// ═══════════════════════════════════════════════════════════════

export { DEGRADATION_MODES };

// ═══════════════════════════════════════════════════════════════
// DEGRADATION_STATUS — Estados de degradação padronizados
// ═══════════════════════════════════════════════════════════════
// Diferente de DEGRADATION_MODES (política de ação),
// DEGRADATION_STATUS representa o ESTADO resultante da degradação

export const DEGRADATION_STATUS = Object.freeze({
  NONE: 'NONE',                 // Sem degradação — sistema saudável
  PARTIAL: 'PARTIAL',           // Degradação parcial — algumas features indisponíveis
  SIGNIFICANT: 'SIGNIFICANT',   // Degradação significativa — funcionalidade limitada
  SEVERE: 'SEVERE',             // Degradação severa — apenas básico funciona
  TOTAL: 'TOTAL'                // Falha total — sistema não operacional
});

// ═══════════════════════════════════════════════════════════════
// DEGRADATION_SEVERITY — Níveis de severidade para notificação
// ═══════════════════════════════════════════════════════════════

export const DEGRADATION_SEVERITY = Object.freeze({
  INFO: 'info',         // Informativo — sem impacto funcional
  WARNING: 'warning',   // Aviso — impacto menor
  ERROR: 'error',       // Erro — impacto significativo
  CRITICAL: 'critical'  // Crítico — sistema comprometido
});

// ═══════════════════════════════════════════════════════════════
// CAMPOS DO CONTRATO
// ═══════════════════════════════════════════════════════════════

export const DEGRADATION_CONTRACT_FIELDS = Object.freeze({
  REQUIRED: Object.freeze(['status', 'mode', 'phaseId', 'timestamp']),
  OPTIONAL: Object.freeze(['reason', 'severity', 'recoverable', 'details', 'notified', 'error'])
});

// ═══════════════════════════════════════════════════════════════
// VALID VALUES
// ═══════════════════════════════════════════════════════════════

const VALID_STATUSES = Object.freeze([
  DEGRADATION_STATUS.NONE,
  DEGRADATION_STATUS.PARTIAL,
  DEGRADATION_STATUS.SIGNIFICANT,
  DEGRADATION_STATUS.SEVERE,
  DEGRADATION_STATUS.TOTAL
]);

const VALID_MODES = Object.freeze([
  DEGRADATION_MODES.HALT,
  DEGRADATION_MODES.DEGRADED,
  DEGRADATION_MODES.SKIP,
  DEGRADATION_MODES.ALLOW_SHELL_ONLY,
  DEGRADATION_MODES.ALLOW_LOGIN_ONLY
]);

const VALID_SEVERITIES = Object.freeze([
  DEGRADATION_SEVERITY.INFO,
  DEGRADATION_SEVERITY.WARNING,
  DEGRADATION_SEVERITY.ERROR,
  DEGRADATION_SEVERITY.CRITICAL
]);

// ═══════════════════════════════════════════════════════════════
// MODE → STATUS MAPPING
// ═══════════════════════════════════════════════════════════════
// Mapeia política de ação (mode) para estado resultante (status)

const MODE_TO_STATUS_MAP = Object.freeze({
  [DEGRADATION_MODES.HALT]: DEGRADATION_STATUS.TOTAL,
  [DEGRADATION_MODES.DEGRADED]: DEGRADATION_STATUS.SIGNIFICANT,
  [DEGRADATION_MODES.ALLOW_LOGIN_ONLY]: DEGRADATION_STATUS.SEVERE,
  [DEGRADATION_MODES.ALLOW_SHELL_ONLY]: DEGRADATION_STATUS.SEVERE,
  [DEGRADATION_MODES.SKIP]: DEGRADATION_STATUS.PARTIAL
});

// ═══════════════════════════════════════════════════════════════
// MODE → SEVERITY MAPPING
// ═══════════════════════════════════════════════════════════════

const MODE_TO_SEVERITY_MAP = Object.freeze({
  [DEGRADATION_MODES.HALT]: DEGRADATION_SEVERITY.CRITICAL,
  [DEGRADATION_MODES.DEGRADED]: DEGRADATION_SEVERITY.ERROR,
  [DEGRADATION_MODES.ALLOW_LOGIN_ONLY]: DEGRADATION_SEVERITY.ERROR,
  [DEGRADATION_MODES.ALLOW_SHELL_ONLY]: DEGRADATION_SEVERITY.WARNING,
  [DEGRADATION_MODES.SKIP]: DEGRADATION_SEVERITY.WARNING
});

// ═══════════════════════════════════════════════════════════════
// MODE → RECOVERABLE MAPPING
// ═══════════════════════════════════════════════════════════════

const MODE_RECOVERABLE_MAP = Object.freeze({
  [DEGRADATION_MODES.HALT]: false,
  [DEGRADATION_MODES.DEGRADED]: true,
  [DEGRADATION_MODES.ALLOW_LOGIN_ONLY]: true,
  [DEGRADATION_MODES.ALLOW_SHELL_ONLY]: true,
  [DEGRADATION_MODES.SKIP]: true
});

// ═══════════════════════════════════════════════════════════════
// VALIDATION FUNCTIONS
// ═══════════════════════════════════════════════════════════════

export function isValidStatus(status: string) {
  return (VALID_STATUSES as readonly string[]).indexOf(status) !== -1;
}

export function isValidMode(mode: string) {
  return (VALID_MODES as readonly string[]).indexOf(mode) !== -1;
}

export function isValidSeverity(severity: string) {
  return (VALID_SEVERITIES as readonly string[]).indexOf(severity) !== -1;
}

// ═══════════════════════════════════════════════════════════════
// MAPPING FUNCTIONS
// ═══════════════════════════════════════════════════════════════

/**
 * mapModeToStatus — Converte DEGRADATION_MODES.* para DEGRADATION_STATUS.*
 * @param {string} mode - Um valor de DEGRADATION_MODES
 * @returns {string} - Um valor de DEGRADATION_STATUS
 */
export function mapModeToStatus(mode: string | null) {
  if (!mode) return DEGRADATION_STATUS.NONE;
  const mapped = MODE_TO_STATUS_MAP[mode as keyof typeof MODE_TO_STATUS_MAP];
  return mapped || DEGRADATION_STATUS.SIGNIFICANT;
}

/**
 * getSeverityForMode — Determina severidade baseada no mode
 * @param {string} mode - Um valor de DEGRADATION_MODES
 * @returns {string} - Um valor de DEGRADATION_SEVERITY
 */
export function getSeverityForMode(mode: string | null) {
  if (!mode) return DEGRADATION_SEVERITY.INFO;
  const mapped = MODE_TO_SEVERITY_MAP[mode as keyof typeof MODE_TO_SEVERITY_MAP];
  return mapped || DEGRADATION_SEVERITY.WARNING;
}

/**
 * isRecoverableMode — Verifica se o mode permite recuperação
 * @param {string} mode - Um valor de DEGRADATION_MODES
 * @returns {boolean}
 */
export function isRecoverableMode(mode: string | null) {
  if (!mode) return true;
  const recoverable = MODE_RECOVERABLE_MAP[mode as keyof typeof MODE_RECOVERABLE_MAP];
  return recoverable !== undefined ? recoverable : true;
}

// ═══════════════════════════════════════════════════════════════
// createDegradationResult — Factory para resultado padronizado
// ═══════════════════════════════════════════════════════════════
// Uso:
//   return createDegradationResult({
//     mode: DEGRADATION_MODES.DEGRADED,
//     phaseId: 'phase-1-core',
//     reason: 'Core services failed',
//     details: { failedModules: ['logger'] }
//   });
// ═══════════════════════════════════════════════════════════════

export function createDegradationResult(opts?: { mode?: string | null; status?: string; severity?: string; phaseId?: string; timestamp?: number; reason?: string; recoverable?: boolean; details?: Record<string, unknown>; notified?: boolean; error?: string | { message?: string } }) {
  if (!opts) opts = {};

  // Mode: obrigatório para cálculos automáticos
  const mode = opts.mode || null;

  // Status: auto-calculado se não fornecido
  let status = opts.status;
  if (!status || !isValidStatus(status)) {
    status = mapModeToStatus(mode);
  }

  // Severity: auto-calculado se não fornecido
  let severity = opts.severity;
  if (!severity || !isValidSeverity(severity)) {
    severity = getSeverityForMode(mode);
  }

  // Resultado obrigatório
  const result: { status: string; mode: string | null; phaseId: string; timestamp: number; [key: string]: unknown } = {
    status: status,
    mode: mode,
    phaseId: opts.phaseId || 'unknown',
    timestamp: opts.timestamp || Date.now()
  };

  // Campos opcionais
  if (opts.reason && typeof opts.reason === 'string') {
    result.reason = opts.reason;
  }

  result.severity = severity;
  result.recoverable = opts.recoverable !== undefined ? opts.recoverable : isRecoverableMode(mode);

  if (opts.details && typeof opts.details === 'object') {
    result.details = opts.details;
  }

  result.notified = opts.notified !== undefined ? opts.notified : false;

  if (opts.error) {
    result.error = typeof opts.error === 'string' ? opts.error : opts.error.message || 'Unknown error';
  }

  return result;
}

// ═══════════════════════════════════════════════════════════════
// validateDegradationResult — Valida conformidade com contrato
// ═══════════════════════════════════════════════════════════════

export function validateDegradationResult(result: Record<string, unknown> | null) {
  const errors = [];

  if (!result || typeof result !== 'object') {
    return { valid: false, errors: ['Result must be an object'] };
  }

  // Campos obrigatórios
  if (!result.status || typeof result.status !== 'string') {
    errors.push('Missing or invalid: status (string required)');
  } else if (!isValidStatus(result.status)) {
    errors.push('Invalid status "' + result.status + '". Must be one of: ' + VALID_STATUSES.join(', '));
  }

  if (result.mode !== null && result.mode !== undefined) {
    if (typeof result.mode !== 'string') {
      errors.push('Invalid: mode must be string or null');
    } else if (!isValidMode(result.mode)) {
      errors.push('Invalid mode "' + result.mode + '". Must be one of: ' + VALID_MODES.join(', '));
    }
  }

  if (!result.phaseId || typeof result.phaseId !== 'string') {
    errors.push('Missing or invalid: phaseId (string required)');
  }

  if (!result.timestamp || typeof result.timestamp !== 'number') {
    errors.push('Missing or invalid: timestamp (number required)');
  }

  // Campos opcionais — validar tipo se presente
  if (result.reason !== undefined && typeof result.reason !== 'string') {
    errors.push('Optional field "reason" must be a string');
  }

  if (result.severity !== undefined && !isValidSeverity(result.severity as string)) {
    errors.push('Invalid severity "' + result.severity + '". Must be one of: ' + VALID_SEVERITIES.join(', '));
  }

  if (result.recoverable !== undefined && typeof result.recoverable !== 'boolean') {
    errors.push('Optional field "recoverable" must be a boolean');
  }

  if (result.details !== undefined && typeof result.details !== 'object') {
    errors.push('Optional field "details" must be an object');
  }

  if (result.notified !== undefined && typeof result.notified !== 'boolean') {
    errors.push('Optional field "notified" must be a boolean');
  }

  return { valid: errors.length === 0, errors: errors };
}

// ═══════════════════════════════════════════════════════════════
// LEGACY SUPPORT — Mapeia tipos antigos de notificação
// ═══════════════════════════════════════════════════════════════

const LEGACY_TYPE_MAP = Object.freeze({
  'boot-failed': { status: DEGRADATION_STATUS.TOTAL, severity: DEGRADATION_SEVERITY.CRITICAL },
  'critical-phase-failed': { status: DEGRADATION_STATUS.TOTAL, severity: DEGRADATION_SEVERITY.CRITICAL },
  'phase-failed': { status: DEGRADATION_STATUS.SIGNIFICANT, severity: DEGRADATION_SEVERITY.ERROR },
  'circuit-breaker-open': { status: DEGRADATION_STATUS.SIGNIFICANT, severity: DEGRADATION_SEVERITY.ERROR },
  'degraded': { status: DEGRADATION_STATUS.SIGNIFICANT, severity: DEGRADATION_SEVERITY.WARNING },
  'phase-degraded': { status: DEGRADATION_STATUS.PARTIAL, severity: DEGRADATION_SEVERITY.WARNING },
  'timeout-warning': { status: DEGRADATION_STATUS.PARTIAL, severity: DEGRADATION_SEVERITY.WARNING }
});

/**
 * mapLegacyType — Mapeia tipos legados de notificação para status/severity
 * @param {string} type - Tipo legado (ex: 'boot-failed', 'phase-degraded')
 * @returns {object} - { status, severity }
 */
export function mapLegacyType(type: string | null) {
  if (!type || typeof type !== 'string') {
    return { status: DEGRADATION_STATUS.PARTIAL, severity: DEGRADATION_SEVERITY.WARNING };
  }
  const mapped = LEGACY_TYPE_MAP[type as keyof typeof LEGACY_TYPE_MAP];
  return mapped || { status: DEGRADATION_STATUS.PARTIAL, severity: DEGRADATION_SEVERITY.WARNING };
}

// ═══════════════════════════════════════════════════════════════
// INFO
// ═══════════════════════════════════════════════════════════════

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    validStatuses: VALID_STATUSES.slice(),
    validModes: VALID_MODES.slice(),
    validSeverities: VALID_SEVERITIES.slice(),
    requiredFields: DEGRADATION_CONTRACT_FIELDS.REQUIRED.slice(),
    optionalFields: DEGRADATION_CONTRACT_FIELDS.OPTIONAL.slice(),
    modeToStatusMappings: Object.keys(MODE_TO_STATUS_MAP).length,
    legacyTypeMappings: Object.keys(LEGACY_TYPE_MAP).length
  };
}

// ═══════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════

export {
  MODULE_ID,
  VERSION,
  VALID_STATUSES,
  VALID_MODES,
  VALID_SEVERITIES
};

export default {
  MODULE_ID,
  VERSION,
  DEGRADATION_MODES,
  DEGRADATION_STATUS,
  DEGRADATION_SEVERITY,
  DEGRADATION_CONTRACT_FIELDS,
  VALID_STATUSES,
  VALID_MODES,
  VALID_SEVERITIES,
  isValidStatus,
  isValidMode,
  isValidSeverity,
  mapModeToStatus,
  getSeverityForMode,
  isRecoverableMode,
  createDegradationResult,
  validateDegradationResult,
  mapLegacyType,
  info
};
