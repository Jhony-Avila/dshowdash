// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-MODULAR-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: ui-api
// PURPOSE: UI API (Badge, Toolbar, Zoom)
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   createUIAPI() — exported function
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
export const MODULE_ID = 'main.ui.container-main.container-factory.api.ui-api';

export function createUIAPI(context: Record<string, unknown>) {
  const getComponents = context.getComponents as () => Record<string, Record<string, (...args: unknown[]) => unknown>>;

  return {
    // Badge
    setBadge(count: number) { getComponents().notificationBadge?.setCount?.(count); return this; },
    clearBadge() { getComponents().notificationBadge?.clear?.(); return this; },

    // Toolbar
    setToolbarItems(items: unknown) { getComponents().toolbar?.setItems?.(items); return this; },
    addToolbarItem(item: Record<string, unknown>, index: number) { getComponents().toolbar?.addItem?.(item, index); return this; },

    // Zoom
    zoomIn() { getComponents().zoomControls?.zoomIn?.(); return this; },
    zoomOut() { getComponents().zoomControls?.zoomOut?.(); return this; },
    setZoom(value: unknown) { getComponents().zoomControls?.setZoom?.(value); return this; },
    resetZoom() { getComponents().zoomControls?.reset?.(); return this; },
    getZoom() { return getComponents().zoomControls?.getZoom?.() || 100; }
  };
}

export default { createUIAPI };
