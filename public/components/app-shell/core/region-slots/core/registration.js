import { SLOT_POSITIONS } from "../constants.js";
import {
  getSlots,
  setSlot,
  deleteSlot,
  deleteSlotContent,
  incrementMetric
} from "../state.js";
import { generateSlotId, notifyListeners } from "./slot-helpers.js";
import { clearSlot } from "./content.js";
const VERSION = "1.0.0-AAA";
const MODULE_ID = "app-shell.core.region-slots.core.registration";
function registerSlot(regionName, config) {
  config = config || {};
  const slots = getSlots();
  if (!slots[regionName]) {
    slots[regionName] = {};
  }
  const slotId = generateSlotId();
  const slotConfig = {
    id: slotId,
    name: config.name || "default",
    position: config.position || SLOT_POSITIONS.APPEND,
    priority: config.priority || 0,
    persistent: config.persistent === true,
    createdAt: Date.now()
  };
  setSlot(regionName, slotId, slotConfig);
  incrementMetric("slotsRegistered");
  notifyListeners("slot-registered", { region: regionName, slotId, config: slotConfig });
  return slotId;
}
function unregisterSlot(regionName, slotId) {
  const slots = getSlots();
  if (!slots[regionName] || !slots[regionName][slotId]) {
    return false;
  }
  clearSlot(regionName, slotId);
  deleteSlot(regionName, slotId);
  deleteSlotContent(slotId);
  incrementMetric("slotsUnregistered");
  notifyListeners("slot-unregistered", { region: regionName, slotId });
  return true;
}
var registration_default = {
  registerSlot,
  unregisterSlot
};
export {
  MODULE_ID,
  VERSION,
  registration_default as default,
  registerSlot,
  unregisterSlot
};
