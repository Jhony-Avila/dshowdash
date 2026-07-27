const VERSION = "7.5.0-P2-ENTERPRISE";
const MODULE_ID = "app-shell.devtools.state-snapshots.collectors";
function _getShell() {
  return typeof window !== "undefined" && window.AppShell ? window.AppShell : null;
}
function collectAppShellState() {
  const shell = _getShell();
  if (!shell) return { error: "AppShell not available" };
  const state = {};
  try {
    state.version = shell.version;
    state.initialized = shell.isInitialized?.() || false;
    state.ready = shell.isReady?.() || false;
    state.mounted = shell.isMounted?.() || false;
    state.phase = shell.getPhase?.() || null;
    if (shell.visibility?.getState) state.visibility = shell.visibility.getState();
    if (shell.resize?.getSizes) state.regionSizes = shell.resize.getSizes();
    if (shell.loading?.getLoadingState) state.loadingState = shell.loading.getLoadingState();
    if (shell.layoutPrefs?.get) state.layoutPrefs = shell.layoutPrefs.get();
    if (shell.layoutPresets?.getCurrent) state.layoutPreset = shell.layoutPresets.getCurrent();
    if (shell.theme?.getTheme) state.theme = shell.theme.getTheme();
    if (shell.theme?.getRegionThemes) state.regionThemes = shell.theme.getRegionThemes();
    if (shell.a11y?.getActivePresets) state.a11yPresets = shell.a11y.getActivePresets();
    if (shell.a11y?.getAllSettings) state.a11ySettings = shell.a11y.getAllSettings();
    if (shell.slots?.info) {
      const slotsInfo = shell.slots.info();
      state.slots = slotsInfo.slotsByRegion || {};
    }
    if (shell.maintenance?.getState) state.maintenance = shell.maintenance.getState();
    if (shell.debugPresets?.getCurrent) state.debugPreset = shell.debugPresets.getCurrent();
    if (shell.shortcuts?.getAll) state.shortcuts = shell.shortcuts.getAll()?.length || 0;
    if (shell.notify?.getAll) state.notifications = shell.notify.getAll()?.length || 0;
  } catch (e) {
    state._collectionError = e.message;
  }
  return state;
}
function collectPerformanceState(config) {
  if (!config.includePerformance) return null;
  const perf = {};
  try {
    const shell = _getShell();
    if (shell?.perf?.getMetrics) {
      perf.metrics = shell.perf.getMetrics();
    }
    if (typeof window !== "undefined" && window.performance) {
      perf.memory = window.performance.memory ? {
        usedJSHeapSize: window.performance.memory.usedJSHeapSize,
        totalJSHeapSize: window.performance.memory.totalJSHeapSize
      } : null;
      perf.timing = {
        navigationStart: window.performance.timing?.navigationStart,
        loadEventEnd: window.performance.timing?.loadEventEnd
      };
    }
  } catch (e) {
    perf._error = e.message;
  }
  return perf;
}
function collectAdapterState(config) {
  if (!config.includeAdapters) return null;
  const shell = _getShell();
  if (!shell) return null;
  const adapters = {};
  try {
    if (shell.responsive?.info) {
      const respInfo = shell.responsive.info();
      adapters.responsive = { breakpoint: respInfo.currentBreakpoint, enabled: respInfo.enabled };
    }
    if (shell.offline?.getState) adapters.offline = shell.offline.getState();
    if (shell.serviceWorker?.getState) adapters.serviceWorker = shell.serviceWorker.getState();
  } catch (e) {
    adapters._error = e.message;
  }
  return adapters;
}
function collectDOMState(config) {
  if (!config.includeDOM) return null;
  const dom = {};
  try {
    const regions = ["header", "nav-rail", "sidebar", "main", "footer"];
    for (let i = 0; i < regions.length; i++) {
      const region = regions[i];
      const el = document.querySelector(`[data-region="${region}"]`);
      if (el) {
        dom[region] = {
          exists: true,
          visible: el.offsetParent !== null,
          classList: Array.from(el.classList),
          childCount: el.children.length
        };
      } else {
        dom[region] = { exists: false };
      }
    }
  } catch (e) {
    dom._error = e.message;
  }
  return dom;
}
export {
  MODULE_ID,
  VERSION,
  collectAdapterState,
  collectAppShellState,
  collectDOMState,
  collectPerformanceState
};
