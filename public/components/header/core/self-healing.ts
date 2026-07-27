// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.2.0-ES6)
// ═══════════════════════════════════════════════════════════════
// MODULE: header/core/self-healing
// PURPOSE: Sistema de auto-recuperação de componentes com falha
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//   COMPONENT_STATUS, HEALTH_STATUS from ./constants.js
// PROVIDES:
//   init(componentsLoader, config) — inicializa com loader
//   start() — inicia monitoramento
//   stop() — para monitoramento
//   performCheck() — executa check de saúde
//   forceRecovery(componentName) — força recuperação
//   clearFailures(componentName) — limpa registro de falhas
//   getPermanentlyFailed() — lista componentes permanentemente falhos
//   getRecoveryAttempts() — tentativas de recuperação
//   onEvent(callback) — registra listener
//   getMetrics() — métricas
//   resetMetrics() — reseta métricas
//   healthCheck() — auto health check
//   info() — informações do módulo
//   DEFAULT_CONFIG — configuração padrão
//   injectPorts(p) — injeta ports
//   getPorts() — snapshot dos ports
// EMITS (eventos):
//   header:component:permanent-failure — quando componente falha permanentemente
// ═══════════════════════════════════════════════════════════════

// Header - Self Healing System
// @version 1.2.0-ES6
// @changelog v1.2.0-ES6 - Task 10.1 B06: var → const/let
// @changelog v1.1.0 - Ports auto-init, healthCheck ajustado
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { COMPONENT_STATUS, HEALTH_STATUS } from './constants.js';

export const VERSION = '1.2.0-ES6';
export const MODULE_ID = 'header/core/self-healing';

const Ports = createCorePorts({ moduleId: MODULE_ID });
let _portsInitialized = false;

function _initPorts() { if (_portsInitialized) return; Ports.init(); _portsInitialized = true; }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string,unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const _debugEnabled = () => { const cfg = _getPort('config'); return (cfg && cfg.app && cfg.app.debug) ? true : false; };
const _log = function(level: string, ...args: any[]) {const logger = _getPort('logger'); if (!logger) return; const prefix = `[${MODULE_ID}]`; if (level === 'error') { if (logger.error) logger.error(prefix, args.join(' ')); return; } if (level === 'warn') { if (logger.warn) logger.warn(prefix, args.join(' ')); return; } if (level === 'info') { if (logger.info) logger.info(prefix, args.join(' ')); return; } if (_debugEnabled() && logger.debug) logger.debug(prefix, args.join(' ')); };

const DEFAULT_CONFIG = { checkInterval: 30000, retryInterval: 15000, maxRetries: 3, cooldownPeriod: 60000, autoStart: false };
let _config = Object.assign({}, DEFAULT_CONFIG);
let _isRunning = false;
let _checkTimer: ReturnType<typeof setInterval>|null = null;
let _componentsLoader: Record<string,unknown>|null = null;
const _recoveryAttempts = new Map();
const _permanentlyFailed = new Set();
// @ts-expect-error strict migration — TS7034
const _listeners = [];
let _metrics = { checksPerformed: 0, issuesDetected: 0, recoveryAttempts: 0, successfulRecoveries: 0, failedRecoveries: 0, permanentFailures: 0, lastCheckAt: (null as unknown|null), lastRecoveryAt: (null as unknown|null) };

function init(componentsLoader: Record<string,unknown>, config: Record<string,unknown>) {
  _initPorts();
  _componentsLoader = componentsLoader;
  if (config) { _config = Object.assign({}, DEFAULT_CONFIG, config); }
  _log('info', 'SelfHealing inicializado');
  if (_config.autoStart) { start(); }
}

function start() {
  if (_isRunning) { _log('warn', 'SelfHealing já está rodando'); return; }
  _isRunning = true;
  _scheduleCheck();
  _log('info', 'SelfHealing iniciado, intervalo:', `${_config.checkInterval}ms`);
  _emitEvent('started', { timestamp: Date.now() });
}

function stop() {
  if (!_isRunning) return;
  _isRunning = false;
  if (_checkTimer) { clearTimeout(_checkTimer); _checkTimer = null; }
  _log('info', 'SelfHealing parado');
  _emitEvent('stopped', { timestamp: Date.now() });
}

function _scheduleCheck() {
  if (!_isRunning) return;
  _checkTimer = setTimeout(() => { performCheck(); _scheduleCheck(); }, _config.checkInterval);
}

