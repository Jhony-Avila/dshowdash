const VERSION = "24.5.4-IMPORT-FIX";
const MODULE_ID = "main.ui.container-main.container-factory.api.events-api";
function createEventsAPI(context) {
  const getComponents = context.getComponents;
  return {
    on(hookName, callback) {
      getComponents().eventHooks?.on?.(hookName, callback);
      return this;
    },
    off(hookName, callback) {
      getComponents().eventHooks?.off?.(hookName, callback);
      return this;
    },
    emit(hookName, data) {
      getComponents().eventHooks?.emit?.(hookName, data);
      return this;
    }
  };
}
var events_api_default = { createEventsAPI };
export {
  MODULE_ID,
  VERSION,
  createEventsAPI,
  events_api_default as default
};
