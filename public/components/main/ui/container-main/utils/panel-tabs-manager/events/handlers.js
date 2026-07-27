import { closeTab, activateTab } from "../api.js";
const VERSION = "15.2.0-MODULAR";
const MODULE_ID = "main.ui.container-main.utils.panel-tabs-manager.events.handlers";
function _handleTabClick(e) {
  const tabEl = e.target.closest(".dsd-pt-tab");
  if (!tabEl) return;
  const tabId = tabEl.dataset.tabId;
  if (e.target.closest(".dsd-pt-tab-close")) {
    closeTab(tabId);
    return;
  }
  activateTab(tabId);
}
export {
  MODULE_ID,
  VERSION,
  _handleTabClick
};
