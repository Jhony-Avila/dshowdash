
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0)
// ═══════════════════════════════════════════════════════════════
// MODULE: overlay-kernel-rate-limiter
// PURPOSE: Overlay Kernel - Rate Limiter v1.0.0
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   isAllowed() — exported function
//   record() — exported function
//   checkAndRecord() — exported function
//   getRemaining() — exported function
//   getUsage() — exported function
//   reset() — exported function
//   configure() — exported function
//   getConfig() — exported function
//   enable() — exported function
//   disable() — exported function
//   isEnabled() — exported function
//   addBypassType() — exported function
//   removeBypassType() — exported function
//   getMetrics() — exported function
//   healthCheck() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '1.0.0';
export const MODULE_ID = 'overlay-kernel-rate-limiter';

// Configuração padrão
const DEFAULT_CONFIG = {
  maxPerSecond: 5,
  maxPerMinute: 30,
  burstAllowance: 3,
  windowMs: 1000,
  minuteWindowMs: 60000,
  bypassTypes: ['system-modal', 'error-modal', 'login-modal'],
  enabled: true
};

// Estado interno
let _config = { ...DEFAULT_CONFIG };
let _state = {
  secondWindow: [] as DynObj,
  minuteWindow: [] as DynObj,
  blocked: 0,
  allowed: 0,
  lastReset: Date.now(),
  burstUsed: 0
};

/**
 * Limpa entradas antigas das janelas de tempo
 */
function cleanupWindows() {
  const now = Date.now();
  
  // Limpar janela de segundo
  _state.secondWindow = _state.secondWindow.filter(
    (ts: DynObj) => now - ts < _config.windowMs);
  
  // Limpar janela de minuto
  _state.minuteWindow = _state.minuteWindow.filter(
    (ts: DynObj) => now - ts < _config.minuteWindowMs);
}

/**
 * Verifica se um overlay pode ser aberto baseado no rate limit
 * @param {string} typeId - Tipo do overlay
 * @param {Object} options - Opções adicionais
 * @returns {Object} Resultado da verificação
 */
export function isAllowed(typeId: string, options: { bypassRateLimit?: boolean } = {}) {
  // Se desabilitado, sempre permite
  if (!_config.enabled) {
    return { allowed: true, reason: 'rate-limiter-disabled' };
  }
  
  // Bypass para tipos críticos
  if (typeId && _config.bypassTypes.includes(typeId)) {
    return { allowed: true, reason: 'bypass-type', typeId };
  }
  
  // Bypass forçado via options
  if (options.bypassRateLimit) {
    return { allowed: true, reason: 'bypass-forced' };
  }
  
  cleanupWindows();
  
  const now = Date.now();
  const secondCount = _state.secondWindow.length;
  const minuteCount = _state.minuteWindow.length;
  
  // Verificar limite por segundo
  if (secondCount >= _config.maxPerSecond) {
    // Verificar burst allowance
    if (_state.burstUsed < _config.burstAllowance) {
      _state.burstUsed++;
      return { 
        allowed: true, 
        reason: 'burst-allowance',
        burstRemaining: _config.burstAllowance - _state.burstUsed
      };
    }
    
    _state.blocked++;
    return {
      allowed: false,
      reason: 'second-limit-exceeded',
      limit: _config.maxPerSecond,
      current: secondCount,
      retryAfter: _config.windowMs - (now - _state.secondWindow[0])
    };
  }
  
  // Verificar limite por minuto
  if (minuteCount >= _config.maxPerMinute) {
    _state.blocked++;
    return {
      allowed: false,
      reason: 'minute-limit-exceeded',
      limit: _config.maxPerMinute,
      current: minuteCount,
      retryAfter: _config.minuteWindowMs - (now - _state.minuteWindow[0])
    };
  }
  
  return { 
    allowed: true, 
    reason: 'within-limits',
    secondRemaining: _config.maxPerSecond - secondCount,
    minuteRemaining: _config.maxPerMinute - minuteCount
  };
}

/**
 * Registra uma abertura de overlay
 * @param {string} typeId - Tipo do overlay
 */
export function record(typeId: string) {
  // Não registrar tipos bypass
  if (typeId && _config.bypassTypes.includes(typeId)) {
    return;
  }
  
  const now = Date.now();
  _state.secondWindow.push(now);
  _state.minuteWindow.push(now);
  _state.allowed++;
  
  // Reset burst após período de calma (sem requests por 2 segundos)
  if (_state.secondWindow.length === 1) {
    _state.burstUsed = 0;
  }
}

/**
 * Verifica e registra em uma única operação
 * @param {string} typeId - Tipo do overlay
 * @param {Object} options - Opções
 * @returns {Object} Resultado
 */
