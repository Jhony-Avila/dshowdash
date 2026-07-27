import { LAYOUT_STATES } from "./constants.js";
import { createLogger } from "../../utils/logger.js";
import { LAYOUT_EVENT_NAMES } from "/core/runtime/constants/event-names.js";
const VERSION = "3.3.0-MODULAR";
const MODULE_ID = "main.ui.container-main.resources.layout-manager.dock-controller";
const logger = createLogger("container-main:layout-manager:dock");
function createDockController(options = {}) {
  const {
    panelRegistry,
    stateManager,
    positionCalculator,
    container,
    emitter,
    onDock,
    onUndock
  } = options;
  const _dockZones = /* @__PURE__ */ new Map();
  return {
    dock(panelId, zone) {
      const layout = panelRegistry.getWithElement(panelId);
      if (!layout) return false;
      if (!layout.constraints.dockable) {
        logger.warn("Panel is not dockable", { panelId });
        return false;
      }
      if (_dockZones.has(zone)) {
        const occupyingPanel = _dockZones.get(zone);
        if (occupyingPanel !== panelId) {
          this.undock(occupyingPanel);
        }
      }
      const containerRect = positionCalculator.getContainerRect(container);
      const position = positionCalculator.calculateDockPosition(zone, containerRect);
      _dockZones.set(zone, panelId);
      layout.dockZone = zone;
      stateManager.setState(panelId, LAYOUT_STATES.DOCKED, {
        x: position.x,
        y: position.y,
        width: position.width,
        height: position.height
      });
      onDock?.(panelId, zone);
      emitter?.emit(LAYOUT_EVENT_NAMES.DOCKED, { panelId, zone });
      return true;
    },
    undock(panelId) {
      const layout = panelRegistry.getWithElement(panelId);
      if (!layout || layout.state !== LAYOUT_STATES.DOCKED) return false;
      const zone = layout.dockZone;
      _dockZones.delete(zone);
      delete layout.dockZone;
      stateManager.setState(panelId, LAYOUT_STATES.FLOATING);
      onUndock?.(panelId, zone);
      emitter?.emit(LAYOUT_EVENT_NAMES.UNDOCKED, { panelId, zone });
      return true;
    },
    getDockedPanels() {
      const result = {};
      _dockZones.forEach((panelId, zone) => {
        result[zone] = panelId;
      });
      return result;
    },
    isZoneOccupied(zone) {
      return _dockZones.has(zone);
    },
    getPanelInZone(zone) {
      return _dockZones.get(zone) || null;
    },
    clearZoneForPanel(panelId) {
      _dockZones.forEach((pid, zone) => {
        if (pid === panelId) _dockZones.delete(zone);
      });
    },
    count() {
      return _dockZones.size;
    },
    clear() {
      _dockZones.clear();
    }
  };
}
var dock_controller_default = { createDockController };
export {
  MODULE_ID,
  VERSION,
  createDockController,
  dock_controller_default as default
};
