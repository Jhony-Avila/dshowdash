import { LAYOUT_STATES } from "./constants.js";
const VERSION = "3.3.0-MODULAR";
const MODULE_ID = "main.ui.container-main.resources.layout-manager.style-applicator";
function createStyleApplicator(options = {}) {
  const { animationDuration = 300 } = options;
  return {
    // Aplica estilo de layout ao elemento
    apply(element, layout, animate = true) {
      if (!element) return;
      const style = element.style;
      if (animate) {
        style.transition = `all ${animationDuration}ms ease-out`;
      } else {
        style.transition = "none";
      }
      if (layout.state === LAYOUT_STATES.FULLSCREEN) {
        style.position = "fixed";
        style.top = "0";
        style.left = "0";
        style.width = "100vw";
        style.height = "100vh";
        style.zIndex = "9999";
      } else if (layout.state === LAYOUT_STATES.MINIMIZED) {
        style.display = "none";
      } else {
        style.position = layout.state === LAYOUT_STATES.FLOATING ? "absolute" : "relative";
        style.display = "block";
        style.width = `${layout.width}px`;
        style.height = `${layout.height}px`;
        if (layout.x !== void 0) style.left = `${layout.x}px`;
        if (layout.y !== void 0) style.top = `${layout.y}px`;
        style.zIndex = layout.zIndex || "auto";
      }
      element.setAttribute("data-layout-state", layout.state);
    },
    // Remove estilos de layout
    clear(element) {
      if (!element) return;
      const style = element.style;
      style.transition = "";
      style.position = "";
      style.top = "";
      style.left = "";
      style.width = "";
      style.height = "";
      style.zIndex = "";
      style.display = "";
      element.removeAttribute("data-layout-state");
    },
    getAnimationDuration() {
      return animationDuration;
    }
  };
}
var style_applicator_default = { createStyleApplicator };
export {
  MODULE_ID,
  VERSION,
  createStyleApplicator,
  style_applicator_default as default
};
