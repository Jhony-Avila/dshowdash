// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: sidebar/core/feature-loader
// PURPOSE: Dynamic feature loading, registration, and enabling for kernel-orchestrated sidebar
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   Kernel from ../kernel/index.js
//   getFeaturesSortedByPriority from ../features/feature-manifest.js
//   MetricsHub from ../telemetry/metrics-hub.js
//   CircuitBreaker from ../kernel/circuit-breaker.js
//   getConfig from ./config-loader.js
//
// PROVIDES:
//   loadFeatureModule(featureDef, ctx) — dynamic import of feature module
//   registerFeatures(ctx) — register all features with kernel
//   enableFeatures(eventBus, sidebarEl, ctx) — enable auto-start features
//
// RECEIVES (via ctx):
//   ctx.log, ctx.config, ctx.moduleMetrics, ctx.safeMode,
//   ctx.featuresLoaded, ctx.setFeaturesLoaded, ctx.featureModules
//
// NOTE: Feature paths in manifest are relative to sidebar root (e.g. './features/xxx.js').
//       Since this module lives in core/, we must resolve paths relative to parent (../).
//
// WINDOW ACCESS: (none)
// ═══════════════════════════════════════════════════════════════
// @changelog v1.0.1: Fixed relative path resolution — paths now resolve from sidebar root, not core/
// @changelog v1.0.0: Extracted from sidebar/index.js v7.3.0 during modularization
'use strict';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;

export const MODULE_ID = 'sidebar.core.feature-loader';

import * as Kernel from '../kernel/index.js';
import { getFeaturesSortedByPriority } from '../features/feature-manifest.js';
import * as MetricsHub from '../telemetry/metrics-hub.js';
import * as CircuitBreaker from '../kernel/circuit-breaker.js';
import { getConfig } from './config-loader.js';
import { SIDEBAR_FEATURES } from '../features/_barrel.js';


export const VERSION = '1.0.1-ENTERPRISE';

// ── Path Resolution ─────────────────────────────────────────
// Manifest paths are relative to sidebar root: './features/xxx.js'
// This module is in core/, so we prepend '../' to resolve correctly.
function resolveFeaturePath(manifestPath: string) {
  if (manifestPath.startsWith('./')) {
    return '../' + manifestPath.slice(2);
  }
  if (manifestPath.startsWith('/')) {
    return manifestPath;
  }
  return '../' + manifestPath;
}

// ── Feature Module Loading ──────────────────────────────────
export async function loadFeatureModule(featureDef: DynObj, ctx: DynObj) {
  if (ctx.featureModules.has(featureDef.id)) return ctx.featureModules.get(featureDef.id);
  try {
    const module = (SIDEBAR_FEATURES as DynObj)[featureDef.id];
    if (!module) {
      ctx.moduleMetrics.featureErrors++;
      ctx.log('warn', `Feature not found in barrel: ${featureDef.id}`);
      return null;
    }
    ctx.featureModules.set(featureDef.id, module);
    return module;
  } catch (error: any) {
    ctx.moduleMetrics.featureErrors++;
    ctx.moduleMetrics.lastError = { featureId: featureDef.id, message: error.message, timestamp: Date.now() };
    ctx.log('warn', `Failed to load feature: ${featureDef.id}`, error.message);
    return null;
  }
}

// ── Feature Tier Resolution ─────────────────────────────────
function getFeatureTier(featureId: string) {
  try {
    const config = getConfig();
    const tiers = (config && config.featureTiers) || {};
    if (tiers.CORE && tiers.CORE.indexOf(featureId) > -1) return 'CORE';
    if (tiers.POST_READY && tiers.POST_READY.indexOf(featureId) > -1) return 'POST_READY';
    if (tiers.OPT_IN && tiers.OPT_IN.indexOf(featureId) > -1) return 'OPT_IN';
    return 'CORE';
  } catch (e) { return 'CORE'; }
}

function shouldLoadFeature(featureDef: DynObj, ctx: DynObj) {
  if (featureDef.enabled === false) return false;
  if (!ctx.safeMode) return true;
  const tier = getFeatureTier(featureDef.id);
  return tier === 'CORE';
}

function shouldAutoEnable(featureDef: DynObj, ctx: DynObj) {
  if (featureDef.enabled === false) return false;
  if (featureDef.priority > ctx.config.autoEnableMaxPriority) return false;
  return true;
}

