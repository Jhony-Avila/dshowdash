// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (13.0.0-PHASE7-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: kernel
// PURPOSE: Bootstrap Helpers - Kernel
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   createKernelHelpers() — exported function
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
export const MODULE_ID = 'main.ui.container-main.bootstrap.helpers.kernel';

export function createKernelHelpers(refs: Record<string, unknown>) {
  const r = refs as Record<string, import('../types.js').ManagerRef | null>;
  return {
    registerSlot(cfg: Record<string, unknown>, contentFactory: unknown) { return r.kernel?.registerSlot(cfg, contentFactory); },
    activateSlot(slotId: string) { return r.kernel?.activateSlot(slotId); },
    getActiveSlot() { return r.kernel?.getActiveSlot(); },
    requestCapability(panelId: string, capability: string) { return r.kernel?.requestCapability(panelId, capability); },
    hasCapability(panelId: string, capability: string) { return r.kernel?.hasCapability(panelId, capability); },
    registerLayout(panelId: string, panel: HTMLElement, element: HTMLElement, opts: Record<string, unknown>) { return r.kernel?.registerLayout(panelId, panel, element, opts); },
    resizePanel(panelId: string, width: number, height: number) { return r.kernel?.resizePanel(panelId, width, height); },
    togglePanelFullscreen(panelId: string) { return r.kernel?.toggleFullscreen(panelId); },
    recordMetric(panelId: string, name: string, value: unknown, opts: Record<string, unknown>) { return r.kernel?.recordMetric(panelId, name, value, opts); },
    virtualizeImage(element: HTMLElement, src: string, opts: Record<string, unknown>) { return r.kernel?.virtualizeImage(element, src, opts); },
    getPreset(presetId: unknown) { return r.slotPresets?.get(presetId); },
    listPresets(category: string) { return r.slotPresets?.list(category); },
    // @ts-expect-error strict migration — TS2345
    applyPreset(presetId: unknown, overrides: Record<string, unknown>) { return r.slotPresets?.apply(presetId, overrides); }
  };
}

export default { createKernelHelpers };
