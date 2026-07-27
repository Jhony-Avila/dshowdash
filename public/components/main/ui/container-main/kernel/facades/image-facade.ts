// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (10.0.0-INTEGRATED-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: image-facade
// PURPOSE: Image Facade
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   createImageFacade() — exported function
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
export const MODULE_ID = 'main.ui.container-main.kernel.facades.image-facade';

export function createImageFacade(registry: { get: (name: string) => Record<string, (...args: unknown[]) => unknown> | null }) {
  return {
    virtualize(element: HTMLElement, src: string, options: Record<string, unknown> = {}) {
      return registry.get('image')?.register(element, src, options) || null;
    },

    loadNow(imageId: unknown) {
      return registry.get('image')?.loadNow(imageId) || Promise.resolve(null);
    },

    pause() {
      return registry.get('image')?.pause();
    },

    resume() {
      return registry.get('image')?.resume();
    }
  };
}

export default { createImageFacade };
