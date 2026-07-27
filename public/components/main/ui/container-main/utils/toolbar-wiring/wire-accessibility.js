const VERSION = "15.2.0-MODULAR";
const MODULE_ID = "main.ui.container-main.utils.toolbar-wiring.wire-accessibility";
function _fontIncreaseFallback() {
  const root = document.documentElement;
  const current = parseFloat(getComputedStyle(root).fontSize) || 16;
  root.style.fontSize = `${Math.min(current + 2, 24)}px`;
}
function _fontDecreaseFallback() {
  const root = document.documentElement;
  const current = parseFloat(getComputedStyle(root).fontSize) || 16;
  root.style.fontSize = `${Math.max(current - 2, 10)}px`;
}
function _highContrastFallback() {
  document.documentElement.classList.toggle("high-contrast");
}
function _focusModeFallback() {
  document.documentElement.classList.toggle("focus-mode");
}
async function wireAccessibility(toolbar, wired, failed, logger) {
  try {
    const a11yModule = await import("../accessibility-manager/index.js");
    const a11y = a11yModule.getAccessibilityManager?.() || a11yModule;
    const announceA11y = a11y.announce || a11yModule.announce;
    toolbar.registerAction("a11y", () => {
      logger.debug("A11y dropdown opened");
    });
    wired.push("a11y");
    const fontIncreaseFn = a11y.increaseFontSize || a11y.fontIncrease;
    if (fontIncreaseFn) {
      toolbar.registerAction("a11y-font-increase", () => {
        fontIncreaseFn();
        if (announceA11y) announceA11y("Fonte aumentada");
      });
    } else {
      toolbar.registerAction("a11y-font-increase", () => {
        _fontIncreaseFallback();
        logger.debug("A11y: font increased to", { size: document.documentElement.style.fontSize });
        if (announceA11y) announceA11y("Fonte aumentada");
      });
    }
    wired.push("a11y-font-increase");
    const fontDecreaseFn = a11y.decreaseFontSize || a11y.fontDecrease;
    if (fontDecreaseFn) {
      toolbar.registerAction("a11y-font-decrease", () => {
        fontDecreaseFn();
        if (announceA11y) announceA11y("Fonte diminu\xEDda");
      });
    } else {
      toolbar.registerAction("a11y-font-decrease", () => {
        _fontDecreaseFallback();
        logger.debug("A11y: font decreased to", { size: document.documentElement.style.fontSize });
        if (announceA11y) announceA11y("Fonte diminu\xEDda");
      });
    }
    wired.push("a11y-font-decrease");
    const highContrastFn = a11y.toggleHighContrast || a11y.highContrast;
    if (highContrastFn) {
      toolbar.registerAction("a11y-high-contrast", () => {
        highContrastFn();
        if (announceA11y) announceA11y("Alto contraste alternado");
      });
    } else {
      toolbar.registerAction("a11y-high-contrast", () => {
        _highContrastFallback();
        const isOn = document.documentElement.classList.contains("high-contrast");
        logger.debug("A11y: high contrast", { enabled: isOn });
        if (announceA11y) announceA11y(isOn ? "Alto contraste ativado" : "Alto contraste desativado");
      });
    }
    wired.push("a11y-high-contrast");
    const focusModeFn = a11y.toggleFocusMode || a11y.focusMode;
    if (focusModeFn) {
      toolbar.registerAction("a11y-focus-mode", () => {
        focusModeFn();
        if (announceA11y) announceA11y("Modo foco alternado");
      });
    } else {
      toolbar.registerAction("a11y-focus-mode", () => {
        _focusModeFallback();
        const isOn = document.documentElement.classList.contains("focus-mode");
        logger.debug("A11y: focus mode", { enabled: isOn });
        if (announceA11y) announceA11y(isOn ? "Modo foco ativado" : "Modo foco desativado");
      });
    }
    wired.push("a11y-focus-mode");
  } catch (e) {
    logger.warn("Accessibility Manager indispon\xEDvel", { error: e.message });
    toolbar.registerAction("a11y", () => {
      logger.debug("A11y dropdown opened (sem manager)");
    });
    wired.push("a11y");
    toolbar.registerAction("a11y-font-increase", _fontIncreaseFallback);
    wired.push("a11y-font-increase");
    toolbar.registerAction("a11y-font-decrease", _fontDecreaseFallback);
    wired.push("a11y-font-decrease");
    toolbar.registerAction("a11y-high-contrast", _highContrastFallback);
    wired.push("a11y-high-contrast");
    toolbar.registerAction("a11y-focus-mode", _focusModeFallback);
    wired.push("a11y-focus-mode");
  }
}
export {
  MODULE_ID,
  VERSION,
  wireAccessibility
};
