// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.2.0-EVENT-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: dock-controller
// PURPOSE: Layout Dock Controller
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   LAYOUT_STATES from ./constants.js
//   createLogger from ../../utils/logger.js
//   LAYOUT_EVENT_NAMES from /core/runtime/constants/event-names.js
//
// PROVIDES:
//   createDockController() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   LAYOUT_EVENT_NAMES.DOCKED
//   LAYOUT_EVENT_NAMES.UNDOCKED
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { LAYOUT_STATES } from './constants.js';
import { createLogger } from '../../utils/logger.js';
import { LAYOUT_EVENT_NAMES } from '/core/runtime/constants/event-names.js';

export const VERSION = '3.3.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.resources.layout-manager.dock-controller';

const logger = createLogger('container-main:layout-manager:dock');

export function createDockController(options: Record<string, any> = {}) {
  const { 
    panelRegistry, 
    stateManager,
    positionCalculator,
    container,
    emitter,
    onDock,
    onUndock
  } = options;

  const _dockZones = new Map();

  return {
    dock(panelId: string, zone: Record<string, unknown>) {
      const layout = panelRegistry.getWithElement(panelId);
      if (!layout) return false;

      if (!layout.constraints.dockable) {
        logger.warn('Panel is not dockable', { panelId });
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
        x: position.x, y: position.y,
        width: position.width, height: position.height
      });

      onDock?.(panelId, zone);
      emitter?.emit(LAYOUT_EVENT_NAMES.DOCKED, { panelId, zone });
      return true;
    },

    undock(panelId: string) {
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
      const result: Record<string, any> = {};
      _dockZones.forEach((panelId, zone) => { result[zone] = panelId; });
      return result;
    },

    isZoneOccupied(zone: Record<string, unknown>) { return _dockZones.has(zone); },
    getPanelInZone(zone: Record<string, unknown>) { return _dockZones.get(zone) || null; },
    clearZoneForPanel(panelId: string) { _dockZones.forEach((pid, zone) => { if (pid === panelId) _dockZones.delete(zone); }); },
    count() { return _dockZones.size; },
    clear() { _dockZones.clear(); }
  };
}

export default { createDockController };
