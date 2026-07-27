// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.2.0-EVENT-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: state-manager
// PURPOSE: Layout State Manager
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   LAYOUT_STATES, VALID_TRANSITIONS from ./constants.js
//   createLogger from ../../utils/logger.js
//   LAYOUT_EVENT_NAMES from /core/runtime/constants/event-names.js
//
// PROVIDES:
//   createStateManager() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   LAYOUT_EVENT_NAMES.MOVED
//   LAYOUT_EVENT_NAMES.RESIZED
//   LAYOUT_EVENT_NAMES.RESTORED
//   LAYOUT_EVENT_NAMES.STATE_CHANGED
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { LAYOUT_STATES, VALID_TRANSITIONS } from './constants.js';
import { createLogger } from '../../utils/logger.js';
import { LAYOUT_EVENT_NAMES } from '/core/runtime/constants/event-names.js';

export const VERSION = '3.3.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.resources.layout-manager.state-manager';

const logger = createLogger('container-main:layout-manager:state');

export function createStateManager(options: Record<string, unknown> = {}) {
  const {
    panelRegistry: panelRegistry,
    styleApplicator: styleApplicator,
    emitter: emitter,
    onLayoutChange
  } = options as any;

  return {
    isValidTransition(from: string, to: string) {
      const allowed = (VALID_TRANSITIONS as Record<string, string[]>)[from];
      return allowed ? allowed.includes(to) : false;
    },

    setState(panelId: string, newState: string, stateOptions: Record<string, any> = {}) {
      const layout = panelRegistry.getWithElement(panelId);
      if (!layout) return false;

      if (!this.isValidTransition(layout.state, newState)) {
        logger.warn('Invalid transition', { panelId, from: layout.state, to: newState });
        return false;
      }

      panelRegistry.saveToHistory(panelId);
      
      const previousState = layout.state;
      layout.previousState = previousState;
      layout.state = newState;

      if (stateOptions.x !== undefined) layout.x = stateOptions.x;
      if (stateOptions.y !== undefined) layout.y = stateOptions.y;
      if (stateOptions.width !== undefined) layout.width = stateOptions.width;
      if (stateOptions.height !== undefined) layout.height = stateOptions.height;
      if (stateOptions.zIndex !== undefined) layout.zIndex = stateOptions.zIndex;

      styleApplicator.apply(layout.element, layout, stateOptions.animate !== false);
      
      onLayoutChange?.(panelId, newState, previousState);
      emitter?.emit(LAYOUT_EVENT_NAMES.STATE_CHANGED, { panelId, state: newState, previousState });
      return true;
    },

    resize(panelId: string, width: number, height: number, resizeOptions: Record<string, any> = {}) {
      const layout = panelRegistry.getWithElement(panelId);
      if (!layout) return false;

      if (!layout.constraints.resizable) {
        logger.warn('Panel is not resizable', { panelId });
        return false;
      }

      layout.width = width;
      layout.height = height;

      styleApplicator.apply(layout.element, layout, resizeOptions.animate !== false);
      emitter?.emit(LAYOUT_EVENT_NAMES.RESIZED, { panelId, width, height });
      return true;
    },

    move(panelId: string, x: number, y: number, moveOptions: Record<string, any> = {}) {
      const layout = panelRegistry.getWithElement(panelId);
      if (!layout) return false;

      if (!layout.constraints.draggable) {
        logger.warn('Panel is not draggable', { panelId });
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

    maximize(panelId: string) { return this.setState(panelId, LAYOUT_STATES.MAXIMIZED); },
    minimize(panelId: string) { return this.setState(panelId, LAYOUT_STATES.MINIMIZED); },

    restore(panelId: string) {
      const layout = panelRegistry.getWithElement(panelId);
      if (!layout) return false;
      return this.setState(panelId, LAYOUT_STATES.NORMAL);
    },

    restoreFromHistory(panelId: string) {
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

export default { createStateManager };
