// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (10.0.0-INTEGRATED-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: listener-facade
// PURPOSE: Listener Facade
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   createListenerFacade() — exported function
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
export const MODULE_ID = 'main.ui.container-main.kernel.facades.listener-facade';

export function createListenerFacade(registry: { get: (name: string) => Record<string, (...args: unknown[]) => unknown> | null }) {
  return {
    trackDOM(panelId: string, target: HTMLElement, eventName: string, handler: (...args: unknown[]) => void, options: Record<string, unknown>) {
      return registry.get('listener')?.trackDOMListener(panelId, target, eventName, handler, options) || null;
    },

    trackEventBus(panelId: string, eventName: string, handler: (...args: unknown[]) => void) {
      return registry.get('listener')?.trackEventBusListener(panelId, eventName, handler) || null;
    },

    cleanupPanel(panelId: string) {
      return registry.get('listener')?.cleanupPanel(panelId) || { removed: 0 };
    }
  };
}

export default { createListenerFacade };
