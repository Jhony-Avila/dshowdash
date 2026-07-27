// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (3.3.0-MODULAR-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-main:resources
// PURPOSE: Resources - Barrel export
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   RESOURCE_MODULES — exported value
//   info() — exported function
//   healthCheck() — exported function
//   CircuitBreaker — exported value
//   ResourceManager — exported value
//   CleanupScheduler — exported value
//   CapabilityManager — exported value
//   LayoutManager — exported value
//   ListenerTracker — exported value
//   DeprecationManager — exported value
//   CompatLayer — exported value
//   LifecycleGuard — exported value
//   ImageVirtualizer — exported value
//   LayoutIntegration — exported value
//   MetricsPersistence — exported value
//   PerformanceMonitor — exported value
//   FallbackSystem — exported value
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

export const VERSION = '3.3.0-MODULAR';
export const MODULE_ID = 'container-main:resources';

// === CORE RESOURCES ===
export * from './circuit-breaker.js';
export * from './resource-manager/index.js';
export * from './cleanup-scheduler.js';
export * from './capability-manager/index.js';
export * from './layout-manager.js';
export * from './listener-tracker.js';
export * from './deprecation-manager.js';
export * from './compat-layer.js';
export * from './lifecycle-guard.js';
export * from './image-virtualizer.js';
export * from './layout-integration/index.js';
export * from './metrics-persistence.js';

// === PHASE 2 RESOURCES ===
export * from './performance-monitor.js';
export * from './fallback-system.js';

// === DEFAULT EXPORTS ===
export { default as CircuitBreaker } from './circuit-breaker.js';
export { default as ResourceManager } from './resource-manager/index.js';
export { default as CleanupScheduler } from './cleanup-scheduler.js';
export { default as CapabilityManager } from './capability-manager/index.js';
export { default as LayoutManager } from './layout-manager.js';
export { default as ListenerTracker } from './listener-tracker.js';
export { default as DeprecationManager } from './deprecation-manager.js';
export { default as CompatLayer } from './compat-layer.js';
export { default as LifecycleGuard } from './lifecycle-guard.js';
export { default as ImageVirtualizer } from './image-virtualizer.js';
export { default as LayoutIntegration } from './layout-integration/index.js';
export { default as MetricsPersistence } from './metrics-persistence.js';

// Phase 2
export { default as PerformanceMonitor } from './performance-monitor.js';
export { default as FallbackSystem } from './fallback-system.js';

// Lista de todos os módulos
export const RESOURCE_MODULES = Object.freeze([
  // Core (12)
  'circuit-breaker',
  'resource-manager',
  'cleanup-scheduler',
  'capability-manager',
  'layout-manager',
  'listener-tracker',
  'deprecation-manager',
  'compat-layer',
  'lifecycle-guard',
  'image-virtualizer',
  'layout-integration',
  'metrics-persistence',
  // Phase 2 (2)
  'performance-monitor',
  'fallback-system'
]);

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    modules: RESOURCE_MODULES,
    totalModules: RESOURCE_MODULES.length,
    categories: {
      core: 12,
      phase2: 2
    }
  };
}

export function healthCheck() {
  return {
    status: 'HEALTHY',
    version: VERSION,
    moduleId: MODULE_ID,
    modules: RESOURCE_MODULES.length
  };
}

export default {
  VERSION, MODULE_ID,
  RESOURCE_MODULES,
  info, healthCheck
};
