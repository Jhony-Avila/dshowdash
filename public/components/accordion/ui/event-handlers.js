import { ACCORDION_INTENTS } from "/core/runtime/events/catalog/sidebar.events.js";
import { MODULE_ID as VIEW_MODULE_ID } from "./constants.js";
const VERSION = "2.2.0-P2-ENTERPRISE";
const MODULE_ID = "components.accordion.ui.event-handlers";
function createEventHandlers(deps) {
  const { container, eventBus, findItem, metrics } = deps;
  function emitIntent(intent, payload) {
    if (!eventBus?.emit) return;
    eventBus.emit(intent, {
      source: VIEW_MODULE_ID,
      ...payload,
      timestamp: Date.now()
    });
  }
  function handleClick(e) {
    const target = e.target?.closest("[data-action]");
    if (!target) return;
    if (target.classList.contains("uarps-hidden") || target.classList.contains("uarps-disabled")) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    const action = target.dataset.action;
    metrics.clicks++;
    if (action === "toggle-section") {
      e.preventDefault();
      const sectionId = target.dataset.sectionId;
      emitIntent(ACCORDION_INTENTS.TOGGLE_SECTION, { sectionId });
    }
    if (action === "select-item") {
      e.preventDefault();
      const itemId = target.dataset.itemId;
      const itemType = target.dataset.itemType;
      const sectionId = target.dataset.sectionId;
      const item = findItem(itemId);
      emitIntent(ACCORDION_INTENTS.SELECT_ITEM, { itemId, itemType, sectionId, item });
    }
  }
  function handleKeydown(e) {
    const target = e.target?.closest("[data-action]");
    if (!target) return;
    if (target.classList.contains("uarps-hidden") || target.classList.contains("uarps-disabled")) {
      return;
    }
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      target.click();
    }
    if (e.key === "ArrowDown" || e.key === "ArrowUp") {
      e.preventDefault();
      navigateFocus(e.key === "ArrowDown" ? 1 : -1);
    }
  }
  function navigateFocus(direction) {
    const focusableItems = container.querySelectorAll(
      '.dsd-sidebar__group-button:not([disabled]):not(.uarps-hidden):not(.uarps-disabled), .dsd-sidebar__link:not([aria-disabled="true"]):not(.uarps-hidden):not(.uarps-disabled)'
    );
    const currentIndex = Array.from(focusableItems).indexOf(document.activeElement);
    const nextIndex = currentIndex + direction;
    if (nextIndex >= 0 && nextIndex < focusableItems.length) {
      focusableItems[nextIndex].focus();
    }
  }
  function setup(abortController) {
    if (!container || !abortController) return;
    const signal = abortController.signal;
    container.addEventListener("click", handleClick, { signal });
    container.addEventListener("keydown", handleKeydown, { signal });
  }
  return {
    setup,
    handleClick,
    handleKeydown,
    navigateFocus
  };
}
function healthCheck() {
  const checks = {
    factoryAvailable: typeof createEventHandlers === "function"
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return {
    status: passed === total ? "HEALTHY" : "DEGRADED",
    score: passed,
    maxScore: total,
    scoreDisplay: `${passed}/${total}`,
    checks,
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    handlers: ["setup", "handleClick", "handleKeydown", "navigateFocus"],
    healthCheck: healthCheck(),
    timestamp: Date.now()
  };
}
var event_handlers_default = {
  createEventHandlers,
  healthCheck,
  info,
  VERSION,
  MODULE_ID
};
export {
  MODULE_ID,
  VERSION,
  createEventHandlers,
  event_handlers_default as default,
  healthCheck,
  info
};
