

// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.4.0-P0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: config-loader-lifecycle
// PURPOSE: Config Loader - Lifecycle Manager v2.4.0-P0-ENTERPRISE
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   loadStaticConfigs, loadBackendConfigs, loadAllOverrides from ./loader.js
//   mergeConfigs, getSafeDefaults from ./merger.js
//   validateConfig from ./validator.js
//   ConfigStore from ../state/store.js
//   track, trackError, trackTiming, initTelemetry from ../telemetry/tracker.js
//   generateSessionId from ../utils/helpers.js
//   SYSTEM_EVENTS from /core/runtime/events/index.js
//   createCorePorts from /core/runtime/ports-profiles.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   injectPorts() — exported function
//   getPorts() — exported function
//   getVersion() — exported function
//   bootConfigLoader() — exported function
//   reloadConfig() — exported function
//   isBooted() — exported function
//   getLastBootTime() — exported function
//   getLastBootResult() — exported function
//   waitForBoot() — exported function
//   destroy() — exported function
//   getLifecycleInfo() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   SYSTEM_EVENTS.CONFIG_LOADED
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   window.APP_CONFIG
//   window.Environment
// ═══════════════════════════════════════════════════════════════
'use strict';

import { loadStaticConfigs, loadBackendConfigs, loadAllOverrides } from './loader.js';
import { mergeConfigs, getSafeDefaults } from './merger.js';
import { validateConfig } from './validator.js';
import { ConfigStore } from '../state/store.js';
import { track, trackError, trackTiming, initTelemetry } from '../telemetry/tracker.js';
import { generateSessionId } from '../utils/helpers.js';
import { SYSTEM_EVENTS } from '/core/runtime/events/catalog/system.events.js';
import { createCorePorts } from '/core/runtime/ports-profiles.js';

export var VERSION = '2.4.0-P0-ENTERPRISE';
export var MODULE_ID = 'config-loader-lifecycle';

// P0 ENTERPRISE: Ports-based access
var Ports = createCorePorts({ moduleId: MODULE_ID });
var _portsInitialized = false;
function _initPorts() { if (_portsInitialized) return; Ports.init(); _portsInitialized = true; }
function _getPort(name: string) { _initPorts(); return Ports.get(name); }
export function injectPorts(p: Record<string, unknown>) { return Ports.inject(p); }
export function getPorts() { return Ports.snapshot(); }

export function getVersion() {
  return VERSION;
}

var _booted = false;
var _bootPromise: Promise<Record<string, unknown>> | null = null;
var _lastBootTime: number | null = null;
var _bootResult: Record<string, unknown> | null = null;
var _destroyed = false;

function resolveBaseConfig() {
  try {
    if (typeof window !== 'undefined' && (window as any).Environment && (window as any).Environment.get) {
      var envData = {
        environment: (window as any).Environment.get('environment'),
        mode: (window as any).Environment.get('mode'),
        hostname: (window as any).Environment.get('hostname')
      };
      if (envData.environment && envData.environment !== 'UNKNOWN') {
        track('resolve:source', { source: 'EnvironmentManager', env: envData.environment, moduleId: MODULE_ID });
        return Object.assign({ _source: 'EnvironmentManager' }, envData);
      }
    }
  } catch (e: any) {
    track('resolve:env-error', { message: e.message, moduleId: MODULE_ID });
  }

  if (typeof window !== 'undefined' && window.APP_CONFIG) {
    track('resolve:source', { source: 'APP_CONFIG', moduleId: MODULE_ID });
    return Object.assign({ _source: 'APP_CONFIG' }, window.APP_CONFIG);
  }

  track('resolve:source', { source: 'empty-fallback', moduleId: MODULE_ID });
  return { _source: 'fallback' };
}

function syncToGlobalState(config: Record<string, unknown>) {
  try {
    // P0 ENTERPRISE: Use Ports to get GlobalState
    var gs = _getPort('globalState');
    if (gs && gs.dispatch) {
      gs.dispatch({
        type: 'SET_APP_CONFIG',
        payload: {
          loaded: true,
          timestamp: Date.now(),
          keys: Object.keys(config)
        }
      });
      track('global-state:synced', {
        hasApp: !!config.app,
        hasApi: !!config.api,
        hasTimeouts: !!config.timeouts,
        moduleId: MODULE_ID
      });
      return true;
    } else {
      track('global-state:not-available', { moduleId: MODULE_ID });
      return false;
    }
  } catch (e: any) {
    track('global-state:sync-error', { message: e.message, moduleId: MODULE_ID });
    return false;
  }
}

