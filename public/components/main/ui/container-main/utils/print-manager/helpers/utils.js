import { PRINT_SIZES } from "../constants.js";
const VERSION = "15.2.0-MODULAR";
const MODULE_ID = "main.ui.container-main.utils.print-manager.helpers.utils";
function _getPageSizeCSS(size) {
  const sizes = {
    [PRINT_SIZES.A4]: "210mm 297mm",
    [PRINT_SIZES.A3]: "297mm 420mm",
    [PRINT_SIZES.LETTER]: "8.5in 11in",
    [PRINT_SIZES.LEGAL]: "8.5in 14in",
    [PRINT_SIZES.AUTO]: "auto"
  };
  return sizes[size] || sizes[PRINT_SIZES.A4];
}
function _formatDate() {
  return (/* @__PURE__ */ new Date()).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });
}
export {
  MODULE_ID,
  VERSION,
  _formatDate,
  _getPageSizeCSS
};
