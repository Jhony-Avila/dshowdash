const VERSION = "24.5.4-IMPORT-FIX";
const MODULE_ID = "main.ui.container-main.container-factory.api.actions-api";
function createActionsAPI(context) {
  const getComponents = context.getComponents;
  return {
    collapse() {
      getComponents().controls?.collapse?.();
      return this;
    },
    expand() {
      getComponents().controls?.expand?.();
      return this;
    },
    toggle() {
      getComponents().controls?.toggle?.();
      return this;
    },
    fullscreen(enable = true) {
      const controls = getComponents().controls;
      if (enable) controls?.enterFullscreen?.();
      else controls?.exitFullscreen?.();
      return this;
    },
    close() {
      getComponents().controls?.close?.();
      return this;
    }
  };
}
var actions_api_default = { createActionsAPI };
export {
  MODULE_ID,
  VERSION,
  createActionsAPI,
  actions_api_default as default
};
