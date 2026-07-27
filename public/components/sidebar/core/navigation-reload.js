import NavigationModelLoader from "../integration/navigation-model-loader.js";
import { emitReloaded, findItemByRoute } from "../features/router-sync.js";
const VERSION = "7.4.0-P2-ENTERPRISE";
const MODULE_ID = "sidebar.core.navigation-reload";
async function reloadNavigation(deps) {
  const { engine, renderer, registry, adapters, logger, metrics, modelLoaderInitialized, getCurrentHash } = deps;
  try {
    logger.info("Reloading navigation...");
    if (modelLoaderInitialized) {
      try {
        const modelResult = await NavigationModelLoader.reload(true);
        if (metrics) metrics.modelLoaderCalls++;
        logger.info("P24: NavigationModel reloaded", { source: modelResult.source, success: modelResult.success });
      } catch (error) {
        logger.warn("P24: NavigationModel reload failed", { error: error.message });
      }
    }
    registry.invalidateCache?.();
    const result = await registry.loadFromAPI();
    if (!result.success) {
      logger.warn("Failed to reload navigation:", result.error);
      return { success: false, error: result.error };
    }
    registry.applyPermissionFilter();
    engine.loadSections(registry.getSections());
    engine.loadItems(registry.getItems());
    renderer.renderNavigation();
    const route = adapters.router?.getCurrentRoute?.();
    const path = route?.path || route?.hash || getCurrentHash();
    const item = findItemByRoute(registry.getItems(), path);
    if (item) {
      engine.setActiveItem(item.id);
      renderer.setActiveItem(item.id);
    }
    logger.info("Navigation reloaded successfully");
    emitReloaded(registry.getSections().length, registry.getItems().length);
    return { success: true, sections: registry.getSections().length, items: registry.getItems().length };
  } catch (error) {
    logger.error("Reload navigation error:", error);
    return { success: false, error: error.message };
  }
}
var navigation_reload_default = { reloadNavigation };
export {
  MODULE_ID,
  VERSION,
  navigation_reload_default as default,
  reloadNavigation
};
