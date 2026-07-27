// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-MODULAR-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: actions-api
// PURPOSE: Actions API
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   createActionsAPI() — exported function
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
export const MODULE_ID = 'main.ui.container-main.container-factory.api.actions-api';

export function createActionsAPI(context: Record<string, unknown>) {
  const getComponents = context.getComponents as () => Record<string, Record<string, (...args: unknown[]) => unknown>>;

  return {
    collapse() { getComponents().controls?.collapse?.(); return this; },
    expand() { getComponents().controls?.expand?.(); return this; },
    toggle() { getComponents().controls?.toggle?.(); return this; },
    fullscreen(enable = true) {
      const controls = getComponents().controls;
      if (enable) controls?.enterFullscreen?.();
      else controls?.exitFullscreen?.();
      return this;
    },
    close() { getComponents().controls?.close?.(); return this; }
  };
}

export default { createActionsAPI };
