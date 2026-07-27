// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v6.1.0-ES6)
// ═══════════════════════════════════════════════════════════════
// MODULE: header/core/environment
// PURPOSE: Deteccao de ambiente (Sandbox/Test/Prod) com cache e metricas
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createUiPorts from /core/runtime/ports-profiles.js
// PROVIDES:
//   EnvironmentDetector — objeto principal com todas as funcoes
//   detect(options) — detecta ambiente atual com cache
//   detectSimple() — retorna string do ambiente
//   isLocal() / isTest() / isProd() / isSecure() — checks booleanos
//   getMetadata() — retorna metadata do ambiente
//   invalidateCache() — limpa cache de deteccao
//   matches(env) — compara com ambiente esperado
//   healthCheck() — status de saude do modulo
//   info() — informacoes completas do modulo
//   injectPorts(p) / getPorts() — gestao de ports
// WINDOW ACCESS:
//   window.location (hostname, protocol, port)
//   window.Environment (Environment Manager)
// ═══════════════════════════════════════════════════════════════
// Header - Environment Presentation Layer Enterprise
// @version 6.1.0-ES6
// @changelog v6.1.0-ES6 - Task 10.1 B03: var → const/let
'use strict';

import { createUiPorts } from '/core/runtime/ports-profiles.js';

const VERSION = '6.1.0-ES6';
const MODULE_ID = 'header.core.environment';

const hasWindow = typeof window !== 'undefined';

const Ports = createUiPorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
function injectPorts(p: Record<string,unknown>) { return Ports.inject(p); }
function getPorts() { return Ports.snapshot(); }

function _debugEnabled() { const cfg = _getPort('config'); return cfg && cfg.app && cfg.app.debug || false; }

function _log(level: 'error' | 'warn' | 'info' | 'debug', ...args: any[]) { const logger = _getPort('logger'); if (!logger) return; if (level === 'error' && logger.error) { logger.error.apply(logger, [`[${MODULE_ID}]`].concat(args)); return; } if (level === 'warn' && logger.warn) { logger.warn.apply(logger, [`[${MODULE_ID}]`].concat(args)); return; } if (level === 'info' && logger.info) { logger.info.apply(logger, [`[${MODULE_ID}]`].concat(args)); return; } if (_debugEnabled() && logger.debug) logger.debug.apply(logger, [`[${MODULE_ID}]`].concat(args)); }

function _getLocationInfo() { if (!hasWindow || !window.location) return { hostname: '', protocol: 'https:', port: '' }; return { hostname: window.location.hostname, protocol: window.location.protocol, port: window.location.port }; }

const ENVIRONMENTS = Object.freeze({ SANDBOX: 'SANDBOX', TEST: 'TEST', PROD: 'PROD', UNKNOWN: 'UNKNOWN' });
const METADATA = Object.freeze({ SANDBOX: { name: 'Sandbox', color: '#FFA500', icon: '🔧', description: 'Ambiente de desenvolvimento', safety: 'high' }, TEST: { name: 'Test/Staging', color: '#FFC107', icon: '⚠️', description: 'Ambiente de testes', safety: 'medium' }, PROD: { name: 'Production', color: '#4CAF50', icon: '✅', description: 'Ambiente de producao', safety: 'low' }, UNKNOWN: { name: 'Unknown', color: '#9E9E9E', icon: '❓', description: 'Ambiente nao identificado', safety: 'unknown' } });

let _cache: Record<string,unknown>|null = null;
let _metrics = { detectCount: 0, cacheHitCount: 0, lastDetectAt: (null as unknown|null) };

function _mapFromEnvManager(envManagerEnv: unknown) { const mapping = { 'SANDBOX': ENVIRONMENTS.SANDBOX, 'DEV': ENVIRONMENTS.SANDBOX, 'TEST': ENVIRONMENTS.TEST, 'STAGE': ENVIRONMENTS.TEST, 'PROD': ENVIRONMENTS.PROD, 'UNKNOWN': ENVIRONMENTS.UNKNOWN }; return (mapping as Record<string,unknown>)[envManagerEnv as string] || ENVIRONMENTS.UNKNOWN; }


