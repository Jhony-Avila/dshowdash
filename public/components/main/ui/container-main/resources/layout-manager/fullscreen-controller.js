import { LAYOUT_STATES } from "./constants.js";
import { LAYOUT_EVENT_NAMES } from "/core/runtime/constants/event-names.js";
const VERSION = "3.3.0-MODULAR";
const MODULE_ID = "main.ui.container-main.resources.layout-manager.fullscreen-controller";
function createFullscreenController(options = {}) {
  const {
    panelRegistry,
    stateManager,
    emitter,
    onFullscreen
  } = options;
  let _fullscreenPanel = null;
  return {
    enter(panelId) {
      if (_fullscreenPanel && _fullscreenPanel !== panelId) {
        this.exit(_fullscreenPanel);
      }
      const layout = panelRegistry.getWithElement(panelId);
      if (!layout) return false;
      _fullscreenPanel = panelId;
      stateManager.setState(panelId, LAYOUT_STATES.FULLSCREEN);
      if (layout.element?.requestFullscreen) {
        layout.element.requestFullscreen().catch(() => {
        });
      }
      onFullscreen?.(panelId, true);
      emitter?.emit(LAYOUT_EVENT_NAMES.FULLSCREEN_ENTER, { panelId });
      return true;
    },
    exit(panelId) {
      const layout = panelRegistry.getWithElement(panelId);
      if (!layout || layout.state !== LAYOUT_STATES.FULLSCREEN) return false;
      _fullscreenPanel = null;
      if (typeof document !== "undefined" && document.fullscreenElement) {
        document.exitFullscreen().catch(() => {
        });
      }
      const previousState = layout.previousState || LAYOUT_STATES.NORMAL;
      stateManager.setState(panelId, previousState);
      onFullscreen?.(panelId, false);
      emitter?.emit(LAYOUT_EVENT_NAMES.FULLSCREEN_EXIT, { panelId });
      return true;
    },
    toggle(panelId) {
      const layout = panelRegistry.getWithElement(panelId);
      if (!layout) return false;
      if (layout.state === LAYOUT_STATES.FULLSCREEN) return this.exit(panelId);
      return this.enter(panelId);
    },
    getFullscreenPanel() {
      return _fullscreenPanel;
    },
    hasFullscreen() {
      return _fullscreenPanel !== null;
    },
    clear() {
      _fullscreenPanel = null;
    }
  };
}
var fullscreen_controller_default = { createFullscreenController };
export {
  MODULE_ID,
  VERSION,
  createFullscreenController,
  fullscreen_controller_default as default
};
