import { getRegion } from "../../../core/dom-regions/index.js";
import { NAVIGATION_ORDER } from "../constants.js";
const VERSION = "7.5.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell.ui.keyboard-navigation.helpers.regions";
function findCurrentRegionIndex() {
  const activeElement = document.activeElement;
  if (!activeElement) return -1;
  for (let i = 0; i < NAVIGATION_ORDER.length; i++) {
    const region = getRegion(NAVIGATION_ORDER[i]);
    if (region && region.contains(activeElement)) {
      return i;
    }
  }
  return -1;
}
function getVisibleRegions() {
  const visible = [];
  for (let i = 0; i < NAVIGATION_ORDER.length; i++) {
    const regionName = NAVIGATION_ORDER[i];
    const region = getRegion(regionName);
    if (region && !region.classList.contains("dsd-region--hidden")) {
      const isVisible = region.offsetParent !== null || getComputedStyle(region).position === "fixed";
      if (isVisible) {
        visible.push(regionName);
      }
    }
  }
  return visible;
}
function getCurrentRegion() {
  const activeElement = document.activeElement;
  if (!activeElement) return null;
  for (let i = 0; i < NAVIGATION_ORDER.length; i++) {
    const regionName = NAVIGATION_ORDER[i];
    const region = getRegion(regionName);
    if (region && region.contains(activeElement)) {
      return regionName;
    }
  }
  return null;
}
export {
  MODULE_ID,
  VERSION,
  findCurrentRegionIndex,
  getCurrentRegion,
  getVisibleRegions
};
