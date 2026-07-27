// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.1.0-ES6)
// ═══════════════════════════════════════════════════════════════
// MODULE: header/core/circuit-breaker-unified
// PURPOSE: Interface unificada para MountCircuitBreaker e CircuitBreakerAPI
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//   MountCircuitBreaker from ./circuit-breaker.js
//   CircuitBreakerAPI (namespace) from ./circuit-breaker-api.js
// PROVIDES:
//   init(options) — inicializa circuit breaker unificado
//   getMountBreaker() — retorna instancia do mount breaker
//   checkMount() / recordMountFailure() / resetMount() — operacoes de mount
//   getApiBreaker(name, opts) — obtem breaker de API por componente
//   getBreaker(type, name, opts) — obtem breaker por tipo (mount/api)
//   canExecute(type, name) — verifica se tipo permite execucao
//   execute(type, name, fn, fallback) — executa com protecao
//   resetAll() — reseta todos os breakers (mount + api)
//   getAllStatus() — status consolidado de todos os breakers
//   healthCheck() — status de saude do modulo
//   info() — informacoes completas do modulo
//   injectPorts(p) / getPorts() — gestao de ports
// ═══════════════════════════════════════════════════════════════
// Header - Circuit Breaker Unified
// @version 1.1.0-ES6
// @changelog v1.1.0-ES6 - Task 10.1 B10: var → const/let
// @description Unifica MountCircuitBreaker e CircuitBreakerAPI em interface unica
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { MountCircuitBreaker } from './circuit-breaker.js';
import * as CircuitBreakerAPI from './circuit-breaker-api.js';

export const VERSION = '1.1.0-ES6';
export const MODULE_ID = 'header/core/circuit-breaker-unified';

const Ports = createCorePorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string,unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const _log = function(level: string, ...args: any[]) {const logger = _getPort('logger'); if (!logger) return; const prefix = `[${MODULE_ID}]`; if (level === 'error' && logger.error) logger.error(prefix, args.join(' ')); else if (level === 'warn' && logger.warn) logger.warn(prefix, args.join(' ')); else if (level === 'info' && logger.info) logger.info(prefix, args.join(' ')); };

const BREAKER_TYPES = { MOUNT: 'mount', API: 'api' };

let _mountBreaker: Record<string,unknown>|null = null;
const _metrics = { mountChecks: 0, apiChecks: 0, lastCheckAt: (null as unknown|null) };

export function init(options: Record<string,unknown>) {
  options = options || {};
  _initPorts();
  
  if (!_mountBreaker) {
    // @ts-expect-error strict migration — TS7009
    _mountBreaker = new MountCircuitBreaker({
      // @ts-expect-error TS migration - TS2322
      maxFailures: options.mountMaxFailures || 3,
      // @ts-expect-error TS migration - TS2322
      resetTimeout: options.mountResetTimeout || 60000
    });
  }
  
  _log('info', 'Circuit breaker unificado inicializado');
}

export function getMountBreaker() {
  if (!_mountBreaker) {
    _mountBreaker = (new (MountCircuitBreaker as unknown as { new(..._args: unknown[]): {[k:string]:Function} })());
  }
  return _mountBreaker;
}

export function checkMount() {
  _metrics.mountChecks++;
  _metrics.lastCheckAt = Date.now();
  // @ts-expect-error TS migration - TS2349
  return getMountBreaker().check();
}

export function recordMountFailure() {
  // @ts-expect-error TS migration - TS2349
  return getMountBreaker().recordFailure();
}

export function resetMount() {
  // @ts-expect-error TS migration - TS2349
  return getMountBreaker().reset();
}

export function getMountStatus() {
  // @ts-expect-error TS migration - TS2349
  return getMountBreaker().getStatus();
}

export function getApiBreaker(componentName: string, options?: Record<string, unknown>) {
  _metrics.apiChecks++;
  _metrics.lastCheckAt = Date.now();
  // @ts-expect-error strict migration — TS2345
  return CircuitBreakerAPI.getBreaker(componentName, options);
}

export function hasApiBreaker(componentName: string) {
  return CircuitBreakerAPI.hasBreaker(componentName);
}

export function removeApiBreaker(componentName: string) {
  return CircuitBreakerAPI.removeBreaker(componentName);
}

export function getAllApiBreakers() {
  return CircuitBreakerAPI.getAllBreakers();
}

export function getOpenApiBreakers() {
  return CircuitBreakerAPI.getOpenBreakers();
}

export function resetAllApi() {
  return CircuitBreakerAPI.resetAll();
}

