// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.3.0-ES6)
// ═══════════════════════════════════════════════════════════════
// MODULE: header/core/graceful-degradation
// PURPOSE: Sistema de degradação graciosa de features do Header
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//   HEADER_INTERNAL_EVENT_NAMES from /core/runtime/constants/event-names.js
//   HEALTH_STATUS from ./constants.js
// PROVIDES:
//   registerFeature(featureId, config) — registra feature para degradação
//   unregisterFeature(featureId) — remove feature
//   getFeature(featureId) — obtém dados da feature
//   getAllFeatures() — lista todas as features
//   degradeFeature(featureId, reason) — degrada feature
//   reactivateFeature(featureId) — reativa feature
//   isFeatureDegraded(featureId) — verifica se está degradada
//   isFeatureAvailable(featureId) — verifica se está disponível
//   getDegradedFeatures() — lista features degradadas
//   getCriticalDegraded() — lista features críticas degradadas
//   withFeature(featureId, fn, fallback) — executa com fallback
//   onEvent(callback) — registra listener
//   getMetrics() — métricas
//   resetMetrics() — reseta métricas
//   healthCheck() — auto health check
//   info() — informações do módulo
//   injectPorts(p) — injeta ports
//   getPorts() — snapshot dos ports
// EMITS (eventos):
//   HEADER_INTERNAL_EVENT_NAMES.FEATURE_DEGRADED — quando feature é degradada
//   HEADER_INTERNAL_EVENT_NAMES.FEATURE_REACTIVATED — quando feature é reativada
// ═══════════════════════════════════════════════════════════════

// Header - Graceful Degradation System
// @version 1.3.0-ES6
// @changelog v1.3.0-ES6 - Task 10.1 B06: var → const/let
// @changelog v1.2.0-EVENT-CONSTANTS - Migrate to HEADER_INTERNAL_EVENT_NAMES constants
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { HEADER_INTERNAL_EVENT_NAMES } from '/core/runtime/constants/event-names.js';
import { HEALTH_STATUS } from './constants.js';

export const VERSION = '1.3.0-ES6';
export const MODULE_ID = 'header/core/graceful-degradation';

const Ports = createCorePorts({ moduleId: MODULE_ID });
let _portsInitialized = false;

function _initPorts() { if (_portsInitialized) return; Ports.init(); _portsInitialized = true; }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string,unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

const _debugEnabled = () => { const cfg = _getPort('config'); return (cfg && cfg.app && cfg.app.debug) ? true : false; };
const _log = function(level: string, ...args: any[]) {const logger = _getPort('logger'); if (!logger) return; const prefix = `[${MODULE_ID}]`; if (level === 'error') { if (logger.error) logger.error(prefix, args.join(' ')); return; } if (level === 'warn') { if (logger.warn) logger.warn(prefix, args.join(' ')); return; } if (level === 'info') { if (logger.info) logger.info(prefix, args.join(' ')); return; } if (_debugEnabled() && logger.debug) logger.debug(prefix, args.join(' ')); };

const _features = new Map();
const _degradedFeatures = new Map();
// @ts-expect-error strict migration — TS7034
const _listeners = [];
let _metrics = { featuresRegistered: 0, degradations: 0, reactivations: 0, checksPerformed: 0, currentlyDegraded: 0 };

function registerFeature(featureId: string, config: Record<string,unknown>) {
  _initPorts();
  if (!featureId) { _log('error', 'featureId é obrigatório'); return false; }
  config = config || {};
  const feature = { id: featureId, name: config.name || featureId, dependencies: config.dependencies || [], healthCheck: config.healthCheck || null, onDegrade: config.onDegrade || null, onReactivate: config.onReactivate || null, fallbackUI: config.fallbackUI || null, critical: config.critical || false, checkInterval: config.checkInterval || 30000, autoReactivate: config.autoReactivate !== false, reactivateDelay: config.reactivateDelay || 10000, registeredAt: Date.now() };
  _features.set(featureId, feature);
  _metrics.featuresRegistered++;
  _log('debug', 'Feature registrada:', featureId);
  return true;
}

function unregisterFeature(featureId: string) {
  if (_features.has(featureId)) { _features.delete(featureId); _degradedFeatures.delete(featureId); _log('debug', 'Feature removida:', featureId); return true; }
  return false;
}

function getFeature(featureId: string) { return _features.get(featureId) || null; }