function performCheck() {
  if (!_componentsLoader) { _log('warn', 'ComponentsLoader não disponível'); return Promise.resolve({ issues: [] }); }
  _metrics.checksPerformed++;
  _metrics.lastCheckAt = Date.now();
  // @ts-expect-error strict migration — TS7034
  const issues = [];
  // @ts-expect-error TS migration - TS2349
  const componentsHealth = _componentsLoader.getSubcomponentsHealth ? _componentsLoader.getSubcomponentsHealth() : {};
  Object.keys(componentsHealth).forEach(name => {
    const health = componentsHealth[name];
    if (_permanentlyFailed.has(name)) return;
    if (_isUnhealthy(health)) { issues.push({ componentName: name, status: health.status, reason: _determineReason(health), detectedAt: Date.now() }); }
  });
  if (issues.length > 0) {
    _metrics.issuesDetected += issues.length;
    _log('warn', 'Detectados', issues.length, 'componentes com problemas');
    // @ts-expect-error strict migration — TS7005
    issues.forEach(issue => { _attemptRecovery(issue); });
  }
  // @ts-expect-error strict migration — TS7005
  return Promise.resolve({ issues, timestamp: Date.now() });
}

function _isUnhealthy(health: unknown) {
  if (!health) return true;
  // @ts-expect-error TS migration - TS2339
  if (health.status === HEALTH_STATUS.UNHEALTHY) return true;
  // @ts-expect-error TS migration - TS2339
  if (health.status === COMPONENT_STATUS.FAILED) return true;
  // @ts-expect-error TS migration - TS2339
  if (health.status === COMPONENT_STATUS.TIMEOUT) return true;
  // @ts-expect-error TS migration - TS2339
  if (health.status === 'ERROR') return true;
  return false;
}

function _determineReason(health: unknown) {
  if (!health) return 'NO_HEALTH_DATA';
  // @ts-expect-error TS migration - TS2339
  if (health.status === COMPONENT_STATUS.TIMEOUT) return 'TIMEOUT';
  // @ts-expect-error TS migration - TS2339
  if (health.status === COMPONENT_STATUS.FAILED) return 'MOUNT_FAILED';
  // @ts-expect-error TS migration - TS2339
  if (health.error) return health.error;
  return 'UNHEALTHY';
}

function _attemptRecovery(issue: boolean) {
  // @ts-expect-error TS migration - TS2339
  const name = issue.componentName;
  const attempts = _recoveryAttempts.get(name) || { count: 0, lastAttempt: 0 };
  const timeSinceLastAttempt = Date.now() - attempts.lastAttempt;
  if (timeSinceLastAttempt < _config.cooldownPeriod && attempts.count > 0) { _log('debug', 'Componente', name, 'em cooldown, pulando'); return; }
  // @ts-expect-error TS migration - TS2339
  if (attempts.count >= _config.maxRetries) { _markPermanentlyFailed(name, issue.reason); return; }
  attempts.count++;
  attempts.lastAttempt = Date.now();
  _recoveryAttempts.set(name, attempts);
  _metrics.recoveryAttempts++;
  _metrics.lastRecoveryAt = Date.now();
  _log('info', 'Tentando recuperar componente:', name, '(tentativa', `${attempts.count}/${_config.maxRetries})`);
  // @ts-expect-error TS migration - TS2339
  _emitEvent('recovery:start', { componentName: name, attempt: attempts.count, reason: issue.reason });
  _performRecovery(name).then((success: boolean) => {
    if (success) { _metrics.successfulRecoveries++; _recoveryAttempts.delete(name); _log('info', 'Componente recuperado:', name); _emitEvent('recovery:success', { componentName: name, attempts: attempts.count }); }
    else { _metrics.failedRecoveries++; _log('warn', 'Falha ao recuperar componente:', name); _emitEvent('recovery:failed', { componentName: name, attempt: attempts.count }); }
  // @ts-expect-error TS migration - TS2339
  }).catch((error: unknown) => { _metrics.failedRecoveries++; _log('error', 'Erro ao recuperar componente:', name, error.message); _emitEvent('recovery:error', { componentName: name, error: error.message }); });
}

function _performRecovery(componentName: string) {
  if (!_componentsLoader || !_componentsLoader.retryComponent) { return Promise.resolve(false); }
  // @ts-expect-error TS migration - TS2349
  return _componentsLoader.retryComponent(componentName).then((instance: Record<string,unknown>) => {
    if (instance) { if (typeof instance.healthCheck === 'function') { const health = instance.healthCheck(); return health.status === HEALTH_STATUS.HEALTHY || health.status === 'HEALTHY'; } return true; }
    return false;
  }).catch(() => false);
}

function _markPermanentlyFailed(name: string, reason: string) {
  _permanentlyFailed.add(name);
  _metrics.permanentFailures++;
  _log('error', 'Componente marcado como permanentemente falho:', name, '- Razão:', reason);
  _emitEvent('permanent:failure', { componentName: name, reason, attempts: _config.maxRetries });
  const eventBus = _getPort('eventBus');
  if (eventBus && eventBus.emit) { eventBus.emit('header:component:permanent-failure', { componentName: name, reason, timestamp: Date.now() }); }
}

