const VERSION = "15.2.0-MODULAR";
const MODULE_ID = "main.ui.container-main.utils.navigation-history.navigation.queries";
function canGoBack(state) {
  return state.currentIndex > 0;
}
function canGoForward(state) {
  return state.currentIndex < state.history.length - 1;
}
function getCurrent(state) {
  return state.currentIndex >= 0 ? { ...state.history[state.currentIndex] } : null;
}
function getCurrentIndex(state) {
  return state.currentIndex;
}
function getHistory(state) {
  return state.history.map((h) => ({ ...h }));
}
function getHistorySize(state) {
  return state.history.length;
}
function getEntry(state, index) {
  return state.history[index] ? { ...state.history[index] } : null;
}
function getBackStack(state) {
  return state.history.slice(0, state.currentIndex).map((h) => ({ ...h }));
}
function getForwardStack(state) {
  return state.history.slice(state.currentIndex + 1).map((h) => ({ ...h }));
}
function findByPanelId(state, panelId) {
  return state.history.map((h, index) => ({ ...h, index })).filter((h) => h.panelId === panelId);
}
function getLastVisited(state, panelId) {
  for (let i = state.history.length - 1; i >= 0; i--) {
    if (state.history[i].panelId === panelId) {
      return { ...state.history[i], index: i };
    }
  }
  return null;
}
function clearForward(state, notifyListeners, saveHistory) {
  if (state.currentIndex < state.history.length - 1) {
    state.history = state.history.slice(0, state.currentIndex + 1);
    saveHistory();
    notifyListeners("clearForward", { index: state.currentIndex });
  }
}
function clear(state, notifyListeners, saveHistory, logger) {
  state.history = [];
  state.currentIndex = -1;
  saveHistory();
  notifyListeners("clear", {});
  logger.debug("History cleared");
}
export {
  MODULE_ID,
  VERSION,
  canGoBack,
  canGoForward,
  clear,
  clearForward,
  findByPanelId,
  getBackStack,
  getCurrent,
  getCurrentIndex,
  getEntry,
  getForwardStack,
  getHistory,
  getHistorySize,
  getLastVisited
};
