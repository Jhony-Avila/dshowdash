import { VERSION, MODULE_ID, SPLIT_ORIENTATIONS, SPLIT_POSITIONS, DEFAULT_CONFIG } from "./constants.js";
import {
  _instance,
  setInstance,
  getConfig,
  setConfig,
  isActive,
  getContainer,
  getPrimaryPanel,
  getSecondaryPanel,
  getCurrentRatio,
  getCollapsedPanel,
  setCurrentRatio,
  setCollapsedPanel,
  _listeners,
  getMetrics
} from "./state.js";
import { _log, _loadState } from "./helpers/index.js";
import { activate, deactivate, toggle } from "./operations/lifecycle.js";
import { setOrientation } from "./operations/orientation.js";
import { setRatio } from "./operations/ratio.js";
import { collapse, expand, toggleCollapse, isCollapsed, setContent } from "./operations/panel.js";
function createSplitViewManager(options = {}) {
  setConfig({ ...DEFAULT_CONFIG, ...options });
  const savedState = _loadState();
  const config = getConfig();
  if (savedState) {
    setConfig({ ...config, orientation: savedState.orientation || config.orientation });
    setCurrentRatio(savedState.ratio || config.ratio);
    setCollapsedPanel(savedState.collapsedPanel || null);
  } else {
    setCurrentRatio(config.ratio);
  }
  _log("debug", "Split View Manager created", { orientation: getConfig().orientation, ratio: getCurrentRatio() });
  return {
    activate,
    deactivate,
    toggle,
    isActive,
    setOrientation,
    getOrientation: () => getConfig().orientation,
    setRatio,
    getRatio: getCurrentRatio,
    collapse,
    expand,
    toggleCollapse,
    isCollapsed,
    getPrimaryPanel,
    getSecondaryPanel,
    setContent,
    subscribe,
    healthCheck,
    info
  };
}
function getSplitViewManager(options = {}) {
  if (!_instance) {
    setInstance(createSplitViewManager(options));
  }
  return _instance;
}
function subscribe(callback) {
  if (typeof callback !== "function") return () => {
  };
  _listeners.push(callback);
  return () => {
    const idx = _listeners.indexOf(callback);
    if (idx >= 0) _listeners.splice(idx, 1);
  };
}
function healthCheck() {
  const metrics = getMetrics();
  const checks = {
    hasContainer: !!getContainer(),
    isActive: isActive(),
    hasPanels: !!getPrimaryPanel() && !!getSecondaryPanel(),
    noErrors: metrics.errors === 0
  };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return {
    status: !isActive() ? "INACTIVE" : passed === total ? "HEALTHY" : "DEGRADED",
    score: `${passed}/${total}`,
    checks,
    metrics,
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now()
  };
}
function info() {
  const config = getConfig();
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    orientations: Object.values(SPLIT_ORIENTATIONS),
    positions: Object.values(SPLIT_POSITIONS),
    config: {
      orientation: config.orientation,
      ratio: getCurrentRatio(),
      minSize: config.minSize,
      resizable: config.resizable,
      collapsible: config.collapsible
    },
    isActive: isActive(),
    collapsedPanel: getCollapsedPanel()
  };
}
export {
  activate,
  collapse,
  createSplitViewManager,
  deactivate,
  expand,
  getSplitViewManager,
  healthCheck,
  info,
  isCollapsed,
  setContent,
  setOrientation,
  setRatio,
  subscribe,
  toggle,
  toggleCollapse
};
