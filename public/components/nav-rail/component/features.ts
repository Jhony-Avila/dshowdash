// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (5.1.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: navrail-component-features
// PURPOSE: NavRail Component - Features
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   NavRailRegistry from ../registry/index.js
//   NavRailFeatureLoader from ../core/feature-loader.js
//   createLogger from ../core/constants.js
//   getPort from ../ports.js
//
// PROVIDES:
//   registerFeature() — exported function
//   registerFeatures() — exported function
//   getLoadedFeatures() — exported function
//   getFailedFeatures() — exported function
//   isFeatureLoaded() — exported function
//
// RECEIVES (via init/options): (see init function if present)
//
// EMITS (eventos):
//   (none)
//
// LISTENS (eventos):
//   (none)
//
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { NavRailRegistry } from '../registry/index.js';
import { NavRailFeatureLoader } from '../core/feature-loader.js';
import { createLogger } from '../core/constants.js';
import { getPort } from '../ports.js';

export const VERSION = '1.0.0-ENTERPRISE';
export const MODULE_ID = 'nav-rail.component.features';

const _log = createLogger(getPort);

export async function initFeatureLoader(component: Record<string, unknown>) {
  try {
    NavRailFeatureLoader.init({
      container: component._root,
      eventBus: getPort('eventBus'),
      registry: NavRailRegistry,
      config: component._config
    });

    const cfg = component._config as Record<string, unknown>;
    if (cfg.features && Array.isArray(cfg.features)) {
      NavRailFeatureLoader.registerFeatures(cfg.features as Record<string, unknown>[]);
    }

    const featureResults = await NavRailFeatureLoader.loadEagerFeatures();
    component._featuresMounted = true;

    _log('info', 'Features loaded', {
      loaded: featureResults.loaded.length,
      failed: featureResults.failed.length
    });

    return featureResults;

  } catch (error: any) {
    _log('warn', 'Feature loader init failed (non-critical)', { error: error.message });
    component._featuresMounted = false;
    return { loaded: [], failed: [] };
  }
}

export async function loadFeature(featureId: string) {
  return NavRailFeatureLoader.loadFeatureOnDemand(featureId);
}

export function registerFeature(featureConfig: unknown) {
  return NavRailFeatureLoader.registerFeature(featureConfig as Record<string, unknown>);
}

export function registerFeatures(features: unknown[]) {
  return NavRailFeatureLoader.registerFeatures(features as Record<string, unknown>[]);
}

export function getLoadedFeatures() {
  return NavRailFeatureLoader.getLoadedFeatures();
}

export function getFailedFeatures() {
  return NavRailFeatureLoader.getFailedFeatures();
}

export function isFeatureLoaded(featureId: string) {
  return NavRailFeatureLoader.isFeatureLoaded(featureId);
}