export function getBreaker(type: string, componentName: string, options: Record<string,unknown>) {
  if (type === BREAKER_TYPES.MOUNT) {
    return getMountBreaker();
  }
  if (type === BREAKER_TYPES.API) {
    return getApiBreaker(componentName, options);
  }
  throw new Error(`Tipo de circuit breaker invalido: ${type}`);
}

export function canExecute(type: string, componentName: string) {
  if (type === BREAKER_TYPES.MOUNT) {
    try {
      checkMount();
      return true;
    } catch (e) {
      return false;
    }
  }
  if (type === BREAKER_TYPES.API && componentName) {
    const breaker = getApiBreaker(componentName);
    return breaker.canExecute();
  }
  return true;
}

export function execute(type: string, componentName: string, fn: Function, fallback: unknown) {
  if (type === BREAKER_TYPES.MOUNT) {
    try {
      checkMount();
      return Promise.resolve(fn());
    } catch (e) {
      // @ts-expect-error TS migration - TS2349
      if (fallback) return Promise.resolve(fallback(e));
      return Promise.reject(e);
    }
  }
  if (type === BREAKER_TYPES.API && componentName) {
    const breaker = getApiBreaker(componentName);
    return breaker.execute(fn, fallback);
  }
  return Promise.resolve(fn());
}

export function resetAll() {
  resetMount();
  resetAllApi();
  _log('info', 'Todos os circuit breakers resetados');
}

export function getAllStatus() {
  const mountStatus = _mountBreaker ? getMountStatus() : null;
  const apiBreakers = getAllApiBreakers();
  const openApiBreakers = getOpenApiBreakers();
  
  return {
    mount: mountStatus,
    api: {
      total: Object.keys(apiBreakers).length,
      open: openApiBreakers.length,
      breakers: apiBreakers
    },
    openBreakers: {
      mount: mountStatus && mountStatus.isOpen ? 1 : 0,
      api: openApiBreakers.length,
      total: (mountStatus && mountStatus.isOpen ? 1 : 0) + openApiBreakers.length,
      apiNames: openApiBreakers
    }
  };
}

export function getMetrics() {
  return Object.assign({}, _metrics, {
    // @ts-expect-error TS migration - TS2349
    mountMetrics: _mountBreaker ? _mountBreaker.getMetrics() : null,
    apiMetrics: CircuitBreakerAPI.getGlobalMetrics()
  });
}

export function resetMetrics() {
  _metrics.mountChecks = 0;
  _metrics.apiChecks = 0;
  _metrics.lastCheckAt = null;
  // @ts-expect-error TS migration - TS2349
  if (_mountBreaker) _mountBreaker.resetMetrics();
}

export function healthCheck() {
  // @ts-expect-error TS migration - TS2349
  const mountHealth = _mountBreaker ? _mountBreaker.healthCheck() : { status: 'UNKNOWN' };
  const apiHealth = CircuitBreakerAPI.healthCheck();
  
  const checks = {
    mountHealthy: mountHealth.status === 'HEALTHY' || mountHealth.status === 'DEGRADED',
    apiHealthy: apiHealth.status === 'HEALTHY' || apiHealth.status === 'DEGRADED',
    noMountOpen: !_mountBreaker || !_mountBreaker.isOpen,
    fewApiOpen: CircuitBreakerAPI.getOpenBreakers().length <= 2,
    portsInitialized: Ports.isInitialized()
  };
  
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  
  return {
    status: passed === total ? 'HEALTHY' : passed >= 3 ? 'DEGRADED' : 'UNHEALTHY',
    score: passed,
    maxScore: total,
    scoreDisplay: `${passed}/${total}`,
    checks,
    mountHealth,
    apiHealth,
    openBreakers: getAllStatus().openBreakers,
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: new Date().toISOString()
  };
}

export function info() {
  return {
    version: VERSION,
    moduleId: MODULE_ID,
    types: BREAKER_TYPES,
    status: getAllStatus(),
    metrics: getMetrics(),
    healthCheck: healthCheck()
  };
}

export { BREAKER_TYPES, MountCircuitBreaker };
export const CircuitBreakerAPIClass = CircuitBreakerAPI.CircuitBreakerAPI;

export default {
  VERSION,
  MODULE_ID,
  BREAKER_TYPES,
  init,
  getMountBreaker,
  checkMount,
  recordMountFailure,
  resetMount,
  getMountStatus,
  getApiBreaker,
  hasApiBreaker,
  removeApiBreaker,
  getAllApiBreakers,
  getOpenApiBreakers,
  resetAllApi,
  getBreaker,
  canExecute,
  execute,
  resetAll,
  getAllStatus,
  getMetrics,
  resetMetrics,
  healthCheck,
  info
};
