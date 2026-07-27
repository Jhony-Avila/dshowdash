const VERSION = "24.5.4-IMPORT-FIX";
const MODULE_ID = "main.ui.container-main.container-factory.api.accessibility-api";
function createAccessibilityAPI(context) {
  const getComponents = context.getComponents;
  return {
    announce(message, priority) {
      getComponents().accessibility?.announce?.(message, priority);
      return this;
    },
    focusFirst() {
      getComponents().accessibility?.focusFirst?.();
      return this;
    },
    enableFocusTrap() {
      getComponents().accessibility?.enableFocusTrap?.();
      return this;
    },
    disableFocusTrap() {
      getComponents().accessibility?.disableFocusTrap?.();
      return this;
    }
  };
}
var accessibility_api_default = { createAccessibilityAPI };
export {
  MODULE_ID,
  VERSION,
  createAccessibilityAPI,
  accessibility_api_default as default
};
