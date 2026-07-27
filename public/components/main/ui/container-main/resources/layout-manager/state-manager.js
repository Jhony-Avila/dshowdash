import { LAYOUT_STATES, VALID_TRANSITIONS } from "./constants.js";
import { createLogger } from "../../utils/logger.js";
import { LAYOUT_EVENT_NAMES } from "/core/runtime/constants/event-names.js";
const VERSION = "3.3.0-MODULAR";
const MODULE_ID = "main.ui.container-main.resources.layout-manager.state-manager";
const logger = createLogger("container-main:layout-manager:state");
function createStateManager(options = {}) {
  const {
    panelRegistry,
    styleApplicator,
    emitter,
    onLayoutChange
  } = options;
  return {
    isValidTransition(from, to) {
      const allowed = VALID_TRANSITIONS[from];
      return allowed ? allowed.includes(to) : false;
    },
    setState(panelId, newState, stateOptions = {}) {
      const layout = panelRegistry.getWithElement(panelId);
      if (!layout) return false;
      if (!this.isValidTransition(layout.state, newState)) {
        logger.warn("Invalid transition", { panelId, from: layout.state, to: newState });
        return false;
      }
      panelRegistry.saveToHistory(panelId);
      const previousState = layout.state;
      layout.previousState = previousState;
      layout.state = newState;
      if (stateOptions.x !== void 0) layout.x = stateOptions.x;
      if (stateOptions.y !== void 0) layout.y = stateOptions.y;
      if (stateOptions.width !== void 0) layout.width = stateOptions.width;
      if (stateOptions.height !== void 0) layout.height = stateOptions.height;
      if (stateOptions.zIndex !== void 0) layout.zIndex = stateOptions.zIndex;
      styleApplicator.apply(layout.element, layout, stateOptions.animate !== false);
      onLayoutChange?.(panelId, newState, previousState);
      emitter?.emit(LAYOUT_EVENT_NAMES.STATE_CHANGED, { panelId, state: newState, previousState });
      return true;
    },
    resize(panelId, width, height, resizeOptions = {}) {
      const layout = panelRegistry.getWithElement(panelId);
      if (!layout) return false;
      if (!layout.constraints.resizable) {
        logger.warn("Panel is not resizable", { panelId });
        return false;
      }
      layout.width = width;
      layout.height = height;
      styleApplicator.apply(layout.element, layout, resizeOptions.animate !== false);
      emitter?.emit(LAYOUT_EVENT_NAMES.RESIZED, { panelId, width, height });
      return true;
    },
    move(panelId, x, y, moveOptions = {}) {
      const layout = panelRegistry.getWithElement(panelId);
      if (!layout) return false;
      if (!layout.constraints.draggable) {
        logger.warn("Panel is not draggable", { panelId });
        return false;
      }
      layout.x = x;
      layout.y = y;
      if (layout.state === LAYOUT_STATES.NORMAL) {
        return this.setState(panelId, LAYOUT_STATES.FLOATING, { x, y, animate: moveOptions.animate });
      } else {
        styleApplicator.apply(layout.element, layout, moveOptions.animate !== false);
      }
      emitter?.emit(LAYOUT_EVENT_NAMES.MOVED, { panelId, x, y });
      return true;
    },
    maximize(panelId) {
      return this.setState(panelId, LAYOUT_STATES.MAXIMIZED);
    },
    minimize(panelId) {
      return this.setState(panelId, LAYOUT_STATES.MINIMIZED);
    },
    restore(panelId) {
      const layout = panelRegistry.getWithElement(panelId);
      if (!layout) return false;
      return this.setState(panelId, LAYOUT_STATES.NORMAL);
    },
    restoreFromHistory(panelId) {
      const previousLayout = panelRegistry.getFromHistory(panelId);
      if (!previousLayout) return false;
      const layout = panelRegistry.getWithElement(panelId);
      if (!layout) return false;
      layout.state = previousLayout.state;
      layout.x = previousLayout.x;
      layout.y = previousLayout.y;
      layout.width = previousLayout.width;
      layout.height = previousLayout.height;
      layout.zIndex = previousLayout.zIndex;
      styleApplicator.apply(layout.element, layout);
      emitter?.emit(LAYOUT_EVENT_NAMES.RESTORED, { panelId });
      return true;
    }
  };
}
var state_manager_default = { createStateManager };
export {
  MODULE_ID,
  VERSION,
  createStateManager,
  state_manager_default as default
};
