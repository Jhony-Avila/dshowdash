const VERSION = "24.5.4-IMPORT-FIX";
const MODULE_ID = "main.ui.container-main.kernel.facades.layout-facade";
function createLayoutFacade(registry) {
  return {
    register(panelId, panel, element, options = {}) {
      return registry.get("layout")?.register(panelId, panel, element, options) || false;
    },
    resize(panelId, width, height, options = {}) {
      return registry.get("layout")?.resize(panelId, width, height, options) || false;
    },
    move(panelId, x, y, options = {}) {
      return registry.get("layout")?.move(panelId, x, y, options) || false;
    },
    dock(panelId, zone) {
      return registry.get("layout")?.dock(panelId, zone) || false;
    },
    toggleFullscreen(panelId) {
      return registry.get("layout")?.toggleFullscreen(panelId) || false;
    },
    unregister(panelId) {
      return registry.get("layout")?.unregister(panelId) || false;
    }
  };
}
var layout_facade_default = { createLayoutFacade };
export {
  MODULE_ID,
  VERSION,
  createLayoutFacade,
  layout_facade_default as default
};
