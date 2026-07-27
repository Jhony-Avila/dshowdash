// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.8.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-17/core/config
// PURPOSE: Panel-17 - Runtime Configuration
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   MAX_CONSECUTIVE_ERRORS — exported value
//   CIRCUIT_BREAKER_THRESHOLD — exported value
//   CIRCUIT_BREAKER_TIMEOUT — exported value
//   REQUEST_TIMEOUT — exported value
//   DEFAULT_PERFORMANCE_METRICS — exported value
//   ERROR_MESSAGES — exported value
//   getErrorMessage() — exported function
//   healthCheck() — exported function
//   info() — exported function
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

export const MODULE_ID = 'panel-17/core/config';
export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MAX_CONSECUTIVE_ERRORS = 3;
export const CIRCUIT_BREAKER_THRESHOLD = 5;
export const CIRCUIT_BREAKER_TIMEOUT = 30000;
export const REQUEST_TIMEOUT = 10000;
export const DEFAULT_PERFORMANCE_METRICS = Object.freeze({ mountTime: 0, avgLoadTime: 0, successRate: 0, totalRequests: 0, failedRequests: 0 });
export const ERROR_MESSAGES = Object.freeze({ 'AUTH_REQUIRED': 'Autenticação necessária', 'REQUEST_ABORTED': 'Requisição cancelada', 'REQUEST_TIMEOUT': 'Tempo esgotado', 'NETWORK_ERROR': 'Erro de rede', 'HTTP_500': 'Erro interno do servidor', 'HTTP_404': 'Endpoint não encontrado', 'CIRCUIT_BREAKER_OPEN': 'Serviço temporariamente indisponível' });
export const getErrorMessage = (errorCode: string) => ERROR_MESSAGES[errorCode as keyof typeof ERROR_MESSAGES] || 'Erro ao carregar dados';
export const healthCheck = () => { const checks = { errorsConfigured: MAX_CONSECUTIVE_ERRORS > 0, circuitBreakerConfigured: CIRCUIT_BREAKER_THRESHOLD > 0, timeoutConfigured: REQUEST_TIMEOUT > 0 }; const passed = Object.values(checks).filter(Boolean).length; const total = Object.keys(checks).length; return { status: passed === total ? 'HEALTHY' : 'DEGRADED', moduleId: MODULE_ID, version: VERSION, score: `${passed}/${total}`, checks, timestamp: Date.now() }; };
export const info = () => ({ moduleId: MODULE_ID, version: VERSION, requestTimeout: REQUEST_TIMEOUT, circuitBreakerThreshold: CIRCUIT_BREAKER_THRESHOLD });
export default { MODULE_ID, VERSION, MAX_CONSECUTIVE_ERRORS, CIRCUIT_BREAKER_THRESHOLD, CIRCUIT_BREAKER_TIMEOUT, REQUEST_TIMEOUT, DEFAULT_PERFORMANCE_METRICS, ERROR_MESSAGES, getErrorMessage, healthCheck, info };
