import { getConfig, getRecentPanels as getRecentPanelsState, setRecentPanels } from "../state.js";
import { emit } from "../helpers/logger.js";
import { saveRecentPanels } from "../storage/recent.js";
const VERSION = "15.2.0-MODULAR";
const MODULE_ID = "main.ui.container-main.utils.panel-bookmarks-manager.operations.recent";
function addToRecent(panelId, metadata = {}) {
  const config = getConfig();
  let recentPanels = getRecentPanelsState();
  recentPanels = recentPanels.filter((r) => r.panelId !== panelId);
  recentPanels.unshift({
    panelId,
    title: metadata.title || panelId,
    timestamp: Date.now(),
    ...metadata
  });
  if (recentPanels.length > config.maxRecentPanels) {
    recentPanels = recentPanels.slice(0, config.maxRecentPanels);
  }
  setRecentPanels(recentPanels);
  saveRecentPanels();
  emit("recentPanelAdded", { panelId });
}
function getRecentPanels(limit = null) {
  const panels = [...getRecentPanelsState()];
  return limit ? panels.slice(0, limit) : panels;
}
function clearRecentPanels() {
  setRecentPanels([]);
  saveRecentPanels();
  emit("recentPanelsCleared", {});
}
export {
  MODULE_ID,
  VERSION,
  addToRecent,
  clearRecentPanels,
  getRecentPanels
};
