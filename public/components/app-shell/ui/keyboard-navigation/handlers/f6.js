import { getRegion } from "../../../core/dom-regions/index.js";
import { isEnabled, setCurrentRegionIndex, incrementMetric, notifyListeners } from "../state.js";
import { getVisibleRegions } from "../helpers/regions.js";
import { focusFirstInRegion } from "../helpers/focus.js";
const VERSION = "7.5.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell.ui.keyboard-navigation.handlers.f6";
function handleF6(event, reverse) {
  if (!isEnabled()) return;
  event.preventDefault();
  const visibleRegions = getVisibleRegions();
  if (visibleRegions.length === 0) return;
  let currentIdx = -1;
  const activeElement = document.activeElement;
  for (let i = 0; i < visibleRegions.length; i++) {
    const region = getRegion(visibleRegions[i]);
    if (region && region.contains(activeElement)) {
      currentIdx = i;
      break;
    }
  }
  let nextIdx;
  if (reverse) {
    nextIdx = currentIdx <= 0 ? visibleRegions.length - 1 : currentIdx - 1;
  } else {
    nextIdx = currentIdx >= visibleRegions.length - 1 ? 0 : currentIdx + 1;
  }
  const nextRegion = visibleRegions[nextIdx];
  focusFirstInRegion(nextRegion);
  setCurrentRegionIndex(nextIdx);
  incrementMetric("f6Navigations");
  notifyListeners("region-navigate", {
    from: currentIdx >= 0 ? visibleRegions[currentIdx] : null,
    to: nextRegion,
    reverse
  });
}
export {
  MODULE_ID,
  VERSION,
  handleF6
};
