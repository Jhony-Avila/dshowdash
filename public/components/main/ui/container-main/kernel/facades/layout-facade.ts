// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (10.0.0-INTEGRATED-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: layout-facade
// PURPOSE: Layout Facade
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   createLayoutFacade() — exported function
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
export const MODULE_ID = 'main.ui.container-main.kernel.facades.layout-facade';

export function createLayoutFacade(registry: { get: (name: string) => Record<string, (...args: unknown[]) => unknown> | null }) {
  return {
    register(panelId: string, panel: HTMLElement, element: HTMLElement, options: Record<string, unknown> = {}) {
      return registry.get('layout')?.register(panelId, panel, element, options) || false;
    },

    resize(panelId: string, width: number, height: number, options: Record<string, unknown> = {}) {
      return registry.get('layout')?.resize(panelId, width, height, options) || false;
    },

    move(panelId: string, x: number, y: number, options: Record<string, unknown> = {}) {
      return registry.get('layout')?.move(panelId, x, y, options) || false;
    },

    dock(panelId: string, zone: Record<string, unknown>) {
      return registry.get('layout')?.dock(panelId, zone) || false;
    },

    toggleFullscreen(panelId: string) {
      return registry.get('layout')?.toggleFullscreen(panelId) || false;
    },

    unregister(panelId: string) {
      return registry.get('layout')?.unregister(panelId) || false;
    }
  };
}

export default { createLayoutFacade };
