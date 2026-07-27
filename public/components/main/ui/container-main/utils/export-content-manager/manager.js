const VERSION = "1.0.0-ENTERPRISE";
const MODULE_ID = "main.ui.container-main.utils.export-content-manager.manager";
import { EXPORT_FORMATS, DEFAULT_CONFIG } from "./constants.js";
import { getConfig, setConfig, isExporting, setExporting, incrementMetric, metrics } from "./state.js";
import { log, emit } from "./helpers/logger.js";
import { generateFilename } from "./helpers/filename.js";
import { downloadBlob } from "./helpers/download.js";
import { elementToCanvas } from "./canvas/renderer.js";
import { addWatermark } from "./canvas/watermark.js";
import { canvasToBlob } from "./canvas/blob.js";
import { internalExportToPDF } from "./exports/pdf.js";
import { exportToSVG } from "./exports/svg.js";
import { exportToPNG } from "./exports/png.js";
import { exportToJPEG } from "./exports/jpeg.js";
async function exportElement(element, options = {}) {
  if (isExporting()) {
    throw new Error("Export already in progress");
  }
  const config = getConfig();
  setExporting(true);
  emit("exportStart", { format: options.format || config.format });
  try {
    const el = typeof element === "string" ? document.querySelector(element) : element;
    if (!el) throw new Error("Element not found");
    const format = options.format || config.format;
    const quality = options.quality || config.quality;
    const download = options.download !== false;
    let blob;
    if (format === EXPORT_FORMATS.PDF) {
      blob = await internalExportToPDF(el, options);
      incrementMetric("pdfExports");
    } else if (format === EXPORT_FORMATS.SVG) {
      setExporting(false);
      return exportToSVG(el, { ...options, download });
    } else {
      const canvas = await elementToCanvas(el, options);
      if (options.watermark || config.watermark) {
        addWatermark(canvas, options.watermark || config.watermark);
      }
      blob = await canvasToBlob(canvas, format, quality);
      if (format === EXPORT_FORMATS.PNG) {
        incrementMetric("pngExports");
      } else {
        incrementMetric("jpegExports");
      }
    }
    if (download) {
      const filename = options.filename ? `${options.filename}.${format}` : generateFilename(format);
      downloadBlob(blob, filename);
    }
    incrementMetric("exports");
    incrementMetric("totalBytes", blob.size);
    metrics.lastExportAt = Date.now();
    emit("exportComplete", { format, size: blob.size });
    log("info", `Exported as ${format.toUpperCase()}:`, blob.size, "bytes");
    return blob;
  } catch (error) {
    incrementMetric("errors");
    emit("exportError", { error: error.message });
    log("error", "Export failed:", error.message);
    throw error;
  } finally {
    setExporting(false);
  }
}
function createExportContentManager(options = {}) {
  setConfig({ ...DEFAULT_CONFIG, ...options });
  log("info", "Export Content Manager created");
  let _api = null;
  const getApi = async () => {
    if (!_api) _api = await import("./api.js");
    return _api;
  };
  return {
    exportToPNG,
    exportToJPEG,
    exportToPDF: internalExportToPDF,
    exportToSVG,
    exportElement,
    configure: (opts) => getApi().then(((api) => api.configure)(opts)),
    isExporting,
    subscribe: (cb) => getApi().then(((api) => api.subscribe)(cb)),
    // @ts-expect-error strict migration — TS2352
    healthCheck: () => getApi().then(((api) => api.healthCheck)()),
    // @ts-expect-error strict migration — TS2352
    info: () => getApi().then(((api) => api.info)())
  };
}
export {
  MODULE_ID,
  VERSION,
  createExportContentManager,
  exportElement
};
