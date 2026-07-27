import { getConfig, getPanelFrequency } from "../state.js";
import { saveFrequency } from "../storage/frequency.js";
const VERSION = "15.2.0-MODULAR";
const MODULE_ID = "main.ui.container-main.utils.panel-bookmarks-manager.operations.frequency";
function getMostFrequent(limit = 10) {
  const frequency = getPanelFrequency();
  return Object.entries(frequency).sort(([, a], [, b]) => b - a).slice(0, limit).map(([panelId, count]) => ({ panelId, count }));
}
function trackPanelAccess(panelId) {
  const config = getConfig();
  if (!config.trackFrequency) return;
  const frequency = getPanelFrequency();
  frequency[panelId] = (frequency[panelId] || 0) + 1;
  saveFrequency();
}
export {
  MODULE_ID,
  VERSION,
  getMostFrequent,
  trackPanelAccess
};
