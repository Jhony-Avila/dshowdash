// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.2.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: environment-manager-store
// PURPOSE: Environment Manager - State Store v2.2.0-ENTERPRISE
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   ENVIRONMENTS, MODES, METADATA, DEFAULT_URLS, ENV_TO_MODE, ENV_POLICIES from ./config.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   store — exported value
//   getVersion() — exported function
//   info() — exported function
//   healthCheck() — exported function
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

import { ENVIRONMENTS, MODES, METADATA, DEFAULT_URLS, ENV_TO_MODE, ENV_POLICIES } from './config.js';

export var VERSION = '2.2.0-ENTERPRISE';
export var MODULE_ID = 'environment-manager-store';

export function getVersion() { return VERSION; }

function EnvironmentStore(this: any) {
  this._state = null;
  this._listeners = [];
  this._initialized = false;
  this._destroyed = false;
}

EnvironmentStore.prototype.initialize = function(resolvedEnv: Record<string, unknown>) {
  if (this._initialized && this._state) return this._state;
  var environment = (resolvedEnv.environment || ENVIRONMENTS.UNKNOWN) as string;
  var mode = (ENV_TO_MODE as Record<string, string>)[environment] || MODES.DEVELOPMENT;
  var metadata = (METADATA as Record<string, Record<string, string>>)[environment] || METADATA[ENVIRONMENTS.UNKNOWN as keyof typeof METADATA];
  var policies = (resolvedEnv.policies || (ENV_POLICIES as Record<string, Record<string, unknown>>)[environment] || ENV_POLICIES[ENVIRONMENTS.UNKNOWN as keyof typeof ENV_POLICIES]) as Record<string, unknown>;
  this._state = Object.freeze({
    version: VERSION, moduleId: MODULE_ID, environment: environment, mode: mode,
    hostname: resolvedEnv.hostname || '', protocol: resolvedEnv.protocol || 'https:', port: resolvedEnv.port || '', isSecure: resolvedEnv.protocol === 'https:',
    apiBaseUrl: resolvedEnv.apiBaseUrl || DEFAULT_URLS.apiBaseUrl, assetsBaseUrl: resolvedEnv.assetsBaseUrl || DEFAULT_URLS.assetsBaseUrl, configBaseUrl: resolvedEnv.configBaseUrl || DEFAULT_URLS.configBaseUrl, telemetryEndpoint: resolvedEnv.telemetryEndpoint || DEFAULT_URLS.telemetryEndpoint,
    debug: policies.debug, enableServiceWorker: policies.enableServiceWorker, cacheLevel: policies.cacheLevel, logLevel: policies.logLevel, showErrors: policies.showErrors, enableExperimentation: policies.enableExperimentation, telemetrySampling: policies.telemetrySampling,
    metadata: metadata, detectionMethod: resolvedEnv.detectionMethod || 'unknown', resolvedAt: Date.now()
  });
  this._initialized = true;
  this._destroyed = false;
  this._notifyListeners('initialized', this._state);
  return this._state;
};

EnvironmentStore.prototype.get = function(key: string) {
  if (!this._state) return null;
  if (key === undefined) return this._state;
  return this._state[key] !== undefined ? this._state[key] : null;
};

EnvironmentStore.prototype.isReady = function() { return this._initialized && !this._destroyed && this._state !== null; };

EnvironmentStore.prototype.getContext = function() {
  if (!this._state) return { env: ENVIRONMENTS.UNKNOWN, mode: MODES.DEVELOPMENT, debug: false, enableServiceWorker: false, cacheLevel: 'none' };
  return { env: this._state.environment, mode: this._state.mode, hostname: this._state.hostname, isSecure: this._state.isSecure, debug: this._state.debug, enableServiceWorker: this._state.enableServiceWorker, cacheLevel: this._state.cacheLevel, logLevel: this._state.logLevel, telemetrySampling: this._state.telemetrySampling, apiBaseUrl: this._state.apiBaseUrl, telemetryEndpoint: this._state.telemetryEndpoint };
};

EnvironmentStore.prototype.is = function(envValue: string) { return this._state ? this._state.environment === envValue : false; };

EnvironmentStore.prototype.isAny = function() {
  if (!this._state) return false;
  for (var i = 0; i < arguments.length; i++) { if (this._state.environment === arguments[i]) return true; }
  return false;
};

EnvironmentStore.prototype.isProd = function() { return this.is(ENVIRONMENTS.PROD); };
EnvironmentStore.prototype.isDev = function() { return this.isAny(ENVIRONMENTS.SANDBOX, ENVIRONMENTS.DEV, ENVIRONMENTS.LOCAL); };
EnvironmentStore.prototype.isTest = function() { return this.isAny(ENVIRONMENTS.TEST, ENVIRONMENTS.STAGE); };
EnvironmentStore.prototype.isLocal = function() { return this.isAny(ENVIRONMENTS.LOCAL, ENVIRONMENTS.SANDBOX); };
EnvironmentStore.prototype.isStaging = function() { return this.is(ENVIRONMENTS.STAGE); };
EnvironmentStore.prototype.canDebug = function() { return this._state && this._state.debug === true; };
EnvironmentStore.prototype.shouldEnableSW = function() { return this._state && this._state.enableServiceWorker === true; };

EnvironmentStore.prototype.onChange = function(callback: (...args: unknown[]) => void) {
  if (typeof callback !== 'function') throw new TypeError('Callback deve ser uma função');
  var self = this;
  this._listeners.push(callback);
  return function() {
    var index = self._listeners.indexOf(callback);
    if (index > -1) self._listeners.splice(index, 1);
  };
};

EnvironmentStore.prototype._notifyListeners = function(event: string, data: Record<string, unknown>) {
  var self = this;
  this._listeners.forEach(function(cb: (...args: unknown[]) => void) { try { cb(event, data); } catch (e) {} });
};

EnvironmentStore.prototype.getDebugInfo = function() {
  return { version: VERSION, moduleId: MODULE_ID, initialized: this._initialized, destroyed: this._destroyed, state: this._state, listenersCount: this._listeners.length, stateAge: this._state ? Date.now() - this._state.resolvedAt : null };
};

EnvironmentStore.prototype.reset = function() {
  this._state = null;
  this._initialized = false;
  this._destroyed = false;
  this._notifyListeners('reset', null);
};

EnvironmentStore.prototype.destroy = function() {
  this._listeners = [];
  this._destroyed = true;
};

EnvironmentStore.prototype.info = function() {
  return { moduleId: MODULE_ID, version: VERSION, initialized: this._initialized, environment: this._state ? this._state.environment : null };
};

EnvironmentStore.prototype.healthCheck = function() {
  return { status: this._initialized ? 'HEALTHY' : 'IDLE', moduleId: MODULE_ID, version: VERSION, checks: { initialized: this._initialized, stateReady: !!this._state, notDestroyed: !this._destroyed } };
};

// @ts-expect-error strict migration — TS7009
export var store = new EnvironmentStore();

export function info() { return store.info(); }
export function healthCheck() { return store.healthCheck(); }

export default store;
