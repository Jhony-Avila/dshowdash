// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.3.0-STRICT-MODE)
// ═══════════════════════════════════════════════════════════════
// MODULE: sidebar:legacy-bridge
// PURPOSE: LEGACY BRIDGE - SIDEBAR ENTERPRISE (MINIMAL)
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
//   isStrict, recordViolation from /core/runtime/enterprise/strict-mode.js
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   injectPorts() — exported function
//   getPortsSnapshot() — exported function
//   applyLegacyBridge() — exported function
//   removeLegacyBridge() — exported function
//   configure() — exported function
//   getConfig() — exported function
//   getDeprecationReport() — exported function
//   clearDeprecationLog() — exported function
//   getLegacyMethods() — exported function
//   getMappingFor() — exported function
//   healthCheck() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS: (none)
// @changelog v2.3.0-STRICT-MODE - Migração NR-FULL strict mode com recordViolation
// @changelog v2.2.0-PORTSFACTORY - Migração para PortsFactory
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createUiPorts } from '/core/runtime/ports-profiles.js';
import { isStrict } from '/core/runtime/enterprise/strict-mode.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const MODULE_ID = 'sidebar:legacy-bridge';
export const VERSION = '2.4.0-P2-ENTERPRISE';

const _Ports = createUiPorts({ moduleId: MODULE_ID });
const _getPort = (name: string) => _Ports.get(name);
export const injectPorts = (p: DynObj) => _Ports.inject(p);
export const getPortsSnapshot = () => _Ports.snapshot();

// ═══════════════════════════════════════════════════════════════
// STRICT MODE RESOLUTION: Logger
// ═══════════════════════════════════════════════════════════════
function _getLogger() {
  // 1. Try Ports first
  const portLogger = _getPort('logger');
  if (portLogger) return portLogger;

  // 2. Try Core.windowAdapter
  if (typeof window !== 'undefined' && window.Core?.windowAdapter?.get) {
    const waLogger = window.Core.windowAdapter.get('Logger');
    if (waLogger) return waLogger;
  }

  // 3. In strict mode, return null (no fallback)
  // 4. Non-strict: use window.Logger with violation recording

  return null;
}

const _log = (level: string, ...args: DynObj[]) => {
  const prefix = `[${MODULE_ID}]`;
  const logger = _getLogger();
  if (logger?.[level]) { logger[level](prefix, ...args); }
  else if (!isStrict() && (level === 'error' || level === 'warn' || level === 'info')) {
    console.debug(prefix, ...args);
  }
};

const _config = { enabled: false, showWarnings: true, logDeprecations: true };
const _deprecationLog = new Map();

const LEGACY_MAPPINGS = {
  setBadge: { feature: 'badges', method: 'set', removeIn: 'v6.0.0' },
  getBadge: { feature: 'badges', method: 'get', removeIn: 'v6.0.0' },
  removeBadge: { feature: 'badges', method: 'remove', removeIn: 'v6.0.0' }
};

function _emitDeprecationWarning(legacyMethod: DynObj, mapping: DynObj) {
  if (!_config.showWarnings) return;
  const newUsage = `Sidebar.feature('${mapping.feature}').${mapping.method}()`;
  const message = `DEPRECATED: ${legacyMethod}() → Use: ${newUsage} (removing in ${mapping.removeIn})`;
  _log('warn', message);
  if (_config.logDeprecations) {
    const count = _deprecationLog.get(legacyMethod) || 0;
    _deprecationLog.set(legacyMethod, count + 1);
  }
}

function createLegacyWrapper(legacyMethod: DynObj, mapping: DynObj, featureAccessor: DynObj) {
  return (...args: DynObj[]) => {
    _emitDeprecationWarning(legacyMethod, mapping);
    const featureProxy = featureAccessor(mapping.feature);
    if (!featureProxy) { _log('error', `Feature not found: ${mapping.feature}`); return undefined; }
    const finalArgs = mapping.args ? [...mapping.args, ...args] : args;
    const method = featureProxy[mapping.method];
    if (typeof method === 'function') { return method.apply(featureProxy, finalArgs); }
    _log('warn', `Method not found: ${mapping.feature}.${mapping.method}`);
    return undefined;
  };
}

