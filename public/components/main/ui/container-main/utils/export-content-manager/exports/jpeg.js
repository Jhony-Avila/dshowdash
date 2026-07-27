import { EXPORT_FORMATS } from "../constants.js";
import { exportElement } from "../manager.js";
const VERSION = "15.2.0-MODULAR";
const MODULE_ID = "main.ui.container-main.utils.export-content-manager.exports.jpeg";
async function exportToJPEG(element, options = {}) {
  return exportElement(element, {
    ...options,
    format: EXPORT_FORMATS.JPEG,
    backgroundColor: options.backgroundColor || "#ffffff"
  });
}
export {
  MODULE_ID,
  VERSION,
  exportToJPEG
};
