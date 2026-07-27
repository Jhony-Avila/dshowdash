// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (10.0.0-INTEGRATED-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: slot-facade
// PURPOSE: Slot Facade
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   createSlotFacade() — exported function
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
export const MODULE_ID = 'main.ui.container-main.kernel.facades.slot-facade';

export function createSlotFacade(registry: { get: (name: string) => Record<string, (...args: unknown[]) => unknown> | null }, healthReporter: { incrementSlotActivations?: () => void } | null) {
  return {
    register(config: Record<string, unknown>, contentFactory: unknown) {
      const slotManager = registry.get('slot');
      if (!slotManager) throw new Error('Kernel not initialized');
      
      const slotId = config.id || config.slotId;
      registry.get('lifecycle')?.register(slotId);
      
      return slotManager.register(config, contentFactory);
    },

    unregister(slotId: string) {
      registry.get('lifecycle')?.reset(slotId);
      return registry.get('slot')?.unregister(slotId) || false;
    },

    async activate(slotId: string) {
      const slotManager = registry.get('slot');
      if (!slotManager) throw new Error('Kernel not initialized');
      
      const startTime = performance.now();
      const result = await slotManager.activate(slotId);
      
      registry.get('metrics')?.timing(slotId, 'activation_time', performance.now() - startTime);
      // @ts-expect-error strict migration — TS2722
      healthReporter?.incrementSlotActivations();
      
      return result;
    },

    get(slotId: string) {
      return registry.get('slot')?.get(slotId) || null;
    },

    getActive() {
      return registry.get('slot')?.getActive() || null;
    },

    list() {
      return registry.get('slot')?.list() || [];
    },

    pauseAll() {
      return registry.get('slot')?.pauseAll();
    },

    resumeActive() {
      return registry.get('slot')?.resumeActive();
    }
  };
}

export default { createSlotFacade };
