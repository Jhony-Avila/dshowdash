
// Boot Errors - Error Types and Handlers
// @version 2.0.1-CONTRACTS
// @changelog v2.0.1-CONTRACTS: Dependency Contract formalizado
// @description QW#18 + #28 - Tratamento de erros tipados com causa raiz
// @changelog v2.0.0-OBSERVABILITY: #28 - Registro de causa raiz em falhas
// @changelog v1.0.0-QUICKWINS: QW#18 - Tratamento de erros tipados
//
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v2.0.1)
// ═══════════════════════════════════════════════════════════════
// IMPORTS: None (self-contained)
// PROVIDES: classifyError(), getRecoveryStrategy(), createTypedError(),
//   extractRootCause(), shouldRetry(), getFallbackAction(),
//   getErrorHistory(), getErrorsByType(), getErrorsByPhase(),
//   analyzeErrorPatterns(), clearErrorHistory()
// WINDOW ACCESS: None (no window.* globals)
import { createHealthResult, HEALTH_STATUS } from '../contracts/health-contract.ts';
// ═══════════════════════════════════════════════════════════════
'use strict';

var MODULE_ID = 'boot-errors';
var VERSION = '2.1.0-HEALTH-CONTRACT';

// QW#18: Tipos de erro conhecidos
var ERROR_TYPES = {
  NETWORK: 'NetworkError',
  TIMEOUT: 'TimeoutError',
  AUTH: 'AuthError',
  MODULE_LOAD: 'ModuleLoadError',
  DEPENDENCY: 'DependencyError',
  VALIDATION: 'ValidationError',
  BOOT_LOOP: 'BootLoopError',
  CIRCUIT_BREAKER: 'CircuitBreakerError',
  UNKNOWN: 'UnknownError'
};

// QW#18: Estratégias de recuperação por tipo
var RECOVERY_STRATEGIES = {
  NetworkError: { retry: true, maxRetries: 3, backoff: true, fallback: 'offline-mode' },
  TimeoutError: { retry: true, maxRetries: 2, backoff: true, fallback: 'skip' },
  AuthError: { retry: false, fallback: 'login-redirect' },
  ModuleLoadError: { retry: true, maxRetries: 2, backoff: false, fallback: 'degraded' },
  DependencyError: { retry: false, fallback: 'abort' },
  ValidationError: { retry: false, fallback: 'abort' },
  BootLoopError: { retry: false, fallback: 'safe-mode' },
  CircuitBreakerError: { retry: false, fallback: 'degraded' },
  UnknownError: { retry: true, maxRetries: 1, backoff: false, fallback: 'degraded' }
};

// Types
interface ErrorLike {
  message?: string;
  name?: string;
  stack?: string;
  cause?: ErrorLike;
  originalError?: ErrorLike;
  innerError?: ErrorLike;
}

interface ErrorChainEntry {
  id: string;
  type: string;
  phase: string | null;
  message: string;
  rootCause: string | null;
  chainSummary: string;
  timestamp: number;
}

interface TypedError {
  id: string;
  type: string;
  originalError: ErrorLike;
  message: string;
  stack: string | null;
  phase: string | null;
  context: Record<string, unknown>;
  strategy: RecoveryStrategy;
  timestamp: number;
  recoverable: boolean;
  rootCause: CauseEntry | null;
  errorChain: CauseEntry[];
  chainDepth: number;
  chainSummary: string;
}

interface CauseEntry {
  level: number;
  name: string;
  message: string;
  type: string;
  stack: string | null;
}

interface RecoveryStrategy {
  retry?: boolean;
  maxRetries?: number;
  backoff?: boolean;
  fallback: string;
}

// #28: Armazenamento de causa raiz
var _errorChains: ErrorChainEntry[] = [];
var _maxChains = 50;

