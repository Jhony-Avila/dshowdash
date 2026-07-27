const VERSION = "24.5.4-IMPORT-FIX";
const MODULE_ID = "main.ui.container-main.container-factory.api.debug-api";
function createDebugAPI(context) {
  const getComponents = context.getComponents;
  return {
    debug: {
      log(msg, data) {
        getComponents().debugPanel?.log?.(msg, data);
      },
      info(msg, data) {
        getComponents().debugPanel?.info?.(msg, data);
      },
      warn(msg, data) {
        getComponents().debugPanel?.warn?.(msg, data);
      },
      error(msg, data) {
        getComponents().debugPanel?.error?.(msg, data);
      },
      toggle() {
        getComponents().debugPanel?.toggle?.();
      },
      show() {
        getComponents().debugPanel?.show?.();
      },
      hide() {
        getComponents().debugPanel?.hide?.();
      }
    }
  };
}
var debug_api_default = { createDebugAPI };
export {
  MODULE_ID,
  VERSION,
  createDebugAPI,
  debug_api_default as default
};
