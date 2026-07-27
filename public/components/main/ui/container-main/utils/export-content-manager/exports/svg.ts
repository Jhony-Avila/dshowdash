// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: svg
// PURPOSE: Export Content Manager - SVG Export
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   incrementMetric, metrics from ../state.js
//   emit from ../helpers/logger.js
//   generateFilename from ../helpers/filename.js
//   downloadBlob from ../helpers/download.js
//   cloneAndPrepare from ../canvas/blob.js
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

import { incrementMetric, metrics } from '../state.js';
import { emit } from '../helpers/logger.js';
import { generateFilename } from '../helpers/filename.js';
import { downloadBlob } from '../helpers/download.js';
import { cloneAndPrepare } from '../canvas/blob.js';

export const VERSION = '15.2.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.utils.export-content-manager.exports.svg';

export async function exportToSVG(element: HTMLElement, options: Record<string, unknown> = {}) {
  const el = typeof element === 'string' ? document.querySelector(element) : element;
  if (!el) throw new Error('Element not found');
  
  const clone = cloneAndPrepare(el, options);
  const rect = el.getBoundingClientRect();
  
  const svgData = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${rect.width}" height="${rect.height}">
      <foreignObject width="100%" height="100%">
        <div xmlns="http://www.w3.org/1999/xhtml">
          // @ts-expect-error TS migration - TS2339
          ${(clone as Element).outerHTML}
        </div>
      </foreignObject>
    </svg>
  `;
  
  const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
  
  if (options.download !== false) {
    downloadBlob(blob, generateFilename('svg'));
  }
  
  incrementMetric('exports');
  incrementMetric('svgExports');
  incrementMetric('totalBytes', blob.size);
  // @ts-expect-error TS migration - TS2352
  metrics.lastExportAt = Date.now() as Record<string, unknown>;
  
  emit('exported', { format: 'svg', size: blob.size });
  
  return blob;
}
