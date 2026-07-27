const VERSION = "1.2.0-UARPS-ONLY";
const MODULE_ID = "sidebar-navigation-methods";
function createNavigationMethods(dependencies) {
  const { engine, renderer, registry, routerAdapter, logger } = dependencies;
  return {
    navigate(itemId) {
      try {
        const item = registry.getItemById(itemId);
        if (item?.route) {
          routerAdapter.navigate(item.route);
          engine.navigate(itemId);
          renderer.setActiveItem(itemId);
        }
      } catch (error) {
        logger?.error?.("Navigate error:", error);
      }
    },
    setBadge(itemId, badge) {
      try {
        registry.setBadge(itemId, badge);
        renderer.renderNavigation();
      } catch (error) {
        logger?.error?.("SetBadge error:", error);
      }
    },
    refresh() {
      try {
        registry.applyPermissionFilter();
        renderer.renderNavigation();
      } catch (error) {
        logger?.error?.("Refresh error:", error);
      }
    },
    setActiveItem(itemId) {
      try {
        engine.setActiveItem(itemId);
        renderer.setActiveItem(itemId);
      } catch (error) {
        logger?.error?.("setActiveItem error:", error);
      }
    }
  };
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION
  };
}
function healthCheck() {
  return {
    status: "HEALTHY",
    version: VERSION,
    moduleId: MODULE_ID,
    checks: { factoryReady: true }
  };
}
var navigation_methods_default = { createNavigationMethods, info, healthCheck, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  createNavigationMethods,
  navigation_methods_default as default,
  healthCheck,
  info
};
