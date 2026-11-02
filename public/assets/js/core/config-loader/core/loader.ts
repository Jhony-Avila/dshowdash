// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.2.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: config-loader-loader
// PURPOSE: Config Loader - Source Loader v2.2.0-ENTERPRISE
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   track, trackError, trackTiming from ../telemetry/tracker.js
//   loadLocalOverrides, loadQueryParamOverrides from ../utils/helpers.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   getVersion() — exported function
//   loadStaticConfigs() — exported function
//   loadBackendConfigs() — exported function
//   loadAllOverrides() — exported function
//   getSourcesInfo() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   localStorage
//   window.APP_CONFIG
//   (window as any).RESILIENCE_CONFIG
// ═══════════════════════════════════════════════════════════════
'use strict';

import { track, trackError, trackTiming } from '../telemetry/tracker.js';
import { loadLocalOverrides, loadQueryParamOverrides } from '../utils/helpers.js';

export var VERSION = '2.2.0-ENTERPRISE';
export var MODULE_ID = 'config-loader-loader';

export function getVersion() { return VERSION; }

export function loadStaticConfigs() {
  var startTime = Date.now();
  track('source:static:start', { moduleId: MODULE_ID });

  var result: Record<string, Record<string, unknown>> = { app: {}, resilience: {}, features: {}, schemas: {} };

  return new Promise(function(resolve) {
    try {
      if (typeof window !== 'undefined' && window.APP_CONFIG) {
        result.app = window.APP_CONFIG;
        track('source:static:app', { loaded: true, keys: Object.keys(result.app).length });
      } else {
        track('source:static:app', { loaded: false, reason: 'window.APP_CONFIG não disponível' });
      }

      if (typeof window !== 'undefined' && (window as any).RESILIENCE_CONFIG) {
        result.resilience = (window as any).RESILIENCE_CONFIG;
        track('source:static:resilience', { loaded: true });
      } else {
        track('source:static:resilience', { loaded: false });
      }

      var _abortCtrl = new AbortController();
      var _fetchTimeout = setTimeout(function() { _abortCtrl.abort(); }, 10000);
      fetch('/config/features/feature-flags.json', { cache: 'no-cache', headers: { 'Accept': 'application/json' }, signal: _abortCtrl.signal })
        .then(function(featuresResponse) {
          if (featuresResponse.ok) {
            return featuresResponse.json().then(function(featuresData) {
              result.features = featuresData;
              track('source:static:features', { loaded: true, version: featuresData.version || 'unknown' });
            });
          } else {
            track('source:static:features', { loaded: false, status: featuresResponse.status });
          }
        })

        .catch(function(fetchErr) { trackError('source:static:features', fetchErr); })
        .finally(function() {
          clearTimeout(_fetchTimeout);
          trackTiming('loadStaticConfigs', Date.now() - startTime, true);
          var sources = [];
          for (var k in result) { if (Object.keys(result[k]).length > 0) sources.push(k); }
          track('source:static:complete', { sources: sources });
          resolve(result);
        });
    } catch (err) {

      // @ts-expect-error strict migration — TS2345
      trackError('loadStaticConfigs', err);
      trackTiming('loadStaticConfigs', Date.now() - startTime, false);
      resolve(result);
    }
  });
}

export function loadBackendConfigs() {
  var startTime = Date.now();
  track('source:backend:start', { moduleId: MODULE_ID });
  return new Promise(function(resolve) {
    track('source:backend:skip', { reason: 'Nenhum endpoint configurado ainda' });
    trackTiming('loadBackendConfigs', Date.now() - startTime, true);
    resolve({});
  });
}

export function loadAllOverrides() {
  var startTime = Date.now();
  track('source:overrides:start', { moduleId: MODULE_ID });

  try {
    var localStorageOverrides = loadLocalOverrides();
    var queryParamOverrides = loadQueryParamOverrides();
    var merged: Record<string, unknown> = {};
    for (var lk in localStorageOverrides) { if (Object.prototype.hasOwnProperty.call(localStorageOverrides, lk)) merged[lk] = (localStorageOverrides as Record<string, unknown>)[lk]; }
    for (var qk in queryParamOverrides) { if (Object.prototype.hasOwnProperty.call(queryParamOverrides, qk)) merged[qk] = (queryParamOverrides as Record<string, unknown>)[qk]; }

    var localKeys = Object.keys(localStorageOverrides);
    var queryKeys = Object.keys(queryParamOverrides);

    track('source:overrides:complete', { localStorage: localKeys.length > 0, localKeys: localKeys, queryParams: queryKeys.length > 0, queryKeys: queryKeys, totalKeys: Object.keys(merged).length });
    trackTiming('loadAllOverrides', Date.now() - startTime, true);

    return { values: merged, meta: { localKeys: localKeys, queryKeys: queryKeys, hasOverrides: Object.keys(merged).length > 0 } };
  } catch (err) {

    // @ts-expect-error strict migration — TS2345
    trackError('loadAllOverrides', err);
    trackTiming('loadAllOverrides', Date.now() - startTime, false);
    return { values: {}, meta: { localKeys: [], queryKeys: [], hasOverrides: false } };
  }
}

export function getSourcesInfo() { return { version: VERSION, moduleId: MODULE_ID, hasAppConfig: typeof window !== 'undefined' && !!window.APP_CONFIG, hasResilienceConfig: typeof window !== 'undefined' && !!(window as any).RESILIENCE_CONFIG }; }

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { loadStaticConfigsReady: typeof loadStaticConfigs === 'function', loadAllOverridesReady: typeof loadAllOverrides === 'function' } }; }
