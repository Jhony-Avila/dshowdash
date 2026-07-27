import { REGION_MAP, CSS_CLASSES } from "./constants.js";
import { _state, incrementMetric, notifySubscribers, getDuration } from "./state.js";
import { getRegion } from "../dom-regions/index.js";
const VERSION = "7.5.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell.core.region-visibility.core";
function isVisible(regionName) {
  const region = getRegion(regionName);
  if (!region) return false;
  return !region.classList.contains(CSS_CLASSES.HIDDEN);
}
function show(regionName, options) {
  options = options || {};
  const region = getRegion(regionName);
  if (!region) {
    incrementMetric("errors");
    return Promise.resolve(false);
  }
  if (isVisible(regionName)) return Promise.resolve(true);
  return new Promise((resolve) => {
    if (options.animate !== false) {
      region.classList.add(CSS_CLASSES.SHOWING);
      region.classList.remove(CSS_CLASSES.HIDDEN);
      setTimeout(() => {
        region.classList.remove(CSS_CLASSES.SHOWING);
        _state.visibility[regionName] = true;
        incrementMetric("shows");
        notifySubscribers("show", { region: regionName });
        resolve(true);
      }, getDuration());
    } else {
      region.classList.remove(CSS_CLASSES.HIDDEN);
      _state.visibility[regionName] = true;
      incrementMetric("shows");
      notifySubscribers("show", { region: regionName });
      resolve(true);
    }
  });
}
function hide(regionName, options) {
  options = options || {};
  const region = getRegion(regionName);
  if (!region) {
    incrementMetric("errors");
    return Promise.resolve(false);
  }
  if (!isVisible(regionName)) return Promise.resolve(true);
  return new Promise((resolve) => {
    if (options.animate !== false) {
      region.classList.add(CSS_CLASSES.HIDING);
      setTimeout(() => {
        region.classList.remove(CSS_CLASSES.HIDING);
        region.classList.add(CSS_CLASSES.HIDDEN);
        _state.visibility[regionName] = false;
        incrementMetric("hides");
        notifySubscribers("hide", { region: regionName });
        resolve(true);
      }, getDuration());
    } else {
      region.classList.add(CSS_CLASSES.HIDDEN);
      _state.visibility[regionName] = false;
      incrementMetric("hides");
      notifySubscribers("hide", { region: regionName });
      resolve(true);
    }
  });
}
function toggle(regionName, options) {
  if (isVisible(regionName)) {
    return hide(regionName, options);
  }
  return show(regionName, options);
}
function setVisibility(visibilityMap, options) {
  const promises = [];
  const keys = Object.keys(visibilityMap);
  for (let i = 0; i < keys.length; i++) {
    const regionName = keys[i];
    const visible = visibilityMap[regionName];
    if (visible) {
      promises.push(show(regionName, options));
    } else {
      promises.push(hide(regionName, options));
    }
  }
  return Promise.all(promises);
}
function enterFullscreen() {
  const regionsToHide = ["header", "sidebar", "nav-rail", "footer", "ticker"];
  for (let i = 0; i < regionsToHide.length; i++) {
    hide(regionsToHide[i], { animate: false });
  }
  _state.isFullscreen = true;
  notifySubscribers("fullscreen-enter", {});
  return true;
}
function exitFullscreen() {
  const regionsToShow = ["header", "sidebar", "nav-rail", "footer"];
  for (let i = 0; i < regionsToShow.length; i++) {
    show(regionsToShow[i], { animate: false });
  }
  _state.isFullscreen = false;
  notifySubscribers("fullscreen-exit", {});
  return true;
}
function toggleFullscreen() {
  if (_state.isFullscreen) {
    return exitFullscreen();
  }
  return enterFullscreen();
}
function isFullscreenMode() {
  return _state.isFullscreen;
}
function getVisibilityState() {
  const state = {};
  const regionNames = Object.keys(REGION_MAP);
  for (let i = 0; i < regionNames.length; i++) {
    state[regionNames[i]] = isVisible(regionNames[i]);
  }
  return state;
}
function resetVisibility() {
  const regionNames = Object.keys(REGION_MAP);
  for (let i = 0; i < regionNames.length; i++) {
    const config = REGION_MAP[regionNames[i]];
    if (config.defaultVisible !== false) {
      show(regionNames[i], { animate: false });
    } else {
      hide(regionNames[i], { animate: false });
    }
  }
  _state.isFullscreen = false;
  return true;
}
export {
  MODULE_ID,
  VERSION,
  enterFullscreen,
  exitFullscreen,
  getVisibilityState,
  hide,
  isFullscreenMode,
  isVisible,
  resetVisibility,
  setVisibility,
  show,
  toggle,
  toggleFullscreen
};
