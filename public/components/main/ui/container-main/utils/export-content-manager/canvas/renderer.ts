// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-TAINT-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: renderer
// PURPOSE: Export Content Manager - Canvas Renderer
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   getConfig from ../state.js
//   log from ../helpers/logger.js
//
// PROVIDES:
//   (none)
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

import { getConfig } from '../state.js';
import { log } from '../helpers/logger.js';

declare const html2canvas: (...args: any[]) => Promise<HTMLCanvasElement>;
export const VERSION = '15.2.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.utils.export-content-manager.canvas.renderer';

export async function elementToCanvasFallback(element: HTMLElement, canvas: HTMLElement, ctx: Record<string, unknown>, width: number, height: number) {
  const data = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
      <foreignObject width="100%" height="100%">
        <div xmlns="http://www.w3.org/1999/xhtml">
          ${element.outerHTML}
        </div>
      </foreignObject>
    </svg>
  `;

  const blob = new Blob([data], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      (ctx.drawImage as (...args: unknown[]) => unknown)(img, 0, 0);
      URL.revokeObjectURL(url);
      resolve(canvas);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to render element to canvas'));
    };
    img.src = url;
  });
}

export async function elementToCanvas(element: HTMLElement, options: Record<string, any> = {}) {
  const config = getConfig();
  const scale = options.scale || config.scale;
  const backgroundColor = options.backgroundColor ?? config.backgroundColor;

  const rect = element.getBoundingClientRect();
  const width = options.maxWidth ? Math.min(rect.width, options.maxWidth) : rect.width;
  const height = options.maxHeight ? Math.min(rect.height, options.maxHeight) : rect.height;

  const canvas = document.createElement('canvas');
  canvas.width = width * scale;
  canvas.height = height * scale;

  const ctx = canvas.getContext('2d');
  ctx!.scale(scale, scale);

  if (backgroundColor) {
    ctx!.fillStyle = backgroundColor;
    ctx!.fillRect(0, 0, width, height);
  }

  if (typeof html2canvas !== 'undefined') {
    try {
      const renderedCanvas = await html2canvas(element, {
        scale,
        backgroundColor,
        useCORS: true,
        allowTaint: false,
        logging: false,
        width,
        height,
        onclone: (doc: unknown, clonedElement: unknown) => {
          config.excludeSelectors.forEach(selector => {
            // @ts-expect-error strict migration — TS2345
            (clonedElement as HTMLElement).querySelectorAll(selector).forEach((el: HTMLElement) => el.remove());
          });
        }
      });
      return renderedCanvas;
    } catch (e: any) {
      log('warn', 'html2canvas failed, using fallback:', e.message);
    }
  }

  // @ts-expect-error TS migration - TS2345
  return elementToCanvasFallback(element, canvas, ctx, width, height);
}