function getAllFeatures() {
  const result = {};
  _features.forEach((feature, id) => { (result as Record<string,unknown>)[id as string] = { id: feature.id, name: feature.name, critical: feature.critical, isDegraded: _degradedFeatures.has(id), dependencies: feature.dependencies }; });
  return result;
}

function degradeFeature(featureId: string, reason: string) {
  const feature = _features.get(featureId);
  if (!feature) { _log('warn', 'Feature não encontrada:', featureId); return false; }
  if (_degradedFeatures.has(featureId)) { _log('debug', 'Feature já está degradada:', featureId); return true; }
  const degradation = { featureId, reason: reason || 'UNKNOWN', degradedAt: Date.now(), reactivateTimer: (null as unknown|null) };
  _degradedFeatures.set(featureId, degradation);
  _metrics.degradations++;
  _metrics.currentlyDegraded = _degradedFeatures.size;
  _log('warn', 'Feature degradada:', featureId, '- Razão:', reason);
  if (typeof feature.onDegrade === 'function') { try { feature.onDegrade({ featureId, reason }); } catch (e: any) { _log('error', 'Erro em onDegrade callback:', e.message); } }
  _degradeDependents(featureId, reason);
  if (feature.autoReactivate) { degradation.reactivateTimer = setTimeout(() => { _checkReactivation(featureId); }, feature.reactivateDelay); }
  _emitEvent('degraded', { featureId, reason });
  const eventBus = _getPort('eventBus');
  if (eventBus && eventBus.emit) { eventBus.emit(HEADER_INTERNAL_EVENT_NAMES.FEATURE_DEGRADED, { featureId, reason, timestamp: Date.now() }); }
  return true;
}

function _degradeDependents(featureId: string, reason: string) {
  _features.forEach(feature => { if (feature.dependencies.indexOf(featureId) !== -1) { if (!_degradedFeatures.has(feature.id)) { degradeFeature(feature.id, `DEPENDENCY_DEGRADED:${featureId}`); } } });
}

function reactivateFeature(featureId: string) {
  const feature = _features.get(featureId);
  if (!feature) { _log('warn', 'Feature não encontrada:', featureId); return false; }
  const degradation = _degradedFeatures.get(featureId);
  if (!degradation) { _log('debug', 'Feature não está degradada:', featureId); return true; }
  const unhealthyDeps = _checkDependencies(featureId);
  if (unhealthyDeps.length > 0) { _log('warn', 'Não é possível reativar', featureId, '- Dependências degradadas:', unhealthyDeps.join(', ')); return false; }
  if (degradation.reactivateTimer) { clearTimeout(degradation.reactivateTimer); }
  _degradedFeatures.delete(featureId);
  _metrics.reactivations++;
  _metrics.currentlyDegraded = _degradedFeatures.size;
  _log('info', 'Feature reativada:', featureId);
  if (typeof feature.onReactivate === 'function') { try { feature.onReactivate({ featureId }); } catch (e: any) { _log('error', 'Erro em onReactivate callback:', e.message); } }
  _emitEvent('reactivated', { featureId });
  const eventBus = _getPort('eventBus');
  if (eventBus && eventBus.emit) { eventBus.emit(HEADER_INTERNAL_EVENT_NAMES.FEATURE_REACTIVATED, { featureId, timestamp: Date.now() }); }
  _tryReactivateDependents(featureId);
  return true;
}

function _checkDependencies(featureId: string) {
  const feature = _features.get(featureId);
  if (!feature) return [];
  // @ts-expect-error strict migration — TS7034
  const unhealthy = [];
  feature.dependencies.forEach((depId: string) => { if (_degradedFeatures.has(depId)) { unhealthy.push(depId); } });
  // @ts-expect-error strict migration — TS7005
  return unhealthy;
}

function _tryReactivateDependents(featureId: string) {
  _features.forEach(feature => { if (feature.dependencies.indexOf(featureId) !== -1) { if (_degradedFeatures.has(feature.id)) { const unhealthyDeps = _checkDependencies(feature.id); if (unhealthyDeps.length === 0) { _checkReactivation(feature.id); } } } });
}

