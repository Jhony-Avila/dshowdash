import { EXPORT_FORMATS } from "../constants.js";
import { getConfig } from "../state.js";
const VERSION = "15.2.0-MODULAR";
const MODULE_ID = "main.ui.container-main.utils.export-content-manager.canvas.blob";
function cloneAndPrepare(element, options = {}) {
  const config = getConfig();
  const clone = element.cloneNode(true);
  const excludeSelectors = options.excludeSelectors || config.excludeSelectors;
  excludeSelectors.forEach((selector) => {
    clone.querySelectorAll(selector).forEach((el) => el.remove());
  });
  return clone;
}
function canvasToBlob(canvas, format, quality) {
  return new Promise((resolve, reject) => {
    const mimeType = format === EXPORT_FORMATS.JPEG ? "image/jpeg" : "image/png";
    canvas.toBlob(
      (blob) => blob ? resolve(blob) : reject(new Error("Failed to create blob")),
      mimeType,
      quality
    );
  });
}
export {
  MODULE_ID,
  VERSION,
  canvasToBlob,
  cloneAndPrepare
};
