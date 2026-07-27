import { MODULE_ID } from "./constants.js";
import { commandPalette, splitView, panelSearchManager } from "./state.js";
import { getCM } from "./helpers.js";
import { createLogger } from "../logger.js";
const VERSION = "1.1.1-LOG-VERBOSITY";
const logger = createLogger(`${MODULE_ID}:shortcuts`);
function setupKeyboardShortcuts() {
  const CM = getCM();
  document.addEventListener("keydown", (e) => {
    if (e.ctrlKey && e.key === "k") {
      e.preventDefault();
      commandPalette.value = commandPalette.value || (CM && CM.getCommandPaletteManager ? CM.getCommandPaletteManager() : null);
      if (commandPalette.value && commandPalette.value.open) commandPalette.value.open();
      return;
    }
    if (e.ctrlKey && e.key === "\\") {
      e.preventDefault();
      splitView.value = splitView.value || (CM && CM.getSplitViewManager ? CM.getSplitViewManager() : null);
      if (splitView.value && splitView.value.toggle) {
        const body = document.querySelector(".dsd-container__body") || document.getElementById("container-main");
        splitView.value.toggle(body);
      }
      return;
    }
    if (e.ctrlKey && e.key === "f") {
      panelSearchManager.value = panelSearchManager.value || (CM && CM.getPanelSearchManager ? CM.getPanelSearchManager() : null);
      if (panelSearchManager.value) {
        e.preventDefault();
        if (panelSearchManager.value.open) panelSearchManager.value.open();
      }
      return;
    }
    if (e.altKey && e.key === "ArrowLeft") {
      e.preventDefault();
      if (CM && CM.goBack) CM.goBack();
      return;
    }
    if (e.altKey && e.key === "ArrowRight") {
      e.preventDefault();
      if (CM && CM.goForward) CM.goForward();
      return;
    }
  });
  logger.debug("Keyboard shortcuts registered");
}
export {
  VERSION,
  setupKeyboardShortcuts
};
