// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: fonts-manager-lifecycle
// PURPOSE: Fonts Manager - Lifecycle v8.1.0-ENTERPRISE
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   Store from ../state/store.js
//   Loader from ./loader.js
//   Engine from ./engine.js
//   Tracker from ../telemetry/tracker.js
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   init() — exported function
//   reset() — exported function
//   reload() — exported function
//   destroy() — exported function
//   getLifecycleInfo() — exported function
//   isInitialized() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   global.extended
//   global.tokens
//   (window as any).ThemeTokensLoader
// ═══════════════════════════════════════════════════════════════
'use strict';

import Store from '../state/store.js';
import Loader from './loader.js';
import Engine from './engine.js';
import Tracker from '../telemetry/tracker.js';

export var MODULE_ID = 'fonts-manager-lifecycle';
export var VERSION = '8.1.0-ENTERPRISE';

var lifecycleState = { initialized: false, initializing: false, initCount: 0, lastInitAt: null as unknown | null, lastError: null as unknown | null, config: null as unknown | null };
var DEFAULT_INIT_CONFIG = { sources: [] as unknown[], roles: null as unknown | null, typography: null as unknown | null, respectTokens: true, autoGenerate: true };

export async function init(config: Record<string, unknown>) {
  config = config || {};
  if (lifecycleState.initialized && !config.force) return { ok: true, alreadyInitialized: true, initCount: lifecycleState.initCount };
  if (lifecycleState.initializing) return { ok: false, error: 'Already initializing' };
  lifecycleState.initializing = true;
  lifecycleState.config = {};
  // @ts-expect-error strict migration — TS18046, TS7053
  for (var k in DEFAULT_INIT_CONFIG) { if (DEFAULT_INIT_CONFIG.hasOwnProperty(k)) lifecycleState.config[k] = DEFAULT_INIT_CONFIG[k]; }
  // @ts-expect-error strict migration — TS18046
  for (var k2 in config) { if (config.hasOwnProperty(k2)) lifecycleState.config[k2] = config[k2]; }
  var startTime = performance.now();
  Tracker.trackLifecycle('init', { config: lifecycleState.config });
  try {
    Engine.configure({ htmlFontSize: config.htmlFontSize || 16, baseFontSize: config.baseFontSize || 14, respectTokens: config.respectTokens !== false } as Record<string, unknown>);
    var _lc = lifecycleState.config as Record<string, unknown>;
    if (_lc.respectTokens && typeof window !== 'undefined') {
      var TTL = (window as any).ThemeTokensLoader;
      if (TTL && TTL.isInitialized && TTL.isInitialized()) {
        var globalTokens = TTL.getGlobalTokens ? TTL.getGlobalTokens() : {};
        var merged = {};
        var gt = globalTokens['global.tokens'] || {};
        var ge = globalTokens['global.extended'] || {};
        // @ts-expect-error strict migration — TS7053
        for (var gk in gt) { if (gt.hasOwnProperty(gk)) merged[gk] = gt[gk]; }
        // @ts-expect-error strict migration — TS7053
        for (var gk2 in ge) { if (ge.hasOwnProperty(gk2)) merged[gk2] = ge[gk2]; }
        Engine.configureFromTokens(merged);
        Tracker.trackEvent('tokens:integrated', { tokenCount: Object.keys(merged).length });
      }
    }
    if (_lc.roles) Store.setRoles(_lc.roles as Record<string, unknown>);
    var loadResult = { ok: true, loaded: 0, failed: 0 };
    if (_lc.sources && (_lc.sources as unknown[]).length > 0) {
      loadResult = await Loader.loadAllSources(_lc.sources);
      (Tracker as any).trackSourcesLoaded(loadResult);
    } else {
      var state = Store.getState();
      if (state.sources.length > 0) { loadResult = await Loader.loadAllSources(state.sources); (Tracker as any).trackSourcesLoaded(loadResult); }
    }
    if (_lc.autoGenerate) {
      var typoVariants = _lc.typography ? (_lc.typography as Record<string, unknown>).variants : null;
      Engine.generateTypography(typoVariants);
    }
    lifecycleState.initialized = true; lifecycleState.initializing = false; lifecycleState.initCount++; lifecycleState.lastInitAt = Date.now(); lifecycleState.lastError = null;
    Store.setInitialized(true); Store.setStatus('ready');
    var duration = performance.now() - startTime;
    Tracker.trackLifecycle('complete', { duration: duration, loadResult: loadResult });
    return { ok: true, alreadyInitialized: false, initCount: lifecycleState.initCount, duration: duration, sources: loadResult };
  } catch (error: any) {
    lifecycleState.initializing = false; lifecycleState.lastError = (error as Error).message;
    Store.setStatus('error', (error as Error).message); Tracker.trackError('init:failed', error as Error);
    return { ok: false, error: error.message };
  }
}


export function reset() { Tracker.trackLifecycle('reset', {}); Loader.cleanup(); Store.reset(); lifecycleState.initialized = false; lifecycleState.initializing = false; lifecycleState.lastError = null; lifecycleState.config = null; return { ok: true }; }
export async function reload(config: Record<string, unknown>) { reset(); return init(config || (lifecycleState.config as Record<string, unknown>) || {}); }

export function destroy() { Tracker.trackLifecycle('destroy', {}); reset(); lifecycleState.initCount = 0; lifecycleState.lastInitAt = null; return { ok: true }; }
export function getLifecycleInfo() { return { initialized: lifecycleState.initialized, initializing: lifecycleState.initializing, initCount: lifecycleState.initCount, lastInitAt: lifecycleState.lastInitAt, lastError: lifecycleState.lastError, storeInitialized: Store.get('initialized'), status: Store.get('status') }; }
export function isInitialized() { return lifecycleState.initialized; }

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: lifecycleState.initialized ? 'HEALTHY' : 'DEGRADED', moduleId: MODULE_ID, version: VERSION, initialized: lifecycleState.initialized }; }

export default { MODULE_ID: MODULE_ID, VERSION: VERSION, init: init, reset: reset, reload: reload, destroy: destroy, getLifecycleInfo: getLifecycleInfo, isInitialized: isInitialized, info: info, healthCheck: healthCheck };
