// Migrado para TypeScript: 2026-02-25
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-GOVERNANCE)
// ═══════════════════════════════════════════════════════════════
// MODULE: events.payloads.governance
// PURPOSE: Governance Events Payloads - Enterprise Strict Mode & Compliance
// ───────────────────────────────────────────────────────────────
// @contract PAYLOAD_CATALOG - Catálogo de payloads para eventos de governança
// @changelog v1.1.0-SEVERITY-COMPLETE: Adicionado payload ALERT_UNKNOWN_SEVERITY
// @changelog v1.0.0-GOVERNANCE: Initial payloads for governance events
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION: string = '1.1.0-SEVERITY-COMPLETE';
export const MODULE_ID: string = 'events.payloads.governance';

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════

/** Violation payload input data */
interface ViolationInputData {
  type?: string;
  severity?: string;
  moduleId?: string;
  module?: string;
  details?: Record<string, unknown>;
  timestamp?: number;
  strictMode?: boolean;
}

/** Created violation payload */
interface ViolationPayload {
  type: string;
  severity: string;
  moduleId: string;
  details: Record<string, unknown>;
  timestamp: number;
  strictMode: boolean;
}

/** Alert payload (base shape for validation) */
interface AlertPayload {
  timestamp: number;
  [key: string]: unknown;
}

// ═══════════════════════════════════════════════════════════════
// GOVERNANCE PAYLOADS
// ═══════════════════════════════════════════════════════════════

export const GOVERNANCE_PAYLOADS = {
  // ─────────────────────────────────────────────────────────────
  // Violation Event Payload
  // ─────────────────────────────────────────────────────────────
  VIOLATION: {
    type: 'string',          // Tipo da violação (ex: WINDOW_FALLBACK)
    severity: 'string',      // CRITICAL, HIGH, MEDIUM, LOW, INFO
    moduleId: 'string',      // ID do módulo que violou
    details: 'object',       // Detalhes adicionais
    timestamp: 'number',     // Timestamp Unix
    strictMode: 'boolean'    // Se strict mode estava ativo
  },

  // ─────────────────────────────────────────────────────────────
  // Alert Event Payload
  // ─────────────────────────────────────────────────────────────
  ALERT_CRITICAL_THRESHOLD: {
    criticalCount: 'number', // Número de violações críticas
    timestamp: 'number'
  },

  ALERT_VIOLATION_SPIKE: {
    rate: 'number',          // Taxa de violações por minuto
    trend: 'string',         // 'increasing', 'decreasing', 'stable'
    timestamp: 'number'
  },

  ALERT_MODULE_NON_COMPLIANT: {
    moduleId: 'string',
    violationCount: 'number',
    types: 'object',         // Contagem por tipo de violação
    timestamp: 'number'
  },

  ALERT_COMPLIANCE_DEGRADED: {
    previousStatus: 'string',
    currentStatus: 'string',
    scorePercentage: 'number',
    timestamp: 'number'
  },

  ALERT_UNKNOWN_SEVERITY: {
    moduleId: 'string',       // Módulo que gerou a violação com severidade desconhecida
    unknownCount: 'number',   // Quantidade acumulada de violações UNKNOWN
    timestamp: 'number'
  },

  // ─────────────────────────────────────────────────────────────
  // Report Event Payload
  // ─────────────────────────────────────────────────────────────
  COMPLIANCE_REPORT: {
    compliant: 'boolean',
    strictModeActive: 'boolean',
    totalViolations: 'number',
    criticalCount: 'number',
    highCount: 'number',
    modulesAffected: 'number',
    fallbackUsage: 'number',
    recommendations: 'array',
    timestamp: 'string'      // ISO timestamp
  },

  VIOLATION_SUMMARY: {
    total: 'number',
    byType: 'object',
    bySeverity: 'object',
    byModule: 'object',
    recentCount: 'number',
    last5Minutes: 'number',
    last15Minutes: 'number',
    last1Hour: 'number'
  },

  MODULE_METRICS: {
    moduleId: 'string',
    count: 'number',
    types: 'object',
    lastViolation: 'number'
  },

  // ─────────────────────────────────────────────────────────────
  // Health Event Payload
  // ─────────────────────────────────────────────────────────────
  HEALTH_CHECK: {
    status: 'string',        // HEALTHY, DEGRADED, UNHEALTHY, CRITICAL
    score: 'string',         // ex: '85/100'
    scorePercentage: 'number',
    checks: 'object',
    strictMode: 'boolean',
    summary: 'object',
    rate: 'object',
    topOffenders: 'array',
    recommendations: 'array',
    moduleId: 'string',
    version: 'string',
    timestamp: 'number'
  },

  // ─────────────────────────────────────────────────────────────
  // Lifecycle Event Payload
  // ─────────────────────────────────────────────────────────────
  STRICT_MODE_CHANGED: {
    enabled: 'boolean',
    previousState: 'boolean',
    source: 'string',        // Quem mudou (ex: 'bootstrap', 'devtools')
    timestamp: 'number'
  }
} as const;

/** Derived type: keys of GOVERNANCE_PAYLOADS */
export type GovernancePayloadKey = keyof typeof GOVERNANCE_PAYLOADS;

// ═══════════════════════════════════════════════════════════════
// PAYLOAD VALIDATORS
// ═══════════════════════════════════════════════════════════════

/**
 * Valida um payload de violação
 * @param payload - The payload to validate
 * @returns Whether the payload is a valid violation payload
 */
export function isValidViolationPayload(payload: unknown): boolean {
  if (!payload || typeof payload !== 'object') return false;
  const p = payload as Record<string, unknown>;
  return (
    typeof p.type === 'string' &&
    typeof p.severity === 'string' &&
    typeof p.moduleId === 'string' &&
    typeof p.timestamp === 'number'
  );
}

/**
 * Valida um payload de alerta
 * @param payload - The payload to validate
 * @returns Whether the payload is a valid alert payload
 */
export function isValidAlertPayload(payload: unknown): boolean {
  if (!payload || typeof payload !== 'object') return false;
  const p = payload as Record<string, unknown>;
  return (
    typeof p.timestamp === 'number'
  );
}

/**
 * Cria um payload de violação válido
 * @param data - Input data for violation payload
 * @returns A complete violation payload
 */
export function createViolationPayload(data: ViolationInputData): ViolationPayload {
  return {
    type: data.type || 'UNKNOWN',
    severity: data.severity || 'UNKNOWN',
    moduleId: data.moduleId || data.module || 'unknown',
    details: data.details || {},
    timestamp: data.timestamp || Date.now(),
    strictMode: data.strictMode !== undefined ? data.strictMode : false
  };
}

// ═══════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════

export const getVersion = (): string => VERSION;
export const getModuleId = (): string => MODULE_ID;

// ═══════════════════════════════════════════════════════════════
// DEFAULT EXPORT
// ═══════════════════════════════════════════════════════════════

export default {
  VERSION,
  MODULE_ID,
  GOVERNANCE_PAYLOADS,
  isValidViolationPayload,
  isValidAlertPayload,
  createViolationPayload,
  getVersion,
  getModuleId
};
