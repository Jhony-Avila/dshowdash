// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-MODULAR-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: events-api
// PURPOSE: Events API
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   createEventsAPI() — exported function
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
export const MODULE_ID = 'main.ui.container-main.container-factory.api.events-api';

export function createEventsAPI(context: Record<string, unknown>) {
  const getComponents = context.getComponents as () => Record<string, Record<string, (...args: unknown[]) => unknown>>;

  return {
    on(hookName: string, callback: (...args: unknown[]) => void) { getComponents().eventHooks?.on?.(hookName, callback); return this; },
    off(hookName: string, callback: (...args: unknown[]) => void) { getComponents().eventHooks?.off?.(hookName, callback); return this; },
    emit(hookName: string, data: Record<string, unknown>) { getComponents().eventHooks?.emit?.(hookName, data); return this; }
  };
}

export default { createEventsAPI };