// QW#18: Classificar erro por tipo
function classifyError(error: ErrorLike): string {
  var message = (error.message || '').toLowerCase();
  var name = error.name || '';
  
  // Boot Loop errors
  if (message.indexOf('boot loop') !== -1 ||
      message.indexOf('loop detected') !== -1) {
    return ERROR_TYPES.BOOT_LOOP;
  }
  
  // Circuit Breaker errors
  if (message.indexOf('circuit') !== -1 ||
      message.indexOf('breaker') !== -1 ||
      message.indexOf('open') !== -1 && message.indexOf('circuit') !== -1) {
    return ERROR_TYPES.CIRCUIT_BREAKER;
  }
  
  // Network errors
  if (message.indexOf('network') !== -1 || 
      message.indexOf('fetch') !== -1 ||
      message.indexOf('connection') !== -1 ||
      message.indexOf('offline') !== -1 ||
      name === 'NetworkError' ||
      name === 'TypeError' && message.indexOf('failed to fetch') !== -1) {
    return ERROR_TYPES.NETWORK;
  }
  
  // Timeout errors
  if (message.indexOf('timeout') !== -1 ||
      message.indexOf('timed out') !== -1 ||
      message.indexOf('aborted') !== -1 ||
      name === 'AbortError' ||
      name === 'TimeoutError') {
    return ERROR_TYPES.TIMEOUT;
  }
  
  // Auth errors
  if (message.indexOf('auth') !== -1 ||
      message.indexOf('unauthorized') !== -1 ||
      message.indexOf('forbidden') !== -1 ||
      message.indexOf('401') !== -1 ||
      message.indexOf('403') !== -1 ||
      message.indexOf('session') !== -1 ||
      message.indexOf('token') !== -1) {
    return ERROR_TYPES.AUTH;
  }
  
  // Module load errors
  if (message.indexOf('module') !== -1 ||
      message.indexOf('import') !== -1 ||
      message.indexOf('load') !== -1 ||
      message.indexOf('script') !== -1 ||
      name === 'SyntaxError') {
    return ERROR_TYPES.MODULE_LOAD;
  }
  
  // Dependency errors
  if (message.indexOf('dependency') !== -1 ||
      message.indexOf('not met') !== -1 ||
      message.indexOf('required') !== -1) {
    return ERROR_TYPES.DEPENDENCY;
  }
  
  // Validation errors
  if (message.indexOf('validation') !== -1 ||
      message.indexOf('invalid') !== -1 ||
      message.indexOf('manifest') !== -1) {
    return ERROR_TYPES.VALIDATION;
  }
  
  return ERROR_TYPES.UNKNOWN;
}

// QW#18: Obter estratégia de recuperação
function getRecoveryStrategy(errorType: string): RecoveryStrategy {
  return (RECOVERY_STRATEGIES as Record<string, RecoveryStrategy>)[errorType] || (RECOVERY_STRATEGIES as Record<string, RecoveryStrategy>)[ERROR_TYPES.UNKNOWN];
}

// #28: Extrair causa raiz de um erro
function extractRootCause(error: ErrorLike) {
  var causes = [];
  var currentError = error;
  var maxDepth = 10;
  var depth = 0;
  
  while (currentError && depth < maxDepth) {
    causes.push({
      level: depth,
      name: currentError.name || 'Error',
      message: currentError.message || 'Unknown error',
      type: classifyError(currentError),
      stack: currentError.stack ? currentError.stack.split('\n').slice(0, 5).join('\n') : null
    });
    
    // Tentar encontrar erro encadeado
    // @ts-expect-error strict migration — TS2322
    currentError = currentError.cause || currentError.originalError || currentError.innerError || null;
    depth++;
  }
  
  return {
    rootCause: causes.length > 0 ? causes[causes.length - 1] : null,
    chain: causes,
    depth: causes.length,
    summary: causes.map(function(c) { return c.type + ': ' + c.message; }).join(' → ')
  };
}

// #28: Criar erro tipado com causa raiz
function createTypedError(originalError: ErrorLike, phaseId: string | null, context: Record<string, unknown>) {
  var errorType = classifyError(originalError);
  var strategy = getRecoveryStrategy(errorType);
  var rootCauseAnalysis = extractRootCause(originalError);
  
  var typedError = {
    id: 'err-' + Date.now().toString(36) + '-' + Math.random().toString(36).substring(2, 7),
    type: errorType,
    originalError: originalError,
    message: originalError.message || 'Unknown error',
    stack: originalError.stack || null,
    phase: phaseId || null,
    context: context || {},
    strategy: strategy,
    timestamp: Date.now(),
    recoverable: strategy.retry || strategy.fallback !== 'abort',
    // #28: Informações de causa raiz
    rootCause: rootCauseAnalysis.rootCause,
    errorChain: rootCauseAnalysis.chain,
    chainDepth: rootCauseAnalysis.depth,
    chainSummary: rootCauseAnalysis.summary
  };
  
  // #28: Registrar na cadeia de erros
  _recordErrorChain(typedError);
  
  return typedError;
}

// #28: Registrar cadeia de erros
function _recordErrorChain(typedError: TypedError) {
  _errorChains.unshift({
    id: typedError.id,
    type: typedError.type,
    phase: typedError.phase,
    message: typedError.message,
    rootCause: typedError.rootCause ? typedError.rootCause.message : null,
    chainSummary: typedError.chainSummary,
    timestamp: typedError.timestamp
  });
  
  // Limitar tamanho
  while (_errorChains.length > _maxChains) {
    _errorChains.pop();
  }
}

// #28: Obter histórico de erros
function getErrorHistory() {
  return _errorChains.slice();
}