// ── Register Features ───────────────────────────────────────
export async function registerFeatures(ctx: DynObj) {
  if (ctx.featuresLoaded) return;
  const sortedFeatures = getFeaturesSortedByPriority();

  if (ctx.config.enableCircuitBreaker) {
    for (let i = 0; i < sortedFeatures.length; i++) {
      CircuitBreaker.configure(sortedFeatures[i].id, {
        failureThreshold: ctx.config.circuitBreakerFailureThreshold,
        timeout: ctx.config.circuitBreakerTimeout
      });
    }
  }

  for (let j = 0; j < sortedFeatures.length; j++) {
    const featureDef = sortedFeatures[j];

    if (!shouldLoadFeature(featureDef, ctx)) {
      ctx.log('debug', `Feature skipped (disabled): ${featureDef.id}`);
      ctx.moduleMetrics.featuresSkipped++;
      continue;
    }

    if (ctx.config.enableCircuitBreaker) {
      const cbCheck = CircuitBreaker.canExecute(featureDef.id);
      if (!cbCheck.allowed) {
        ctx.log('warn', `Feature blocked by circuit breaker: ${featureDef.id}`, cbCheck.reason);
        ctx.moduleMetrics.circuitBreakerBlocks++;
        continue;
      }
    }

    try {
      const module = await loadFeatureModule(featureDef, ctx);
      if (!module) {
        if (ctx.config.enableCircuitBreaker) {
          CircuitBreaker.recordFailure(featureDef.id, 'Load failed' as DynObj);
        }
        continue;
      }

      const result = Kernel.registerFeature({
        id: featureDef.id,
        version: module.VERSION || (module.default && module.default.VERSION) || '0.0.0',
        category: featureDef.category,
        priority: featureDef.priority,
        dependencies: featureDef.dependencies || [],
        capabilities: { requiresEl: featureDef.requiresEl },
        init: module.init || (module.default && module.default.init),
        cleanup: module.cleanup || module.destroy || (module.default && (module.default.cleanup || module.default.destroy)),
        getMetrics: module.getMetrics || (module.default && module.default.getMetrics),
        healthCheck: module.healthCheck || (module.default && module.default.healthCheck),
        info: module.info || (module.default && module.default.info)
      });

      if (result.ok) {
        ctx.moduleMetrics.featuresRegistered++;
        if (ctx.config.enableCircuitBreaker) {
          CircuitBreaker.recordSuccess(featureDef.id);
        }
        if (module.getMetrics || (module.default && module.default.getMetrics)) {
          MetricsHub.registerSource(featureDef.id, {
            category: featureDef.category,
            version: module.VERSION || (module.default && module.default.VERSION) || '0.0.0',
            getMetrics: module.getMetrics || (module.default && module.default.getMetrics),
            healthCheck: module.healthCheck || (module.default && module.default.healthCheck)
          });
        }
      } else {
        if (ctx.config.enableCircuitBreaker) {
          CircuitBreaker.recordFailure(featureDef.id, 'Registration failed' as DynObj);
        }
      }
    } catch (error: any) {
      ctx.moduleMetrics.featureErrors++;
      if (ctx.config.enableCircuitBreaker) {
        CircuitBreaker.recordFailure(featureDef.id, error.message);
      }
      ctx.log('warn', `Failed to register feature: ${featureDef.id}`, error.message);
    }
  }
  ctx.setFeaturesLoaded(true);
}

// ── Enable Features ─────────────────────────────────────────
export async function enableFeatures(eventBus: DynObj, sidebarEl: HTMLElement, ctx: DynObj) {
  const sortedFeatures = getFeaturesSortedByPriority();

  for (let i = 0; i < sortedFeatures.length; i++) {
    const featureDef = sortedFeatures[i];

    if (!shouldLoadFeature(featureDef, ctx)) continue;
    if (!shouldAutoEnable(featureDef, ctx)) continue;

    if (ctx.config.enableCircuitBreaker) {
      const cbCheck = CircuitBreaker.canExecute(featureDef.id);
      if (!cbCheck.allowed) {
        ctx.moduleMetrics.circuitBreakerBlocks++;
        continue;
      }
    }

    try {
      if (featureDef.requiresEl && !sidebarEl) continue;

      const opts = {
        eventBus,
        sidebarEl: featureDef.requiresEl ? sidebarEl : undefined
      };

      const result = Kernel.enableFeature(featureDef.id, opts);

      if (result.ok && !(result.data && result.data.alreadyEnabled)) {
        ctx.moduleMetrics.featuresEnabled++;
        if (ctx.config.enableCircuitBreaker) {
          CircuitBreaker.recordSuccess(featureDef.id);
        }
        ctx.log('debug', `Feature enabled: ${featureDef.id} (priority=${featureDef.priority})`);
      } else if (!result.ok) {
        ctx.moduleMetrics.featureErrors++;
        if (ctx.config.enableCircuitBreaker) {
          CircuitBreaker.recordFailure(featureDef.id, 'Enable failed' as DynObj);
        }
      }
    } catch (error: any) {
      ctx.moduleMetrics.featureErrors++;
      if (ctx.config.enableCircuitBreaker) {
        CircuitBreaker.recordFailure(featureDef.id, error.message);
      }
      ctx.log('warn', `Failed to enable feature: ${featureDef.id}`, error.message);
    }
  }
}
