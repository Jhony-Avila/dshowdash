// Health Contract — Contrato Formal de HealthCheck
// @version 1.0.0-ACTION4
// @description Define o schema obrigatório, validação e factory para healthCheck padronizado
// @changelog v1.0.0-ACTION4: Criação do contrato formal de health para 32+ módulos
//
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.0.0)
// ═══════════════════════════════════════════════════════════════
// IMPORTS: BOOT_HEALTH from boot-manifest/constants.js
// PROVIDES: HEALTH_STATUS, HEALTH_CONTRACT_FIELDS,
//   createHealthResult(), validateHealthResult(),
//   mapLegacyStatus(), isValidStatus()
// WINDOW ACCESS: None
// ═══════════════════════════════════════════════════════════════
'use strict';

import { BOOT_HEALTH } from '../boot-manifest/constants.js';

var MODULE_ID = 'health-contract';
var VERSION = '1.0.0-ACTION4';

// ═══════════════════════════════════════════════════════════════
// STATUS — Únicos valores permitidos (re-exporta BOOT_HEALTH)
// ═══════════════════════════════════════════════════════════════

var HEALTH_STATUS = BOOT_HEALTH;

// ═══════════════════════════════════════════════════════════════
// CAMPOS OBRIGATÓRIOS — Todo healthCheck() DEVE retornar estes
// ═══════════════════════════════════════════════════════════════

var HEALTH_CONTRACT_FIELDS = Object.freeze({
  REQUIRED: Object.freeze(['status', 'moduleId', 'version', 'timestamp']),
  OPTIONAL: Object.freeze(['checks', 'score', 'details', 'message'])
});

// ═══════════════════════════════════════════════════════════════
// VALID STATUS VALUES
// ═══════════════════════════════════════════════════════════════

var VALID_STATUSES = Object.freeze([
  BOOT_HEALTH.HEALTHY,
  BOOT_HEALTH.DEGRADED,
  BOOT_HEALTH.UNHEALTHY,
  BOOT_HEALTH.FAILED
]);

// ═══════════════════════════════════════════════════════════════
// LEGACY STATUS MAP — Mapeia status antigos para BOOT_HEALTH.*
// ═══════════════════════════════════════════════════════════════

var LEGACY_STATUS_MAP = Object.freeze({
  // Minúsculas → Maiúsculas
  'healthy':           BOOT_HEALTH.HEALTHY,
  'degraded':          BOOT_HEALTH.DEGRADED,
  'unhealthy':         BOOT_HEALTH.UNHEALTHY,
  'failed':            BOOT_HEALTH.FAILED,

  // Status customizados → BOOT_HEALTH padrão
  'initializing':      BOOT_HEALTH.DEGRADED,
  'INITIALIZING':      BOOT_HEALTH.DEGRADED,
  'unknown':           BOOT_HEALTH.DEGRADED,
  'UNKNOWN':           BOOT_HEALTH.DEGRADED,
  'CANCELLED':         BOOT_HEALTH.FAILED,
  'cancelled':         BOOT_HEALTH.FAILED,
  'OFFLINE':           BOOT_HEALTH.UNHEALTHY,
  'offline':           BOOT_HEALTH.UNHEALTHY,
  'CRITICAL':          BOOT_HEALTH.FAILED,
  'critical':          BOOT_HEALTH.FAILED,
  'NOT_INITIALIZED':   BOOT_HEALTH.DEGRADED,
  'not_initialized':   BOOT_HEALTH.DEGRADED,
  'DISABLED':          BOOT_HEALTH.DEGRADED,
  'disabled':          BOOT_HEALTH.DEGRADED,
  'NOT_EXECUTED':      BOOT_HEALTH.DEGRADED,
  'not_executed':      BOOT_HEALTH.DEGRADED,

  // Já válidos (passthrough)
  'HEALTHY':           BOOT_HEALTH.HEALTHY,
  'DEGRADED':          BOOT_HEALTH.DEGRADED,
  'UNHEALTHY':         BOOT_HEALTH.UNHEALTHY,
  'FAILED':            BOOT_HEALTH.FAILED
});

// ═══════════════════════════════════════════════════════════════
// mapLegacyStatus — Converte qualquer status legado para BOOT_HEALTH.*
// ═══════════════════════════════════════════════════════════════

function mapLegacyStatus(legacyStatus: string | null) {
  if (!legacyStatus || typeof legacyStatus !== 'string') {
    return BOOT_HEALTH.DEGRADED;
  }
  var mapped = (LEGACY_STATUS_MAP as Record<string, string>)[legacyStatus];
  if (mapped) return mapped;

  // Tenta uppercase direto
  var upper = legacyStatus.toUpperCase();
  if ((LEGACY_STATUS_MAP as Record<string, string>)[upper]) return (LEGACY_STATUS_MAP as Record<string, string>)[upper];

  // Fallback seguro
  return BOOT_HEALTH.DEGRADED;
}

// ═══════════════════════════════════════════════════════════════
// isValidStatus — Verifica se status é um BOOT_HEALTH.* válido
// ═══════════════════════════════════════════════════════════════