function forceRecovery(componentName: string) { _recoveryAttempts.delete(componentName); _permanentlyFailed.delete(componentName); return _performRecovery(componentName); }
function clearFailures(componentName: string) { if (componentName) { _recoveryAttempts.delete(componentName); _permanentlyFailed.delete(componentName); _log('info', 'Falhas limpas para:', componentName); } else { _recoveryAttempts.clear(); _permanentlyFailed.clear(); _log('info', 'Todas as falhas limpas'); } }
function getPermanentlyFailed() { return Array.from(_permanentlyFailed); }
function getRecoveryAttempts() { const result = {}; _recoveryAttempts.forEach((value, key) => { (result as Record<string,unknown>)[key as string] = value; }); return result; }

const _registeredComponents = new Map<string, { healthCheck: () => boolean; recover: () => Promise<boolean>; critical?: boolean; maxRetries?: number }>();

function register(name: string, opts: { healthCheck: () => boolean; recover: () => Promise<boolean>; critical?: boolean; maxRetries?: number }) {
  if (!name || typeof opts !== 'object') return;
  _registeredComponents.set(name, opts);
  _log('debug', 'Componente registrado:', name);
}

function unregister(componentName: string) {
  _registeredComponents.delete(componentName);
  _recoveryAttempts.delete(componentName);
  _log('debug', 'Componente desregistrado:', componentName);
}

function checkNow(componentName: string): Promise<unknown> {
  if (_registeredComponents.has(componentName)) {
    const reg = _registeredComponents.get(componentName);
    if (reg && !reg.healthCheck()) {
      _metrics.issuesDetected++;
      return reg.recover().then(ok => {
        if (ok) { _metrics.successfulRecoveries++; _metrics.recoveryAttempts++; } else { _metrics.failedRecoveries++; _metrics.recoveryAttempts++; }
        return ok;
      });
    }
    return Promise.resolve(true);
  }
  return performCheck();
}

function checkAllNow(): Promise<unknown> { return performCheck(); }

function cleanup() {
  stop();
  _registeredComponents.clear();
  _recoveryAttempts.clear();
  _permanentlyFailed.clear();
  _componentsLoader = null;
  _listeners.length = 0;
  _log('info', 'SelfHealing limpo');
}

// @ts-expect-error strict migration — TS7005
function onEvent(callback: Function) { if (typeof callback !== 'function') return () => {}; _listeners.push(callback); return () => { const idx = _listeners.indexOf(callback); if (idx > -1) _listeners.splice(idx, 1); }; }
// @ts-expect-error strict migration — TS7005
function _emitEvent(type: string, data: Record<string,unknown>) { const event = Object.assign({ type, timestamp: Date.now() }, data); _listeners.forEach(cb => { try { cb(event); } catch (e: any) { _log('error', 'Listener error:', e.message); } }); }

function getMetrics() { return Object.assign({}, _metrics); }
function resetMetrics() { _metrics = { checksPerformed: 0, issuesDetected: 0, recoveryAttempts: 0, successfulRecoveries: 0, failedRecoveries: 0, permanentFailures: 0, lastCheckAt: null, lastRecoveryAt: null }; }

function healthCheck() {
  _initPorts();
  const recoveryRate = _metrics.recoveryAttempts > 0 ? _metrics.successfulRecoveries / _metrics.recoveryAttempts : 1;
  const checks = { isRunning: _isRunning, hasComponentsLoader: !!_componentsLoader, goodRecoveryRate: recoveryRate >= 0.5 || _metrics.recoveryAttempts < 3, fewPermanentFailures: _permanentlyFailed.size < 3, portsInitialized: _portsInitialized };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed === total ? 'HEALTHY' : passed >= 3 ? 'DEGRADED' : 'UNHEALTHY', score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, recoveryRate: `${(recoveryRate * 100).toFixed(1)}%`, permanentlyFailed: getPermanentlyFailed(), version: VERSION, moduleId: MODULE_ID, timestamp: new Date().toISOString() };
}

function info() { return { version: VERSION, moduleId: MODULE_ID, isRunning: _isRunning, config: Object.assign({}, _config), metrics: getMetrics(), permanentlyFailed: getPermanentlyFailed(), recoveryAttempts: getRecoveryAttempts(), portsInitialized: _portsInitialized, healthCheck: healthCheck() }; }

export { init, start, stop, performCheck, forceRecovery, clearFailures, getPermanentlyFailed, getRecoveryAttempts, onEvent, getMetrics, resetMetrics, healthCheck, info, DEFAULT_CONFIG, register, unregister, checkNow, checkAllNow, cleanup };

export default { VERSION, MODULE_ID, init, start, stop, performCheck, forceRecovery, clearFailures, getPermanentlyFailed, getRecoveryAttempts, onEvent, getMetrics, resetMetrics, healthCheck, info, register, unregister, checkNow, checkAllNow, cleanup };
