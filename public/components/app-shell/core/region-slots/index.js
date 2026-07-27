import { VERSION, MODULE_ID, SLOT_POSITIONS } from "./constants.js";
import { addListener, removeListener } from "./state.js";
import { registerSlot, unregisterSlot } from "./core/registration.js";
import { injectContent, clearSlot, clearRegionSlots, updateSlot } from "./core/content.js";
import { getSlot, getRegionSlots, getSlotContent, hasContent, findSlotsByName } from "./queries/slot-queries.js";
import { inject, createPersistentSlot } from "./convenience/shortcuts.js";
import { getMetrics, healthCheck, info } from "./diagnostics/health.js";
function subscribe(callback) {
  if (typeof callback !== "function") return () => {
  };
  addListener(callback);
  return () => {
    removeListener(callback);
  };
}
var region_slots_default = {
  VERSION,
  MODULE_ID,
  POSITIONS: SLOT_POSITIONS,
  registerSlot,
  unregisterSlot,
  injectContent,
  clearSlot,
  clearRegionSlots,
  updateSlot,
  getSlot,
  getRegionSlots,
  getSlotContent,
  hasContent,
  findSlotsByName,
  inject,
  createPersistentSlot,
  subscribe,
  getMetrics,
  healthCheck,
  info
};
export {
  MODULE_ID,
  SLOT_POSITIONS,
  VERSION,
  clearRegionSlots,
  clearSlot,
  createPersistentSlot,
  region_slots_default as default,
  findSlotsByName,
  getMetrics,
  getRegionSlots,
  getSlot,
  getSlotContent,
  hasContent,
  healthCheck,
  info,
  inject,
  injectContent,
  registerSlot,
  subscribe,
  unregisterSlot,
  updateSlot
};
