import { focusHistory } from "./state.js";
import { focusElement } from "./core.js";
const VERSION = "7.5.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell.ui.focus-manager.history";
function getHistory(limit) {
  limit = limit || 10;
  return focusHistory.slice(-limit).map((entry) => ({
    tagName: entry.element?.tagName,
    id: entry.element?.id,
    context: entry.context,
    timestamp: entry.timestamp
  }));
}
function goBack() {
  if (focusHistory.length < 2) {
    return { ok: false, error: "No previous focus in history" };
  }
  focusHistory.pop();
  const previous = focusHistory[focusHistory.length - 1];
  if (previous && previous.element && document.contains(previous.element)) {
    return focusElement(previous.element, { context: "history-back" });
  }
  return { ok: false, error: "Previous element not in DOM" };
}
function clearHistory() {
  focusHistory.length = 0;
}
export {
  MODULE_ID,
  VERSION,
  clearHistory,
  getHistory,
  goBack
};
