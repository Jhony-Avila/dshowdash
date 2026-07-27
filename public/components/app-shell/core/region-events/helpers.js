import { getRegion } from "../dom-regions/index.js";
import { MODULE_ID } from "./constants.js";
import { eventHistory, historyLimit } from "./state.js";
const VERSION = "1.0.1-AAA";
function addToHistory(event) {
  eventHistory.push(event);
  if (eventHistory.length > historyLimit.value) {
    eventHistory.shift();
  }
}
function createEvent(regionName, eventType, data) {
  return {
    type: eventType,
    region: regionName,
    data: data || null,
    timestamp: Date.now(),
    id: `${MODULE_ID}:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`
  };
}
function getRegionElement(regionName) {
  return getRegion(regionName);
}
export {
  VERSION,
  addToHistory,
  createEvent,
  getRegionElement
};
