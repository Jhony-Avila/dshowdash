const VERSION = "24.5.4-IMPORT-FIX";
const MODULE_ID = "main.ui.container-main.container-factory.api.state-api";
function createStateAPI(context) {
  const state = context.state;
  return {
    getState() {
      return { ...state };
    },
    isCollapsed() {
      return state.collapsed;
    },
    isFullscreen() {
      return state.fullscreen;
    },
    isMinimized() {
      return state.minimized;
    },
    isLoading() {
      return state.loading;
    },
    isMounted() {
      return state.mounted;
    }
  };
}
var state_api_default = { createStateAPI };
export {
  MODULE_ID,
  VERSION,
  createStateAPI,
  state_api_default as default
};
