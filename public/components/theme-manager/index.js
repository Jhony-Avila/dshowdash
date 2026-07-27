import { THEME_EVENTS } from "/core/runtime/events/catalog/theme.events.js";
import { ORCHESTRATOR_EVENTS } from "/core/runtime/events/catalog/orchestrator.events.js";
import { createCorePorts } from "/core/runtime/ports-profiles.js";
import { isStrict, recordViolation } from "/core/runtime/enterprise/strict-mode.js";
import { themeStore as _themeStore } from "./state/store.js";
import { ThemeApplier as _ThemeApplier } from "./core/applier.js";
import { ThemeDetector as _ThemeDetector } from "./core/detector.js";
import { ThemeLifecycle } from "./core/lifecycle.js";
const themeStore = _themeStore;
const ThemeApplier = _ThemeApplier;
const ThemeDetector = _ThemeDetector;
import { trackThemeEvent, getEventLog, getRecentEvents } from "./telemetry/tracker.js";
import { saveThemePreference, loadThemePreference, getSystemTheme, createThemeVariables } from "./utils/helpers.js";
const VERSION = "1.9.0-P2-ENTERPRISE";
const MODULE_ID = "theme-manager";
const hasWindow = typeof window !== "undefined";
const Ports = createCorePorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const _getPort = (name) => Ports.get(name);
const injectPorts = (p) => Ports.inject(p);
const getPorts = () => Ports.snapshot();
let orchestratorCleanups = [];
let globalStateCleanups = [];
const _metrics = { initCount: 0, themeChangeCount: 0, toggleCount: 0, lastThemeChangeAt: null };
const setupGlobalStateIntegration = () => {
  const globalState = _getPort("globalState");
  if (!hasWindow || !globalState) return;
  const unsubscribeTheme = globalState.subscribe((theme) => {
    if (theme && theme !== themeStore.getCurrentTheme()) {
      ThemeApplier.apply(theme);
      trackThemeEvent("theme:global-state:synced", { theme });
    }
  }, "preferences.theme");
  globalStateCleanups.push(unsubscribeTheme);
  const initialState = globalState.getState();
  if (initialState?.preferences?.theme) {
    ThemeApplier.apply(initialState.preferences.theme);
  }
  trackThemeEvent("theme:global-state:connected");
};
const cleanupGlobalStateIntegration = () => {
  globalStateCleanups.forEach((cleanup) => {
    if (typeof cleanup === "function") cleanup();
  });
  globalStateCleanups = [];
};
const setupOrchestratorIntegration = () => {
  const eventBus = _getPort("eventBus");
  if (!hasWindow || !eventBus) return;
  eventBus.on(ORCHESTRATOR_EVENTS.PRESET_APPLIED, (data) => {
    if (data?.theme) {
      ThemeApplier.apply(data.theme);
      trackThemeEvent("theme:orchestrator:preset-applied", { theme: data.theme });
    }
  });
  orchestratorCleanups.push(() => {
    const eb = _getPort("eventBus");
    eb?.off?.(ORCHESTRATOR_EVENTS.PRESET_APPLIED);
  });
  const unsubscribe = themeStore.subscribe(({ action }) => {
    const eb = _getPort("eventBus");
    if (action === "theme-changed") {
      eb?.emit?.(THEME_EVENTS.CHANGED, { theme: themeStore.getCurrentTheme(), timestamp: Date.now() });
    }
  });
  orchestratorCleanups.push(unsubscribe);
  trackThemeEvent("theme:orchestrator:connected");
};
const cleanupOrchestratorIntegration = () => {
  orchestratorCleanups.forEach((cleanup) => {
    if (typeof cleanup === "function") cleanup();
  });
  orchestratorCleanups = [];
};
const ThemeManager = {
  version: VERSION,
  name: MODULE_ID,
  init: (options = {}) => {
    trackThemeEvent("theme:api:init:called");
    _initPorts();
    return ThemeLifecycle.init(options).then((result) => {
      setupGlobalStateIntegration();
      setupOrchestratorIntegration();
      _metrics.initCount++;
      return result;
    });
  },
  shutdown: () => {
    trackThemeEvent("theme:api:shutdown:called");
    cleanupGlobalStateIntegration();
    cleanupOrchestratorIntegration();
    return ThemeLifecycle.shutdown();
  },
  reset: () => {
    trackThemeEvent("theme:api:reset:called");
    return ThemeLifecycle.reset ? ThemeLifecycle.reset() : true;
  },
  setTheme: (theme) => {
    ThemeApplier.apply(theme);
    saveThemePreference(theme);
    const globalState = _getPort("globalState");
    if (hasWindow && globalState?.dispatch && globalState?.actions?.updatePreferences) {
      try {
        globalState.dispatch(globalState.actions.updatePreferences({ theme }));
      } catch (e) {
      }
    }
    trackThemeEvent("theme:set", { theme });
    _metrics.themeChangeCount++;
    _metrics.lastThemeChangeAt = Date.now();
  },
  getTheme: () => themeStore.getCurrentTheme(),
  toggleTheme: () => {
    const current = themeStore.getCurrentTheme();
    const newTheme = current === "dark" ? "light" : "dark";
    ThemeManager.setTheme(newTheme);
    _metrics.toggleCount++;
    return newTheme;
  },
  setLight: () => ThemeManager.setTheme("light"),
  setDark: () => ThemeManager.setTheme("dark"),
  setAuto: () => ThemeManager.setTheme("auto"),
  getSystemTheme: () => ThemeDetector.getSystemTheme(),
  isSystemDark: () => ThemeDetector.isSystemDark(),
  watchSystemTheme: (callback) => ThemeDetector.watch(callback),
  getAvailableThemes: () => themeStore.getAvailableThemes(),
  registerTheme: (name, variables) => themeStore.registerTheme(name, variables),
  getVariable: (name) => ThemeApplier.getVariable(name),
  setVariable: (name, value) => ThemeApplier.setVariable(name, value),
  subscribe: (listener) => themeStore.subscribe(listener),
  status: () => ThemeLifecycle.getStatus(),
  isInitialized: () => ThemeLifecycle.isInitialized(),
  getVersion: () => VERSION,
  injectPorts,
  getPorts,
  getMetrics: () => ({ ..._metrics }),
  resetMetrics: () => {
    for (const k of Object.keys(_metrics)) {
      _metrics[k] = typeof _metrics[k] === "number" ? 0 : null;
    }
  },
  healthCheck: () => {
    const checks = { hasWindow, initialized: ThemeLifecycle.isInitialized(), hasThemeStore: !!themeStore, hasApplier: !!ThemeApplier, hasDetector: !!ThemeDetector, orchestratorConnected: orchestratorCleanups.length > 0, globalStateConnected: globalStateCleanups.length > 0, portsInitialized: Ports.isInitialized() };
    const issues = [];
    let passed = 0;
    for (const [key, value] of Object.entries(checks)) {
      if (value) passed++;
      else issues.push(key);
    }
    const total = Object.keys(checks).length;
    return { status: passed === total ? "HEALTHY" : passed >= 5 ? "DEGRADED" : "UNHEALTHY", score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, issues, currentTheme: themeStore?.getCurrentTheme() || "unknown", metrics: { ..._metrics }, version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), timestamp: Date.now() };
  },
  info: () => ({ name: MODULE_ID, version: VERSION, status: ThemeLifecycle.getStatus(), currentTheme: themeStore?.getCurrentTheme() || null, orchestratorConnected: orchestratorCleanups.length > 0, globalStateConnected: globalStateCleanups.length > 0, metrics: { ..._metrics }, portsInitialized: Ports.isInitialized(), healthCheck: ThemeManager.healthCheck() }),
  utils: { saveThemePreference, loadThemePreference, getSystemTheme, createThemeVariables },
  debug: { getEventLog, getRecentEvents, getStore: () => themeStore.toJSON() }
};
if (hasWindow) {
  const strictMode = isStrict();
  if (!strictMode) {
    window.ThemeManager = ThemeManager;
    trackThemeEvent("theme:global:exposed");
  } else {
    recordViolation("THEME_MANAGER_STRICT_MODE_BLOCK", { module: MODULE_ID, action: "window.ThemeManager exposure blocked" });
  }
  window.__dev = window.__dev || {};
  window.__dev.themeManager = ThemeManager;
}
var theme_manager_default = ThemeManager;
const getVersion = () => VERSION;
export {
  MODULE_ID,
  ThemeApplier,
  ThemeDetector,
  ThemeLifecycle,
  ThemeManager,
  VERSION,
  theme_manager_default as default,
  getPorts,
  getVersion,
  injectPorts,
  themeStore
};
