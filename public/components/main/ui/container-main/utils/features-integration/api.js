import { commandPalette, splitView, tourManager } from "./state.js";
import { getCM } from "./helpers.js";
const VERSION = "1.1.1-LOG-VERBOSITY";
const MODULE_ID = "main.ui.container-main.utils.features-integration.api";
function startWelcomeTour() {
  const CM = getCM();
  tourManager.value = tourManager.value || (CM && CM.getTourManager ? CM.getTourManager() : null);
  if (tourManager.value && tourManager.value.startTour) tourManager.value.startTour("welcome");
}
function openCommandPalette() {
  const CM = getCM();
  commandPalette.value = commandPalette.value || (CM && CM.getCommandPaletteManager ? CM.getCommandPaletteManager() : null);
  if (commandPalette.value && commandPalette.value.open) commandPalette.value.open();
}
function toggleSplitView() {
  const CM = getCM();
  splitView.value = splitView.value || (CM && CM.getSplitViewManager ? CM.getSplitViewManager() : null);
  if (splitView.value && splitView.value.toggle) {
    let body = document.querySelector(".dsd-container__body");
    if (!body) {
      const container = document.getElementById("container-main");
      body = container;
    }
    splitView.value.toggle(body);
  }
}
export {
  MODULE_ID,
  VERSION,
  openCommandPalette,
  startWelcomeTour,
  toggleSplitView
};
