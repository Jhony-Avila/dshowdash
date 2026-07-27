import { getConfig, getPanelElement, setPanelElement } from "../state.js";
import { injectStyles } from "../styles.js";
const VERSION = "4.0.0-P4-ENTERPRISE";
const MODULE_ID = "overlay-layer.telemetry.debug-panel.ui.panel";
function createPanelElement() {
  injectStyles();
  const config = getConfig();
  const panel = document.createElement("div");
  panel.id = "overlay-debug-panel";
  panel.className = `overlay-debug-panel ${config.position}${config.collapsed ? " collapsed" : ""}`;
  panel.style.opacity = String(config.opacity);
  return panel;
}
function ensurePanelElement() {
  let panel = getPanelElement();
  if (!panel) {
    panel = createPanelElement();
    document.body.appendChild(panel);
    setPanelElement(panel);
  }
  return panel;
}
function removePanelElement() {
  const panel = getPanelElement();
  if (panel && panel.parentNode) {
    panel.parentNode.removeChild(panel);
  }
  setPanelElement(null);
}
function updatePanelClasses() {
  const panel = getPanelElement();
  const config = getConfig();
  if (panel) {
    panel.className = `overlay-debug-panel ${config.position}${config.collapsed ? " collapsed" : ""}`;
    panel.style.opacity = String(config.opacity);
  }
}
var panel_default = {
  createPanelElement,
  ensurePanelElement,
  removePanelElement,
  updatePanelClasses
};
export {
  MODULE_ID,
  VERSION,
  createPanelElement,
  panel_default as default,
  ensurePanelElement,
  removePanelElement,
  updatePanelClasses
};
