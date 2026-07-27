import { getConfig } from "../state.js";
import { _formatDate } from "../helpers/utils.js";
const VERSION = "15.2.0-MODULAR";
const MODULE_ID = "main.ui.container-main.utils.print-manager.dom.wrapper";
function _createPrintWrapper(element) {
  const config = getConfig();
  const wrapper = document.createElement("div");
  wrapper.id = "dsd-print-wrapper";
  wrapper.className = "dsd-print-content";
  if (config.showHeader) {
    const header = document.createElement("div");
    header.className = "dsd-print-header dsd-print-only";
    if (config.headerContent) {
      header.innerHTML = typeof config.headerContent === "function" ? config.headerContent() : config.headerContent;
    } else {
      const title = config.title || document.title || "Documento";
      header.innerHTML = `
        <span class="dsd-print-title">${config.showTitle ? title : ""}</span>
        <span class="dsd-print-date">${config.showDate ? _formatDate() : ""}</span>
      `;
    }
    wrapper.appendChild(header);
  }
  const content = element.cloneNode(true);
  content.classList.add("dsd-print-body");
  wrapper.appendChild(content);
  if (config.showFooter) {
    const footer = document.createElement("div");
    footer.className = "dsd-print-footer dsd-print-only";
    if (config.footerContent) {
      footer.innerHTML = typeof config.footerContent === "function" ? config.footerContent() : config.footerContent;
    } else {
      footer.innerHTML = `
        <span>Impresso em ${_formatDate()}</span>
        ${config.showPageNumbers ? '<span class="dsd-print-page-number"></span>' : ""}
      `;
    }
    wrapper.appendChild(footer);
  }
  return wrapper;
}
export {
  MODULE_ID,
  VERSION,
  _createPrintWrapper
};
