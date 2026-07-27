// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (6.5.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: health-reporter
// PURPOSE: Sidebar Health Reporter
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   VERSION, MODULE_ID from ../core/constants.js
//   getDegradedComponents, getStatus from ../core/error-emitter.js
//   getMetrics as getToggleMetrics from ../api/public-methods.js
//   SidebarRegistry from ../registry/registry.js
//   NavigationModelLoader from ../integration/navigation-model-loader.js
//
// PROVIDES:
//   createHealthReporter() — exported function
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

import { VERSION, MODULE_ID } from '../core/constants.js';
import { getDegradedComponents, getStatus } from '../core/error-emitter.js';
import SidebarRegistry from '../registry/registry.js';
import NavigationModelLoader from '../integration/navigation-model-loader.js';
import { getMetrics as getToggleMetrics } from '../api/public-methods.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export function createHealthReporter(options: { getContext?: () => Record<string, any>; metricsManager?: Record<string, any>; setupCoordinator?: Record<string, any>; portsManager?: Record<string, any> } = {}) {
  
  const getContext = options.getContext;
  const metricsManager = options.metricsManager;
  const setupCoordinator = options.setupCoordinator;
  const portsManager = options.portsManager;

  return {
    healthCheck() {
      const context = getContext!();
      
      const checks = {
        initialized: context.initialized,
        engineReady: !!context.engine,
        rendererReady: !!context.renderer,
        registryLoaded: SidebarRegistry.getItems()?.length > 0,
        portsInitialized: portsManager!.isInitialized(),
        layoutListenerConnected: !!setupCoordinator!.getLayoutListener(),
        modelLoaderInitialized: context.modelLoaderInitialized
      };

      const passed = Object.values(checks).filter(Boolean).length;
      const total = Object.keys(checks).length;

      let status = 'HEALTHY';
      if (passed < total && passed >= Math.floor(total * 0.6)) status = 'DEGRADED';
      if (passed < Math.floor(total * 0.6)) status = 'UNHEALTHY';

      return {
        status,
        score: { passed, total, percentage: Math.round((passed / total) * 100) },
        checks,
        issues: getDegradedComponents().map(c => ({
          code: c,
          severity: 'warn',
          message: `Component degraded: ${c}`
        })),
        moduleId: MODULE_ID,
        version: VERSION,
        safeMode: context.safeMode,
        metrics: this.getMetrics(),
        ports: { initialized: portsManager!.isInitialized(), missing: [] as DynObj[] },
        modelLoaderHealth: NavigationModelLoader.healthCheck?.() ?? { healthy: false },
        timestamp: Date.now()
      };
    },

    info() {
      const context = getContext!();
      const modelLoaderInfo = NavigationModelLoader.info?.() ?? ({} as any);

      return {
        moduleId: MODULE_ID,
        version: VERSION,
        initialized: context.initialized,
        status: getStatus(),
        safeMode: context.safeMode,
        collapsed: context.engine?.collapsed || false,
        expandedSections: context.engine?.getExpandedSections?.() ?? [],
        keyboardNavEnabled: context.keyboardNavEnabled,
        metrics: this.getMetrics(),
        portsInitialized: portsManager!.isInitialized(),
        p24ModelFirst: true,
        modelLoaderInitialized: context.modelLoaderInitialized,
        modelLoaderInfo,
        health: this.healthCheck()
      };
    },

    getManifest() {
      const context = getContext!();
      const sections = SidebarRegistry.getSections?.() || [];
      const items = SidebarRegistry.getItems?.() || [];
      const modelInfo = NavigationModelLoader.info?.() ?? ({} as any);

      return {
        registryId: MODULE_ID,
        version: VERSION,
        loadedAt: context.initAt,
        itemCount: sections.length + items.length,
        sections: sections.map(s => s.id),
        items: items.map(i => i.id),
        initialized: context.initialized,
        safeMode: context.safeMode,
        collapsed: context.engine?.collapsed || false,
        metrics: this.getMetrics(),
        p24ModelFirst: true,
        // @ts-expect-error strict migration — TS2339
        modelLoaderSource: modelInfo.source || 'none',
        modelLoaderHasModel: modelInfo.hasModel || false,
        timestamp: Date.now()
      };
    },

    getMetrics() {
      const context = getContext!();
      const layoutListener = setupCoordinator!.getLayoutListener();
      const externalCollapses = layoutListener?.getExternalCollapseCount?.() || metricsManager!.get('externalCollapses');
      const modelInfo = NavigationModelLoader.info?.() ?? ({} as any);
      const baseMetrics = metricsManager!.getAll();

      return Object.assign({}, baseMetrics, {
        externalCollapses,
        status: getStatus(),
        initialized: context.initialized,
        safeMode: context.safeMode,
        sectionsCount: SidebarRegistry.getSections?.()?.length || 0,
        itemsCount: SidebarRegistry.getItems?.()?.length || 0,
        expandedSections: context.engine?.getExpandedSections?.()?.length || 0,
        collapsed: context.engine?.collapsed || false,
        toggleMetrics: getToggleMetrics(),
        portsInitialized: portsManager!.isInitialized(),
        modelLoaderInitialized: context.modelLoaderInitialized,
        // @ts-expect-error strict migration — TS2339
        modelLoaderSource: modelInfo.source || 'none'
      });
    }
  };
}

export default { createHealthReporter };
