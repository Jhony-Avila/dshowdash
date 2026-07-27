import { getGutter } from "../state.js";
import { toggleCollapse } from "../operations/panel.js";
const VERSION = "15.2.0-MODULAR";
const MODULE_ID = "main.ui.container-main.utils.split-view-manager.handlers.collapse";
function _setupCollapseHandlers() {
  const gutter = getGutter();
  const buttons = gutter.querySelectorAll(".dsd-split-view__collapse-btn");
  buttons.forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      const panel = btn.dataset.collapse;
      toggleCollapse(panel);
    });
  });
}
export {
  MODULE_ID,
  VERSION,
  _setupCollapseHandlers
};
