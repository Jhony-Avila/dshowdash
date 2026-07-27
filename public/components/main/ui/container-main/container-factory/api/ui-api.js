const VERSION = "24.5.4-IMPORT-FIX";
const MODULE_ID = "main.ui.container-main.container-factory.api.ui-api";
function createUIAPI(context) {
  const getComponents = context.getComponents;
  return {
    // Badge
    setBadge(count) {
      getComponents().notificationBadge?.setCount?.(count);
      return this;
    },
    clearBadge() {
      getComponents().notificationBadge?.clear?.();
      return this;
    },
    // Toolbar
    setToolbarItems(items) {
      getComponents().toolbar?.setItems?.(items);
      return this;
    },
    addToolbarItem(item, index) {
      getComponents().toolbar?.addItem?.(item, index);
      return this;
    },
    // Zoom
    zoomIn() {
      getComponents().zoomControls?.zoomIn?.();
      return this;
    },
    zoomOut() {
      getComponents().zoomControls?.zoomOut?.();
      return this;
    },
    setZoom(value) {
      getComponents().zoomControls?.setZoom?.(value);
      return this;
    },
    resetZoom() {
      getComponents().zoomControls?.reset?.();
      return this;
    },
    getZoom() {
      return getComponents().zoomControls?.getZoom?.() || 100;
    }
  };
}
var ui_api_default = { createUIAPI };
export {
  MODULE_ID,
  VERSION,
  createUIAPI,
  ui_api_default as default
};
