import { syncInitialCollapsedState } from "../core/state-sync.js";
import { setupLayoutListener } from "../core/layout-listener.js";
import { setupKeyboardNavigation, setupGlobalShortcut } from "../features/keyboard-navigation.js";
import { setupMobileDetect, setupOverlayClick } from "../features/mobile-handler.js";
import { setupRouterSync } from "../features/router-sync.js";
import { setupAllEvents } from "../features/event-setup.js";
const VERSION = "7.4.0-P2-ENTERPRISE";
const MODULE_ID = "sidebar.lifecycle.setup-coordinator";
function createSetupCoordinator(options) {
  if (options === void 0) options = {};
  const logger = options.logger;
  const tracker = options.tracker;
  const getPort = options.getPort;
  const emitDegraded = options.emitDegraded;
  let _layoutListener = null;
  let _cleanups = [];
  return {
    setupCore(deps) {
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
      } catch (error) {
        emitDegraded("restore-state", error.message);
      }
      try {
        _layoutListener = setupLayoutListener({
          engine,
          renderer,
          tracker,
          logger,
          getPort
        });
        if (_layoutListener && _layoutListener.cleanup) {
          _cleanups.push(_layoutListener.cleanup);
        }
      } catch (error) {
        emitDegraded("layout-listener", error.message);
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
      } catch (error) {
        emitDegraded("setup-events", error.message);
      }
    },
    setupPostReady(deps) {
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
          const cleanup1 = setupKeyboardNavigation(sidebar, {
            onExpandSection,
            onCollapseSection
          });
          _cleanups.push(cleanup1);
          const cleanup2 = setupGlobalShortcut(onToggle);
          _cleanups.push(cleanup2);
        }
      } catch (error) {
        emitDegraded("keyboard-nav", error.message);
      }
      try {
        const cleanup3 = setupMobileDetect({
          onMobileChange(isMobile) {
            engine.setMobile(isMobile);
          },
          onCloseMobile
        });
        _cleanups.push(cleanup3);
        const cleanup4 = setupOverlayClick(onCloseMobile);
        _cleanups.push(cleanup4);
      } catch (error) {
        emitDegraded("mobile-detect", error.message);
      }
      try {
        const cleanup5 = setupRouterSync({
          routerAdapter: adapters.router,
          registry,
          onSetActiveItem,
          onReloadNavigation
        });
        _cleanups.push(cleanup5);
      } catch (error) {
        emitDegraded("sync-router", error.message);
      }
    },
    getLayoutListener() {
      return _layoutListener;
    },
    getCleanups() {
      return _cleanups.slice();
    },
    addCleanup(fn) {
      _cleanups.push(fn);
    },
    cleanup() {
      if (_layoutListener && _layoutListener.cleanup) {
        _layoutListener.cleanup();
        _layoutListener = null;
      }
      _cleanups.forEach((fn) => {
        try {
          fn();
        } catch (e) {
        }
      });
      _cleanups = [];
    }
  };
}
var setup_coordinator_default = { createSetupCoordinator };
export {
  MODULE_ID,
  VERSION,
  createSetupCoordinator,
  setup_coordinator_default as default
};
