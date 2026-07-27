// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.4.1-IMPORT-FIX)
// ═══════════════════════════════════════════════════════════════
// MODULE: header/core/components-self-healing
// PURPOSE: Integração de self-healing com o sistema de componentes
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   * as SelfHealing from ./self-healing.js
//   * as FeatureFlags from ./feature-flags.js
//   log as coreLog from ./logger.js
// PROVIDES:
//   init(componentsLoader, config) — inicializa integração
//   registerComponents() — registra componentes para self-healing
//   start() — inicia self-healing
//   stop() — para self-healing
//   checkComponent(name) — verifica componente específico
//   checkAll() — verifica todos os componentes
//   unregister(name) — remove componente do self-healing
//   cleanup() — limpa tudo
//   setEnabled(enabled) — habilita/desabilita
//   isEnabled() — verifica se está habilitado
//   getMetrics() — métricas
//   resetMetrics() — reseta métricas
//   setLogLevel(level) — define nível de log
//   healthCheck() — auto health check
//   info() — informações do módulo
// ═══════════════════════════════════════════════════════════════

// Components Self-Healing Integration
// @version 1.4.1-IMPORT-FIX
// @changelog v1.4.1-IMPORT-FIX - Fixed missing import for coreLog
// @changelog v1.4.0-ES6 - Task 10.1 B05: var → const/let
// @changelog v1.3.0 - Migrated to centralized logger from header/core/logger.js
'use strict';

import * as SelfHealingModule from './self-healing.js';
const SelfHealing: typeof SelfHealingModule = SelfHealingModule;
import * as FeatureFlags from './feature-flags.js';
import { log as coreLog } from './logger.js';

export const VERSION = '1.4.1-IMPORT-FIX';
export const MODULE_ID = 'header/core/components-self-healing';

let _componentsLoader: Record<string,unknown>|null = null;
let _initialized = false;
const _registeredComponents = new Map();
let _logLevel = 1;
const _metrics = { recoveryAttempts: 0, recoverySuccesses: 0, recoveryFailures: 0, lastRecoveryAt: (null as unknown|null) };
const _config = { enabled: true, checkInterval: 30000, maxRetries: 3, cooldownMs: 60000, criticalOnly: false };

const LOG_LEVELS = { debug: 0, info: 1, warn: 2, error: 3, none: 99 };

function _log(level: string, msg: string, data?: unknown) {
  const levelNum = (LOG_LEVELS as Record<string,unknown>)[level] || 1;
  // @ts-expect-error TS migration - TS2365
  if (levelNum < _logLevel) return;
  
  const fullMsg = `[${MODULE_ID}] ${msg}`;
  if (data !== undefined) {
    coreLog(level, fullMsg, data);
  } else {
    coreLog(level, fullMsg);
  }
}

export function setLogLevel(level: string) {
  // @ts-expect-error TS migration - TS2322
  if (typeof level === 'string') _logLevel = (LOG_LEVELS as Record<string,unknown>)[level] !== undefined ? (LOG_LEVELS as Record<string,unknown>)[level] : 1;
  else if (typeof level === 'number') _logLevel = level;
  return _logLevel;
}

function _createHealthCheck(componentName: string) {
  return () => {
    if (!_componentsLoader) return false;
    // @ts-expect-error TS migration - TS2349
    const status = _componentsLoader.getComponentStatus ? _componentsLoader.getComponentStatus(componentName) : null;
    if (!status) return false;
    return status.status === 'MOUNTED' || status.status === 'mounted';
  };
}

function _createRecoveryFn(componentName: string) {
  return () => {
    _metrics.recoveryAttempts++;
    _log('info', `Tentando recuperar componente: ${componentName}`);
    // @ts-expect-error TS migration - TS2349
    return _componentsLoader.retryComponent(componentName).then((result: unknown) => {
      if (result) { _metrics.recoverySuccesses++; _metrics.lastRecoveryAt = Date.now(); _log('info', `Componente recuperado com sucesso: ${componentName}`); return true; }
      else { _metrics.recoveryFailures++; _log('warn', `Falha ao recuperar componente: ${componentName}`); return false; }
    // @ts-expect-error TS migration - TS2339
    }).catch((error: unknown) => { _metrics.recoveryFailures++; _log('error', `Erro ao recuperar componente: ${componentName}`, error.message); return false; });
  };
}

