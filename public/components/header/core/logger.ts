// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v5.6.0-P17WI)
// ═══════════════════════════════════════════════════════════════
// MODULE: header-core-logger
// PURPOSE: Logger Enterprise Adapter - logging, metricas e status de integracoes
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
// PROVIDES:
//   VERSION, MODULE_ID — identificacao do modulo
//   injectPorts(p) — injeta ports
//   getPorts() — snapshot dos ports
//   log(level, ...args) — log com nivel (error/warn/info/debug)
//   isDebug() — verifica modo debug
//   setDebug(enabled) — ativa/desativa debug
//   setDebugMode(enabled) — alias para setDebug
//   updateIntegrationsStatus() — atualiza status das integracoes
//   getMetrics() — metricas de logging
//   resetMetrics() — reseta metricas
//   resetIntegrations() — reseta status de integracoes
//   getIntegrationsStatus() — retorna status das integracoes
//   healthCheck() — health check do logger
//   info() — informacoes do modulo
//   _metrics — objeto de metricas (exportado)
//   _integrationsStatus — objeto de status de integracoes (exportado)
// ═══════════════════════════════════════════════════════════════

// Header - Logger Enterprise Adapter
// @version 5.6.0-P17WI
// P17WI: PortsFactory/PortsProfiles
'use strict';

import { createUiPorts } from '/core/runtime/ports-profiles.js';

export const VERSION = '5.6.0-P17WI';
export const MODULE_ID = 'header-core-logger';

const Ports = createUiPorts({ moduleId: MODULE_ID });

function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }

export function injectPorts(p: Record<string,unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

let _debug = false;
const _debugEnabled = () => _debug || _getPort('config')?.app?.debug || false;

export const _metrics: Record<string, any> = { logCount: 0, errorCount: 0, warnCount: 0, mountCount: 0, lastLogAt: null };
export const _integrationsStatus = { globalStateConnected: false, eventBusConnected: false, telemetryConnected: false, appShellConnected: false };

export function log(level: string, ...args: unknown[]) { _metrics.logCount++; _metrics.lastLogAt = Date.now(); if (level === 'error') _metrics.errorCount++; if (level === 'warn') _metrics.warnCount++; const logger = _getPort('logger'); if (!logger) return; const prefix = `[${MODULE_ID}]`; if (level === 'error') { logger.error?.(prefix, ...args); return; } if (level === 'warn') { logger.warn?.(prefix, ...args); return; } if (level === 'info') { logger.info?.(prefix, ...args); return; } if (_debugEnabled()) { logger.debug?.(prefix, ...args); } }

export function isDebug() { return _debugEnabled(); }
export function setDebug(enabled: boolean) { _debug = !!enabled; }
export function setDebugMode(enabled: boolean) { _debug = !!enabled; }

export function updateIntegrationsStatus() { _integrationsStatus.globalStateConnected = !!_getPort('globalState'); _integrationsStatus.eventBusConnected = !!_getPort('eventBus'); _integrationsStatus.telemetryConnected = !!_getPort('telemetryCore'); _integrationsStatus.appShellConnected = !!_getPort('appShell'); }

export function getMetrics() { return { ..._metrics }; }
export function resetMetrics() { _metrics.logCount = 0; _metrics.errorCount = 0; _metrics.warnCount = 0; _metrics.mountCount = 0; _metrics.lastLogAt = null; }
export function resetIntegrations() { _integrationsStatus.globalStateConnected = false; _integrationsStatus.eventBusConnected = false; _integrationsStatus.telemetryConnected = false; _integrationsStatus.appShellConnected = false; }
export function getIntegrationsStatus() { updateIntegrationsStatus(); return { ..._integrationsStatus }; }

export function healthCheck() { const logger = _getPort('logger'); const checks = { loggerAvailable: !!logger, noExcessiveErrors: _metrics.errorCount < 50 }; const passed = Object.values(checks).filter(Boolean).length; const total = Object.keys(checks).length; return { status: passed === total ? 'HEALTHY' : 'DEGRADED', score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), timestamp: new Date().toISOString() }; }

export function info() { updateIntegrationsStatus(); return { version: VERSION, moduleId: MODULE_ID, debug: _debugEnabled(), portsInitialized: Ports.isInitialized(), metrics: getMetrics(), integrations: { ..._integrationsStatus }, healthCheck: healthCheck() }; }

export default { log, isDebug, setDebug, setDebugMode, updateIntegrationsStatus, getMetrics, resetMetrics, resetIntegrations, getIntegrationsStatus, healthCheck, info, VERSION, MODULE_ID, _metrics, _integrationsStatus };