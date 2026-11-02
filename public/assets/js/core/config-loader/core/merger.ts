// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.2.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: config-loader-merger
// PURPOSE: Config Loader - Configuration Merger v2.2.0-ENTERPRISE
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   deepMerge from ../utils/deepmerge.js
//   track from ../telemetry/tracker.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   getVersion() — exported function
//   mergeConfigs() — exported function
//   getSafeDefaults() — exported function
//   getSafeDefaultKeys() — exported function
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

import { deepMerge } from '../utils/deepmerge.js';
import { track } from '../telemetry/tracker.js';

export var VERSION = '2.2.0-ENTERPRISE';
export var MODULE_ID = 'config-loader-merger';

export function getVersion() { return VERSION; }

var SAFE_DEFAULTS = {
  env: 'UNKNOWN',
  app: { name: 'DshowDash', version: '0.0.0', build: '00000000', assetsVersion: '0', debug: false, apiUrl: '/api' },
  api: { baseUrl: '/api', timeouts: { global: 5000, health: 3000, default: 10000 } },
  layout: { sidebarInitialState: 'expanded', theme: 'flat-dark' },
  features: { enableTelemetry: true, enableBootTracker: true },
  refresh: { global: 60000, cards: 30000, panels: 45000 },
  timeouts: { readyTimeoutMs: 12000, componentTimeoutMs: 10000, apiDefaultMs: 10000, configLoadMs: 5000 }
};

export function mergeConfigs(opts: { defaults?: Record<string, unknown>; staticConfig?: Record<string, unknown>; backendConfig?: Record<string, unknown>; overrides?: Record<string, unknown> }) {
  var defaults = opts.defaults || {};
  var staticConfig = opts.staticConfig || {};
  var backendConfig = opts.backendConfig || {};
  var overrides = opts.overrides || {};

  track('merger:start', { hasDefaults: Object.keys(defaults).length > 0, hasStatic: Object.keys(staticConfig).length > 0, hasBackend: Object.keys(backendConfig).length > 0, hasOverrides: Object.keys(overrides).length > 0, moduleId: MODULE_ID });

  var merged = deepMerge(SAFE_DEFAULTS, defaults, staticConfig.app || {}, { resilience: staticConfig.resilience || {} }, { featureFlags: staticConfig.features || {} }, backendConfig, overrides);

  track('merger:complete', { finalKeys: Object.keys(merged).length, hasApp: !!(merged as Record<string, unknown>).app, hasTimeouts: !!(merged as Record<string, unknown>).timeouts, hasFeatures: !!(merged as Record<string, unknown>).features || !!(merged as Record<string, unknown>).featureFlags, moduleId: MODULE_ID });

  return merged;
}

export function getSafeDefaults() { return deepMerge({}, SAFE_DEFAULTS); }
export function getSafeDefaultKeys() { return Object.keys(SAFE_DEFAULTS); }

export function info() { return { moduleId: MODULE_ID, version: VERSION, defaultKeysCount: Object.keys(SAFE_DEFAULTS).length }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { mergeConfigsReady: typeof mergeConfigs === 'function', safeDefaultsReady: Object.keys(SAFE_DEFAULTS).length > 0 } }; }
