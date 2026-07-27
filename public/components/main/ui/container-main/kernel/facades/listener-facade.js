const VERSION = "24.5.4-IMPORT-FIX";
const MODULE_ID = "main.ui.container-main.kernel.facades.listener-facade";
function createListenerFacade(registry) {
  return {
    trackDOM(panelId, target, eventName, handler, options) {
      return registry.get("listener")?.trackDOMListener(panelId, target, eventName, handler, options) || null;
    },
    trackEventBus(panelId, eventName, handler) {
      return registry.get("listener")?.trackEventBusListener(panelId, eventName, handler) || null;
    },
    cleanupPanel(panelId) {
      return registry.get("listener")?.cleanupPanel(panelId) || { removed: 0 };
    }
  };
}
var listener_facade_default = { createListenerFacade };
export {
  MODULE_ID,
  VERSION,
  createListenerFacade,
  listener_facade_default as default
};
