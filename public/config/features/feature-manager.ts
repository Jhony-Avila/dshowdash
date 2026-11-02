// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.4.0-PORTSFACTORY)
// ═══════════════════════════════════════════════════════════════
// MODULE: feature-manager
// PURPOSE: Feature Manager - Sistema centralizado de feature flags
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   Environment from /assets/js/core/environment-manager/index.js
//   createCorePorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   getFeatureManager() — exported function
//   isFeatureEnabled() — exported function
//   healthCheck() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): (see init function)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   localStorage
//   sessionStorage
//   window.APP_CONFIG
//   window.Logger
//   window.__FEATURE_MANAGER__
// ═══════════════════════════════════════════════════════════════
'use strict';

import Environment from '/assets/js/core/environment-manager/index.js';
import { createCorePorts } from '/core/runtime/ports-profiles.js';

export var VERSION = '2.4.0-PORTSFACTORY';
export var MODULE_ID = 'feature-manager';

var _Ports = createCorePorts({ moduleId: MODULE_ID });
function _getPort(name: string) { return _Ports.get(name); }
export function injectPorts(p: Record<string, any>) { return _Ports.inject(p); }
export function getPorts() { return _Ports.snapshot(); }

var _debug = function() { var cfg = _getPort('config'); return cfg && cfg.app && cfg.app.debug ? true : false; };
var _log = function(level: 'error' | 'warn' | 'info' | 'debug', ...rest: any[]) { var logger = _getPort('logger'); if (!logger) return; var args = rest; var prefix = '[' + MODULE_ID + ']'; if (level === 'error') { if (logger.error) logger.error.apply(logger, [prefix].concat(args)); return; } if (level === 'warn') { if (logger.warn) logger.warn.apply(logger, [prefix].concat(args)); return; } if (level === 'info') { if (logger.info) logger.info.apply(logger, [prefix].concat(args)); return; } if (_debug() && logger.debug) logger.debug.apply(logger, [prefix].concat(args)); };

