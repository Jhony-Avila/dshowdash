import { REGION_EVENTS } from "../../region-events/constants.js";
import { getRegion } from "../../dom-regions/index.js";
import { slots, incrementMetric, notifySubscribers } from "../state.js";
import { SLOT_POSITIONS } from "../constants.js";
const VERSION = "7.5.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell.core.region-slots.core.content";
function injectContent(regionName, slotId, content, options) {
  options = options || {};
  const position = options.position || SLOT_POSITIONS.APPEND;
  const priority = options.priority || 0;
  const region = getRegion(regionName);
  if (!region) {
    incrementMetric("errors");
    return { ok: false, error: `Region not found: ${regionName}` };
  }
  let slotElement = region.querySelector(`[data-slot-id="${slotId}"]`);
  if (!slotElement) {
    slotElement = document.createElement("div");
    slotElement.setAttribute("data-slot-id", slotId);
    slotElement.setAttribute("data-slot-priority", priority);
    slotElement.className = "region-slot";
  }
  if (typeof content === "string") {
    slotElement.innerHTML = content;
  } else if (content instanceof HTMLElement) {
    slotElement.innerHTML = "";
    slotElement.appendChild(content);
  }
  if (!slotElement.parentNode) {
    const existingSlots = region.querySelectorAll("[data-slot-id]");
    let inserted = false;
    for (let i = 0; i < existingSlots.length; i++) {
      const existingPriority = parseInt(existingSlots[i].getAttribute("data-slot-priority") || "0", 10);
      if (priority > existingPriority) {
        region.insertBefore(slotElement, existingSlots[i]);
        inserted = true;
        break;
      }
    }
    if (!inserted) {
      switch (position) {
        case SLOT_POSITIONS.PREPEND:
          region.insertBefore(slotElement, region.firstChild);
          break;
        case SLOT_POSITIONS.BEFORE:
          if (options.reference) {
            const ref = region.querySelector(options.reference);
            if (ref) region.insertBefore(slotElement, ref);
            else region.appendChild(slotElement);
          } else {
            region.appendChild(slotElement);
          }
          break;
        case SLOT_POSITIONS.AFTER:
          if (options.reference) {
            const ref = region.querySelector(options.reference);
            if (ref && ref.nextSibling) region.insertBefore(slotElement, ref.nextSibling);
            else region.appendChild(slotElement);
          } else {
            region.appendChild(slotElement);
          }
          break;
        case SLOT_POSITIONS.REPLACE:
          region.innerHTML = "";
          region.appendChild(slotElement);
          break;
        default:
          region.appendChild(slotElement);
      }
    }
  }
  if (!slots.has(regionName)) {
    slots.set(regionName, /* @__PURE__ */ new Map());
  }
  slots.get(regionName).set(slotId, {
    element: slotElement,
    priority,
    position,
    persistent: options.persistent || false
  });
  incrementMetric("contentInjections");
  notifySubscribers(REGION_EVENTS.CONTENT_UPDATED, { region: regionName, slot: slotId });
  return { ok: true, element: slotElement };
}
function clearSlot(regionName, slotId) {
  const regionSlots = slots.get(regionName);
  if (!regionSlots) return false;
  const slotInfo = regionSlots.get(slotId);
  if (!slotInfo) return false;
  if (slotInfo.element && slotInfo.element.parentNode) {
    slotInfo.element.parentNode.removeChild(slotInfo.element);
  }
  regionSlots.delete(slotId);
  incrementMetric("contentClears");
  notifySubscribers(REGION_EVENTS.CONTENT_CLEARED, { region: regionName, slot: slotId });
  return true;
}
function clearRegionSlots(regionName) {
  const regionSlots = slots.get(regionName);
  if (!regionSlots) return 0;
  let cleared = 0;
  regionSlots.forEach((slotInfo, slotId) => {
    if (!slotInfo.persistent) {
      clearSlot(regionName, slotId);
      cleared++;
    }
  });
  return cleared;
}
function updateSlot(regionName, slotId, content) {
  const regionSlots = slots.get(regionName);
  if (!regionSlots) return false;
  const slotInfo = regionSlots.get(slotId);
  if (!slotInfo || !slotInfo.element) return false;
  if (typeof content === "string") {
    slotInfo.element.innerHTML = content;
  } else if (content instanceof HTMLElement) {
    slotInfo.element.innerHTML = "";
    slotInfo.element.appendChild(content);
  }
  notifySubscribers(REGION_EVENTS.CONTENT_UPDATED, { region: regionName, slot: slotId });
  return true;
}
export {
  MODULE_ID,
  VERSION,
  clearRegionSlots,
  clearSlot,
  injectContent,
  updateSlot
};