export function applyLegacyBridge(target: DynObj, featureAccessor: DynObj) {
  if (!target || !_config.enabled) {
    _log('info', `Legacy bridge DISABLED - use Sidebar.feature('x').method() API`);
    return target;
  }
  Object.keys(LEGACY_MAPPINGS).forEach(legacyMethod => {
    if (target[legacyMethod] && !target[legacyMethod]._isLegacyBridge) return;
    const mapping = (LEGACY_MAPPINGS as DynObj)[legacyMethod];
    const wrapper = createLegacyWrapper(legacyMethod, mapping, featureAccessor);
    (wrapper as any)._isLegacyBridge = true;
    (wrapper as any)._mapping = mapping;
    target[legacyMethod] = wrapper;
  });
  return target;
}

export function removeLegacyBridge(target: DynObj) {
  if (!target) return target;
  Object.keys(LEGACY_MAPPINGS).forEach(legacyMethod => {
    if (target[legacyMethod]?._isLegacyBridge) delete target[legacyMethod];
  });
  return target;
}

export function configure(options: { enabled?: boolean; showWarnings?: boolean; logDeprecations?: boolean } = {}) {
  if (typeof options.enabled === 'boolean') _config.enabled = options.enabled;
  if (typeof options.showWarnings === 'boolean') _config.showWarnings = options.showWarnings;
  if (typeof options.logDeprecations === 'boolean') _config.logDeprecations = options.logDeprecations;
  return { ..._config };
}

export function getConfig() { return { ..._config }; }

export function getDeprecationReport() {
  const entries = Array.from(_deprecationLog.entries())
    .map(([method, count]) => ({ method, count, mapping: (LEGACY_MAPPINGS as DynObj)[method] }))
    .sort((a, b) => b.count - a.count);
  return { totalCalls: entries.reduce((sum, e) => sum + e.count, 0), uniqueMethods: entries.length, methods: entries };
}

export function clearDeprecationLog() { _deprecationLog.clear(); }
export function getLegacyMethods() { return Object.keys(LEGACY_MAPPINGS); }
export function getMappingFor(legacyMethod: DynObj) { return (LEGACY_MAPPINGS as DynObj)[legacyMethod] || null; }

export function healthCheck() {
  const report = getDeprecationReport();
  const totalMappings = Object.keys(LEGACY_MAPPINGS).length;
  const checks = { bridgeDisabled: !_config.enabled, minimalMappings: totalMappings <= 10, noDeprecationCalls: report.totalCalls === 0 };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return {
    status: passed === total ? 'HEALTHY' : 'DEGRADED',
    score: { passed, total, percentage: Math.round((passed / total) * 100) },
    checks, issues: report.totalCalls > 0 ? [{ code: 'LEGACY_USAGE', severity: 'warn', message: `${report.totalCalls} legacy method call(s) detected` }] : [],
    moduleId: MODULE_ID, version: VERSION,
    portsInitialized: _Ports.isInitialized(),
    strictMode: isStrict(),
    config: { ..._config },
    stats: { totalLegacyMethods: totalMappings, deprecationCalls: report.totalCalls, uniqueMethodsCalled: report.uniqueMethods },
    timestamp: Date.now()
  };
}

export function info() {
  return {
    moduleId: MODULE_ID, version: VERSION, enabled: _config.enabled,
    portsInitialized: _Ports.isInitialized(),
    strictMode: isStrict(),
    totalMappings: Object.keys(LEGACY_MAPPINGS).length,
    message: 'Legacy bridge is DISABLED by default. Use Sidebar.feature(x).method() API.', deprecationReport: getDeprecationReport()
  };
}

export default { LEGACY_MAPPINGS, applyLegacyBridge, removeLegacyBridge, createLegacyWrapper, configure, getConfig, getDeprecationReport, clearDeprecationLog, getLegacyMethods, getMappingFor, healthCheck, info, injectPorts, getPorts: getPortsSnapshot, VERSION, MODULE_ID };
