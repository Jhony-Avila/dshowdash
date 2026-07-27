import { FOCUSABLE_SELECTOR } from "./constants.js";
import { focusHistory, subscribers, config } from "./state.js";
const VERSION = "7.5.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell.ui.focus-manager.utils";
function getFocusableElements(container) {
  if (!container) return [];
  const elements = container.querySelectorAll(FOCUSABLE_SELECTOR);
  return Array.prototype.filter.call(elements, (el) => el.offsetParent !== null && getComputedStyle(el).visibility !== "hidden");
}
function notifySubscribers(event) {
  for (let i = 0; i < subscribers.length; i++) {
    try {
      subscribers[i](event);
    } catch (e) {
    }
  }
}
function addToHistory(element, context) {
  focusHistory.push({
    element,
    context: context || null,
    timestamp: Date.now()
  });
  while (focusHistory.length > config.historyLimit) {
    focusHistory.shift();
  }
}
export {
  MODULE_ID,
  VERSION,
  addToHistory,
  getFocusableElements,
  notifySubscribers
};
