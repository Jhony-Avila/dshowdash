import { LIFECYCLE_HOOKS } from "./components/event-hooks.js";
import { MODE } from "./config.js";
import { isStrict, recordViolation } from "/core/runtime/enterprise/strict-mode.js";
const VERSION = "8.4.0-P2-ENTERPRISE";
const MODULE_ID = "container-main-api-builder";
const DI_STRICT_MODULES = [
  "controls",
  "pluginSystem",
  "configPresets",
  "breadcrumb",
  "contextMenu",
  "drag",
  "errorBoundary",
  "keyboard",
  "multiWindow",
  "notificationBadge",
  "performanceMonitor",
  "progressBar",
  "resize",
  "searchBox",
  "snapDock",
  "splitView",
  "statePersistence",
  "toolbar",
  "usageMetrics",
  "zoomControls",
  "toast",
  "debugPanel"
];
const DOM_ONLY_MODULES = ["header", "accessibility", "eventHooks", "skeleton", "statusIndicator", "tabs"];
const HYBRID_MODULES = [];
function _checkWindowEventBus() {
  if (typeof window === "undefined") return false;
  if (window.Core?.windowAdapter?.get) {
    const waEventBus = window.Core.windowAdapter.get("EventBus");
    if (waEventBus) return true;
  }
  if (isStrict()) return false;
  if (window.EventBus) {
    recordViolation("WINDOW_EVENTBUS_CHECK", { module: MODULE_ID });
    return true;
  }
  return false;
}
function buildContainerApi(deps) {
  const { container, containerId, options, state, components, onUnmount, mode, eventBus } = deps;
  function _aggregateComponentHealth() {
    const health = { total: 0, healthy: 0, degraded: 0, notInitialized: 0, unknown: 0, scores: [], details: {} };
    const componentKeys = Object.keys(components).filter((k) => k !== "_diStatus" && k !== "_timing");
    componentKeys.forEach((name) => {
      if (components[name]?.healthCheck) {
        try {
          const check = components[name].healthCheck();
          health.total++;
          health.details[name] = check;
          if (check.status === "HEALTHY") {
            health.healthy++;
            health.scores.push(100);
          } else if (check.status === "DEGRADED") {
            health.degraded++;
            health.scores.push(50);
          } else if (check.status === "NOT_INITIALIZED") {
            health.notInitialized++;
            health.scores.push(0);
          } else {
            health.unknown++;
            health.scores.push(25);
          }
          if (typeof check.score === "number") health.scores.push(check.score);
        } catch (e) {
          health.total++;
          health.unknown++;
          health.scores.push(0);
          health.details[name] = { status: "ERROR", error: e.message };
        }
      }
    });
    health.avgScore = health.scores.length > 0 ? Math.round(health.scores.reduce((a, b) => a + b, 0) / health.scores.length) : 0;
    health.overallStatus = health.degraded > 0 || health.unknown > 0 ? "DEGRADED" : health.notInitialized > 0 ? "PARTIAL" : "HEALTHY";
    return health;
  }
  function _audit() {
    const results = {
      timestamp: Date.now(),
      containerId,
      mode: mode || MODE.STRICT,
      modeLabel: mode === MODE.STRICT ? "STRICT (recommended)" : mode === MODE.HYBRID ? "HYBRID (transitional)" : "LEGACY (deprecated)",
      score: 0,
      maxScore: 100,
      issues: [],
      warnings: [],
      passed: [],
      components: {
        diStrict: { expected: [], found: [], missing: [], withoutInjection: [] },
        hybrid: { expected: [], found: [] },
        domOnly: { expected: [], found: [] },
        unknown: []
      },
      eventBus: { injected: !!eventBus, available: _checkWindowEventBus() },
      health: null,
      timing: null,
      strictMode: isStrict()
    };
    let scoreDeductions = 0;
    const componentKeys = Object.keys(components).filter((k) => k !== "_diStatus" && k !== "_timing");
    DI_STRICT_MODULES.forEach((mod) => {
      results.components.diStrict.expected.push(mod);
      if (components[mod]) {
        results.components.diStrict.found.push(mod);
        const health = components[mod].healthCheck?.();
        if (health && health.hasInjectedEventBus === false) {
          results.components.diStrict.withoutInjection.push(mod);
          results.issues.push(`DI-STRICT module "${mod}" running without EventBus injection`);
          scoreDeductions += 15;
        } else {
          results.passed.push(`DI-STRICT module "${mod}" correctly injected`);
        }
      }
    });
    HYBRID_MODULES.forEach((mod) => {
      results.components.hybrid.expected.push(mod);
      if (components[mod]) {
        results.components.hybrid.found.push(mod);
        if (mode === MODE.STRICT) {
          results.warnings.push(`Hybrid module "${mod}" active in STRICT mode - consider migration`);
          scoreDeductions += 2;
        }
      }
    });
    DOM_ONLY_MODULES.forEach((mod) => {
      results.components.domOnly.expected.push(mod);
      if (components[mod]) {
        results.components.domOnly.found.push(mod);
        results.passed.push(`DOM-only module "${mod}" active (no EventBus needed)`);
      }
    });
    componentKeys.forEach((key) => {
      const isDiStrict = DI_STRICT_MODULES.includes(key);
      const isHybrid = HYBRID_MODULES.includes(key);
      const isDomOnly = DOM_ONLY_MODULES.includes(key);
      if (!isDiStrict && !isHybrid && !isDomOnly) {
        results.components.unknown.push(key);
        results.warnings.push(`Unknown module "${key}" - classify for audit`);
        scoreDeductions += 1;
      }
    });
    if (mode === MODE.STRICT && !eventBus) {
      results.issues.push("STRICT mode without EventBus injection - components may be muted");
      scoreDeductions += 20;
    }
    if (mode === MODE.LEGACY) {
      results.warnings.push("LEGACY mode is deprecated - migrate to STRICT");
      scoreDeductions += 10;
    }
    if (components._diStatus) {
      if (components._diStatus.eventBus > 0) {
        results.passed.push(`EventBus DI injection applied at init (${components._diStatus.eventBus} modules)`);
      } else {
        results.issues.push("EventBus DI injection NOT applied at init");
        scoreDeductions += 15;
      }
    }
    results.health = _aggregateComponentHealth();
    if (results.health.degraded > 0) {
      results.warnings.push(`${results.health.degraded} component(s) in DEGRADED state`);
      scoreDeductions += results.health.degraded * 3;
    }
    if (results.health.notInitialized > 0) {
      results.warnings.push(`${results.health.notInitialized} component(s) NOT_INITIALIZED`);
      scoreDeductions += results.health.notInitialized * 2;
    }
    if (components._timing) {
      results.timing = { ...components._timing };
      const slowComponents = Object.entries(results.timing).filter(([, ms]) => ms > 50);
      if (slowComponents.length > 0) {
        results.warnings.push(`${slowComponents.length} component(s) took >50ms to initialize`);
        slowComponents.forEach(([name, ms]) => {
          results.warnings.push(`  - ${name}: ${ms}ms`);
        });
      }
    }
    results.score = Math.max(0, results.maxScore - scoreDeductions);
    results.grade = results.score >= 90 ? "A" : results.score >= 80 ? "B" : results.score >= 70 ? "C" : results.score >= 60 ? "D" : "F";
    results.summary = {
      totalComponents: componentKeys.length,
      diStrictActive: results.components.diStrict.found.length,
      hybridActive: results.components.hybrid.found.length,
      domOnlyActive: results.components.domOnly.found.length,
      healthScore: results.health.avgScore,
      healthStatus: results.health.overallStatus,
      issueCount: results.issues.length,
      warningCount: results.warnings.length,
      passedCount: results.passed.length
    };
    return results;
  }
  return {
    unmount() {
      if (!state.mounted) return this;
      if (components.eventHooks?.emit) {
        components.eventHooks.emit(LIFECYCLE_HOOKS.BEFORE_UNMOUNT, { container });
      }
      if (onUnmount) onUnmount();
      if (container) container.remove();
      state.mounted = false;
      return this;
    },
    getState() {
      return { ...state };
    },
    isCollapsed() {
      return state.collapsed;
    },
    isFullscreen() {
      return state.fullscreen;
    },
    isMinimized() {
      return state.minimized;
    },
    isLoading() {
      return state.loading;
    },
    isMounted() {
      return state.mounted;
    },
    collapse() {
      if (components.controls) components.controls.collapse();
      return this;
    },
    expand() {
      if (components.controls) components.controls.expand();
      return this;
    },
    toggle() {
      if (components.controls) components.controls.toggle();
      return this;
    },
    fullscreen(enable = true) {
      if (enable) {
        if (components.controls) components.controls.enterFullscreen();
      } else {
        if (components.controls) components.controls.exitFullscreen();
      }
      return this;
    },
    close() {
      if (components.controls) components.controls.close();
      return this;
    },
    setContent(content) {
      const contentEl = container ? container.querySelector(".dsd-container__content") : null;
      if (!contentEl) return this;
      if (typeof content === "string") contentEl.innerHTML = content;
      else if (content instanceof HTMLElement) {
        contentEl.innerHTML = "";
        contentEl.appendChild(content);
      }
      return this;
    },
    getContent() {
      return container ? container.querySelector(".dsd-container__content") : null;
    },
    setTitle(title) {
      if (components.header) components.header.setTitle(title);
      return this;
    },
    setIcon(icon) {
      if (components.header) components.header.setIcon(icon);
      return this;
    },
    showLoading() {
      state.loading = true;
      if (container) container.classList.add("dsd-container--loading");
      if (components.progressBar) {
        const pb = components.progressBar.show();
        pb?.setIndeterminate?.(true);
      }
      if (components.accessibility) components.accessibility.setAriaBusy(true);
      return this;
    },
    hideLoading() {
      state.loading = false;
      if (container) container.classList.remove("dsd-container--loading");
      if (components.progressBar) components.progressBar.hide();
      if (components.accessibility) components.accessibility.setAriaBusy(false);
      return this;
    },
    setProgress(value, variant) {
      if (components.progressBar) {
        const pb = components.progressBar.show();
        pb?.setIndeterminate?.(false);
        pb?.setValue?.(value);
        if (variant) components.progressBar.setVariant(variant);
      }
      return this;
    },
    toast(message, type = "info") {
      return components.toast ? components.toast.show(message, type) : void 0;
    },
    toastSuccess(message) {
      return components.toast ? components.toast.success(message) : void 0;
    },
    toastError(message) {
      return components.toast ? components.toast.error(message) : void 0;
    },
    toastWarning(message) {
      return components.toast ? components.toast.warning(message) : void 0;
    },
    toastInfo(message) {
      return components.toast ? components.toast.info(message) : void 0;
    },
    addTab(tab) {
      if (components.tabs) components.tabs.addTab(tab);
      return this;
    },
    removeTab(tabId) {
      if (components.tabs) components.tabs.removeTab(tabId);
      return this;
    },
    setActiveTab(tabId) {
      if (components.tabs) components.tabs.setActive(tabId);
      return this;
    },
    setBadge(count) {
      if (components.notificationBadge) components.notificationBadge.setCount(count);
      return this;
    },
    clearBadge() {
      if (components.notificationBadge) components.notificationBadge.clear();
      return this;
    },
    setToolbarItems(items) {
      if (components.toolbar) components.toolbar.setItems(items);
      return this;
    },
    addToolbarItem(item, index) {
      if (components.toolbar) components.toolbar.addItem(item, index);
      return this;
    },
    zoomIn() {
      if (components.zoomControls) components.zoomControls.zoomIn();
      return this;
    },
    zoomOut() {
      if (components.zoomControls) components.zoomControls.zoomOut();
      return this;
    },
    setZoom(value) {
      if (components.zoomControls) components.zoomControls.setZoom(value);
      return this;
    },
    resetZoom() {
      if (components.zoomControls) components.zoomControls.reset();
      return this;
    },
    getZoom() {
      return components.zoomControls ? components.zoomControls.getZoom() : 100;
    },
    announce(message, priority) {
      if (components.accessibility) components.accessibility.announce(message, priority);
      return this;
    },
    focusFirst() {
      if (components.accessibility) components.accessibility.focusFirst();
      return this;
    },
    enableFocusTrap() {
      if (components.accessibility) components.accessibility.enableFocusTrap();
      return this;
    },
    disableFocusTrap() {
      if (components.accessibility) components.accessibility.disableFocusTrap();
      return this;
    },
    registerPlugin(plugin) {
      if (components.pluginSystem) components.pluginSystem.register(plugin);
      return this;
    },
    unregisterPlugin(pluginId) {
      if (components.pluginSystem) components.pluginSystem.unregister(pluginId);
      return this;
    },
    getPlugin(pluginId) {
      return components.pluginSystem ? components.pluginSystem.getPlugin(pluginId) : null;
    },
    on(hookName, callback) {
      if (components.eventHooks) components.eventHooks.on(hookName, callback);
      return this;
    },
    off(hookName, callback) {
      if (components.eventHooks) components.eventHooks.off(hookName, callback);
      return this;
    },
    emit(hookName, data) {
      if (components.eventHooks) components.eventHooks.emit(hookName, data);
      return this;
    },
    debug: {
      log(msg, data) {
        if (components.debugPanel) components.debugPanel.log?.(msg, data);
      },
      info(msg, data) {
        if (components.debugPanel) components.debugPanel.info?.(msg, data);
      },
      warn(msg, data) {
        if (components.debugPanel) components.debugPanel.warn?.(msg, data);
      },
      error(msg, data) {
        if (components.debugPanel) components.debugPanel.error?.(msg, data);
      },
      toggle() {
        if (components.debugPanel) components.debugPanel.toggle?.();
      },
      show() {
        if (components.debugPanel) components.debugPanel.show?.();
      },
      hide() {
        if (components.debugPanel) components.debugPanel.hide?.();
      }
    },
    getMetrics() {
      return components.usageMetrics ? components.usageMetrics.getStats() : {};
    },
    getPerformance() {
      return components.performanceMonitor ? components.performanceMonitor.getMetrics() : {};
    },
    getComponentTiming() {
      return components._timing || {};
    },
    getComponent(name) {
      return components[name] || null;
    },
    getElement() {
      return container;
    },
    getId() {
      return containerId;
    },
    getOptions() {
      return { ...options };
    },
    audit() {
      return _audit();
    },
    healthCheck() {
      const aggregatedHealth = _aggregateComponentHealth();
      return {
        status: state.error ? "DEGRADED" : aggregatedHealth.overallStatus,
        version: deps.version || VERSION,
        moduleId: deps.moduleId || MODULE_ID,
        containerId,
        mode: mode || MODE.STRICT,
        mounted: state.mounted,
        state: { ...state },
        componentCount: aggregatedHealth.total,
        healthScore: aggregatedHealth.avgScore,
        components: aggregatedHealth.details,
        summary: { healthy: aggregatedHealth.healthy, degraded: aggregatedHealth.degraded, notInitialized: aggregatedHealth.notInitialized },
        diStrict: true,
        strictMode: isStrict()
      };
    }
  };
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    diStrict: true,
    hasHealthAggregation: true,
    strictMode: isStrict(),
    methods: [
      "unmount",
      "getState",
      "isCollapsed",
      "isFullscreen",
      "isMinimized",
      "isLoading",
      "isMounted",
      "collapse",
      "expand",
      "toggle",
      "fullscreen",
      "close",
      "setContent",
      "getContent",
      "setTitle",
      "setIcon",
      "showLoading",
      "hideLoading",
      "setProgress",
      "toast",
      "toastSuccess",
      "toastError",
      "toastWarning",
      "toastInfo",
      "addTab",
      "removeTab",
      "setActiveTab",
      "setBadge",
      "clearBadge",
      "setToolbarItems",
      "addToolbarItem",
      "zoomIn",
      "zoomOut",
      "setZoom",
      "resetZoom",
      "getZoom",
      "announce",
      "focusFirst",
      "enableFocusTrap",
      "disableFocusTrap",
      "registerPlugin",
      "unregisterPlugin",
      "getPlugin",
      "on",
      "off",
      "emit",
      "getMetrics",
      "getPerformance",
      "getComponentTiming",
      "getComponent",
      "getElement",
      "getId",
      "getOptions",
      "audit",
      "healthCheck"
    ]
  };
}
function healthCheck() {
  return { status: "HEALTHY", version: VERSION, moduleId: MODULE_ID, diStrict: true, hasHealthAggregation: true, strictMode: isStrict() };
}
var api_builder_default = { buildContainerApi, info, healthCheck, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  buildContainerApi,
  api_builder_default as default,
  healthCheck,
  info
};