function isValidStatus(status: string) {
  return (VALID_STATUSES as readonly string[]).indexOf(status) !== -1;
}

// ═══════════════════════════════════════════════════════════════
// createHealthResult — Factory para criar resultado padronizado
// ═══════════════════════════════════════════════════════════════
// Uso:
//   return createHealthResult({
//     status: HEALTH_STATUS.HEALTHY,
//     moduleId: MODULE_ID,
//     version: VERSION,
//     checks: { dbConnected: true, cacheReady: false },
//     details: { activeConnections: 5 },
//     message: 'Running with cache disabled'
//   });
// ═══════════════════════════════════════════════════════════════

function createHealthResult(opts?: { status?: string; moduleId?: string; version?: string; timestamp?: number; checks?: Record<string, boolean>; details?: Record<string, unknown>; message?: string }) {
  if (!opts) opts = {};

  // Status: valida ou mapeia legado
  var status = opts.status || BOOT_HEALTH.DEGRADED;
  if (!isValidStatus(status)) {
    status = mapLegacyStatus(status);
  }

  // Resultado obrigatório
  var result: { status: string; moduleId: string; version: string; timestamp: number; checks?: Record<string, boolean>; score?: string | number; details?: Record<string, unknown>; message?: string } = {
    status: status,
    moduleId: opts.moduleId || 'unknown',
    version: opts.version || '0.0.0',
    timestamp: opts.timestamp || Date.now()
  };

  // Checks opcionais (sub-checks booleanos)
  if (opts.checks && typeof opts.checks === 'object') {
    result.checks = opts.checks;
    var keys = Object.keys(opts.checks);
    var passed = 0;
    for (var i = 0; i < keys.length; i++) {
      if (opts.checks[keys[i]]) passed++;
    }
    result.score = passed + '/' + keys.length;
  }

  // Details opcionais (dados extras do módulo)
  if (opts.details && typeof opts.details === 'object') {
    result.details = opts.details;
  }

  // Message opcional
  if (opts.message && typeof opts.message === 'string') {
    result.message = opts.message;
  }

  return result;
}

// ═══════════════════════════════════════════════════════════════
// validateHealthResult — Valida se resultado cumpre contrato
// ═══════════════════════════════════════════════════════════════

function validateHealthResult(result: Record<string, unknown> | null) {
  var errors = [];

  if (!result || typeof result !== 'object') {
    return { valid: false, errors: ['Result must be an object'] };
  }

  // Campos obrigatórios
  if (!result.status || typeof result.status !== 'string') {
    errors.push('Missing or invalid: status (string required)');
  } else if (!isValidStatus(result.status)) {
    errors.push('Invalid status "' + result.status + '". Must be one of: ' + VALID_STATUSES.join(', '));
  }

  if (!result.moduleId || typeof result.moduleId !== 'string') {
    errors.push('Missing or invalid: moduleId (string required)');
  }

  if (!result.version || typeof result.version !== 'string') {
    errors.push('Missing or invalid: version (string required)');
  }

  if (!result.timestamp || typeof result.timestamp !== 'number') {
    errors.push('Missing or invalid: timestamp (number required)');
  }

  // Checks opcionais — se presente, deve ser object
  if (result.checks !== undefined && typeof result.checks !== 'object') {
    errors.push('Optional field "checks" must be an object');
  }

  // Details opcionais — se presente, deve ser object
  if (result.details !== undefined && typeof result.details !== 'object') {
    errors.push('Optional field "details" must be an object');
  }

  // Score opcional — se presente, deve ser string no formato X/Y
  if (result.score !== undefined) {
    if (typeof result.score !== 'string' || !/^\d+\/\d+$/.test(result.score)) {
      errors.push('Optional field "score" must be string in format "X/Y"');
    }
  }

  return { valid: errors.length === 0, errors: errors };
}

// ═══════════════════════════════════════════════════════════════
// INFO
// ═══════════════════════════════════════════════════════════════

function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    validStatuses: VALID_STATUSES.slice(),
    requiredFields: HEALTH_CONTRACT_FIELDS.REQUIRED.slice(),
    optionalFields: HEALTH_CONTRACT_FIELDS.OPTIONAL.slice(),
    legacyMappings: Object.keys(LEGACY_STATUS_MAP).length
  };
}

// ═══════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════

export {
  HEALTH_STATUS,
  HEALTH_CONTRACT_FIELDS,
  VALID_STATUSES,
  LEGACY_STATUS_MAP,
  createHealthResult,
  validateHealthResult,
  mapLegacyStatus,
  isValidStatus,
  info,
  MODULE_ID,
  VERSION
};

export default {
  HEALTH_STATUS: HEALTH_STATUS,
  HEALTH_CONTRACT_FIELDS: HEALTH_CONTRACT_FIELDS,
  VALID_STATUSES: VALID_STATUSES,
  LEGACY_STATUS_MAP: LEGACY_STATUS_MAP,
  createHealthResult: createHealthResult,
  validateHealthResult: validateHealthResult,
  mapLegacyStatus: mapLegacyStatus,
  isValidStatus: isValidStatus,
  info: info,
  MODULE_ID: MODULE_ID,
  VERSION: VERSION
};
