// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-health-dashboard/core/config
// PURPOSE: Panel Health Dashboard - Runtime Configuration
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   MAX_CONSECUTIVE_ERRORS — exported value
//   CIRCUIT_BREAKER_THRESHOLD — exported value
//   CIRCUIT_BREAKER_TIMEOUT — exported value
//   REQUEST_TIMEOUT — exported value
//   REFRESH_INTERVAL — exported value
//   REFRESH_INTERVAL_DEGRADED — exported value
//   DEFAULT_PERFORMANCE_METRICS — exported value
//   HEALTH_THRESHOLDS — exported value
//   ERROR_MESSAGES — exported value
//   getErrorMessage() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-health-dashboard/core/config';

export const MAX_CONSECUTIVE_ERRORS = 3;
export const CIRCUIT_BREAKER_THRESHOLD = 5;
export const CIRCUIT_BREAKER_TIMEOUT = 30000;
export const REQUEST_TIMEOUT = 15000;
export const REFRESH_INTERVAL = 30000;
export const REFRESH_INTERVAL_DEGRADED = 90000;

export const DEFAULT_PERFORMANCE_METRICS = Object.freeze({ mountTime: 0, avgLoadTime: 0, successRate: 0, totalRequests: 0, failedRequests: 0 });
export const HEALTH_THRESHOLDS = Object.freeze({ HEALTHY: 80, DEGRADED: 50, UNHEALTHY: 0 });
export const ERROR_MESSAGES = Object.freeze({ 'REQUEST_ABORTED': 'Requisição cancelada', 'NETWORK_ERROR': 'Erro de rede', 'CIRCUIT_BREAKER_OPEN': 'Serviço temporariamente indisponível' });

export function getErrorMessage(errorCode: keyof typeof ERROR_MESSAGES | string) { return (ERROR_MESSAGES as Record<string, string>)[errorCode] || 'Erro ao coletar dados'; }
export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, timestamp: Date.now() }; }

export default { VERSION, MODULE_ID, MAX_CONSECUTIVE_ERRORS, CIRCUIT_BREAKER_THRESHOLD, CIRCUIT_BREAKER_TIMEOUT, REQUEST_TIMEOUT, REFRESH_INTERVAL, DEFAULT_PERFORMANCE_METRICS, HEALTH_THRESHOLDS, ERROR_MESSAGES, getErrorMessage, info, healthCheck };