// @ts-expect-error TS migration - TS2339
function detect(options?: { forceRefresh?: boolean }) { if (!options) options = {}; const forceRefresh = options.forceRefresh || false; _metrics.detectCount++; _metrics.lastDetectAt = Date.now(); if (!forceRefresh && _cache) { _metrics.cacheHitCount++; return _cache; } const loc = _getLocationInfo(); const hostname = loc.hostname; const protocol = loc.protocol; const port = loc.port; const envManager = hasWindow ? window.Environment : null; if (envManager) { const envManagerEnv = envManager.get('environment'); const mappedEnv = _mapFromEnvManager(envManagerEnv); const detection = { environment: mappedEnv, hostname, protocol, port, metadata: METADATA[mappedEnv], isLocal: mappedEnv === ENVIRONMENTS.SANDBOX, isTest: mappedEnv === ENVIRONMENTS.TEST, isProd: mappedEnv === ENVIRONMENTS.PROD, isSecure: protocol === 'https:', detectedAt: Date.now(), detectionMethod: 'environment-manager' }; _cache = detection; _log('debug', 'Environment detected via EnvManager:', mappedEnv); return detection; } _log('info', 'Environment Manager nao disponivel - usando fallback'); const fallbackEnv = ENVIRONMENTS.UNKNOWN; const detection = { environment: fallbackEnv, hostname, protocol, port, metadata: METADATA[fallbackEnv], isLocal: false, isTest: false, isProd: false, isSecure: protocol === 'https:', detectedAt: Date.now(), detectionMethod: 'fallback-no-env-manager' }; _cache = detection; return detection; }

function detectSimple() { return detect().environment; }
function isLocal() { return detect().isLocal; }
function isTest() { return detect().isTest; }
function isProd() { return detect().isProd; }
function isSecure() { return detect().isSecure; }
function getMetadata() { return detect().metadata; }
function invalidateCache() { _cache = null; }
function matches(expectedEnvironment: unknown) { return detect().environment === expectedEnvironment; }
function getEnvMetrics() { return Object.assign({}, _metrics); }
function resetMetrics() { _metrics.detectCount = 0; _metrics.cacheHitCount = 0; _metrics.lastDetectAt = null; }

function healthCheck() { const checks = { cacheReady: true, environmentsConfigured: Object.keys(ENVIRONMENTS).length > 0, metadataConfigured: Object.keys(METADATA).length > 0, portsInitialized: Ports.isInitialized() }; const passed = Object.values(checks).filter(Boolean).length; const total = Object.keys(checks).length; return { status: passed === total ? 'HEALTHY' : passed >= total - 1 ? 'DEGRADED' : 'UNHEALTHY', score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, issues: Object.entries(checks).filter(e => !e[1]).map(e => e[0]), portsInitialized: Ports.isInitialized(), version: VERSION, moduleId: MODULE_ID, timestamp: new Date().toISOString() }; }

function info() { return { version: VERSION, moduleId: MODULE_ID, cached: !!_cache, currentEnvironment: _cache ? _cache.environment : 'not-detected', metrics: getEnvMetrics(), portsInitialized: Ports.isInitialized(), healthCheck: healthCheck() }; }
function getVersion() { return VERSION; }

const EnvironmentDetector = { ENVIRONMENTS, METADATA, detect, detectSimple, isLocal, isTest, isProd, isSecure, getMetadata, invalidateCache, matches, getMetrics: getEnvMetrics, resetMetrics, healthCheck, info, getVersion };

export { EnvironmentDetector, ENVIRONMENTS, METADATA, detect, detectSimple, isLocal, isTest, isProd, isSecure, getMetadata, invalidateCache, matches, getVersion, healthCheck, info, VERSION, MODULE_ID, injectPorts, getPorts };
export default EnvironmentDetector;