function emitConfigReady(success: boolean, config: unknown) {
  try {
    // P0 ENTERPRISE: Use Ports for EventBus
    var eb = _getPort('eventBus');
    if (eb && eb.emit) {
      eb.emit(SYSTEM_EVENTS.CONFIG_LOADED, {
        success: success,
        timestamp: new Date().toISOString(),
        version: VERSION,
        keys: Object.keys(config || {}),
        source: MODULE_ID
      });
    }

    // DOM CustomEvent for legacy listeners
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent(SYSTEM_EVENTS.CONFIG_LOADED, {
        detail: { success: success, timestamp: Date.now() }
      }));
    }
  } catch (e: any) {
    // Silencioso
  }
}

export function bootConfigLoader(force: boolean = false) {
  if (force === undefined) force = false;
  if (_booted && !force) {
    track('lifecycle:boot:already-booted', { moduleId: MODULE_ID });
    return Promise.resolve(_bootResult || { ok: true, config: ConfigStore.getAll(), errors: [] });
  }

  if (_bootPromise && !force) {
    track('lifecycle:boot:waiting', { reason: 'Boot já em andamento', moduleId: MODULE_ID });
    return _bootPromise;
  }

  _bootPromise = _performBoot() as Promise<Record<string, unknown>>;
  return _bootPromise;
}

function _performBoot() {
  var startTime = Date.now();
  var sessionId = generateSessionId();

  initTelemetry(sessionId);
  track('lifecycle:boot:start', { sessionId: sessionId, version: VERSION, moduleId: MODULE_ID });

  return Promise.resolve()
    .then(function() {
      track('lifecycle:step', { step: 0, name: 'resolveBaseConfig', moduleId: MODULE_ID });
      return resolveBaseConfig();
    })
    .then(function(baseConfig) {
      track('lifecycle:step', { step: 1, name: 'loadStaticConfigs', moduleId: MODULE_ID });
      return loadStaticConfigs().then(function(staticConfig) {
        return { baseConfig: baseConfig, staticConfig: staticConfig };
      });
    })
    .then(function(data: Record<string, unknown>) {
      track('lifecycle:step', { step: 2, name: 'loadBackendConfigs', moduleId: MODULE_ID });
      // @ts-expect-error strict migration — TS2345
      return loadBackendConfigs().then(function(backendConfig: Record<string, unknown>) {
        data.backendConfig = backendConfig;
        return data;
      });
    })
    // @ts-expect-error strict migration — TS2345
    .then(function(data: Record<string, unknown>) {
      track('lifecycle:step', { step: 3, name: 'loadAllOverrides', moduleId: MODULE_ID });
      var overridesResult = loadAllOverrides();
      data.overridesResult = overridesResult;
      return data;
    })
    // @ts-expect-error strict migration — TS2345
    .then(function(data: Record<string, unknown>) {
      track('lifecycle:step', { step: 4, name: 'mergeConfigs', moduleId: MODULE_ID });
      var mergedConfig = mergeConfigs({
        defaults: data.baseConfig as Record<string, unknown>,
        staticConfig: data.staticConfig as Record<string, unknown>,
        backendConfig: data.backendConfig as Record<string, unknown>,
        overrides: ((data.overridesResult as Record<string, unknown>).values || data.overridesResult) as Record<string, unknown>
      });
      data.mergedConfig = mergedConfig;
      return data;
    })
    // @ts-expect-error strict migration — TS2345
    .then(function(data: Record<string, unknown>) {
      track('lifecycle:step', { step: 5, name: 'validateConfig', moduleId: MODULE_ID });
      var validationResult = validateConfig(data.mergedConfig as Record<string, unknown>);
      data.validationResult = validationResult;
      return data;
    })
    // @ts-expect-error strict migration — TS2345
    .then(function(data: Record<string, unknown>) {
      track('lifecycle:step', { step: 6, name: 'setFinalConfig', moduleId: MODULE_ID });
      ConfigStore.setFinalConfig((data.validationResult as Record<string, unknown>).config as Record<string, unknown>, (data.overridesResult as Record<string, unknown>).meta as Record<string, unknown>);
      return data;
    })
    // @ts-expect-error strict migration — TS2345
    .then(function(data: Record<string, unknown>) {
      track('lifecycle:step', { step: 7, name: 'syncToGlobalState', moduleId: MODULE_ID });
      var validationResult = data.validationResult as Record<string, unknown>;
      var baseConfig = data.baseConfig as Record<string, unknown>;
      var overridesResult = data.overridesResult as Record<string, unknown>;
      syncToGlobalState(validationResult.config as Record<string, unknown>);

      var duration = Date.now() - startTime;
      _booted = true;
      _destroyed = false;
      _lastBootTime = Date.now();

      if (validationResult.ok) {
        track('lifecycle:boot:success', {
          durationMs: duration,
          configKeys: Object.keys(validationResult.config as object).length,
          source: baseConfig._source,
          hasOverrides: (overridesResult.meta && (overridesResult.meta as Record<string, unknown>).hasOverrides) || false,
          moduleId: MODULE_ID
        });
      } else {
        track('lifecycle:boot:fallback', {
          durationMs: duration,
          errors: validationResult.errors,
          reason: 'Validação falhou, usando config segura',
          moduleId: MODULE_ID
        });
      }

      trackTiming('bootConfigLoader', duration, validationResult.ok as boolean);
      emitConfigReady(validationResult.ok as boolean, validationResult.config);

      _bootResult = data.validationResult as Record<string, unknown>;
      _bootPromise = null;
      return data.validationResult;
    })
    .catch(function(err) {
      var duration = Date.now() - startTime;
      trackError('lifecycle:boot', err, { durationMs: duration, moduleId: MODULE_ID });
      trackTiming('bootConfigLoader', duration, false);

      var safeConfig = getSafeDefaults() as Record<string, unknown>;
      ConfigStore.setFinalConfig(safeConfig);
      _booted = true;
      _lastBootTime = Date.now();

      track('lifecycle:boot:critical-fallback', {
        error: err.message,
        durationMs: duration,
        moduleId: MODULE_ID
      });

      emitConfigReady(false, safeConfig);

      _bootResult = {
        ok: false,
        config: safeConfig,
        errors: [err.message]
      };
      _bootPromise = null;

      return _bootResult;
    });
}

