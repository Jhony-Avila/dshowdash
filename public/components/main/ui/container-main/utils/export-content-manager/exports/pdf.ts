// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: pdf
// PURPOSE: Export Content Manager - PDF Export
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   EXPORT_FORMATS from ../constants.js
//   getConfig from ../state.js
//   loadScript from ../helpers/download.js
//   elementToCanvas from ../canvas/renderer.js
//   addWatermark from ../canvas/watermark.js
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
//   window.jsPDF
//   window.jspdf
// ═══════════════════════════════════════════════════════════════
'use strict';

import { EXPORT_FORMATS } from '../constants.js';
import { getConfig } from '../state.js';
import { loadScript } from '../helpers/download.js';
import { elementToCanvas } from '../canvas/renderer.js';
import { addWatermark } from '../canvas/watermark.js';

export const VERSION = '15.2.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.utils.export-content-manager.exports.pdf';

export async function internalExportToPDF(element: HTMLElement, options: Record<string, unknown> = {}) {
  const config = getConfig();

  if (typeof (window as any).jspdf === 'undefined' && typeof (window as any).jsPDF === 'undefined') {
    try {
      await loadScript('https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js');
    } catch (e) {
      throw new Error('jsPDF library not available. Please include jsPDF for PDF export.');
    }
  }

  const PDF = (window as any).jspdf?.jsPDF || (window as any).jsPDF;
  if (!PDF) {
    throw new Error('jsPDF not found after loading');
  }

  const canvas = await elementToCanvas(element, options) as HTMLCanvasElement;

  if (options.watermark || config.watermark) {
    // @ts-expect-error strict migration — TS2345
    addWatermark(canvas, options.watermark || config.watermark);
  }

  const imgData = canvas.toDataURL('image/jpeg', (options.quality || config.quality) as number);
  const pdf = new PDF({
    orientation: canvas.width > canvas.height ? 'landscape' : 'portrait',
    unit: 'px',
    format: [canvas.width, canvas.height]
  });

  pdf.addImage(imgData, 'JPEG', 0, 0, canvas.width, canvas.height);

  return pdf.output('blob');
}

export async function exportToPDF(element: HTMLElement, options: Record<string, unknown> = {}) {
  const { exportElement } = await import('../manager.js');
  return exportElement(element, { ...options, format: EXPORT_FORMATS.PDF });
}
