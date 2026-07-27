// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (6.5.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: destroyer
// PURPOSE: Sidebar Destroyer
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   destroy as destroyKeyboard from ../features/keyboard-navigation.js
//   destroy as destroyMobile from ../features/mobile-handler.js
//   destroy as destroyRouterSync from ../features/router-sync.js
//   destroy as destroyEvents from ../features/event-setup.js
//   resetErrorState, setStatus from ../core/error-emitter.js
//   NavigationModelLoader from ../integration/navigation-model-loader.js
//
// PROVIDES:
//   createDestroyer() — exported function
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

import { destroy as destroyKeyboard } from '../features/keyboard-navigation.js';
import { destroy as destroyMobile } from '../features/mobile-handler.js';
import { destroy as destroyRouterSync } from '../features/router-sync.js';
import { destroy as destroyEvents } from '../features/event-setup.js';
import { resetErrorState, setStatus } from '../core/error-emitter.js';
import NavigationModelLoader from '../integration/navigation-model-loader.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '7.4.0-P2-ENTERPRISE';
export const MODULE_ID = 'sidebar.lifecycle.destroyer';

export function createDestroyer(options: DynObj) {
  if (options === undefined) options = {};
  
  const logger = options.logger;

  return {
    execute(context: DynObj, setupCoordinator: DynObj) {
      try {
        if (setupCoordinator) {
          setupCoordinator.cleanup();
        }

        destroyKeyboard();
        destroyMobile();
        destroyRouterSync();
        destroyEvents();

        if (context.engine) {
          context.engine.destroy();
          context.engine = null;
        }

        if (context.renderer) {
          context.renderer.destroy();
          context.renderer = null;
        }

        if (context.adapters && context.adapters.router) {
          if (context.adapters.router.destroy) {
            context.adapters.router.destroy();
          }
        }

        if (NavigationModelLoader.abort) {
          NavigationModelLoader.abort();
        }

        resetErrorState();
        context.initialized = false;
        context.initAt = null;
        context.safeMode = false;
        context.modelLoaderInitialized = false;

        setStatus('destroyed');
        logger.info('Sidebar destroyed');

        return { success: true };

      } catch (error: any) {
        logger.error('Destroy error:', error);
        return { success: false, error: error.message };
      }
    }
  };
}

export default { createDestroyer };