export function checkAndRecord(typeId: string, options: { bypassRateLimit?: boolean } = {}) {
  const result = isAllowed(typeId, options);
  
  if (result.allowed) {
    record(typeId);
  }
  
  return result;
}

/**
 * Retorna quantos requests ainda podem ser feitos
 */
export function getRemaining() {
  cleanupWindows();
  
  return {
    perSecond: Math.max(0, _config.maxPerSecond - _state.secondWindow.length),
    perMinute: Math.max(0, _config.maxPerMinute - _state.minuteWindow.length),
    burstRemaining: Math.max(0, _config.burstAllowance - _state.burstUsed)
  };
}

/**
 * Retorna uso atual
 */
export function getUsage() {
  cleanupWindows();
  
  return {
    secondWindow: _state.secondWindow.length,
    minuteWindow: _state.minuteWindow.length,
    secondLimit: _config.maxPerSecond,
    minuteLimit: _config.maxPerMinute,
    secondUsagePercent: (_state.secondWindow.length / _config.maxPerSecond) * 100,
    minuteUsagePercent: (_state.minuteWindow.length / _config.maxPerMinute) * 100
  };
}

/**
 * Reseta o rate limiter
 */
export function reset() {
  _state = {
    secondWindow: [],
    minuteWindow: [],
    blocked: 0,
    allowed: 0,
    lastReset: Date.now(),
    burstUsed: 0
  };
}

/**
 * Atualiza configuração
 * @param {Object} config - Nova configuração parcial
 */
export function configure(config: DynObj) {
  if (!config || typeof config !== 'object') return false;
  
  _config = { ..._config, ...config };
  
  // Validar limites
  if (_config.maxPerSecond < 1) _config.maxPerSecond = 1;
  if (_config.maxPerMinute < 1) _config.maxPerMinute = 1;
  if (_config.burstAllowance < 0) _config.burstAllowance = 0;
  
  return true;
}

/**
 * Retorna configuração atual
 */
export function getConfig() {
  return { ..._config };
}

/**
 * Habilita o rate limiter
 */
export function enable() {
  _config.enabled = true;
}

/**
 * Desabilita o rate limiter
 */
export function disable() {
  _config.enabled = false;
}

/**
 * Verifica se está habilitado
 */
export function isEnabled() {
  return _config.enabled;
}

/**
 * Adiciona tipo ao bypass
 */
export function addBypassType(typeId: string) {
  if (!_config.bypassTypes.includes(typeId)) {
    _config.bypassTypes.push(typeId);
  }
}

/**
 * Remove tipo do bypass
 */
export function removeBypassType(typeId: string) {
  _config.bypassTypes = _config.bypassTypes.filter(t => t !== typeId);
}

/**
 * Retorna métricas
 */
export function getMetrics() {
  cleanupWindows();
  
  const total = _state.allowed + _state.blocked;
  const blockRate = total > 0 ? (_state.blocked / total) * 100 : 0;
  
  return {
    allowed: _state.allowed,
    blocked: _state.blocked,
    total,
    blockRate: `${blockRate.toFixed(1)}%`,
    currentSecondUsage: _state.secondWindow.length,
    currentMinuteUsage: _state.minuteWindow.length,
    burstUsed: _state.burstUsed,
    lastReset: _state.lastReset,
    uptime: Date.now() - _state.lastReset
  };
}

/**
 * Health check
 */
export function healthCheck() {
  cleanupWindows();
  
  const usage = getUsage();
  const checks = {
    enabled: _config.enabled,
    configValid: _config.maxPerSecond > 0 && _config.maxPerMinute > 0,
    notOverloaded: usage.secondUsagePercent < 90,
    minuteHealthy: usage.minuteUsagePercent < 80
  };
  
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  
  let status = 'HEALTHY';
  if (!checks.enabled) status = 'DEGRADED';
  else if (!checks.notOverloaded || !checks.minuteHealthy) status = 'DEGRADED';
  else if (passed < total * 0.5) status = 'UNHEALTHY';
  
  return {
    status,
    score: `${passed}/${total}`,
    checks,
    usage: {
      secondPercent: `${usage.secondUsagePercent.toFixed(0)}%`,
      minutePercent: `${usage.minuteUsagePercent.toFixed(0)}%`
    },
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}

/**
 * Info do módulo
 */
export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    enabled: _config.enabled,
    config: getConfig(),
    usage: getUsage(),
    remaining: getRemaining(),
    metrics: getMetrics(),
    timestamp: Date.now()
  };
}

// Export default
export default {
  isAllowed,
  record,
  checkAndRecord,
  getRemaining,
  getUsage,
  reset,
  configure,
  getConfig,
  enable,
  disable,
  isEnabled,
  addBypassType,
  removeBypassType,
  getMetrics,
  healthCheck,
  info,
  VERSION,
  MODULE_ID
};
