// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v5.3.0-P17WI)
// ═══════════════════════════════════════════════════════════════
// MODULE: header/state/validators
// PURPOSE: Validation logic for state data structures
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
// PROVIDES:
//   validateConnectivity(data) — validate connectivity data
//   validateAlerts(data) — validate alerts data
//   validateSync(data) — validate sync data
//   validateHealth(data) — validate health data
//   validateErrors(data) — validate errors data
//   validateEnvironment(env) — validate environment string
//   validateScrolled(scrolled) — validate scrolled boolean
//   validateNetworkQuality(data) — validate network quality
//   healthCheck() — module health status
//   info() — module info
//   injectPorts(p) — inject port dependencies
//   getPorts() — return ports snapshot
// ═══════════════════════════════════════════════════════════════
// State Validators - Validation Logic Enterprise AAA
// @version 5.3.0-P17WI
// P17WI: PortsFactory/PortsProfiles
'use strict';

import { createUiPorts } from '/core/runtime/ports-profiles.js';

export const VERSION = '5.3.0-P17WI';
export const MODULE_ID = 'header/state/validators';

const Ports = createUiPorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }

export function injectPorts(p: Record<string,unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const _debugEnabled = () => _getPort('config')?.app?.debug || false;
const _log = (level: string, ...args: unknown[]) => {
  const logger = _getPort('logger');
  if (!logger) return;
  const prefix = `[${MODULE_ID}]`;
  if (level === 'error') { logger.error?.(prefix, ...args); return; }
  if (level === 'warn') { logger.warn?.(prefix, ...args); return; }
  if (level === 'info') { logger.info?.(prefix, ...args); return; }
  if (_debugEnabled()) logger.debug?.(prefix, ...args);
};

const _metrics = { validationCount: 0, errorCount: 0, lastValidationAt: (null as unknown|null) };

export function validateConnectivity(data: Record<string,unknown>) {
  _metrics.validationCount++; _metrics.lastValidationAt = Date.now();
  if (!data || typeof data !== 'object') { _metrics.errorCount++; throw new TypeError('Connectivity data deve ser um objeto'); }
  return { online: typeof data.online === 'boolean' ? data.online : true, rttMs: typeof data.rttMs === 'number' && data.rttMs >= 0 ? data.rttMs : null, lastCheckAt: typeof data.lastCheckAt === 'number' ? data.lastCheckAt : Date.now(), timeoutCount: typeof data.timeoutCount === 'number' && data.timeoutCount >= 0 ? data.timeoutCount : 0 };
}

export function validateAlerts(data: Record<string,unknown>) {
  _metrics.validationCount++; _metrics.lastValidationAt = Date.now();
  if (!data || typeof data !== 'object') { _metrics.errorCount++; throw new TypeError('Alerts data deve ser um objeto'); }
  return { critical: typeof data.critical === 'number' && data.critical >= 0 ? data.critical : 0, warning: typeof data.warning === 'number' && data.warning >= 0 ? data.warning : 0, lastCheckAt: typeof data.lastCheckAt === 'number' ? data.lastCheckAt : Date.now() };
}

export function validateSync(data: Record<string,unknown>) {
  _metrics.validationCount++; _metrics.lastValidationAt = Date.now();
  if (!data || typeof data !== 'object') { _metrics.errorCount++; throw new TypeError('Sync data deve ser um objeto'); }
  const validStatuses = ['idle', 'syncing', 'success', 'error'];
  // @ts-expect-error TS migration - TS2345
  const status = validStatuses.includes(data.status) ? data.status : 'idle';
  return { busy: typeof data.busy === 'boolean' ? data.busy : false, status, lastSyncAt: typeof data.lastSyncAt === 'number' ? data.lastSyncAt : null, failCount: typeof data.failCount === 'number' && data.failCount >= 0 ? data.failCount : 0 };
}

export function validateHealth(data: Record<string,unknown>) {
  _metrics.validationCount++; _metrics.lastValidationAt = Date.now();
  if (!data || typeof data !== 'object') { _metrics.errorCount++; throw new TypeError('Health data deve ser um objeto'); }
  const validStatuses = ['healthy', 'degraded', 'critical', 'unknown'];
  // @ts-expect-error TS migration - TS2345
  const status = validStatuses.includes(data.status) ? data.status : 'unknown';
  return { status, checks: typeof data.checks === 'object' && data.checks !== null ? data.checks : {}, responseTimeMs: typeof data.responseTimeMs === 'number' && data.responseTimeMs >= 0 ? data.responseTimeMs : null, degradedReason: typeof data.degradedReason === 'string' ? data.degradedReason : null, lastCheckAt: typeof data.lastCheckAt === 'number' ? data.lastCheckAt : Date.now() };
}

export function validateErrors(data: Record<string,unknown>) {
  _metrics.validationCount++; _metrics.lastValidationAt = Date.now();
  if (!data || typeof data !== 'object') { _metrics.errorCount++; throw new TypeError('Errors data deve ser um objeto'); }
  return { count: typeof data.count === 'number' && data.count >= 0 ? data.count : 0, lastError: typeof data.lastError === 'string' ? data.lastError : null, lastErrorAt: typeof data.lastErrorAt === 'number' ? data.lastErrorAt : null };
}

export function validateEnvironment(env: unknown) {
  _metrics.validationCount++; _metrics.lastValidationAt = Date.now();
  const validEnvs = ['SANDBOX', 'DEV', 'TEST', 'STAGE', 'PROD', 'UNKNOWN'];
  if (typeof env !== 'string' || !validEnvs.includes(env)) { _metrics.errorCount++; throw new TypeError(`Environment deve ser: ${validEnvs.join(', ')}`); }
  return env;
}

export function validateScrolled(scrolled: unknown) {
  _metrics.validationCount++; _metrics.lastValidationAt = Date.now();
  if (typeof scrolled !== 'boolean') { _metrics.errorCount++; throw new TypeError('Scrolled deve ser boolean'); }
  return scrolled;
}

export function validateNetworkQuality(data: Record<string,unknown>) {
  _metrics.validationCount++; _metrics.lastValidationAt = Date.now();
  if (!data || typeof data !== 'object') { _metrics.errorCount++; throw new TypeError('Network quality data deve ser um objeto'); }
  const validStatuses = ['online', 'degraded', 'offline'];
  // @ts-expect-error TS migration - TS2345
  const status = validStatuses.includes(data.status) ? data.status : 'unknown';
  return { rtt: typeof data.rtt === 'number' && data.rtt >= 0 ? data.rtt : null, effectiveType: typeof data.effectiveType === 'string' ? data.effectiveType : null, downlink: typeof data.downlink === 'number' && data.downlink >= 0 ? data.downlink : null, status };
}

export function getMetrics() { return { ..._metrics }; }
export function resetMetrics() { _metrics.validationCount = 0; _metrics.errorCount = 0; _metrics.lastValidationAt = null; }

export function healthCheck() {
  const logger = _getPort('logger');
  const checks = { loggerAvailable: !!logger, noExcessiveErrors: _metrics.errorCount < 100 };
  const passed = Object.values(checks).filter(Boolean).length; const total = Object.keys(checks).length;
  return { status: passed === total ? 'HEALTHY' : 'DEGRADED', score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, issues: Object.entries(checks).filter(([,v]) => !v).map(([k]) => k), version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), timestamp: new Date().toISOString() };
}

export function info() { return { version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), metrics: getMetrics(), healthCheck: healthCheck() }; }
export function getVersion() { return VERSION; }

export default { validateConnectivity, validateAlerts, validateSync, validateHealth, validateErrors, validateEnvironment, validateScrolled, validateNetworkQuality, getMetrics, resetMetrics, healthCheck, info, getVersion, VERSION, MODULE_ID };
