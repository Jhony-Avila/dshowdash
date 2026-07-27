// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v3.6.0-ES6)
// ═══════════════════════════════════════════════════════════════
// MODULE: header/core/circuit-breaker
// PURPOSE: Circuit breaker para operacoes de mount do Header
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
// PROVIDES:
//   MountCircuitBreaker(options) — constructor do circuit breaker de mount
//     .check() — verifica se circuit breaker permite execucao
//     .recordFailure() — registra falha
//     .reset() — reseta estado do breaker
//     .getStatus() — retorna estado atual
//     .healthCheck() — status de saude
//   getVersion() — retorna versao do modulo
//   injectPorts(p) / getPorts() — gestao de ports
// ═══════════════════════════════════════════════════════════════
// Header - Mount Circuit Breaker Enterprise
// @version 3.6.0-ES6
// @changelog v3.6.0-ES6 - Task 10.1 B04: var → const/let
// @changelog P17WI - Migração para PortsFactory/PortsProfiles
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';

export const VERSION = '3.6.0-ES6';
export const MODULE_ID = 'header/core/circuit-breaker';

const Ports = createCorePorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
// @ts-expect-error TS migration - TS2349
MountCircuitBreaker.prototype.execute = async function(fn: Function, fallback: unknown) { try { this.check(); } catch (e) { if (fallback) return fallback(); throw e; } try { var result = await fn(); this.recordSuccess(); return result; } catch (error) { this.recordFailure(error); if (fallback) return fallback(); throw error; } };
export function injectPorts(p: Record<string,unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const _debugEnabled = () => { const cfg = _getPort('config'); return (cfg && cfg.app && cfg.app.debug) ? true : false; };
const _log = function(level: string) { const args = Array.prototype.slice.call(arguments, 1); const logger = _getPort('logger'); if (!logger) return; const prefix = `[${MODULE_ID}]`; if (level === 'error') { if (logger.error) logger.error(prefix, args.join(' ')); return; } if (level === 'warn') { if (logger.warn) logger.warn(prefix, args.join(' ')); return; } if (_debugEnabled() && logger.debug) logger.debug(prefix, args.join(' ')); };

export function MountCircuitBreaker(this: any, options?: { maxFailures?: number; resetTimeout?: number }) {
  options = options || {};
  this.failures = 0;
  this.maxFailures = options.maxFailures || 3;
  this.isOpen = false;
  this.lastFailureTime = null;
  this.resetTimeout = options.resetTimeout || 60000;
  this._metrics = { checkCount: 0, failureCount: 0, resetCount: 0, lastCheckAt: null };
  _initPorts();

  // @ts-expect-error TS migration - TS2554
  _log('info', 'MountCircuitBreaker created');
}

MountCircuitBreaker.prototype.check = function() {
  this._metrics.checkCount++;
  this._metrics.lastCheckAt = Date.now();
  if (this.isOpen) {
    const timeSinceFailure = Date.now() - this.lastFailureTime;
    if (timeSinceFailure > this.resetTimeout) { this.reset(); return true; }
    throw new Error('Circuit breaker aberto - muitas falhas de mount recentes');
  }
  return true;
};

MountCircuitBreaker.prototype.recordFailure = function() {
  this.failures++;
  this._metrics.failureCount++;
  this.lastFailureTime = Date.now();

  // @ts-expect-error TS migration - TS2554
  if (this.failures >= this.maxFailures) { this.isOpen = true; _log('warn', 'Circuit breaker OPENED'); return true; }
  return false;
};


// @ts-expect-error TS migration - TS2554
MountCircuitBreaker.prototype.reset = function() { this.isOpen = false; this.failures = 0; this.lastFailureTime = null; this._metrics.resetCount++; _log('info', 'Circuit breaker reset'); };
MountCircuitBreaker.prototype.getStatus = function() { return { isOpen: this.isOpen, failures: this.failures, maxFailures: this.maxFailures, lastFailureTime: this.lastFailureTime }; };
MountCircuitBreaker.prototype.setDebug = (enabled: boolean) => { };
MountCircuitBreaker.prototype.getMetrics = function() { return Object.assign({}, this._metrics, this.getStatus()); };
MountCircuitBreaker.prototype.resetMetrics = function() { const self = this; const keys = Object.keys(this._metrics); for (let i = 0; i < keys.length; i++) { const k = keys[i]; self._metrics[k] = typeof self._metrics[k] === 'number' ? 0 : null; } };

MountCircuitBreaker.prototype.healthCheck = function() {
  const checks = { notOpen: !this.isOpen, belowMaxFailures: this.failures < this.maxFailures, hasResetTimeout: this.resetTimeout > 0, portsInitialized: Ports.isInitialized() };
  const checkKeys = Object.keys(checks);
  let passed = 0;
  for (let i = 0; i < checkKeys.length; i++) { if ((checks as Record<string,unknown>)[checkKeys[i]]) passed++; }
  const total = checkKeys.length;
  const issues = [];
  for (let j = 0; j < checkKeys.length; j++) { if (!(checks as Record<string,unknown>)[checkKeys[j]]) issues.push(checkKeys[j]); }
  return { status: passed === total ? 'HEALTHY' : passed >= total - 1 ? 'DEGRADED' : 'UNHEALTHY', score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, issues, version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), timestamp: new Date().toISOString() };
};

MountCircuitBreaker.prototype.info = function() { return { version: VERSION, moduleId: MODULE_ID, metrics: this.getMetrics(), portsInitialized: Ports.isInitialized(), healthCheck: this.healthCheck() }; };
MountCircuitBreaker.prototype.getVersion = () => VERSION;

export function getVersion() { return VERSION; }

function destroy() { }
export default MountCircuitBreaker;
