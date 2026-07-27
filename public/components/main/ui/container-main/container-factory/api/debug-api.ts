// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-MODULAR-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: debug-api
// PURPOSE: Debug API
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   createDebugAPI() — exported function
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
export const MODULE_ID = 'main.ui.container-main.container-factory.api.debug-api';

export function createDebugAPI(context: Record<string, unknown>) {
  const getComponents = context.getComponents as () => Record<string, Record<string, (...args: unknown[]) => unknown>>;

  return {
    debug: {
      log(msg: string, data: Record<string, unknown>) { getComponents().debugPanel?.log?.(msg, data); },
      info(msg: string, data: Record<string, unknown>) { getComponents().debugPanel?.info?.(msg, data); },
      warn(msg: string, data: Record<string, unknown>) { getComponents().debugPanel?.warn?.(msg, data); },
      error(msg: string, data: Record<string, unknown>) { getComponents().debugPanel?.error?.(msg, data); },
      toggle() { getComponents().debugPanel?.toggle?.(); },
      show() { getComponents().debugPanel?.show?.(); },
      hide() { getComponents().debugPanel?.hide?.(); }
    }
  };
}

export default { createDebugAPI };
