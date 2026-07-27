import { getRegion } from "../../core/dom-regions/index.js";
import {
  LOADING_CLASS,
  SKELETON_CLASS,
  createOverlay,
  removeOverlay
} from "./dom-helpers.js";
const VERSION = "1.1.0-MODULAR";
const MODULE_ID = "app-shell.ui.region-loading.core";
function isLoading(regionName, state) {
  const s = state.loadingState[regionName];
  return s ? s.loading : false;
}
function setLoading(regionName, loading, options, state) {
  options = options || {};
  const useSkeleton = options.skeleton === true;
  const showOverlay = options.overlay !== false;
  const showSpinner = options.spinner !== false;
  const region = getRegion(regionName);
  if (!region) {
    state.metrics.errors++;
    return false;
  }
  let s = state.loadingState[regionName];
  if (!s) {
    s = { loading: false, skeleton: false, startedAt: null };
    state.loadingState[regionName] = s;
  }
  if (loading) {
    region.classList.add(LOADING_CLASS);
    region.setAttribute("aria-busy", "true");
    if (useSkeleton) {
      region.classList.add(SKELETON_CLASS);
      s.skeleton = true;
    } else if (showOverlay) {
      removeOverlay(region);
      region.appendChild(createOverlay(showSpinner));
    }
    s.loading = true;
    s.startedAt = Date.now();
    state.metrics.loadingStarts++;
    state.notify("loading-start", { region: regionName, skeleton: useSkeleton });
  } else {
    region.classList.remove(LOADING_CLASS, SKELETON_CLASS);
    region.setAttribute("aria-busy", "false");
    removeOverlay(region);
    const duration = s.startedAt ? Date.now() - s.startedAt : 0;
    s.loading = false;
    s.skeleton = false;
    s.startedAt = null;
    state.metrics.loadingEnds++;
    state.notify("loading-end", { region: regionName, duration });
  }
  return true;
}
function startLoading(regionName, options, state) {
  return setLoading(regionName, true, options, state);
}
function endLoading(regionName, state) {
  return setLoading(regionName, false, null, state);
}
function setSkeleton(regionName, loading, state) {
  return setLoading(regionName, loading, { skeleton: true, overlay: false }, state);
}
function setMultipleLoading(loadingMap, options, state) {
  const results = {};
  const keys = Object.keys(loadingMap);
  for (let i = 0; i < keys.length; i++) {
    results[keys[i]] = setLoading(keys[i], loadingMap[keys[i]], options, state);
  }
  return results;
}
function endAllLoading(state) {
  const keys = Object.keys(state.loadingState);
  for (let i = 0; i < keys.length; i++) {
    if (state.loadingState[keys[i]].loading) {
      setLoading(keys[i], false, null, state);
    }
  }
  state.notify("all-loading-ended", null);
  return true;
}
function getLoadingState(state) {
  const result = {};
  const keys = Object.keys(state.loadingState);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const s = state.loadingState[key];
    result[key] = {
      loading: s.loading,
      skeleton: s.skeleton,
      duration: s.startedAt ? Date.now() - s.startedAt : null
    };
  }
  return result;
}
function getLoadingRegions(state) {
  const loading = [];
  const keys = Object.keys(state.loadingState);
  for (let i = 0; i < keys.length; i++) {
    if (state.loadingState[keys[i]].loading) {
      loading.push(keys[i]);
    }
  }
  return loading;
}
function isAnyLoading(state) {
  const keys = Object.keys(state.loadingState);
  for (let i = 0; i < keys.length; i++) {
    if (state.loadingState[keys[i]].loading) return true;
  }
  return false;
}
export {
  MODULE_ID,
  VERSION,
  endAllLoading,
  endLoading,
  getLoadingRegions,
  getLoadingState,
  isAnyLoading,
  isLoading,
  setLoading,
  setMultipleLoading,
  setSkeleton,
  startLoading
};
