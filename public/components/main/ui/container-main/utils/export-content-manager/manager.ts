// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.2.0-CIRCULAR-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: manager
// PURPOSE: Export Content Manager - Manager
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   EXPORT_FORMATS, DEFAULT_CONFIG from ./constants.js
//   getConfig, setConfig, isExporting, setExporting, incrementMetric, metrics fro...
//   log, emit from ./helpers/logger.js
//   generateFilename from ./helpers/filename.js
//   downloadBlob from ./helpers/download.js
//   elementToCanvas from ./canvas/renderer.js
//   addWatermark from ./canvas/watermark.js
//   canvasToBlob from ./canvas/blob.js
//   internalExportToPDF from ./exports/pdf.js
//   exportToSVG from ./exports/svg.js
//   exportToPNG from ./exports/png.js
//   exportToJPEG from ./exports/jpeg.js
//
// PROVIDES:
//   createExportContentManager() — exported function
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
export const VERSION = '1.0.0-ENTERPRISE';
export const MODULE_ID = 'main.ui.container-main.utils.export-content-manager.manager';

import { EXPORT_FORMATS, DEFAULT_CONFIG } from './constants.js';
import { getConfig, setConfig, isExporting, setExporting, incrementMetric, metrics } from './state.js';
import { log, emit } from './helpers/logger.js';
import { generateFilename } from './helpers/filename.js';
import { downloadBlob } from './helpers/download.js';
import { elementToCanvas } from './canvas/renderer.js';
import { addWatermark } from './canvas/watermark.js';
import { canvasToBlob } from './canvas/blob.js';
import { internalExportToPDF } from './exports/pdf.js';
import { exportToSVG } from './exports/svg.js';
import { exportToPNG } from './exports/png.js';
import { exportToJPEG } from './exports/jpeg.js';

export async function exportElement(element: HTMLElement, options: Record<string, any> = {}) {
  if (isExporting()) {
    throw new Error('Export already in progress');
  }

  const config = getConfig();
  setExporting(true);
  emit('exportStart', { format: options.format || config.format });

  try {
    const el = typeof element === 'string' ? document.querySelector(element) : element;
    if (!el) throw new Error('Element not found');

    const format = options.format || config.format;
    const quality = options.quality || config.quality;
    const download = options.download !== false;

    let blob;

    if (format === EXPORT_FORMATS.PDF) {
      blob = await internalExportToPDF(el, options);
      incrementMetric('pdfExports');
    } else if (format === EXPORT_FORMATS.SVG) {
      setExporting(false);
      return exportToSVG(el, { ...options, download });
    } else {
      const canvas = await elementToCanvas(el, options);

      if (options.watermark || config.watermark) {
        addWatermark((canvas as HTMLElement), options.watermark || config.watermark);
      }

      blob = await canvasToBlob((canvas as HTMLElement), format, quality);

      if (format === EXPORT_FORMATS.PNG) {
        incrementMetric('pngExports');
      } else {
        incrementMetric('jpegExports');
      }
    }

    if (download) {
      const filename = options.filename
        ? `${options.filename}.${format}`
        : generateFilename(format);
      downloadBlob(blob, filename);
    }

    incrementMetric('exports');
    incrementMetric('totalBytes', blob.size);
    // @ts-expect-error TS migration - TS2352
    metrics.lastExportAt = Date.now() as Record<string, unknown>;

    emit('exportComplete', { format, size: blob.size });
    log('info', `Exported as ${format.toUpperCase()}:`, blob.size, 'bytes');

    return blob;

  } catch (error: any) {
    incrementMetric('errors');
    emit('exportError', { error: error.message });
    log('error', 'Export failed:', error.message);
    throw error;
  } finally {
    setExporting(false);
  }
}

export function createExportContentManager(options: Record<string, any> = {}) {
  setConfig({ ...DEFAULT_CONFIG, ...options });

  log('info', 'Export Content Manager created');

  // Lazy imports para evitar dependência circular api.js ↔ manager.js
  // api.js importa createExportContentManager de manager.js
  // Portanto manager.js NÃO pode importar estaticamente de api.js
  let _api: unknown = null;
  const getApi = async () => {
    if (!_api) _api = await import('./api.js');
    return _api;
  };

  return {
    exportToPNG,
    exportToJPEG,
    exportToPDF: internalExportToPDF,
    exportToSVG,
    exportElement,
    configure: (opts: Record<string, unknown>) => getApi().then((api => (api as Record<string, unknown>).configure as (...args: unknown[]) => unknown)(opts)),
    isExporting,
    subscribe: (cb: (...args: unknown[]) => void) => getApi().then((api => (api as unknown as Record<string, unknown>).subscribe as (...args: unknown[]) => unknown)(cb)),
    // @ts-expect-error strict migration — TS2352
    healthCheck: () => getApi().then((api => (api as Record<string, unknown>).healthCheck as (...args: unknown[]) => unknown)()),
    // @ts-expect-error strict migration — TS2352
    info: () => getApi().then((api => (api as Record<string, unknown>).info as (...args: unknown[]) => unknown)())
  };
}
