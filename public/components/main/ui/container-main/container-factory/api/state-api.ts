// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-MODULAR-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: state-api
// PURPOSE: State API
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   createStateAPI() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '24.5.4-IMPORT-FIX';
export const MODULE_ID = 'main.ui.container-main.container-factory.api.state-api';

export function createStateAPI(context: Record<string, unknown>) {
  const state = context.state as Record<string, unknown>;

  return {
    getState() { return { ...state }; },
    isCollapsed() { return state.collapsed; },
    isFullscreen() { return state.fullscreen; },
    isMinimized() { return state.minimized; },
    isLoading() { return state.loading; },
    isMounted() { return state.mounted; }
  };
}

export default { createStateAPI };
