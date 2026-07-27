import { SLOT_ATTRIBUTE, SLOT_ID_ATTRIBUTE, SLOT_PRIORITY_ATTRIBUTE } from "../constants.js";
import { getListeners, incrementMetric } from "../state.js";
const VERSION = "7.5.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell.core.region-slots.core.slot-helpers";
function notifyListeners(event, data) {
  const listeners = getListeners();
  for (let i = 0; i < listeners.length; i++) {
    try {
      listeners[i]({ type: event, data, timestamp: Date.now() });
    } catch (e) {
      incrementMetric("errors");
    }
  }
}
function generateSlotId() {
  return `slot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
function createSlotElement(slotId, content, config) {
  const element = document.createElement("div");
  element.setAttribute(SLOT_ATTRIBUTE, config.name || "default");
  element.setAttribute(SLOT_ID_ATTRIBUTE, slotId);
  element.setAttribute(SLOT_PRIORITY_ATTRIBUTE, String(config.priority || 0));
  element.className = `dsd-slot dsd-slot--${config.name || "default"}`;
  if (typeof content === "string") {
    element.innerHTML = content;
  } else if (content instanceof HTMLElement) {
    element.appendChild(content);
  } else if (content && typeof content.render === "function") {
    const rendered = content.render();
    if (typeof rendered === "string") {
      element.innerHTML = rendered;
    } else if (rendered instanceof HTMLElement) {
      element.appendChild(rendered);
    }
  }
  return element;
}
function insertByPriority(container, newElement, priority) {
  const slots = container.querySelectorAll(`[${SLOT_ATTRIBUTE}]`);
  let inserted = false;
  for (let i = 0; i < slots.length; i++) {
    const existingPriority = parseInt(slots[i].getAttribute(SLOT_PRIORITY_ATTRIBUTE) || "0", 10);
    if (priority > existingPriority) {
      container.insertBefore(newElement, slots[i]);
      inserted = true;
      break;
    }
  }
  if (!inserted) {
    container.appendChild(newElement);
  }
}
var slot_helpers_default = {
  notifyListeners,
  generateSlotId,
  createSlotElement,
  insertByPriority
};
export {
  MODULE_ID,
  VERSION,
  createSlotElement,
  slot_helpers_default as default,
  generateSlotId,
  insertByPriority,
  notifyListeners
};