export function init(componentsLoader: Record<string,unknown>, config: Record<string,unknown>) {
  if (_initialized) return;
  if (!componentsLoader) { _log('error', 'ComponentsLoader nao fornecido'); return; }
  _componentsLoader = componentsLoader;
  if (config) {
    // @ts-expect-error TS migration - TS2322
    if (config.checkInterval) _config.checkInterval = config.checkInterval;
    // @ts-expect-error TS migration - TS2322
    if (config.maxRetries) _config.maxRetries = config.maxRetries;
    // @ts-expect-error TS migration - TS2322
    if (config.cooldownMs) _config.cooldownMs = config.cooldownMs;
    // @ts-expect-error TS migration - TS2322
    if (config.criticalOnly !== undefined) _config.criticalOnly = config.criticalOnly;
    // @ts-expect-error TS migration - TS2345
    if (config.logLevel !== undefined) setLogLevel(config.logLevel);
  }
  if (FeatureFlags.isEnabled && !FeatureFlags.isEnabled('selfHealingEnabled')) { _log('debug', 'Self-healing desabilitado via feature flag'); _config.enabled = false; }
  SelfHealing.init(componentsLoader, { checkInterval: _config.checkInterval, maxRetries: _config.maxRetries, cooldownPeriod: _config.cooldownMs });
  _initialized = true;
  _log('info', 'Components self-healing inicializado');
}

export function registerComponents() {
  if (!_initialized || !_componentsLoader) { _log('warn', 'Nao inicializado'); return 0; }
  if (!_config.enabled) { _log('debug', 'Self-healing desabilitado'); return 0; }
  const componentsList = _componentsLoader.componentsList || [];
  let registered = 0;
  // @ts-expect-error TS migration - TS2339
  componentsList.forEach((config: Record<string,unknown>) => {
    const name = config.name;
    const criticality = config.criticality;
    if (_config.criticalOnly && criticality !== 'critical') return;
    if (_registeredComponents.has(name)) return;
    if (SelfHealing.register) {
      // @ts-expect-error TS migration - TS2345
      SelfHealing.register(name, { healthCheck: _createHealthCheck(name), recover: _createRecoveryFn(name), critical: criticality === 'critical', maxRetries: _config.maxRetries });
    }
    _registeredComponents.set(name, { registeredAt: Date.now(), criticality });
    registered++;
  });
  _log('info', `Componentes registrados para self-healing: ${registered}`);
  return registered;
}

export function start() {
  if (!_initialized) { _log('warn', 'Nao inicializado'); return; }
  if (!_config.enabled) { _log('debug', 'Self-healing desabilitado'); return; }
  registerComponents();
  SelfHealing.start();
  _log('info', 'Self-healing iniciado');
}

export function stop() { SelfHealing.stop(); _log('info', 'Self-healing parado'); }
export function checkComponent(componentName: string) { return SelfHealing.checkNow ? SelfHealing.checkNow(componentName) : Promise.resolve(); }
export function checkAll() { return SelfHealing.checkAllNow ? SelfHealing.checkAllNow() : Promise.resolve(); }
export function unregister(componentName: string) { if (SelfHealing.unregister) SelfHealing.unregister(componentName); _registeredComponents.delete(componentName); }
export function cleanup() { if (SelfHealing.cleanup) SelfHealing.cleanup(); _registeredComponents.clear(); _componentsLoader = null; _initialized = false; }
export function setEnabled(enabled: boolean) { _config.enabled = !!enabled; if (!enabled) stop(); }
export function isEnabled() { return _config.enabled && _initialized; }
export function getMetrics() { return Object.assign({}, _metrics, { registeredCount: _registeredComponents.size, selfHealingMetrics: SelfHealing.getMetrics ? SelfHealing.getMetrics() : null }); }
export function resetMetrics() { _metrics.recoveryAttempts = 0; _metrics.recoverySuccesses = 0; _metrics.recoveryFailures = 0; _metrics.lastRecoveryAt = null; }

export function healthCheck() {
  const successRate = _metrics.recoveryAttempts > 0 ? _metrics.recoverySuccesses / _metrics.recoveryAttempts : 1;
  const checks = { initialized: _initialized, enabled: _config.enabled, hasComponentsLoader: !!_componentsLoader, hasRegisteredComponents: _registeredComponents.size > 0 || !_config.enabled, goodRecoveryRate: successRate >= 0.5 || _metrics.recoveryAttempts < 3 };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed === total ? 'HEALTHY' : passed >= 3 ? 'DEGRADED' : 'UNHEALTHY', score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, recoveryRate: successRate, version: VERSION, moduleId: MODULE_ID, timestamp: new Date().toISOString() };
}

export function info() { return { version: VERSION, moduleId: MODULE_ID, initialized: _initialized, enabled: _config.enabled, config: Object.assign({}, _config), registeredComponents: Array.from(_registeredComponents.keys()), metrics: getMetrics(), healthCheck: healthCheck() }; }

export default { VERSION, MODULE_ID, init, registerComponents, start, stop, checkComponent, checkAll, unregister, cleanup, setEnabled, isEnabled, getMetrics, resetMetrics, setLogLevel, healthCheck, info };
