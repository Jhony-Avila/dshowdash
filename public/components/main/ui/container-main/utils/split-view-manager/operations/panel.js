import { SPLIT_POSITIONS } from "../constants.js";
import { getPrimaryPanel, getSecondaryPanel, getCollapsedPanel, setCollapsedPanel, incrementMetric } from "../state.js";
import { _emit } from "../helpers/logger.js";
import { _saveState } from "../helpers/storage.js";
const VERSION = "15.2.0-MODULAR";
const MODULE_ID = "main.ui.container-main.utils.split-view-manager.operations.panel";
function collapse(panel) {
  if (panel !== SPLIT_POSITIONS.PRIMARY && panel !== SPLIT_POSITIONS.SECONDARY) {
    return false;
  }
  if (getCollapsedPanel() === panel) return true;
  const targetPanel = panel === SPLIT_POSITIONS.PRIMARY ? getPrimaryPanel() : getSecondaryPanel();
  if (!targetPanel) return false;
  targetPanel.classList.add("dsd-split-view__panel--collapsed");
  setCollapsedPanel(panel);
  incrementMetric("collapses");
  _saveState();
  _emit("collapsed", { panel });
  return true;
}
function expand(panel = null) {
  const targetPanelName = panel || getCollapsedPanel();
  if (!targetPanelName) return false;
  const targetPanel = targetPanelName === SPLIT_POSITIONS.PRIMARY ? getPrimaryPanel() : getSecondaryPanel();
  if (!targetPanel) return false;
  targetPanel.classList.remove("dsd-split-view__panel--collapsed");
  setCollapsedPanel(null);
  _saveState();
  _emit("expanded", { panel: targetPanelName });
  return true;
}
function toggleCollapse(panel) {
  return getCollapsedPanel() === panel ? expand(panel) : collapse(panel);
}
function isCollapsed(panel = null) {
  if (panel) {
    return getCollapsedPanel() === panel;
  }
  return getCollapsedPanel() !== null;
}
function setContent(panel, content) {
  const targetPanel = panel === SPLIT_POSITIONS.PRIMARY ? getPrimaryPanel() : getSecondaryPanel();
  if (!targetPanel) return false;
  if (typeof content === "string") {
    targetPanel.innerHTML = content;
  } else if (content instanceof HTMLElement) {
    targetPanel.innerHTML = "";
    targetPanel.appendChild(content);
  }
  _emit("contentSet", { panel });
  return true;
}
export {
  MODULE_ID,
  VERSION,
  collapse,
  expand,
  isCollapsed,
  setContent,
  toggleCollapse
};
