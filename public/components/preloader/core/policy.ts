// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.2.0-P17WI)
// ═══════════════════════════════════════════════════════════════
// MODULE: preloader-policy
// PURPOSE: Preloader Policy Layer
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   POLICY_PROFILES — exported value
//   PreloaderPolicy — exported value
//   injectPorts() — exported function
//   getPorts() — exported function
//   shouldForceFinalizeOnTimeout() — exported function
//   shouldDegradeOnAuthTimeout() — exported function
//   shouldDegradeOnComponentsTimeout() — exported function
//   shouldLoadVideo() — exported function
//   shouldRetry() — exported function
//   getRetryBackoff() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';

export const VERSION = '1.2.0-P17WI';
export const MODULE_ID = 'preloader-policy';

const hasWindow = typeof window !== 'undefined';

const Ports = createCorePorts({ moduleId: MODULE_ID });
function _initPorts() { Ports.init(); }
function _getPort(name: string) { return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

function _log(level: string, msg: string, ctx?: Record<string, unknown>) {
  const logger = _getPort('logger');
  if (!logger) return;
  ctx = ctx || {};
  ctx.component = MODULE_ID;
  if (level === 'warn') { if (logger.warn) logger.warn(msg, ctx); return; }
  if (level === 'info') { if (logger.info) logger.info(msg, ctx); return; }
  if (logger.debug) logger.debug(msg, ctx);
}

const DEFAULT_POLICIES = {
  timeouts: { global: 30000, auth: 10000, components: 10000, video: 5000, hide: 300 },
  retries: { componentsMax: 3, authMax: 2, backoffMs: 5000 },
  degraded: { allowDegraded: true, degradedOnVideoFail: true, degradedOnAuthTimeout: true, degradedOnComponentsTimeout: true, minProgressForDegraded: 50 },
  video: { enabled: true, required: false, preload: 'metadata', autoplay: true, loop: true, muted: true },
  progress: { pollInterval: 200, debounceMs: 32, hits100Threshold: 3, smoothing: true },
  ui: { showLogo: true, showProgress: true, showPercentage: true, showText: true, animations: true, respectReducedMotion: true },
  force: { enableOnGlobalTimeout: true, minProgressForForce: 30 },
  cleanup: { removeFromDOM: true, disposeResources: true, clearTimers: true }
};

let _currentPolicies = JSON.parse(JSON.stringify(DEFAULT_POLICIES));
let _policyOverrides: Record<string, unknown> = {};
let _policyVersion = 0;

export const POLICY_PROFILES = Object.freeze({
  STANDARD: 'standard',
  FAST: 'fast',
  CORPORATE: 'corporate',
  KIOSK: 'kiosk',
  MINIMAL: 'minimal',
  DEBUG: 'debug',
  RECOVERY: 'recovery'
});

const PROFILE_CONFIGS: Record<string, Record<string, unknown>> = {};
PROFILE_CONFIGS[POLICY_PROFILES.STANDARD] = {};
PROFILE_CONFIGS[POLICY_PROFILES.FAST] = { timeouts: { global: 15000, auth: 5000, components: 5000, video: 2000 }, video: { enabled: false }, progress: { hits100Threshold: 1 } };
PROFILE_CONFIGS[POLICY_PROFILES.CORPORATE] = { timeouts: { global: 60000, auth: 20000, components: 20000 }, retries: { componentsMax: 5, authMax: 3 }, degraded: { allowDegraded: true, minProgressForDegraded: 30 } };
PROFILE_CONFIGS[POLICY_PROFILES.KIOSK] = { timeouts: { global: 45000 }, degraded: { allowDegraded: true }, force: { enableOnGlobalTimeout: true, minProgressForForce: 10 }, ui: { showPercentage: false } };
PROFILE_CONFIGS[POLICY_PROFILES.MINIMAL] = { video: { enabled: false }, ui: { showLogo: true, showProgress: true, showPercentage: false, showText: false, animations: false } };
PROFILE_CONFIGS[POLICY_PROFILES.DEBUG] = { timeouts: { global: 120000, auth: 30000, components: 30000, video: 10000 }, retries: { componentsMax: 5 }, progress: { hits100Threshold: 1 } };
PROFILE_CONFIGS[POLICY_PROFILES.RECOVERY] = { timeouts: { global: 20000, auth: 5000, components: 5000 }, video: { enabled: false }, degraded: { allowDegraded: true, minProgressForDegraded: 20 }, force: { enableOnGlobalTimeout: true, minProgressForForce: 0 } };

function _deepMerge(target: Record<string, any>, source: Record<string, any>) {
  for (const key in source) {
    if (source.hasOwnProperty(key)) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        if (!target[key]) target[key] = {};
        _deepMerge(target[key], source[key]);
      } else { target[key] = source[key]; }
    }
  }
}

