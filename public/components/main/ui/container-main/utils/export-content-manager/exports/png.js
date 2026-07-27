import { EXPORT_FORMATS } from "../constants.js";
import { exportElement } from "../manager.js";
const VERSION = "15.2.0-MODULAR";
const MODULE_ID = "main.ui.container-main.utils.export-content-manager.exports.png";
async function exportToPNG(element, options = {}) {
  return exportElement(element, { ...options, format: EXPORT_FORMATS.PNG });
}
export {
  MODULE_ID,
  VERSION,
  exportToPNG
};
