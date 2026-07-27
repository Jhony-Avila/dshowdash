import { injectStyles } from "../styles.js";
const VERSION = "15.2.0-MODULAR";
const MODULE_ID = "main.ui.container-main.utils.loading-progress.dom.elements";
function createElements(config, refs) {
  if (refs.element) return;
  injectStyles(config);
  refs.element = document.createElement("div");
  refs.element.className = `dsd-loading-progress dsd-loading-progress--${config.position}`;
  refs.element.setAttribute("role", "progressbar");
  refs.element.setAttribute("aria-valuemin", "0");
  refs.element.setAttribute("aria-valuemax", "100");
  refs.element.setAttribute("aria-valuenow", "0");
  refs.barElement = document.createElement("div");
  refs.barElement.className = "dsd-loading-progress__bar";
  refs.element.appendChild(refs.barElement);
  if (config.showSpinner) {
    refs.spinnerElement = document.createElement("div");
    refs.spinnerElement.className = "dsd-loading-progress__spinner";
    refs.spinnerElement.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none" stroke="${config.color}" stroke-width="2">
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83"/>
      </svg>
    `;
  }
  const parent = config.parent || document.body;
  parent.appendChild(refs.element);
  if (refs.spinnerElement) parent.appendChild(refs.spinnerElement);
}
function removeElements(refs) {
  refs.element?.remove();
  refs.spinnerElement?.remove();
  refs.element = null;
  refs.barElement = null;
  refs.spinnerElement = null;
}
export {
  MODULE_ID,
  VERSION,
  createElements,
  removeElements
};
