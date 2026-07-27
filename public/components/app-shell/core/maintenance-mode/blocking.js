import { MAINTENANCE_TYPES } from "./constants.js";
import { state, config } from "./state.js";
import { getDefaultMessage } from "./banner.js";
const VERSION = "7.5.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell.core.maintenance-mode.blocking";
function applyBlockingOverlay() {
  if (!config.blockInteraction) return;
  if (state.type !== MAINTENANCE_TYPES.FULL) return;
  if (typeof document === "undefined") return;
  const overlay = document.createElement("div");
  overlay.id = "shell-maintenance-overlay";
  overlay.style.cssText = [
    "position: fixed",
    "top: 0",
    "left: 0",
    "right: 0",
    "bottom: 0",
    "background: rgba(0,0,0,0.5)",
    "z-index: 99998",
    "display: flex",
    "align-items: center",
    "justify-content: center"
  ].join(";");
  const content = document.createElement("div");
  content.style.cssText = "background: white; padding: 32px; border-radius: 8px; text-align: center; max-width: 400px";
  content.innerHTML = `<h2 style="margin: 0 0 16px">\u{1F527} Manutencao</h2><p>${state.message || getDefaultMessage()}</p>`;
  overlay.appendChild(content);
  document.body.appendChild(overlay);
}
function removeBlockingOverlay() {
  const overlay = document.getElementById("shell-maintenance-overlay");
  if (overlay && overlay.parentNode) {
    overlay.parentNode.removeChild(overlay);
  }
}
function blockRegion(regionName) {
  if (typeof document === "undefined") return;
  const regionId = `shell-${regionName}-region`;
  const region = document.getElementById(regionId);
  if (!region) return;
  region.setAttribute("data-maintenance", "true");
  region.style.pointerEvents = "none";
  region.style.opacity = "0.5";
}
function unblockRegion(regionName) {
  if (typeof document === "undefined") return;
  const regionId = `shell-${regionName}-region`;
  const region = document.getElementById(regionId);
  if (!region) return;
  region.removeAttribute("data-maintenance");
  region.style.pointerEvents = "";
  region.style.opacity = "";
}
export {
  MODULE_ID,
  VERSION,
  applyBlockingOverlay,
  blockRegion,
  removeBlockingOverlay,
  unblockRegion
};
