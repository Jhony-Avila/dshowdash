import { getPrintStylesheet, setPrintStylesheet } from "../state.js";
import { _generatePrintStyles } from "../styles/print-styles.js";
const VERSION = "15.2.0-MODULAR";
const MODULE_ID = "main.ui.container-main.utils.print-manager.dom.stylesheet";
function _injectPrintStylesheet() {
  _removePrintStylesheet();
  const stylesheet = document.createElement("style");
  stylesheet.id = "dsd-print-styles";
  stylesheet.textContent = _generatePrintStyles();
  document.head.appendChild(stylesheet);
  setPrintStylesheet(stylesheet);
}
function _removePrintStylesheet() {
  const currentStylesheet = getPrintStylesheet();
  if (currentStylesheet) {
    currentStylesheet.remove();
    setPrintStylesheet(null);
  }
  const existing = document.getElementById("dsd-print-styles");
  if (existing) existing.remove();
}
export {
  MODULE_ID,
  VERSION,
  _injectPrintStylesheet,
  _removePrintStylesheet
};
