import { getLiveRegion, setLiveRegion } from "../state.js";
const VERSION = "15.2.0-MODULAR";
const MODULE_ID = "main.ui.container-main.utils.accessibility-manager.ui.live-region";
function _createLiveRegion() {
  if (getLiveRegion()) return getLiveRegion();
  const liveRegion = document.createElement("div");
  liveRegion.id = "dsd-a11y-live-region";
  liveRegion.setAttribute("role", "status");
  liveRegion.setAttribute("aria-live", "polite");
  liveRegion.setAttribute("aria-atomic", "true");
  liveRegion.className = "dsd-a11y-sr-only";
  liveRegion.style.cssText = `
    position: absolute !important;
    width: 1px !important;
    height: 1px !important;
    padding: 0 !important;
    margin: -1px !important;
    overflow: hidden !important;
    clip: rect(0, 0, 0, 0) !important;
    white-space: nowrap !important;
    border: 0 !important;
  `;
  document.body.appendChild(liveRegion);
  setLiveRegion(liveRegion);
  return liveRegion;
}
export {
  MODULE_ID,
  VERSION,
  _createLiveRegion
};
