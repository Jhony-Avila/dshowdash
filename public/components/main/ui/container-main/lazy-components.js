const VERSION = "1.0.0-ADAPTIVE";
const MODULE_ID = "container-main:lazy-components";
const COMPONENT_MAP = {
  // Core components (sempre carregados)
  core: [
    "header",
    "controls",
    "errorBoundary",
    "eventHooks",
    "configPresets"
  ],
  // Componentes sob demanda
  lazy: {
    contextMenu: () => import("./components/context-menu.js"),
    keyboard: () => import("./components/keyboard-handler.js"),
    drag: () => import("./components/drag-handler.js"),
    resize: () => import("./components/resize-handler.js"),
    tabs: () => import("./components/tab-manager.js"),
    breadcrumb: () => import("./components/breadcrumb.js"),
    splitView: () => import("./components/split-view.js"),
    notificationBadge: () => import("./components/notification-badge.js"),
    statePersistence: () => import("./components/state-persistence.js"),
    toolbar: () => import("./components/toolbar.js"),
    searchBox: () => import("./components/search-box.js"),
    progressBar: () => import("./components/progress-bar.js"),
    toast: () => import("./components/toast.js"),
    snapDock: () => import("./components/snap-dock.js"),
    multiWindow: () => import("./components/multi-window.js"),
    zoomControls: () => import("./components/zoom-controls.js"),
    accessibility: () => import("./components/accessibility.js"),
    usageMetrics: () => import("./components/usage-metrics.js"),
    performanceMonitor: () => import("./components/performance-monitor.js"),
    debugPanel: () => import("./components/debug-panel.js"),
    pluginSystem: () => import("./components/plugin-system.js"),
    modal: () => import("./components/modal.js"),
    tooltip: () => import("./components/tooltip.js"),
    dropdown: () => import("./components/dropdown.js"),
    popover: () => import("./components/popover.js"),
    tabsEnhanced: () => import("./components/tabs-enhanced.js"),
    accordion: () => import("./components/accordion.js"),
    slider: () => import("./components/slider.js"),
    badge: () => import("./components/badge.js"),
    avatar: () => import("./components/avatar.js"),
    spinner: () => import("./components/spinner.js"),
    chip: () => import("./components/chip.js"),
    alert: () => import("./components/alert.js"),
    card: () => import("./components/card.js")
  }
};
const _loadedModules = /* @__PURE__ */ new Map();
const _loadingPromises = /* @__PURE__ */ new Map();
let _metrics = {
  totalLoaded: 0,
  loadTimes: {},
  errors: []
};
async function loadComponent(name) {
  if (_loadedModules.has(name)) {
    return _loadedModules.get(name);
  }
  if (_loadingPromises.has(name)) {
    return _loadingPromises.get(name);
  }
  const loader = COMPONENT_MAP.lazy[name];
  if (!loader) {
    throw new Error(`Component "${name}" not found in lazy map`);
  }
  const startTime = performance.now();
  const loadPromise = (async () => {
    try {
      const module = await loader();
      const loadTime = Math.round(performance.now() - startTime);
      _loadedModules.set(name, module);
      _metrics.totalLoaded++;
      _metrics.loadTimes[name] = loadTime;
      return module;
    } catch (error) {
      _metrics.errors.push({ name, error: error.message, timestamp: Date.now() });
      throw error;
    } finally {
      _loadingPromises.delete(name);
    }
  })();
  _loadingPromises.set(name, loadPromise);
  return loadPromise;
}
async function loadComponents(names) {
  const results = {};
  const promises = names.map(async (name) => {
    try {
      results[name] = await loadComponent(name);
    } catch (e) {
      results[name] = null;
    }
  });
  await Promise.all(promises);
  return results;
}
async function preloadFromOptions(options) {
  const toLoad = [];
  if (options.contextMenuEnabled) toLoad.push("contextMenu");
  if (options.keyboardEnabled) toLoad.push("keyboard");
  if (options.draggable) toLoad.push("drag");
  if (options.resizable) toLoad.push("resize");
  if (options.tabsEnabled) toLoad.push("tabs");
  if (options.breadcrumbEnabled) toLoad.push("breadcrumb");
  if (options.splitViewEnabled) toLoad.push("splitView");
  if (options.notificationBadgeEnabled) toLoad.push("notificationBadge");
  if (options.statePersistenceEnabled) toLoad.push("statePersistence");
  if (options.toolbarEnabled) toLoad.push("toolbar");
  if (options.searchEnabled) toLoad.push("searchBox");
  if (options.progressEnabled) toLoad.push("progressBar");
  if (options.toastEnabled) toLoad.push("toast");
  if (options.snapEnabled) toLoad.push("snapDock");
  if (options.multiWindowEnabled) toLoad.push("multiWindow");
  if (options.zoomEnabled) toLoad.push("zoomControls");
  if (options.accessibilityEnabled) toLoad.push("accessibility");
  if (options.metricsEnabled) toLoad.push("usageMetrics");
  if (options.performanceEnabled) toLoad.push("performanceMonitor");
  if (options.debugEnabled) toLoad.push("debugPanel");
  if (options.pluginSystemEnabled) toLoad.push("pluginSystem");
  if (toLoad.length > 0) {
    return loadComponents(toLoad);
  }
  return {};
}
function isLoaded(name) {
  return _loadedModules.has(name);
}
function getLoaded(name) {
  return _loadedModules.get(name) || null;
}
function getLoadedList() {
  return Array.from(_loadedModules.keys());
}
function getMetrics() {
  return { ..._metrics };
}
function clearCache() {
  _loadedModules.clear();
  _loadingPromises.clear();
  _metrics = { totalLoaded: 0, loadTimes: {}, errors: [] };
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    coreComponents: COMPONENT_MAP.core.length,
    lazyComponents: Object.keys(COMPONENT_MAP.lazy).length,
    loadedCount: _loadedModules.size
  };
}
function healthCheck() {
  return {
    status: "HEALTHY",
    version: VERSION,
    moduleId: MODULE_ID,
    metrics: getMetrics(),
    loadedComponents: getLoadedList()
  };
}
var lazy_components_default = {
  VERSION,
  MODULE_ID,
  loadComponent,
  loadComponents,
  preloadFromOptions,
  isLoaded,
  getLoaded,
  getLoadedList,
  getMetrics,
  clearCache,
  info,
  healthCheck
};
export {
  MODULE_ID,
  VERSION,
  clearCache,
  lazy_components_default as default,
  getLoaded,
  getLoadedList,
  getMetrics,
  healthCheck,
  info,
  isLoaded,
  loadComponent,
  loadComponents,
  preloadFromOptions
};