// #28: Obter erros por tipo
function getErrorsByType(errorType: string) {
  return _errorChains.filter(function(e) { return e.type === errorType; });
}

// #28: Obter erros por fase
function getErrorsByPhase(phaseId: string) {
  return _errorChains.filter(function(e) { return e.phase === phaseId; });
}

// #28: Analisar padrões de erro
function analyzeErrorPatterns() {
  if (_errorChains.length === 0) {
    return {
      totalErrors: 0,
      byType: {} as Record<string, number>,
      byPhase: {} as Record<string, number>,
      mostCommon: null as { type: string; count: number } | null,
      recentTrend: 'NONE'
    };
  }
  
  var byType: Record<string, number> = {};
  var byPhase: Record<string, number> = {};
  
  _errorChains.forEach(function(e) {
    byType[e.type] = (byType[e.type] || 0) + 1;
    if (e.phase) {
      byPhase[e.phase] = (byPhase[e.phase] || 0) + 1;
    }
  });
  
  // Encontrar mais comum
  var mostCommonType = null;
  var maxCount = 0;
  for (var type in byType) {
    if (byType[type] > maxCount) {
      maxCount = byType[type];
      mostCommonType = type;
    }
  }
  
  // Tendência recente (últimos 5 vs anteriores)
  var recentTrend = 'STABLE';
  if (_errorChains.length >= 10) {
    var recentCount = _errorChains.slice(0, 5).length;
    var olderCount = _errorChains.slice(5, 10).length;
    if (recentCount > olderCount * 1.5) {
      recentTrend = 'INCREASING';
    } else if (recentCount < olderCount * 0.5) {
      recentTrend = 'DECREASING';
    }
  }
  
  return {
    totalErrors: _errorChains.length,
    byType: byType,
    byPhase: byPhase,
    mostCommon: mostCommonType ? { type: mostCommonType, count: maxCount } : null,
    recentTrend: recentTrend,
    lastError: _errorChains[0] || null
  };
}

// #28: Limpar histórico
function clearErrorHistory() {
  _errorChains = [];
  return true;
}

// QW#18: Verificar se deve fazer retry baseado no tipo
function shouldRetry(typedError: TypedError, attemptNumber: number) {
  var strategy = typedError.strategy;
  if (!strategy.retry) return false;
  if (attemptNumber >= (strategy.maxRetries || 1)) return false;
  return true;
}

// QW#18: Obter fallback apropriado
function getFallbackAction(typedError: TypedError) {
  return typedError.strategy.fallback || 'degraded';
}

// Info
function info() {
  var analysis = analyzeErrorPatterns();
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    errorTypes: Object.keys(ERROR_TYPES),
    strategies: Object.keys(RECOVERY_STRATEGIES),
    errorHistory: _errorChains.length,
    analysis: analysis,
    improvements: ['QW18-TypedErrors', '#28-RootCauseAnalysis']
  };
}

function healthCheck() {
  var analysis = analyzeErrorPatterns();
  var status: string = HEALTH_STATUS.HEALTHY;
  if (analysis.totalErrors >= 5) {
    status = HEALTH_STATUS.UNHEALTHY;
  } else if (analysis.totalErrors > 0) {
    status = HEALTH_STATUS.DEGRADED;
  }

  return createHealthResult({
    status: status,
    moduleId: MODULE_ID,
    version: VERSION,
    details: {
      totalErrors: analysis.totalErrors,
      mostCommonError: analysis.mostCommon,
      recentTrend: analysis.recentTrend
    }
  });
}

export {
  ERROR_TYPES,
  RECOVERY_STRATEGIES,
  classifyError,
  getRecoveryStrategy,
  createTypedError,
  extractRootCause,
  shouldRetry,
  getFallbackAction,
  getErrorHistory,
  getErrorsByType,
  getErrorsByPhase,
  analyzeErrorPatterns,
  clearErrorHistory,
  info,
  healthCheck,
  MODULE_ID,
  VERSION
};

export default {
  ERROR_TYPES: ERROR_TYPES,
  RECOVERY_STRATEGIES: RECOVERY_STRATEGIES,
  classifyError: classifyError,
  getRecoveryStrategy: getRecoveryStrategy,
  createTypedError: createTypedError,
  extractRootCause: extractRootCause,
  shouldRetry: shouldRetry,
  getFallbackAction: getFallbackAction,
  getErrorHistory: getErrorHistory,
  getErrorsByType: getErrorsByType,
  getErrorsByPhase: getErrorsByPhase,
  analyzeErrorPatterns: analyzeErrorPatterns,
  clearErrorHistory: clearErrorHistory,
  info: info,
  healthCheck: healthCheck,
  MODULE_ID: MODULE_ID,
  VERSION: VERSION
};
