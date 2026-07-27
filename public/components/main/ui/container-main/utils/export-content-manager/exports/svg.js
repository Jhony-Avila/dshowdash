import { incrementMetric, metrics } from "../state.js";
import { emit } from "../helpers/logger.js";
import { generateFilename } from "../helpers/filename.js";
import { downloadBlob } from "../helpers/download.js";
import { cloneAndPrepare } from "../canvas/blob.js";
const VERSION = "15.2.0-MODULAR";
const MODULE_ID = "main.ui.container-main.utils.export-content-manager.exports.svg";
async function exportToSVG(element, options = {}) {
  const el = typeof element === "string" ? document.querySelector(element) : element;
  if (!el) throw new Error("Element not found");
  const clone = cloneAndPrepare(el, options);
  const rect = el.getBoundingClientRect();
  const svgData = `
    <svg xmlns="http://www.w3.org/2000/svg" width="${rect.width}" height="${rect.height}">
      <foreignObject width="100%" height="100%">
        <div xmlns="http://www.w3.org/1999/xhtml">
          // @ts-expect-error TS migration - TS2339
          ${clone.outerHTML}
        </div>
      </foreignObject>
    </svg>
  `;
  const blob = new Blob([svgData], { type: "image/svg+xml;charset=utf-8" });
  if (options.download !== false) {
    downloadBlob(blob, generateFilename("svg"));
  }
  incrementMetric("exports");
  incrementMetric("svgExports");
  incrementMetric("totalBytes", blob.size);
  metrics.lastExportAt = Date.now();
  emit("exported", { format: "svg", size: blob.size });
  return blob;
}
export {
  MODULE_ID,
  VERSION,
  exportToSVG
};
