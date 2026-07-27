// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-MODULAR-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: toast-api
// PURPOSE: Toast API
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   createToastAPI() — exported function
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
export const MODULE_ID = 'main.ui.container-main.container-factory.api.toast-api';

export function createToastAPI(context: Record<string, unknown>) {
  const getComponents = context.getComponents as () => Record<string, Record<string, (...args: unknown[]) => unknown>>;

  return {
    toast(message: string, type = 'info') { return getComponents().toast?.show?.(message, type); },
    toastSuccess(message: string) { return getComponents().toast?.success?.(message); },
    toastError(message: string) { return getComponents().toast?.error?.(message); },
    toastWarning(message: string) { return getComponents().toast?.warning?.(message); },
    toastInfo(message: string) { return getComponents().toast?.info?.(message); }
  };
}

export default { createToastAPI };
