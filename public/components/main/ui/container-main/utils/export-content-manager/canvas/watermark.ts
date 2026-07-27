// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: watermark
// PURPOSE: Export Content Manager - Watermark
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   addWatermark() — exported function
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

export const VERSION = '15.2.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.utils.export-content-manager.canvas.watermark';

export function addWatermark(canvas: HTMLElement, watermark: Record<string, unknown>) {
  if (!watermark || !watermark.text) return canvas;
  
  // @ts-expect-error TS migration - TS2339
  const ctx = canvas.getContext('2d');
  const { text, position = 'bottom-right', opacity = 0.5, fontSize = 14 } = watermark;
  
  ctx.save();
  ctx.globalAlpha = opacity;
  ctx.font = `${fontSize}px system-ui, sans-serif`;
  ctx.fillStyle = '#666666';
  
  const metrics = ctx.measureText(text);
  const padding = 10;
  
  let x, y;
  switch (position) {
    case 'top-left':
      x = padding;
      y = (fontSize as number) + padding;
      break;
    case 'top-right':
      // @ts-expect-error TS migration - TS2339
      x = canvas.width - metrics.width - padding;
      y = (fontSize as number) + padding;
      break;
    case 'bottom-left':
      x = padding;
      // @ts-expect-error TS migration - TS2339
      y = canvas.height - padding;
      break;
    case 'bottom-right':
    default:
      // @ts-expect-error TS migration - TS2339
      x = canvas.width - metrics.width - padding;
      // @ts-expect-error TS migration - TS2339
      y = canvas.height - padding;
  }
  
  ctx.fillText(text, x, y);
  ctx.restore();
  
  return canvas;
}