export function reloadConfig() {
  track('lifecycle:reload:start', { moduleId: MODULE_ID });

  ConfigStore._reset();
  _booted = false;
  _bootPromise = null;
  _bootResult = null;

  return bootConfigLoader(true);
}

export function isBooted() {
  return _booted && !_destroyed;
}

export function getLastBootTime() {
  return _lastBootTime;
}

export function getLastBootResult() {
  return _bootResult;
}

export function waitForBoot(timeoutMs: number = 10000) {
  if (timeoutMs === undefined) timeoutMs = 10000;
  if (_booted) {
    return Promise.resolve(true);
  }

  if (_bootPromise) {
    return _bootPromise.then(function() {
      return true;
    }).catch(function() {
      return false;
    });
  }

  var startTime = Date.now();
  return new Promise(function(resolve) {
    var checkInterval = setInterval(function() {
      if (_booted) {
        clearInterval(checkInterval);
        resolve(true);
      } else if (Date.now() - startTime > timeoutMs) {
        clearInterval(checkInterval);
        track('lifecycle:waitForBoot:timeout', { timeoutMs: timeoutMs, moduleId: MODULE_ID });
        resolve(false);
      }
    }, 100);
  });
}

export function destroy() {
  ConfigStore.destroy();
  _booted = false;
  _bootPromise = null;
  _bootResult = null;
  _destroyed = true;
}

export function getLifecycleInfo() {
  return {
    version: VERSION,
    moduleId: MODULE_ID,
    booted: _booted,
    destroyed: _destroyed,
    lastBootTime: _lastBootTime,
    hasBootResult: !!_bootResult,
    bootResultOk: _bootResult ? _bootResult.ok : undefined,
    bootErrors: _bootResult ? _bootResult.errors : []
  };
}

export function info() {
  return getLifecycleInfo();
}

export function healthCheck() {
  return {
    status: _booted && !_destroyed ? 'HEALTHY' : 'DEGRADED',
    moduleId: MODULE_ID,
    version: VERSION,
    p0Enterprise: true,
    portsInitialized: _portsInitialized,
    checks: {
      booted: _booted,
      notDestroyed: !_destroyed,
      hasBootResult: !!_bootResult,
      bootResultOk: _bootResult ? _bootResult.ok : false
    }
  };
}

export default {
  VERSION: VERSION,
  MODULE_ID: MODULE_ID,
  getVersion: getVersion,
  bootConfigLoader: bootConfigLoader,
  reloadConfig: reloadConfig,
  isBooted: isBooted,
  getLastBootTime: getLastBootTime,
  getLastBootResult: getLastBootResult,
  waitForBoot: waitForBoot,
  destroy: destroy,
  getLifecycleInfo: getLifecycleInfo,
  info: info,
  healthCheck: healthCheck,
  injectPorts: injectPorts,
  getPorts: getPorts
};
