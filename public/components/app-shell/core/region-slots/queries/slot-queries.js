import { SLOT_ID_ATTRIBUTE } from "../constants.js";
import {
  getSlots,
  getSlot as _getSlot,
  getSlotContent as _getSlotContent
} from "../state.js";
import { getRegion } from "../../dom-regions/index.js";
const VERSION = "1.0.0-AAA";
const MODULE_ID = "app-shell.core.region-slots.queries.slot-queries";
function getSlot(regionName, slotId) {
  const slot = _getSlot(regionName, slotId);
  return slot ? Object.assign({}, slot) : null;
}
function getRegionSlots(regionName) {
  const slots = getSlots();
  const regionSlots = slots[regionName];
  if (!regionSlots) return [];
  const result = [];
  const slotIds = Object.keys(regionSlots);
  for (let i = 0; i < slotIds.length; i++) {
    result.push(Object.assign({}, regionSlots[slotIds[i]]));
  }
  return result.sort((a, b) => b.priority - a.priority);
}
function getSlotContent(slotId) {
  return _getSlotContent(slotId);
}
function hasContent(regionName, slotId) {
  const region = getRegion(regionName);
  if (!region) return false;
  return !!region.querySelector(`[${SLOT_ID_ATTRIBUTE}="${slotId}"]`);
}
function findSlotsByName(regionName, slotName) {
  const slots = getSlots();
  const regionSlots = slots[regionName];
  if (!regionSlots) return [];
  const result = [];
  const slotIds = Object.keys(regionSlots);
  for (let i = 0; i < slotIds.length; i++) {
    const slot = regionSlots[slotIds[i]];
    if (slot.name === slotName) {
      result.push(Object.assign({}, slot));
    }
  }
  return result;
}
var slot_queries_default = {
  getSlot,
  getRegionSlots,
  getSlotContent,
  hasContent,
  findSlotsByName
};
export {
  MODULE_ID,
  VERSION,
  slot_queries_default as default,
  findSlotsByName,
  getRegionSlots,
  getSlot,
  getSlotContent,
  hasContent
};
