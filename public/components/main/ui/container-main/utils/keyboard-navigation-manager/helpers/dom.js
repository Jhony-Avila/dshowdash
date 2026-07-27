const VERSION = "15.2.0-MODULAR";
const MODULE_ID = "main.ui.container-main.utils.keyboard-navigation-manager.helpers.dom";
function _getFocusableElements(container) {
  const selectors = [
    'a[href]:not([disabled]):not([tabindex="-1"])',
    'button:not([disabled]):not([tabindex="-1"])',
    'input:not([disabled]):not([tabindex="-1"])',
    'select:not([disabled]):not([tabindex="-1"])',
    'textarea:not([disabled]):not([tabindex="-1"])',
    '[tabindex]:not([tabindex="-1"]):not([disabled])'
  ].join(", ");
  return Array.from(container.querySelectorAll(selectors)).filter((el) => {
    const style = window.getComputedStyle(el);
    return style.display !== "none" && style.visibility !== "hidden";
  });
}
function _getItemLabel(element) {
  return element.getAttribute("aria-label") || element.getAttribute("data-label") || element.textContent?.trim() || // @ts-expect-error TS migration - TS2339
  element.value || "";
}
export {
  MODULE_ID,
  VERSION,
  _getFocusableElements,
  _getItemLabel
};