function _checkReactivation(featureId: string) {
  const feature = _features.get(featureId);
  if (!feature) return;
  _metrics.checksPerformed++;
  if (!_degradedFeatures.has(featureId)) return;
  const unhealthyDeps = _checkDependencies(featureId);
  if (unhealthyDeps.length > 0) { if (feature.autoReactivate) { const degradation = _degradedFeatures.get(featureId); if (degradation) { degradation.reactivateTimer = setTimeout(() => { _checkReactivation(featureId); }, feature.reactivateDelay); } } return; }
  if (typeof feature.healthCheck === 'function') {
    try {
      const result = feature.healthCheck();
      const isHealthy = result === true || (result && result.status === HEALTH_STATUS.HEALTHY) || (result && result.status === 'HEALTHY');
      if (isHealthy) { reactivateFeature(featureId); }
      else { if (feature.autoReactivate) { const deg = _degradedFeatures.get(featureId); if (deg) { deg.reactivateTimer = setTimeout(() => { _checkReactivation(featureId); }, feature.reactivateDelay); } } }
    } catch (e: any) { _log('error', 'Erro no healthCheck da feature:', featureId, e.message); }
  } else { reactivateFeature(featureId); }
}

function isFeatureDegraded(featureId: string) { return _degradedFeatures.has(featureId); }
function isFeatureAvailable(featureId: string) { return _features.has(featureId) && !_degradedFeatures.has(featureId); }
function getDegradedFeatures() { const result: any[] = []; _degradedFeatures.forEach((degradation, featureId) => { result.push({ featureId, reason: degradation.reason, degradedAt: degradation.degradedAt, duration: Date.now() - degradation.degradedAt }); }); return result; }
function getCriticalDegraded() { const critical: any[] = []; _degradedFeatures.forEach((degradation, featureId) => { const feature = _features.get(featureId); if (feature && feature.critical) { critical.push(featureId); } }); return critical; }

function withFeature(featureId: string, fn: Function, fallback: unknown) {
  if (isFeatureAvailable(featureId)) { if (typeof fn === 'function') { try { return fn(); } catch (e: any) { _log('error', 'Erro ao executar feature:', featureId, e.message); degradeFeature(featureId, `EXECUTION_ERROR:${e.message}`); if (typeof fallback === 'function') { return fallback(e); } } } }
  else { if (typeof fallback === 'function') { return fallback(new Error(`Feature degraded: ${featureId}`)); } }
  return undefined;
}

// @ts-expect-error strict migration — TS7005
function onEvent(callback: Function) { if (typeof callback !== 'function') return () => {}; _listeners.push(callback); return () => { const idx = _listeners.indexOf(callback); if (idx > -1) _listeners.splice(idx, 1); }; }
// @ts-expect-error strict migration — TS7005
function _emitEvent(type: string, data: Record<string,unknown>) { const event = Object.assign({ type, timestamp: Date.now() }, data); _listeners.forEach(cb => { try { cb(event); } catch (e: any) { _log('error', 'Listener error:', e.message); } }); }

function getMetrics() { return Object.assign({}, _metrics); }
function resetMetrics() { _metrics = { featuresRegistered: _features.size, degradations: 0, reactivations: 0, checksPerformed: 0, currentlyDegraded: _degradedFeatures.size }; }

function healthCheck() {
  _initPorts();
  const criticalDegraded = getCriticalDegraded();
  const checks = {
    hasFeatures: _features.size > 0 || _metrics.featuresRegistered === 0,
    noCriticalDegraded: criticalDegraded.length === 0,
    lowDegradationRate: _features.size === 0 || (_degradedFeatures.size / _features.size) < 0.3,
    portsInitialized: _portsInitialized
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return { status: passed === total ? 'HEALTHY' : passed >= 3 ? 'DEGRADED' : 'UNHEALTHY', score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, criticalDegraded, degradedCount: _degradedFeatures.size, totalFeatures: _features.size, version: VERSION, moduleId: MODULE_ID, timestamp: new Date().toISOString() };
}

function info() { return { version: VERSION, moduleId: MODULE_ID, totalFeatures: _features.size, degradedCount: _degradedFeatures.size, features: getAllFeatures(), degraded: getDegradedFeatures(), metrics: getMetrics(), portsInitialized: _portsInitialized, healthCheck: healthCheck() }; }

export { registerFeature, unregisterFeature, getFeature, getAllFeatures, degradeFeature, reactivateFeature, isFeatureDegraded, isFeatureAvailable, getDegradedFeatures, getCriticalDegraded, withFeature, onEvent, getMetrics, resetMetrics, healthCheck, info };

export default { VERSION, MODULE_ID, registerFeature, unregisterFeature, degradeFeature, reactivateFeature, isFeatureDegraded, isFeatureAvailable, getDegradedFeatures, withFeature, healthCheck, info };
