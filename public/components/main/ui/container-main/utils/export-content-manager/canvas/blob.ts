// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: blob
// PURPOSE: Export Content Manager - Blob Utils
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   EXPORT_FORMATS from ../constants.js
//   getConfig from ../state.js
//
// PROVIDES:
//   cloneAndPrepare() — exported function
//   canvasToBlob() — exported function
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

import { EXPORT_FORMATS } from '../constants.js';
import { getConfig } from '../state.js';

export const VERSION = '15.2.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.utils.export-content-manager.canvas.blob';

export function cloneAndPrepare(element: HTMLElement, options: Record<string, any> = {}) {
  const config = getConfig();
  const clone = element.cloneNode(true);
  
  const excludeSelectors = options.excludeSelectors || config.excludeSelectors;
  excludeSelectors.forEach((selector: string) => {
    // @ts-expect-error TS migration - TS2339
    clone.querySelectorAll(selector).forEach((el: HTMLElement) => el.remove());
  });
  
  return clone;
}

export function canvasToBlob(canvas: HTMLElement, format: string, quality: unknown) {
  return new Promise((resolve, reject) => {
    const mimeType = format === EXPORT_FORMATS.JPEG ? 'image/jpeg' : 'image/png';
    // @ts-expect-error TS migration - TS2339
    canvas.toBlob(
      (blob: unknown) => blob ? resolve(blob) : reject(new Error('Failed to create blob')),
      mimeType,
      quality
    );
  });
}