function FeatureManager(this: any, config: { environment?: string; version?: string }) { if (!config) config = {}; this.flags = new Map(); this.environment = config.environment || null; this.version = config.version || '1.0.0'; this.overrides = new Map(); this.listeners = new Map(); this.initialized = false; }
FeatureManager.prototype.init = function(featureConfig?: Record<string, unknown>) { var self = this; if (self.initialized) { _log('warn', 'Ja inicializado'); return Promise.resolve(); } var initPromise = Promise.resolve(); if (!self.environment) { initPromise = Environment.init().then(function() { var envMode = Environment.get('mode'); self.environment = self._mapModeToEnv(envMode); _log('info', 'Ambiente obtido do Environment Manager', { environment: self.environment }); }); } return initPromise.then(function() { if (!featureConfig) { return self._loadFeatureConfig(); } return featureConfig; }).then(function(fc) { if (fc && fc.features) { Object.keys(fc.features).forEach(function(key) { self.flags.set(key, self._processFeature(key, fc.features[key])); }); } self._loadOverrides(); self.initialized = true; _log('info', 'Inicializado', { features: self.flags.size, environment: self.environment }); self._logFeatureStatus(); }); };
FeatureManager.prototype._mapModeToEnv = function(mode: string) { if (mode === 'development') return 'dev'; if (mode === 'staging') return 'staging'; if (mode === 'production') return 'production'; return 'dev'; };
FeatureManager.prototype.isEnabled = function(featureName: string) { if (this.overrides.has(featureName)) { return this.overrides.get(featureName); } var feature = this.flags.get(featureName); if (!feature) { _log('warn', 'Feature desconhecida', { feature: featureName }); return false; } if (feature.dependencies && feature.dependencies.length > 0) { var self = this; var allDepsEnabled = feature.dependencies.every(function(dep: string) { return self.isEnabled(dep); }); if (!allDepsEnabled) { return false; } } var envEnabled = feature.environments[this.environment]; if (envEnabled === false) { return false; } if (feature.rollout.strategy === 'sampling') { return this._shouldSample(feature.rollout.percentage); } return feature.enabled; };
FeatureManager.prototype.getFeature = function(featureName: string) { return this.flags.get(featureName) || null; };
FeatureManager.prototype.getAllFeatures = function(enabledOnly?: boolean) { var self = this; var features: Record<string, unknown> = {}; self.flags.forEach(function(feature: unknown, name: string) { if (!enabledOnly || self.isEnabled(name)) { features[name] = Object.assign({}, feature, { enabled: self.isEnabled(name), hasOverride: self.overrides.has(name) }); } }); return features; };
FeatureManager.prototype.override = function(featureName: string, enabled: boolean, persist?: boolean) { if (!this.flags.has(featureName)) { _log('warn', 'Feature desconhecida', { feature: featureName }); return false; } this.overrides.set(featureName, enabled); if (persist) { this._saveOverrides(); } _log('info', 'Override aplicado', { feature: featureName, enabled: enabled }); this._notifyListeners(featureName, enabled); return true; };
FeatureManager.prototype.clearOverride = function(featureName: string) { if (this.overrides.delete(featureName)) { this._saveOverrides(); _log('info', 'Override removido', { feature: featureName }); this._notifyListeners(featureName, this.isEnabled(featureName)); return true; } return false; };
FeatureManager.prototype.clearAllOverrides = function() { var count = this.overrides.size; this.overrides.clear(); this._saveOverrides(); _log('info', 'Todos overrides removidos', { count: count }); };
FeatureManager.prototype.onChange = function(featureName: string, callback: (enabled: boolean) => void) { var self = this; if (!self.listeners.has(featureName)) { self.listeners.set(featureName, []); } self.listeners.get(featureName).push(callback); return function() { var callbacks = self.listeners.get(featureName); var index = callbacks.indexOf(callback); if (index > -1) { callbacks.splice(index, 1); } }; };
// @ts-expect-error strict migration — TS2769
FeatureManager.prototype.getSummary = function() { var self = this; var all = Array.from(self.flags.values()); var enabled = all.filter(function(f: { name: string }) { return self.isEnabled(f.name); }); return { total: all.length, enabled: enabled.length, disabled: all.length - enabled.length, overrides: self.overrides.size, environment: self.environment, version: self.version }; };
FeatureManager.prototype._processFeature = function(name: string, config: Record<string, unknown>) { return { name: name, enabled: config.enabled || false, version: config.version || '1.0.0', description: config.description || '', rollout: config.rollout || { percentage: 100, strategy: 'all' }, environments: config.environments || {}, dependencies: config.dependencies || [], owner: config.owner || 'unknown', jiraTicket: config.jiraTicket || null }; };
FeatureManager.prototype._loadFeatureConfig = function() { return fetch('/config/features/feature-flags.json').then(function(response) { if (!response.ok) { throw new Error('HTTP ' + response.status); } return response.json(); }).catch(function(error) { _log('error', 'Erro ao carregar features', { error: error.message }); return { features: {} }; }); };
FeatureManager.prototype._shouldSample = function(percentage: number) { if (percentage >= 100) return true; if (percentage <= 0) return false; var key = '__feature_sampling__'; var samplingId: string | number | null = sessionStorage.getItem(key); if (!samplingId) { samplingId = Math.random() * 100; sessionStorage.setItem(key, String(samplingId)); } else { samplingId = parseFloat(samplingId); } return samplingId < percentage; };
FeatureManager.prototype._loadOverrides = function() { try { var stored = localStorage.getItem('__feature_overrides__'); if (stored) { var self = this; var overrides = JSON.parse(stored); Object.keys(overrides).forEach(function(key) { self.overrides.set(key, overrides[key]); }); if (self.overrides.size > 0) { _log('info', 'Overrides carregados', { count: self.overrides.size }); } } } catch (error: any) { _log('warn', 'Erro ao carregar overrides', { error: error.message }); } };
FeatureManager.prototype._saveOverrides = function() { try { var overrides: Record<string, boolean> = {}; this.overrides.forEach(function(v: boolean, k: string) { overrides[k] = v; }); localStorage.setItem('__feature_overrides__', JSON.stringify(overrides)); } catch (error: any) { _log('warn', 'Erro ao salvar overrides', { error: (error as Error).message }); } };
FeatureManager.prototype._notifyListeners = function(featureName: string, enabled: boolean) { var callbacks = this.listeners.get(featureName); if (callbacks) { callbacks.forEach(function(cb: (enabled: boolean) => void) { try { cb(enabled); } catch (error: any) { _log('error', 'Erro em listener', { feature: featureName, error: (error as Error).message }); } }); } };
FeatureManager.prototype._logFeatureStatus = function() { var cfg = _getPort('config'); if (!(cfg && cfg.app && cfg.app.debug)) return; var self = this; var features = self.getAllFeatures(); var summary = Object.keys(features).map(function(name) { var feature = features[name]; return { name: name, enabled: feature.enabled, override: feature.hasOverride, version: feature.version }; }); _log('debug', 'Status das Features', { features: summary }); };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
var instance: { initialized: boolean; flags: Map<string, unknown>; isEnabled: (name: string) => boolean; [key: string]: unknown } | null = null;
export function getFeatureManager() { if (!instance) { var cfg = (typeof window !== 'undefined' && window.APP_CONFIG) ? window.APP_CONFIG : {}; instance = new (FeatureManager as unknown as new (config: { version: string }) => typeof instance)({ version: (cfg.app && cfg.app.version) as string || '1.0.0' }); if (typeof window !== 'undefined' && cfg.app && cfg.app.debug) { (window as any).__FEATURE_MANAGER__ = instance; } } return instance; }
export function isFeatureEnabled(featureName: string) { var manager = getFeatureManager(); return manager!.isEnabled(featureName); }
export function healthCheck() { var manager = getFeatureManager(); return { status: manager!.initialized && manager!.flags.size > 0 && _Ports.isInitialized() ? 'HEALTHY' : (manager!.initialized || _Ports.isInitialized()) ? 'DEGRADED' : 'UNHEALTHY', score: (manager!.initialized ? 1 : 0) + (manager!.flags.size > 0 ? 1 : 0) + (_Ports.isInitialized() ? 1 : 0), maxScore: 3, checks: { initialized: manager!.initialized, hasFlags: manager!.flags.size > 0, portsInitialized: _Ports.isInitialized() }, moduleId: MODULE_ID, version: VERSION, portsInitialized: _Ports.isInitialized() }; }
export function info() { return { moduleId: MODULE_ID, version: VERSION, portsInitialized: _Ports.isInitialized(), healthCheck: healthCheck() }; }
export default FeatureManager;