export const PreloaderPolicy = {
  get(path?: string) {
    if (!path) return Object.freeze(Object.assign({}, _currentPolicies));
    const parts = path.split('.');
    let value = _currentPolicies;
    for (let i = 0; i < parts.length; i++) {
      if (value && typeof value === 'object' && parts[i] in value) { value = value[parts[i]]; }
      else { return undefined; }
    }
    return value;
  },

  set(path: string, value: unknown) {
    const parts = path.split('.');
    let target = _currentPolicies;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!(parts[i] in target)) { target[parts[i]] = {}; }
      target = target[parts[i]];
    }
    const lastKey = parts[parts.length - 1];
    const oldValue = target[lastKey];
    target[lastKey] = value;
    _policyVersion++;
    _log('info', 'Policy updated', { path, oldValue, newValue: value, version: _policyVersion });
    return { path, oldValue, newValue: value };
  },

  applyProfile(profileName: string) {
    if (!PROFILE_CONFIGS[profileName]) { _log('warn', 'Unknown profile', { profileName }); return false; }
    _currentPolicies = JSON.parse(JSON.stringify(DEFAULT_POLICIES));
    const profileConfig = PROFILE_CONFIGS[profileName];
    _deepMerge(_currentPolicies, profileConfig);
    _deepMerge(_currentPolicies, _policyOverrides);
    _policyVersion++;
    _log('info', 'Profile applied', { profileName, version: _policyVersion });
    return true;
  },

  override(overrides: Record<string, unknown>) {
    _policyOverrides = Object.assign({}, _policyOverrides, overrides);
    _deepMerge(_currentPolicies, overrides);
    _policyVersion++;
    _log('info', 'Policy overridden', { keys: Object.keys(overrides), version: _policyVersion });
  },

  reset() {
    _currentPolicies = JSON.parse(JSON.stringify(DEFAULT_POLICIES));
    _policyOverrides = {};
    _policyVersion++;
    _log('info', 'Policy reset to default', { version: _policyVersion });
  },

  allows(action: string, context: Record<string, unknown> = {}) {
    switch (action) {
      case 'degraded': return _currentPolicies.degraded.allowDegraded;
      case 'force': return (context.progress || 0) >= _currentPolicies.force.minProgressForForce;
      case 'video': return _currentPolicies.video.enabled;
      case 'retry': return (context.retryCount || 0) < _currentPolicies.retries.componentsMax;
      case 'degradedOnTimeout': return _currentPolicies.degraded.allowDegraded && (context.progress || 0) >= _currentPolicies.degraded.minProgressForDegraded;
      default: return true;
    }
  },

  getTimeout(action: string) { return _currentPolicies.timeouts[action] || _currentPolicies.timeouts.global; },
  getVersion() { return _policyVersion; },

  getStatus() { return { version: VERSION, moduleId: MODULE_ID, policyVersion: _policyVersion, currentPolicies: this.get(), hasOverrides: Object.keys(_policyOverrides).length > 0, overrideKeys: Object.keys(_policyOverrides), portsInitialized: Ports.isInitialized() }; },

  healthCheck() {
    const hasTimeouts = !!_currentPolicies.timeouts;
    const hasRetries = !!_currentPolicies.retries;
    const hasDegraded = !!_currentPolicies.degraded;
    return { status: hasTimeouts && hasRetries && hasDegraded ? 'HEALTHY' : 'DEGRADED', moduleId: MODULE_ID, version: VERSION, checks: { hasTimeouts, hasRetries, hasDegraded, hasLogger: !!_getPort('logger'), portsInitialized: Ports.isInitialized() }, policyVersion: _policyVersion, portsInitialized: Ports.isInitialized(), timestamp: Date.now() };
  },

  info() { return { version: VERSION, moduleId: MODULE_ID, profiles: Object.keys(POLICY_PROFILES), defaultPolicies: Object.keys(DEFAULT_POLICIES), portsInitialized: Ports.isInitialized(), status: this.getStatus(), healthCheck: this.healthCheck() }; }
};

export function shouldForceFinalizeOnTimeout(context?: Record<string, unknown>) { const policy: Record<string, any> = PreloaderPolicy.get(); return policy.force.enableOnGlobalTimeout && ((context && context.progress) || 0) >= policy.force.minProgressForForce; }
export function shouldDegradeOnAuthTimeout(context?: Record<string, unknown>) { const policy: Record<string, any> = PreloaderPolicy.get(); return policy.degraded.allowDegraded && policy.degraded.degradedOnAuthTimeout; }
export function shouldDegradeOnComponentsTimeout(context?: Record<string, unknown>) { const policy: Record<string, any> = PreloaderPolicy.get(); return policy.degraded.allowDegraded && policy.degraded.degradedOnComponentsTimeout && ((context && context.progress) || 0) >= policy.degraded.minProgressForDegraded; }
export function shouldLoadVideo() { const policy: Record<string, any> = PreloaderPolicy.get(); return policy.video.enabled; }
export function shouldRetry(context?: Record<string, unknown>) { const policy: Record<string, any> = PreloaderPolicy.get(); return ((context && context.retryCount) || 0) < policy.retries.componentsMax; }
export function getRetryBackoff() { return PreloaderPolicy.get('retries.backoffMs'); }

export default PreloaderPolicy;
