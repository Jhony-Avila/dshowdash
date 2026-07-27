// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-EVENT-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: fullscreen-controller
// PURPOSE: Layout Fullscreen Controller
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   LAYOUT_STATES from ./constants.js
//   LAYOUT_EVENT_NAMES from /core/runtime/constants/event-names.js
//
// PROVIDES:
//   createFullscreenController() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   LAYOUT_EVENT_NAMES.FULLSCREEN_ENTER
//   LAYOUT_EVENT_NAMES.FULLSCREEN_EXIT
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { LAYOUT_STATES } from './constants.js';
import { LAYOUT_EVENT_NAMES } from '/core/runtime/constants/event-names.js';

export const VERSION = '3.3.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.resources.layout-manager.fullscreen-controller';

export function createFullscreenController(options: Record<string, any> = {}) {
  const { 
    panelRegistry, 
    stateManager,
    emitter,
    onFullscreen
  } = options;

  let _fullscreenPanel: unknown = null;

  return {
    enter(panelId: string) {
      if (_fullscreenPanel && _fullscreenPanel !== panelId) {
        // @ts-expect-error strict migration — TS2345
        this.exit(_fullscreenPanel);
      }

      const layout = panelRegistry.getWithElement(panelId);
      if (!layout) return false;

      _fullscreenPanel = panelId;
      stateManager.setState(panelId, LAYOUT_STATES.FULLSCREEN);

      if (layout.element?.requestFullscreen) {
        layout.element.requestFullscreen().catch(() => {});
      }

      onFullscreen?.(panelId, true);
      emitter?.emit(LAYOUT_EVENT_NAMES.FULLSCREEN_ENTER, { panelId });
      return true;
    },

    exit(panelId: string) {
      const layout = panelRegistry.getWithElement(panelId);
      if (!layout || layout.state !== LAYOUT_STATES.FULLSCREEN) return false;

      _fullscreenPanel = null;
      
      if (typeof document !== 'undefined' && document.fullscreenElement) {
        document.exitFullscreen().catch(() => {});
      }

      const previousState = layout.previousState || LAYOUT_STATES.NORMAL;
      stateManager.setState(panelId, previousState);

      onFullscreen?.(panelId, false);
      emitter?.emit(LAYOUT_EVENT_NAMES.FULLSCREEN_EXIT, { panelId });
      return true;
    },

    toggle(panelId: string) {
      const layout = panelRegistry.getWithElement(panelId);
      if (!layout) return false;
      if (layout.state === LAYOUT_STATES.FULLSCREEN) return this.exit(panelId);
      return this.enter(panelId);
    },

    getFullscreenPanel() { return _fullscreenPanel; },
    hasFullscreen() { return _fullscreenPanel !== null; },
    clear() { _fullscreenPanel = null; }
  };
}

export default { createFullscreenController };
