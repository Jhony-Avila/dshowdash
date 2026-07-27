// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.2.0-UARPS-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: sidebar-navigation-methods
// PURPOSE: Sidebar API - Navigation Methods
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   createNavigationMethods() — exported function
//   info() — exported function
//   healthCheck() — exported function
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


export const VERSION = '1.2.0-UARPS-ONLY';
export const MODULE_ID = 'sidebar-navigation-methods';

export function createNavigationMethods(dependencies: DynObj) {
  const { engine, renderer, registry, routerAdapter, logger } = dependencies;

  return {
    navigate(itemId: string) {
      try {
        const item = registry.getItemById(itemId);
        if (item?.route) {
          routerAdapter.navigate(item.route);
          engine.navigate(itemId);
          renderer.setActiveItem(itemId);
        }
      } catch (error) {
        logger?.error?.('Navigate error:', error);
      }
    },

    setBadge(itemId: string, badge: DynObj) {
      try {
        registry.setBadge(itemId, badge);
        renderer.renderNavigation();
      } catch (error) {
        logger?.error?.('SetBadge error:', error);
      }
    },

    refresh() {
      try {
        registry.applyPermissionFilter();
        renderer.renderNavigation();
      } catch (error) {
        logger?.error?.('Refresh error:', error);
      }
    },

    setActiveItem(itemId: string) {
      try {
        engine.setActiveItem(itemId);
        renderer.setActiveItem(itemId);
      } catch (error) {
        logger?.error?.('setActiveItem error:', error);
      }
    }
  };
}

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION
  };
}

export function healthCheck() {
  return {
    status: 'HEALTHY',
    version: VERSION,
    moduleId: MODULE_ID,
    checks: { factoryReady: true }
  };
}

export default { createNavigationMethods, info, healthCheck, VERSION, MODULE_ID };
