// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-MODULAR-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: loading-api
// PURPOSE: Loading API
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   createLoadingAPI() — exported function
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
export const MODULE_ID = 'main.ui.container-main.container-factory.api.loading-api';

export function createLoadingAPI(context: Record<string, unknown>) {
  const state = context.state as Record<string, unknown>;
  const refs = context.refs as Record<string, unknown>;
  const getComponents = context.getComponents as () => Record<string, Record<string, (...args: unknown[]) => unknown>>;

  return {
    showLoading() {
      state.loading = true;
      (refs.container as HTMLElement | null)?.classList?.add('dsd-container--loading');
      const pb = getComponents().progressBar;
      if (pb?.show) { const shown = pb.show() as Record<string, (...args: unknown[]) => unknown>; shown?.setIndeterminate?.(true); }
      getComponents().accessibility?.setAriaBusy?.(true);
      return this;
    },
    hideLoading() {
      state.loading = false;
      (refs.container as HTMLElement | null)?.classList?.remove('dsd-container--loading');
      getComponents().progressBar?.hide?.();
      getComponents().accessibility?.setAriaBusy?.(false);
      return this;
    },
    setProgress(value: unknown, variant: string) {
      const progressBar = getComponents().progressBar;
      if (progressBar?.show) { const shown = progressBar.show() as Record<string, (...args: unknown[]) => unknown>; shown?.setIndeterminate?.(false); shown?.setValue?.(value); }
      if (variant) progressBar?.setVariant?.(variant);
      return this;
    }
  };
}

export default { createLoadingAPI };
