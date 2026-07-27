// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-EVENT-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: split-controller
// PURPOSE: Layout Split Controller
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   LAYOUT_STATES, SPLIT_MODES from ./constants.js
//   LAYOUT_EVENT_NAMES from /core/runtime/constants/event-names.js
//
// PROVIDES:
//   createSplitController() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   LAYOUT_EVENT_NAMES.SPLIT
//   LAYOUT_EVENT_NAMES.UNSPLIT
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { LAYOUT_STATES, SPLIT_MODES } from './constants.js';
import { LAYOUT_EVENT_NAMES } from '/core/runtime/constants/event-names.js';

export const VERSION = '3.3.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.resources.layout-manager.split-controller';

export function createSplitController(options: Record<string, any> = {}) {
  const { 
    panelRegistry, 
    stateManager,
    positionCalculator,
    container,
    emitter
  } = options;

  const _splitPanels = new Map();

  return {
    split(panelIds: string[], mode: string = SPLIT_MODES.HORIZONTAL) {
      if (!Array.isArray(panelIds) || panelIds.length < 2) return false;

      const containerRect = positionCalculator.getContainerRect(container);

      panelIds.forEach((panelId, index) => {
        const layout = panelRegistry.getWithElement(panelId);
        if (!layout) return;

        const position = positionCalculator.calculateSplitPosition(mode, index, containerRect);
        const splitState = index === 0 
          ? (mode === SPLIT_MODES.HORIZONTAL ? LAYOUT_STATES.SPLIT_LEFT : LAYOUT_STATES.SPLIT_TOP)
          : (mode === SPLIT_MODES.HORIZONTAL ? LAYOUT_STATES.SPLIT_RIGHT : LAYOUT_STATES.SPLIT_BOTTOM);

        _splitPanels.set(panelId, { mode, index, partner: panelIds.filter(id => id !== panelId) });

        stateManager.setState(panelId, splitState, {
          x: position.x, y: position.y,
          width: position.width, height: position.height
        });
      });

      emitter?.emit(LAYOUT_EVENT_NAMES.SPLIT, { panelIds, mode });
      return true;
    },

    unsplit(panelId: string) {
      const splitInfo = _splitPanels.get(panelId);
      if (!splitInfo) return false;

      const allPanels = [panelId, ...splitInfo.partner];
      allPanels.forEach(pid => {
        _splitPanels.delete(pid);
        stateManager.setState(pid, LAYOUT_STATES.NORMAL);
      });

      emitter?.emit(LAYOUT_EVENT_NAMES.UNSPLIT, { panelIds: allPanels });
      return true;
    },

    getSplitPanels() {
      const result: Record<string, any> = {};
      _splitPanels.forEach((info, panelId) => { result[panelId] = { ...info }; });
      return result;
    },

    isInSplit(panelId: string) { return _splitPanels.has(panelId); },
    getSplitInfo(panelId: string) { return _splitPanels.get(panelId) || null; },
    count() { return _splitPanels.size; },
    clearForPanel(panelId: string) { _splitPanels.delete(panelId); },
    clear() { _splitPanels.clear(); }
  };
}

export default { createSplitController };
