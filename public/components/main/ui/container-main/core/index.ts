// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (11.0.0-PHASE4-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-main:core
// PURPOSE: container-main/core/index.js
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   CORE_MODULES — exported value
//   info() — exported function
//   healthCheck() — exported function
//   DependencyMap — exported value
//   PluginSystem — exported value
//   LifecycleHooks — exported value
//   BootMetrics — exported value
//   StateSnapshots — exported value
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '11.0.0-PHASE4';
export const MODULE_ID = 'container-main:core';

// Core modules
export * from './constants.js';
export * from './event-bridge.js';
export * from './state.js';
export * from './label-resolver.js';
export * from './uarps.js';
export * from './container-core.js';
export * from './health.js';

// FASE 3
export * from './dependency-map.js';
export { default as DependencyMap } from './dependency-map.js';

// FASE 4
export * from './plugin-system.js';
export { default as PluginSystem } from './plugin-system.js';

export * from './lifecycle-hooks.js';
export { default as LifecycleHooks } from './lifecycle-hooks.js';

export * from './boot-metrics.js';
export { default as BootMetrics } from './boot-metrics.js';

export * from './state-snapshots.js';
export { default as StateSnapshots } from './state-snapshots.js';

// Lista de módulos
export const CORE_MODULES = Object.freeze([
  'constants', 'event-bridge', 'state', 'label-resolver', 'uarps',
  'container-core', 'health', 'dependency-map',
  'plugin-system', 'lifecycle-hooks', 'boot-metrics', 'state-snapshots'
]);

// Health check agregado
export async function coreHealthCheckAll() {
  const results = {};
  const modules = ['constants', 'event-bridge', 'dependency-map', 'plugin-system', 'lifecycle-hooks', 'boot-metrics', 'state-snapshots'];
  
  for (const name of modules) {
    try {
      const mod = await import(`./${name}.js`);
      (results as Record<string, unknown>)[name] = mod.healthCheck?.() || { status: 'NO_HEALTHCHECK' };
    } catch (e: any) {
      (results as Record<string, unknown>)[name] = { status: 'IMPORT_ERROR', error: e.message };
    }
  }


  // @ts-expect-error TS migration - TS2339
  const healthy = Object.values(results).filter(r => r.status === 'HEALTHY' || r.status === 'NOT_INITIALIZED').length;
  
  return {
    status: healthy === Object.keys(results).length ? 'HEALTHY' : 'DEGRADED',
    summary: { healthy, total: Object.keys(results).length },
    modules: results
  };
}

export function info() {
  return { moduleId: MODULE_ID, version: VERSION, modules: CORE_MODULES, totalModules: CORE_MODULES.length };
}

export function healthCheck() {
  return { status: 'HEALTHY', version: VERSION, moduleId: MODULE_ID, totalModules: CORE_MODULES.length };
}

export default { VERSION, MODULE_ID, CORE_MODULES, coreHealthCheckAll, info, healthCheck };
