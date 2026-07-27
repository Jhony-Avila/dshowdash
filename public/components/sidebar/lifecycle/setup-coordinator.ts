// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (6.5.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: setup-coordinator
// PURPOSE: Sidebar Setup Coordinator
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   syncInitialCollapsedState from ../core/state-sync.js
//   setupLayoutListener from ../core/layout-listener.js
//   setupKeyboardNavigation, setupGlobalShortcut from ../features/keyboard-navigation.js
//   setupMobileDetect, setupOverlayClick from ../features/mobile-handler.js
//   setupRouterSync from ../features/router-sync.js
//   setupAllEvents from ../features/event-setup.js
//
// PROVIDES:
//   createSetupCoordinator() — exported function
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

import { syncInitialCollapsedState } from '../core/state-sync.js';
import { setupLayoutListener } from '../core/layout-listener.js';
import { setupKeyboardNavigation, setupGlobalShortcut } from '../features/keyboard-navigation.js';
import { setupMobileDetect, setupOverlayClick } from '../features/mobile-handler.js';
import { setupRouterSync } from '../features/router-sync.js';
import { setupAllEvents } from '../features/event-setup.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '7.4.0-P2-ENTERPRISE';
export const MODULE_ID = 'sidebar.lifecycle.setup-coordinator';

export function createSetupCoordinator(options: DynObj) {
  if (options === undefined) options = {};
  
  const logger = options.logger;
  const tracker = options.tracker;
  const getPort = options.getPort;
  const emitDegraded = options.emitDegraded;

  let _layoutListener: (() => void) | null = null;
  let _cleanups: (() => void)[] = [];

  return {
    setupCore(deps: DynObj) {
      const engine = deps.engine;
      const renderer = deps.renderer;
      const registry = deps.registry;
      const adapters = deps.adapters;
      const onToggle = deps.onToggle;
      const onSetActiveItem = deps.onSetActiveItem;
      const onToggleSection = deps.onToggleSection;

      try {
        syncInitialCollapsedState({
          engine,
          renderer,
          logger,
          getPort
        });
      } catch (error: any) {
        emitDegraded('restore-state', error.message);
      }

      try {
        _layoutListener = setupLayoutListener({
          engine,
          renderer,
          tracker,
          logger,
          getPort
        }) as DynObj;
        if (_layoutListener && (_layoutListener as DynObj).cleanup) {
          _cleanups.push((_layoutListener as DynObj).cleanup);
        }
      } catch (error: any) {
        emitDegraded('layout-listener', error.message);
      }

      try {
        const sidebar = renderer.getSidebar();
        if (sidebar) {
          setupAllEvents(sidebar, {
            registry,
            routerAdapter: adapters.router,
            engine,
            renderer,
            onToggle,
            onSetActiveItem,
            onToggleSection
          });
        }
      } catch (error: any) {
        emitDegraded('setup-events', error.message);
      }
    },

    setupPostReady(deps: DynObj) {
      const engine = deps.engine;
      const renderer = deps.renderer;
      const registry = deps.registry;
      const adapters = deps.adapters;
      const onToggle = deps.onToggle;
      const onSetActiveItem = deps.onSetActiveItem;
      const onExpandSection = deps.onExpandSection;
      const onCollapseSection = deps.onCollapseSection;
      const onCloseMobile = deps.onCloseMobile;
      const onReloadNavigation = deps.onReloadNavigation;

      const sidebar = renderer.getSidebar();

      try {
        if (sidebar) {
          const cleanup1 = (setupKeyboardNavigation as any)(sidebar, {
            onExpandSection,
            onCollapseSection
          });
          _cleanups.push(cleanup1);

          const cleanup2 = setupGlobalShortcut(onToggle);
          _cleanups.push(cleanup2);
        }
      } catch (error: any) {
        emitDegraded('keyboard-nav', error.message);
      }

      try {
        const cleanup3 = setupMobileDetect({
          onMobileChange(isMobile: boolean) { engine.setMobile(isMobile); },
          onCloseMobile
        });
        _cleanups.push(cleanup3);

        const cleanup4 = setupOverlayClick(onCloseMobile);
        _cleanups.push((cleanup4 as DynObj));
      } catch (error: any) {
        emitDegraded('mobile-detect', error.message);
      }

      try {
        const cleanup5 = setupRouterSync({
          routerAdapter: adapters.router,
          registry,
          onSetActiveItem,
          onReloadNavigation
        });
        _cleanups.push(cleanup5);
      } catch (error: any) {
        emitDegraded('sync-router', error.message);
      }
    },

    getLayoutListener() {
      return _layoutListener;
    },

    getCleanups() {
      return _cleanups.slice();
    },

    addCleanup(fn: DynObj) {
      _cleanups.push(fn);
    },

    cleanup() {
      if (_layoutListener && (_layoutListener as DynObj).cleanup) {
        (_layoutListener as DynObj).cleanup();
        _layoutListener = null;
      }
      _cleanups.forEach(fn => {
        try { fn(); } catch (e) {}
      });
      _cleanups = [];
    }
  };
}

export default { createSetupCoordinator };
