const VERSION = "1.1.1-LOG-VERBOSITY";
const MODULE_ID = "main.ui.container-main.utils.features-integration.state";
let initialized = { value: false };
let commandPalette = { value: null };
let splitView = { value: null };
let tourManager = { value: null };
let navigationHistory = { value: null };
let zoomManager = { value: null };
let printManager = { value: null };
let bookmarksManager = { value: null };
let exportManager = { value: null };
let accessibilityManager = { value: null };
let panelSearchManager = { value: null };
const metrics = {
  commandsRegistered: 0,
  toursRegistered: 0,
  errors: 0
};
function resetManagers() {
  commandPalette.value = null;
  splitView.value = null;
  tourManager.value = null;
  navigationHistory.value = null;
  zoomManager.value = null;
  printManager.value = null;
  bookmarksManager.value = null;
  exportManager.value = null;
  accessibilityManager.value = null;
  panelSearchManager.value = null;
}
export {
  MODULE_ID,
  VERSION,
  accessibilityManager,
  bookmarksManager,
  commandPalette,
  exportManager,
  initialized,
  metrics,
  navigationHistory,
  panelSearchManager,
  printManager,
  resetManagers,
  splitView,
  tourManager,
  zoomManager
};
