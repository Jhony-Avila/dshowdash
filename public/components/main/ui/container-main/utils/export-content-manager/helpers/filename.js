import { getConfig } from "../state.js";
const VERSION = "15.2.0-MODULAR";
const MODULE_ID = "main.ui.container-main.utils.export-content-manager.helpers.filename";
function generateFilename(format) {
  const config = getConfig();
  let name = config.filename;
  if (config.includeDateInFilename) {
    const date = /* @__PURE__ */ new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, "");
    const timeStr = date.toTimeString().slice(0, 8).replace(/:/g, "");
    name += `_${dateStr}_${timeStr}`;
  }
  return `${name}.${format}`;
}
export {
  MODULE_ID,
  VERSION,
  generateFilename
};
