import { LAYOUT_STATES, SPLIT_MODES } from "./constants.js";
import { LAYOUT_EVENT_NAMES } from "/core/runtime/constants/event-names.js";
const VERSION = "3.3.0-MODULAR";
const MODULE_ID = "main.ui.container-main.resources.layout-manager.split-controller";
function createSplitController(options = {}) {
  const {
    panelRegistry,
    stateManager,
    positionCalculator,
    container,
    emitter
  } = options;
  const _splitPanels = /* @__PURE__ */ new Map();
  return {
    split(panelIds, mode = SPLIT_MODES.HORIZONTAL) {
      if (!Array.isArray(panelIds) || panelIds.length < 2) return false;
      const containerRect = positionCalculator.getContainerRect(container);
      panelIds.forEach((panelId, index) => {
        const layout = panelRegistry.getWithElement(panelId);
        if (!layout) return;
        const position = positionCalculator.calculateSplitPosition(mode, index, containerRect);
        const splitState = index === 0 ? mode === SPLIT_MODES.HORIZONTAL ? LAYOUT_STATES.SPLIT_LEFT : LAYOUT_STATES.SPLIT_TOP : mode === SPLIT_MODES.HORIZONTAL ? LAYOUT_STATES.SPLIT_RIGHT : LAYOUT_STATES.SPLIT_BOTTOM;
        _splitPanels.set(panelId, { mode, index, partner: panelIds.filter((id) => id !== panelId) });
        stateManager.setState(panelId, splitState, {
          x: position.x,
          y: position.y,
          width: position.width,
          height: position.height
        });
      });
      emitter?.emit(LAYOUT_EVENT_NAMES.SPLIT, { panelIds, mode });
      return true;
    },
    unsplit(panelId) {
      const splitInfo = _splitPanels.get(panelId);
      if (!splitInfo) return false;
      const allPanels = [panelId, ...splitInfo.partner];
      allPanels.forEach((pid) => {
        _splitPanels.delete(pid);
        stateManager.setState(pid, LAYOUT_STATES.NORMAL);
      });
      emitter?.emit(LAYOUT_EVENT_NAMES.UNSPLIT, { panelIds: allPanels });
      return true;
    },
    getSplitPanels() {
      const result = {};
      _splitPanels.forEach((info, panelId) => {
        result[panelId] = { ...info };
      });
      return result;
    },
    isInSplit(panelId) {
      return _splitPanels.has(panelId);
    },
    getSplitInfo(panelId) {
      return _splitPanels.get(panelId) || null;
    },
    count() {
      return _splitPanels.size;
    },
    clearForPanel(panelId) {
      _splitPanels.delete(panelId);
    },
    clear() {
      _splitPanels.clear();
    }
  };
}
var split_controller_default = { createSplitController };
export {
  MODULE_ID,
  VERSION,
  createSplitController,
  split_controller_default as default
};
