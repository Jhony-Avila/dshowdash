import { REGION_MAP } from "../dom-regions/index.js";
import { REGION_EVENTS } from "./constants.js";
import { getRegionElement } from "./helpers.js";
import { emit } from "./core.js";
const VERSION = "7.5.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell.core.region-events.dom-listeners";
function onFocusIn(event) {
  const target = event.target;
  const keys = Object.keys(REGION_MAP);
  for (let i = 0; i < keys.length; i++) {
    const regionName = keys[i];
    const region = getRegionElement(regionName);
    if (region && region.contains(target)) {
      emit(regionName, REGION_EVENTS.FOCUS_ENTER, { element: target });
      break;
    }
  }
}
function onFocusOut(event) {
  const target = event.target;
  const relatedTarget = event.relatedTarget;
  const keys = Object.keys(REGION_MAP);
  for (let i = 0; i < keys.length; i++) {
    const regionName = keys[i];
    const region = getRegionElement(regionName);
    if (region && region.contains(target) && !region.contains(relatedTarget)) {
      emit(regionName, REGION_EVENTS.FOCUS_LEAVE, {
        element: target,
        relatedTarget
      });
      break;
    }
  }
}
function onClick(event) {
  const target = event.target;
  const keys = Object.keys(REGION_MAP);
  for (let i = 0; i < keys.length; i++) {
    const regionName = keys[i];
    const region = getRegionElement(regionName);
    if (region && region.contains(target)) {
      emit(regionName, REGION_EVENTS.CLICK, {
        element: target,
        x: event.clientX,
        y: event.clientY
      });
      break;
    }
  }
}
export {
  MODULE_ID,
  VERSION,
  onClick,
  onFocusIn,
  onFocusOut
};
