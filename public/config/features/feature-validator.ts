// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.4.0-PORTSFACTORY)
// ═══════════════════════════════════════════════════════════════
// MODULE: feature-validator
// PURPOSE: Feature Validator - Validador de feature flags config
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   validateFeatureConfig() — exported function
//   validateAndReport() — exported function
//   healthCheck() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   window.Logger
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';

export var VERSION = '1.4.0-PORTSFACTORY';
export var MODULE_ID = 'feature-validator';

var _Ports = createCorePorts({ moduleId: MODULE_ID });
function _getPort(name: string) { return _Ports.get(name); }
export function injectPorts(p: Record<string, any>) { return _Ports.inject(p); }
export function getPorts() { return _Ports.snapshot(); }

var _log = function(level: 'error' | 'warn' | 'info', ...rest: any[]) { var logger = _getPort('logger'); if (!logger) return; var args = rest; var prefix = '[' + MODULE_ID + ']'; if (level === 'error') { if (logger.error) logger.error.apply(logger, [prefix].concat(args)); return; } if (level === 'warn') { if (logger.warn) logger.warn.apply(logger, [prefix].concat(args)); return; } if (level === 'info') { if (logger.info) logger.info.apply(logger, [prefix].concat(args)); return; } };

export function validateFeatureConfig(config: Record<string, unknown>) { var errors: string[] = []; var warnings: string[] = []; if (!config || typeof config !== 'object') { errors.push('Config deve ser um objeto'); return { valid: false, errors: errors, warnings: warnings }; } if (!config.features || typeof config.features !== 'object') { errors.push('Config deve ter propriedade "features"'); return { valid: false, errors: errors, warnings: warnings }; } type _FeatureEntry = { enabled?: unknown; version?: unknown; description?: unknown; rollout?: { percentage?: number; strategy?: string }; environments?: Record<string, unknown>; dependencies?: unknown; owner?: unknown; jiraTicket?: unknown };
// @ts-expect-error strict migration — TS2345, TS18048
var _features = config.features as Record<string, _FeatureEntry>; Object.keys(_features).forEach(function(name) { var feature = _features[name]; var prefix = 'features.' + name; if (typeof feature.enabled !== 'boolean') { errors.push(prefix + '.enabled deve ser boolean'); } if (!feature.version || typeof feature.version !== 'string') { errors.push(prefix + '.version e obrigatorio (string)'); } if (!feature.description || typeof feature.description !== 'string') { errors.push(prefix + '.description e obrigatorio (string)'); } if (!feature.rollout) { errors.push(prefix + '.rollout e obrigatorio'); } else { if (typeof feature.rollout.percentage !== 'number') { errors.push(prefix + '.rollout.percentage deve ser number'); } else if (feature.rollout.percentage < 0 || feature.rollout.percentage > 100) { errors.push(prefix + '.rollout.percentage deve estar entre 0-100'); } var validStrategies = ['all', 'gradual', 'sampling', 'opt-in']; if (validStrategies.indexOf(feature.rollout.strategy) === -1) { errors.push(prefix + '.rollout.strategy deve ser: ' + validStrategies.join(', ')); } } if (!feature.environments) { warnings.push(prefix + '.environments nao definido'); } else { ['dev', 'test', 'staging', 'production'].forEach(function(env) { if (typeof feature.environments[env] !== 'boolean') { warnings.push(prefix + '.environments.' + env + ' deve ser boolean'); } }); } if (feature.dependencies) { if (!Array.isArray(feature.dependencies)) { errors.push(prefix + '.dependencies deve ser array'); } else { feature.dependencies.forEach(function(dep: string) { if (!(_features as Record<string, unknown>)[dep]) { errors.push(prefix + '.dependencies: feature "' + dep + '" nao existe'); } }); } } if (feature.enabled && feature.rollout.percentage === 0) { warnings.push(prefix + ': enabled=true mas rollout.percentage=0'); } if (!feature.owner || feature.owner === 'unknown') { warnings.push(prefix + '.owner nao definido'); } if (!feature.jiraTicket) { warnings.push(prefix + '.jiraTicket nao definido'); } }); var circularDeps = detectCircularDependencies(_features as Record<string, unknown>); if (circularDeps.length > 0) { errors.push('Dependencias circulares detectadas: ' + circularDeps.join(', ')); } return { valid: errors.length === 0, errors: errors, warnings: warnings }; }

function detectCircularDependencies(features: Record<string, unknown>) { var circular: string[] = []; var visited = new Set<string>(); var stack = new Set<string>(); function visit(name: string, path: string[]) { if (!path) path = []; if (stack.has(name)) { circular.push(path.concat([name]).join(' -> ')); return; } if (visited.has(name)) return; visited.add(name); stack.add(name); var feature = features[name] as { dependencies?: string[] }; if (feature && feature.dependencies) { feature.dependencies.forEach(function(dep: string) { visit(dep, path.concat([name])); }); } stack.delete(name); } Object.keys(features).forEach(function(name) { visit(name, []); }); return circular; }

export function validateAndReport(config: Record<string, any>) { _log('info', 'Validando feature flags'); var result = validateFeatureConfig(config); if (!result.valid) { _log('error', 'Config INVALIDO', { errors: result.errors }); return false; } if (result.warnings.length > 0) { _log('warn', 'Avisos na validacao', { warnings: result.warnings }); } _log('info', 'Config valido'); return true; }

export function healthCheck() { return { status: _Ports.isInitialized() ? 'HEALTHY' : 'DEGRADED', score: _Ports.isInitialized() ? 2 : 0, maxScore: 2, checks: { portsInitialized: _Ports.isInitialized(), hasLogger: !!_getPort('logger') }, moduleId: MODULE_ID, version: VERSION, portsInitialized: _Ports.isInitialized() }; }
export function info() { return { moduleId: MODULE_ID, version: VERSION, portsInitialized: _Ports.isInitialized(), healthCheck: healthCheck() }; }

export default { validateFeatureConfig: validateFeatureConfig, validateAndReport: validateAndReport, detectCircularDependencies: detectCircularDependencies, healthCheck: healthCheck, info: info };
