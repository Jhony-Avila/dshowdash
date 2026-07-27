// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-MODULAR-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: accessibility-api
// PURPOSE: Accessibility API
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   createAccessibilityAPI() — exported function
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
export const MODULE_ID = 'main.ui.container-main.container-factory.api.accessibility-api';

export function createAccessibilityAPI(context: Record<string, unknown>) {
  const getComponents = context.getComponents as () => Record<string, Record<string, (...args: unknown[]) => unknown>>;

  return {
    announce(message: string, priority: number) { getComponents().accessibility?.announce?.(message, priority); return this; },
    focusFirst() { getComponents().accessibility?.focusFirst?.(); return this; },
    enableFocusTrap() { getComponents().accessibility?.enableFocusTrap?.(); return this; },
    disableFocusTrap() { getComponents().accessibility?.disableFocusTrap?.(); return this; }
  };
}

export default { createAccessibilityAPI };
