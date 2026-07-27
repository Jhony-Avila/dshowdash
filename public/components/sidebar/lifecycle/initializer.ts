// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (6.9.1-IMPORT-FIX)
// ═══════════════════════════════════════════════════════════════
// MODULE: initializer
// PURPOSE: Sidebar Initializer
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   loadCSS, withRetry from ../core/utils.js
//   loadConfig, mergeConfig from ../core/config-loader.js
//   emitDegraded, emitError, setStatus from ../core/error-emitter.js
//   createAdapters, createPorts from ../core/adapters-factory.js
//   createEngine from ../domain/sidebar-engine.js
//   createRenderer from ../ui/renderer.js
//   RESILIENCE_CONFIG from ../core/constants.js
//   SidebarRegistry from ../registry/registry.js
//   NavigationModelLoader from ../integration/navigation-model-loader.js
//
// PROVIDES:
//   createInitializer() — exported function
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;

export const VERSION = '1.0.0-ENTERPRISE';
export const MODULE_ID = 'sidebar.lifecycle.initializer';

import { loadCSS, withRetry } from '../core/utils.js';
import { loadConfig, mergeConfig } from '../core/config-loader.js';
import { emitDegraded, emitError, setStatus } from '../core/error-emitter.js';
import { createAdapters, createPorts } from '../core/adapters-factory.js';
import { createEngine } from '../domain/sidebar-engine.js';
import SidebarRegistry from '../registry/registry.js';
import { createRenderer } from '../ui/renderer.js';
import NavigationModelLoader from '../integration/navigation-model-loader.js';
import { RESILIENCE_CONFIG } from '../core/constants.js';


export function createInitializer(options: DynObj) {
  if (options === undefined) options = {};

  const logger = options.logger;
  const tracker = options.tracker;
  const metricsManager = options.metricsManager;

  return {
    async execute(initOptions: DynObj, context: DynObj) {
      if (initOptions === undefined) initOptions = {};

      metricsManager.incrementInits();
      setStatus('initializing');

      try {
        logger.info('Initializing Sidebar V6.9 ES6...');

        const cssLoaded = await loadCSS();
        if (!cssLoaded) emitDegraded('css', 'CSS failed to load' as DynObj);

        try {
          await loadConfig();
        } catch (error: any) {
          emitDegraded('config', error.message);
        }

        const config = mergeConfig(initOptions);
        context.config = config;

        context.safeMode = config.safeMode === true || initOptions.safeMode === true;
        if (context.safeMode) {
          metricsManager.incrementSafeModeBoots();
          logger.info('SafeMode ACTIVE - minimal boot');
        }

        context.adapters = createAdapters({ containerSelector: config.containerSelector });
        context.ports = createPorts(context.adapters);

        try {
          context.engine = createEngine({
            defaultCollapsed: config.settings?.defaultCollapsed ?? false,
            accordion: config.accordion ?? { allowMultipleOpen: true, persistState: true }
          });
          context.engine.setPorts(context.ports);
          await context.engine.init();
        } catch (error: any) {
          metricsManager.incrementErrors();
          emitError(error, { phase: 'engine-init' });
          return { success: false, error: error.message };
        }

        if (!context.safeMode) {
          try {
            logger.info('P24: Loading NavigationModel...');
            const modelResult = await NavigationModelLoader.load();
            context.modelLoaderInitialized = true;
            metricsManager.incrementModelLoaderCalls();

            if (modelResult.success) {
              logger.info(`P24: NavigationModel loaded from ${modelResult.source}`, {
                sectionsCount: ((modelResult as DynObj).model)?.sections?.length || 0,
                source: modelResult.source
              });
            } else {
              logger.warn('P24: NavigationModel load failed, will fallback to Registry', {
                reason: modelResult.reason || (modelResult as any).error
              });
            }
          } catch (error: any) {
            emitDegraded('navigation-model-loader', error.message);
            logger.warn('P24: NavigationModelLoader failed, continuing with Registry fallback', {
              error: error.message
            });
          }
        }

        try {
          await withRetry(
            () => SidebarRegistry.loadFromAPI(),
            RESILIENCE_CONFIG.maxRetries,
            RESILIENCE_CONFIG.retryDelay
          );
        } catch (error: any) {
          emitDegraded('registry', error.message);
        }

        try {
          SidebarRegistry.applyPermissionFilter();
        } catch (error: any) {
          emitDegraded('permissions-filter', error.message);
        }

        try {
          context.engine.loadSections(SidebarRegistry.getSections());
          context.engine.loadItems(SidebarRegistry.getItems());
        } catch (error: any) {
          emitDegraded('engine-load', error.message);
        }

        try {
          await context.engine.mount();
        } catch (error: any) {
          emitDegraded('engine-mount', error.message);
        }

        try {
          context.renderer = createRenderer({ title: config.header?.title });
        } catch (error: any) {
          metricsManager.incrementErrors();
          emitError(error, { phase: 'renderer-create' });
          return { success: false, error: error.message };
        }

        try {
          const container = context.adapters.ui.getContainer?.();
          if (!container) throw new Error('Container not found');
          context.renderer.setContainer(container);

          const restoredSections = context.engine.getExpandedSections();
          if (restoredSections && restoredSections.length > 0) {
            context.renderer.preloadExpandedSections(restoredSections);
            logger.info(`Accordion state preloaded from engine: ${restoredSections.length} sections`, {
              sectionIds: restoredSections
            });
          }

          context.renderer.render();
        } catch (error: any) {
          metricsManager.incrementErrors();
          emitError(error, { phase: 'render' });
          return { success: false, error: error.message };
        }

        return { success: true, config };

      } catch (error: any) {
        metricsManager.incrementErrors();
        emitError(error, { phase: 'init' });
        logger.error('Init failed:', error);
        return { success: false, error: error.message };
      }
    }
  };
}

export default { createInitializer };
