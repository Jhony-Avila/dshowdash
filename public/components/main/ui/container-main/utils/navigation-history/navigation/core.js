import { NAVIGATION_TYPES } from "../constants.js";
import { createEntry } from "../helpers/entry.js";
import { updateBrowserHistory } from "../browser/integration.js";
const VERSION = "15.2.0-MODULAR";
const MODULE_ID = "main.ui.container-main.utils.navigation-history.navigation.core";
function push(state, config, panelId, entryState = {}, title = "", notifyListeners, saveHistory, logger) {
  if (!panelId) {
    logger.warn("Cannot push without panelId");
    return null;
  }
  if (state.currentIndex < state.history.length - 1) {
    state.history = state.history.slice(0, state.currentIndex + 1);
  }
  const entry = createEntry(panelId, entryState, title, config);
  state.history.push(entry);
  state.currentIndex = state.history.length - 1;
  if (state.history.length > config.maxHistorySize) {
    const removeCount = state.history.length - config.maxHistorySize;
    state.history = state.history.slice(removeCount);
    state.currentIndex -= removeCount;
  }
  updateBrowserHistory(entry, NAVIGATION_TYPES.PUSH, state.browserHistoryEnabled, state.isNavigating);
  saveHistory();
  notifyListeners("push", { entry, index: state.currentIndex });
  config.onNavigate?.(entry, NAVIGATION_TYPES.PUSH);
  if (config.debug) logger.debug("Push:", entry.panelId, { index: state.currentIndex });
  return entry;
}
function replace(state, config, panelId, entryState = {}, title = "", notifyListeners, saveHistory, logger) {
  if (!panelId) {
    logger.warn("Cannot replace without panelId");
    return null;
  }
  const entry = createEntry(panelId, entryState, title, config);
  if (state.currentIndex >= 0) {
    state.history[state.currentIndex] = entry;
  } else {
    state.history.push(entry);
    state.currentIndex = 0;
  }
  updateBrowserHistory(entry, NAVIGATION_TYPES.REPLACE, state.browserHistoryEnabled, state.isNavigating);
  saveHistory();
  notifyListeners("replace", { entry, index: state.currentIndex });
  config.onNavigate?.(entry, NAVIGATION_TYPES.REPLACE);
  if (config.debug) logger.debug("Replace:", entry.panelId);
  return entry;
}
function back(state, config, notifyListeners, saveHistory, logger) {
  if (state.currentIndex <= 0) {
    logger.debug("Cannot go back - at beginning");
    return null;
  }
  state.currentIndex--;
  const entry = state.history[state.currentIndex];
  if (state.browserHistoryEnabled && !state.isNavigating) {
    state.isNavigating = true;
    window.history.back();
    setTimeout(() => {
      state.isNavigating = false;
    }, 100);
  }
  saveHistory();
  notifyListeners("back", { entry, index: state.currentIndex });
  config.onNavigate?.(entry, NAVIGATION_TYPES.POP);
  if (config.debug) logger.debug("Back to:", entry.panelId, { index: state.currentIndex });
  return entry;
}
function forward(state, config, notifyListeners, saveHistory, logger) {
  if (state.currentIndex >= state.history.length - 1) {
    logger.debug("Cannot go forward - at end");
    return null;
  }
  state.currentIndex++;
  const entry = state.history[state.currentIndex];
  if (state.browserHistoryEnabled && !state.isNavigating) {
    state.isNavigating = true;
    window.history.forward();
    setTimeout(() => {
      state.isNavigating = false;
    }, 100);
  }
  saveHistory();
  notifyListeners("forward", { entry, index: state.currentIndex });
  config.onNavigate?.(entry, NAVIGATION_TYPES.POP);
  if (config.debug) logger.debug("Forward to:", entry.panelId, { index: state.currentIndex });
  return entry;
}
function go(state, config, delta, notifyListeners, saveHistory, logger) {
  const newIndex = state.currentIndex + delta;
  if (newIndex < 0 || newIndex >= state.history.length) {
    logger.debug("Cannot go to index:", newIndex);
    return null;
  }
  state.currentIndex = newIndex;
  const entry = state.history[state.currentIndex];
  if (state.browserHistoryEnabled && !state.isNavigating) {
    state.isNavigating = true;
    window.history.go(delta);
    setTimeout(() => {
      state.isNavigating = false;
    }, 100);
  }
  saveHistory();
  notifyListeners("go", { entry, index: state.currentIndex, delta });
  config.onNavigate?.(entry, NAVIGATION_TYPES.GO);
  if (config.debug) logger.debug("Go to:", entry.panelId, { delta, index: state.currentIndex });
  return entry;
}
export {
  MODULE_ID,
  VERSION,
  back,
  forward,
  go,
  push,
  replace
};
