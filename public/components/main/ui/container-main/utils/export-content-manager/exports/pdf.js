import { EXPORT_FORMATS } from "../constants.js";
import { getConfig } from "../state.js";
import { loadScript } from "../helpers/download.js";
import { elementToCanvas } from "../canvas/renderer.js";
import { addWatermark } from "../canvas/watermark.js";
const VERSION = "15.2.0-MODULAR";
const MODULE_ID = "main.ui.container-main.utils.export-content-manager.exports.pdf";
async function internalExportToPDF(element, options = {}) {
  const config = getConfig();
  if (typeof window.jspdf === "undefined" && typeof window.jsPDF === "undefined") {
    try {
      await loadScript("https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js");
    } catch (e) {
      throw new Error("jsPDF library not available. Please include jsPDF for PDF export.");
    }
  }
  const PDF = window.jspdf?.jsPDF || window.jsPDF;
  if (!PDF) {
    throw new Error("jsPDF not found after loading");
  }
  const canvas = await elementToCanvas(element, options);
  if (options.watermark || config.watermark) {
    addWatermark(canvas, options.watermark || config.watermark);
  }
  const imgData = canvas.toDataURL("image/jpeg", options.quality || config.quality);
  const pdf = new PDF({
    orientation: canvas.width > canvas.height ? "landscape" : "portrait",
    unit: "px",
    format: [canvas.width, canvas.height]
  });
  pdf.addImage(imgData, "JPEG", 0, 0, canvas.width, canvas.height);
  return pdf.output("blob");
}
async function exportToPDF(element, options = {}) {
  const { exportElement } = await import("../manager.js");
  return exportElement(element, { ...options, format: EXPORT_FORMATS.PDF });
}
export {
  MODULE_ID,
  VERSION,
  exportToPDF,
  internalExportToPDF
};
