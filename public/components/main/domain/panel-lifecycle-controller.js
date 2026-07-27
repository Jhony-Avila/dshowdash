const VERSION = "9.3.0-TITLE-SYNC";
const MODULE_ID = "main-panel-lifecycle";
const POLICY = { EPHEMERAL: "ephemeral", PERSISTENT: "persistent" };
const LAYOUT_MODE = { INHERIT: "inherit", OVERRIDE: "override" };
const DOCK_SLOTS = { PRIMARY: "primary", SECONDARY: "secondary", TERTIARY: "tertiary" };
const PANEL_STATE = { IDLE: "idle", LOADING: "loading", MOUNTED: "mounted", ERROR: "error", RECOVERING: "recovering", CANCELLED: "cancelled" };
const LOTTIE_CDN = "https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.12.2/lottie.min.js";
const LOTTIE_ANIM_PATH = "/assets/animacoes/Loading_Cube.json";
const LOTTIE_CONTAINER_CLASS = "dsd-panel-lottie-loading";
class NavigationCancelledError extends Error {
  constructor(panelId, phase) {
    super(`Navigation cancelled during ${phase} for panel: ${panelId}`);
    this.name = "NavigationCancelledError";
    this.panelId = panelId;
    this.phase = phase;
  }
}
function _ensureLottieLib() {
  if (typeof lottie !== "undefined") return Promise.resolve(true);
  return new Promise(function(resolve) {
    var existing = document.querySelector('script[src*="lottie"]');
    if (existing) {
      existing.addEventListener("load", function() {
        resolve(true);
      });
      if (typeof lottie !== "undefined") resolve(true);
      return;
    }
    var script = document.createElement("script");
    script.src = LOTTIE_CDN;
    script.onload = function() {
      resolve(true);
    };
    script.onerror = function() {
      resolve(false);
    };
    document.head.appendChild(script);
  });
}
function _injectLottieStyles() {
  if (document.getElementById("dsd-lottie-loading-styles")) return;
  var style = document.createElement("style");
  style.id = "dsd-lottie-loading-styles";
  style.textContent = [
    "." + LOTTIE_CONTAINER_CLASS + " {",
    "  display: flex;",
    "  align-items: center;",
    "  justify-content: center;",
    "  width: 100%;",
    "  height: 100%;",
    "  min-height: 300px;",
    "  position: absolute;",
    "  top: 0;",
    "  left: 0;",
    "  right: 0;",
    "  bottom: 0;",
    "  z-index: 100;",
    "  background: var(--dsd-bg-primary, rgba(10, 12, 20, 0.95));",
    "  transition: opacity 0.3s ease;",
    "}",
    "." + LOTTIE_CONTAINER_CLASS + "__animation {",
    "  width: 120px;",
    "  height: 120px;",
    "}",
    "." + LOTTIE_CONTAINER_CLASS + "--fade-out {",
    "  opacity: 0;",
    "  pointer-events: none;",
    "}"
  ].join("\n");
  document.head.appendChild(style);
}
function _showLottieLoading(contentEl) {
  if (!contentEl) return;
  var pos = getComputedStyle(contentEl).position;
  if (pos === "static" || pos === "") contentEl.style.position = "relative";
  contentEl.innerHTML = "";
  _injectLottieStyles();
  var wrapper = document.createElement("div");
  wrapper.className = LOTTIE_CONTAINER_CLASS;
  var animEl = document.createElement("div");
  animEl.className = LOTTIE_CONTAINER_CLASS + "__animation";
  wrapper.appendChild(animEl);
  contentEl.appendChild(wrapper);
  _ensureLottieLib().then(function(loaded) {
    if (!loaded || typeof lottie === "undefined") return;
    if (!wrapper.parentNode) return;
    try {
      lottie.loadAnimation({
        container: animEl,
        renderer: "svg",
        loop: true,
        autoplay: true,
        path: LOTTIE_ANIM_PATH
      });
    } catch (e) {
    }
  });
}
function _hideLottieLoading(contentEl) {
  if (!contentEl) return;
  var wrapper = contentEl.querySelector("." + LOTTIE_CONTAINER_CLASS);
  if (!wrapper) return;
  wrapper.classList.add(LOTTIE_CONTAINER_CLASS + "--fade-out");
  setTimeout(function() {
    if (wrapper.parentNode) wrapper.parentNode.removeChild(wrapper);
  }, 320);
}
function _resolvePanelTitle(panelId, config) {
  if (config && config.title) return config.title;
  try {
    const activeNavItem = document.querySelector(
      `[data-panel-id="${panelId}"], [data-nav-panel="${panelId}"]`
    );
    if (activeNavItem) {
      const displayTitle = activeNavItem.getAttribute("data-display-title");
      if (displayTitle) return displayTitle;
      const label = activeNavItem.getAttribute("data-label") || activeNavItem.getAttribute("aria-label") || activeNavItem.querySelector(".nav-label, .sidebar-label, .nav-rail__label")?.textContent?.trim();
      if (label) return label;
    }
  } catch (e) {
  }
  return panelId.replace(/^panel-/, "").replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
class PanelLifecycleController {
  constructor(panelPort, domAdapter, containerPort, telemetry, orchestrator = null, timerPort = null) {
    this._panelPort = panelPort;
    this._domAdapter = domAdapter;
    this._containerPort = containerPort;
    this._telemetry = telemetry;
    this._orchestrator = orchestrator;
    this._timerPort = timerPort;
    this._currentPanel = null;
    this._currentPanelId = null;
    this._currentContainerId = null;
    this._panelInstances = /* @__PURE__ */ new Map();
    this._panelStates = /* @__PURE__ */ new Map();
    this._panelErrors = /* @__PURE__ */ new Map();
    this._maxRetries = 3;
    this._retryDelayMs = 1e3;
    this._metrics = {
      loads: 0,
      loadSuccesses: 0,
      loadFailures: 0,
      loadsCancelled: 0,
      mounts: 0,
      mountSuccesses: 0,
      mountFailures: 0,
      mountsCancelled: 0,
      unmounts: 0,
      hydrations: 0,
      retries: 0,
      retrySuccesses: 0,
      totalLoadTime: 0,
      totalMountTime: 0,
      avgLoadTime: 0,
      avgMountTime: 0
    };
    this._panelTimings = /* @__PURE__ */ new Map();
    this._navItemsChangedHandler = (e) => {
      try {
        const detail = e.detail || {};
        if (detail.action === "display-title-edit" && detail.newDisplayTitle !== void 0) {
          const currentPanelId = this._currentPanelId;
          if (!currentPanelId) return;
          const newTitle = detail.newDisplayTitle || null;
          if (newTitle) {
            const primary = this._containerPort?.getPrimary?.();
            if (primary && typeof primary.setTitle === "function") {
              primary.setTitle(newTitle);
            } else {
              const titleEl = document.querySelector(".dsd-container__title");
              if (titleEl) titleEl.textContent = newTitle;
            }
            const navEl = document.querySelector(`[data-panel-id="${currentPanelId}"], [data-nav-panel="${currentPanelId}"]`);
            if (navEl) navEl.setAttribute("data-display-title", newTitle);
          }
        }
      } catch (_e) {
      }
    };
    window.addEventListener("navigation:items:changed", this._navItemsChangedHandler);
  }
  _delay(ms) {
    if (this._timerPort?.delay) return this._timerPort.delay(ms);
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
  _getPanelState(panelId) {
    return this._panelStates.get(panelId) || PANEL_STATE.IDLE;
  }
  _setPanelState(panelId, state, error = null) {
    const previousState = this._getPanelState(panelId);
    this._panelStates.set(panelId, state);
    if (error) {
      const errorRecord = { message: error?.message || String(error), stack: error?.stack?.substring(0, 500), timestamp: Date.now(), retryCount: (this._panelErrors.get(panelId)?.retryCount || 0) + (state === PANEL_STATE.RECOVERING ? 1 : 0) };
      this._panelErrors.set(panelId, errorRecord);
    } else if (state === PANEL_STATE.MOUNTED) {
      this._panelErrors.delete(panelId);
    }
    this._telemetry?.track?.("panel:state-change", { panelId, previousState, newState: state, hasError: !!error });
  }
  _recordTiming(panelId, phase, duration) {
    if (!this._panelTimings.has(panelId)) this._panelTimings.set(panelId, { loads: [], mounts: [] });
    const timings = this._panelTimings.get(panelId);
    timings[phase].push(duration);
    if (timings[phase].length > 10) timings[phase].shift();
  }
  _checkAborted(signal, panelId, phase) {
    if (signal?.aborted) {
      this._setPanelState(panelId, PANEL_STATE.CANCELLED);
      throw new NavigationCancelledError(panelId, phase);
    }
  }
  _getPrimaryContentEl() {
    if (this._containerPort?.getPrimary) {
      const primary = this._containerPort.getPrimary();
      if (primary?.contentEl) return primary.contentEl;
    }
    if (this._containerPort?.get) {
      const primary = this._containerPort.get("primary");
      if (primary?.contentEl) return primary.contentEl;
    }
    const containerMain = document.getElementById("container-main");
    if (containerMain) {
      const contentEl = containerMain.querySelector(".dsd-container__content");
      if (contentEl) return contentEl;
    }
    const shellMain = document.querySelector('#shell-main-region, [data-region="main"], #main');
    if (shellMain) {
      const contentEl = shellMain.querySelector(".dsd-container__content");
      if (contentEl) return contentEl;
    }
    return null;
  }
  // v9.3.0-TITLE-SYNC: Updates the primary container header title
  _syncContainerTitle(panelId, config) {
    try {
      const title = _resolvePanelTitle(panelId, config);
      const primary = this._containerPort?.getPrimary?.();
      if (primary && typeof primary.setTitle === "function") {
        primary.setTitle(title);
        return;
      }
      const titleEl = document.querySelector(".dsd-container__title");
      if (titleEl) {
        titleEl.textContent = title;
      }
    } catch (e) {
    }
  }
  getPanelError(panelId) {
    return this._panelErrors.get(panelId) || null;
  }
  getPanelTiming(panelId) {
    const timings = this._panelTimings.get(panelId);
    if (!timings) return null;
    const avgLoad = timings.loads.length > 0 ? Math.round(timings.loads.reduce((a, b) => a + b, 0) / timings.loads.length) : 0;
    const avgMount = timings.mounts.length > 0 ? Math.round(timings.mounts.reduce((a, b) => a + b, 0) / timings.mounts.length) : 0;
    return { avgLoadTime: avgLoad, avgMountTime: avgMount, samples: { loads: timings.loads.length, mounts: timings.mounts.length } };
  }
  async load(panelId, options = {}) {
    const signal = options.signal;
    const startTime = performance.now();
    this._metrics.loads++;
    this._checkAborted(signal, panelId, "load-start");
    this._telemetry?.track?.("panel:loading", { panelId });
    this._setPanelState(panelId, PANEL_STATE.LOADING);
    try {
      this._checkAborted(signal, panelId, "load-before-fetch");
      const module = await this._panelPort.loadPanel(panelId);
      this._checkAborted(signal, panelId, "load-after-fetch");
      const loadTime = Math.round(performance.now() - startTime);
      this._metrics.loadSuccesses++;
      this._metrics.totalLoadTime += loadTime;
      this._metrics.avgLoadTime = Math.round(this._metrics.totalLoadTime / this._metrics.loadSuccesses);
      this._recordTiming(panelId, "loads", loadTime);
      this._telemetry?.track?.("panel:loaded", { panelId, loadTime });
      return module;
    } catch (error) {
      if (error instanceof NavigationCancelledError) {
        this._metrics.loadsCancelled++;
        this._telemetry?.track?.("panel:load-cancelled", { panelId, phase: error.phase });
        throw error;
      }
      this._metrics.loadFailures++;
      this._setPanelState(panelId, PANEL_STATE.ERROR, error);
      this._telemetry?.track?.("panel:load-error", { panelId, error: error.message });
      throw error;
    }
  }
  async mount(panelModule, panelId, config = {}) {
    const signal = config.signal;
    const startTime = performance.now();
    this._metrics.mounts++;
    this._checkAborted(signal, panelId, "mount-start");
    const containerId = "primary";
    const policy = this._containerPort?.getPolicy?.() || POLICY.EPHEMERAL;
    const layoutPolicy = { mode: config.layoutOverride ? LAYOUT_MODE.OVERRIDE : LAYOUT_MODE.INHERIT, layout: config.layout || config.layoutOverride || null };
    const dockSpec = { region: config.dockRegion || "main", slot: config.dockSlot || DOCK_SLOTS.PRIMARY, order: config.dockOrder || 0 };
    let contentEl = this._getPrimaryContentEl();
    if (!contentEl) {
      const existing = this._containerPort?.get?.(containerId);
      if (existing) {
        contentEl = existing.contentEl || existing;
      } else if (this._containerPort?.getOrCreate) {
        const container = this._containerPort.getOrCreate({ id: containerId, title: config.title || panelId, icon: config.icon || "", variant: config.variant || "default", collapsible: config.collapsible !== false, defaultCollapsed: config.defaultCollapsed || false, dockSpec, layoutPolicy });
        contentEl = container?.contentEl || container;
      } else if (this._containerPort?.getContainer) {
        const container = this._containerPort.getContainer();
        contentEl = container?.contentEl || container;
      }
    }
    if (!contentEl) {
      const error = new Error(`Container contentEl not found for ${containerId}`);
      this._metrics.mountFailures++;
      this._setPanelState(panelId, PANEL_STATE.ERROR, error);
      throw error;
    }
    this._telemetry?.track?.("panel:mounting", { panelId, containerId, policy, dockSpec, layoutPolicy });
    this._setPanelState(panelId, PANEL_STATE.LOADING);
    try {
      this._checkAborted(signal, panelId, "mount-before-render");
      _showLottieLoading(contentEl);
      let instance;
      if (panelModule && typeof panelModule.mount === "function") {
        instance = await panelModule.mount(contentEl, config);
      } else if (this._panelPort?.mount) {
        instance = await this._panelPort.mount(panelModule, contentEl, config);
      } else {
        instance = panelModule;
      }
      this._checkAborted(signal, panelId, "mount-after-render");
      _hideLottieLoading(contentEl);
      const mountTime = Math.round(performance.now() - startTime);
      this._metrics.mountSuccesses++;
      this._metrics.totalMountTime += mountTime;
      this._metrics.avgMountTime = Math.round(this._metrics.totalMountTime / this._metrics.mountSuccesses);
      this._recordTiming(panelId, "mounts", mountTime);
      this._panelInstances.set(panelId, instance);
      this._currentPanel = panelModule;
      this._currentPanelId = panelId;
      this._currentContainerId = containerId;
      this._setPanelState(panelId, PANEL_STATE.MOUNTED);
      this._telemetry?.track?.("panel:mounted", { panelId, containerId, policy, mountTime });
      this._syncContainerTitle(panelId, config);
      return instance;
    } catch (error) {
      _hideLottieLoading(contentEl);
      if (error instanceof NavigationCancelledError) {
        this._metrics.mountsCancelled++;
        this._telemetry?.track?.("panel:mount-cancelled", { panelId, phase: error.phase });
        throw error;
      }
      this._metrics.mountFailures++;
      this._setPanelState(panelId, PANEL_STATE.ERROR, error);
      this._telemetry?.track?.("panel:mount-error", { panelId, containerId, error: error.message });
      this._containerPort?.setError?.(containerId, error);
      this._currentPanel = panelModule;
      this._currentPanelId = panelId;
      this._currentContainerId = containerId;
      return null;
    }
  }
  async retryMount(config = {}) {
    const panelId = this._currentPanelId;
    const panelModule = this._currentPanel;
    if (!panelId || !panelModule) {
      this._telemetry?.track?.("panel:retry-no-panel");
      return null;
    }
    const errorRecord = this._panelErrors.get(panelId);
    if (errorRecord && errorRecord.retryCount >= this._maxRetries) {
      this._telemetry?.track?.("panel:retry-max-exceeded", { panelId, retryCount: errorRecord.retryCount });
      return null;
    }
    this._metrics.retries++;
    this._setPanelState(panelId, PANEL_STATE.RECOVERING);
    this._telemetry?.track?.("panel:retrying", { panelId, retryCount: errorRecord?.retryCount || 0 });
    if (this._currentContainerId) this._containerPort?.clearError?.(this._currentContainerId);
    await this._delay(this._retryDelayMs);
    const result = await this.mount(panelModule, panelId, config);
    if (result) this._metrics.retrySuccesses++;
    return result;
  }
  async unmount() {
    if (!this._currentPanel) return false;
    this._metrics.unmounts++;
    const panelId = this._currentPanelId;
    const containerId = this._currentContainerId;
    const policy = this._containerPort?.getPolicy?.() || POLICY.EPHEMERAL;
    this._telemetry?.track?.("panel:unmounting", { panelId, containerId, policy });
    try {
      if (this._panelPort?.unloadPanel) await this._panelPort.unloadPanel(this._currentPanel);
      else if (typeof this._currentPanel.unmount === "function") await this._currentPanel.unmount();
    } catch (error) {
      this._telemetry?.track?.("panel:unmount-error", { panelId, error: error.message });
    }
    if (containerId === "primary") {
      const contentEl = this._getPrimaryContentEl();
      if (contentEl) contentEl.innerHTML = "";
    } else if (policy === POLICY.EPHEMERAL) {
      if (containerId) this._containerPort?.destroy?.(containerId);
    } else if (policy === POLICY.PERSISTENT) {
      if (containerId) this._containerPort?.deactivate?.(containerId);
    }
    this._panelInstances.delete(panelId);
    this._panelStates.delete(panelId);
    this._panelErrors.delete(panelId);
    this._currentPanel = null;
    this._currentPanelId = null;
    this._currentContainerId = null;
    this._telemetry?.track?.("panel:unmounted", { panelId, containerId, policy });
    return true;
  }
  getPreloadHints() {
    const hints = [];
    this._panelTimings.forEach((timing, panelId) => {
      if (timing.loads.length > 2) {
        const avgLoad = timing.loads.reduce((a, b) => a + b, 0) / timing.loads.length;
        if (avgLoad > 500) hints.push({ panelId, reason: "slow-load", avgTime: Math.round(avgLoad) });
      }
    });
    return hints;
  }
  async warmCache(panelIds) {
    const results = [];
    for (const panelId of panelIds) {
      if (!this._panelInstances.has(panelId)) {
        try {
          await this._panelPort.loadPanel(panelId);
          results.push({ panelId, status: "warmed" });
        } catch (e) {
          results.push({ panelId, status: "failed", error: e.message });
        }
      } else {
        results.push({ panelId, status: "cached" });
      }
    }
    return results;
  }
  getCurrentPanelId() {
    return this._currentPanelId;
  }
  getCurrentContainerId() {
    return this._currentContainerId;
  }
  hasPanel() {
    return !!this._currentPanel;
  }
  isCurrentPanelInError() {
    return this._currentPanelId && this._getPanelState(this._currentPanelId) === PANEL_STATE.ERROR;
  }
  canRetry() {
    if (!this._currentPanelId) return false;
    const err = this._panelErrors.get(this._currentPanelId);
    return err && err.retryCount < this._maxRetries;
  }
  setPolicy(policy) {
    return this._containerPort?.setPolicy?.(policy) || false;
  }
  getPolicy() {
    return this._containerPort?.getPolicy?.() || POLICY.EPHEMERAL;
  }
  listContainers() {
    return this._containerPort?.list?.() || [];
  }
  clearInstanceCache() {
    this._panelInstances.clear();
    this._panelStates.clear();
    this._panelErrors.clear();
  }
  setLoading(loading) {
    if (this._currentContainerId) this._containerPort?.setLoading?.(this._currentContainerId, loading);
  }
  setError(error) {
    if (this._currentContainerId) {
      this._containerPort?.setError?.(this._currentContainerId, error);
      if (this._currentPanelId) this._setPanelState(this._currentPanelId, PANEL_STATE.ERROR, error);
    }
  }
  clearError() {
    if (this._currentContainerId) {
      this._containerPort?.clearError?.(this._currentContainerId);
      if (this._currentPanelId && this._getPanelState(this._currentPanelId) === PANEL_STATE.ERROR) this._setPanelState(this._currentPanelId, PANEL_STATE.MOUNTED);
    }
  }
  getMetrics() {
    const loadSuccessRate = this._metrics.loads > 0 ? Math.round(this._metrics.loadSuccesses / this._metrics.loads * 100) : 0;
    const mountSuccessRate = this._metrics.mounts > 0 ? Math.round(this._metrics.mountSuccesses / this._metrics.mounts * 100) : 0;
    const retrySuccessRate = this._metrics.retries > 0 ? Math.round(this._metrics.retrySuccesses / this._metrics.retries * 100) : 0;
    return { ...this._metrics, loadSuccessRate: `${loadSuccessRate}%`, mountSuccessRate: `${mountSuccessRate}%`, retrySuccessRate: `${retrySuccessRate}%`, cachedInstances: this._panelInstances.size, errorCount: this._panelErrors.size };
  }
  info() {
    return { version: VERSION, moduleId: MODULE_ID, currentPanelId: this._currentPanelId, currentContainerId: this._currentContainerId, hasPanel: this.hasPanel(), policy: this.getPolicy(), cachedInstances: this._panelInstances.size, panelStates: Object.fromEntries(this._panelStates), isCurrentInError: this.isCurrentPanelInError(), canRetry: this.canRetry(), metrics: this.getMetrics(), preloadHints: this.getPreloadHints(), p1HexCompliant: true, abortSignalSupport: true, primaryContainerFix: true, lottieLoading: true, titleSync: true };
  }
  healthCheck() {
    const hasPort = !!this._panelPort;
    const hasContainerPort = !!this._containerPort;
    const hasCurrentError = this.isCurrentPanelInError();
    const loadFailureRate = this._metrics.loads > 0 ? this._metrics.loadFailures / this._metrics.loads * 100 : 0;
    const mountFailureRate = this._metrics.mounts > 0 ? this._metrics.mountFailures / this._metrics.mounts * 100 : 0;
    let status = "HEALTHY";
    if (!hasPort || !hasContainerPort) status = "UNHEALTHY";
    else if (hasCurrentError || loadFailureRate > 20 || mountFailureRate > 20) status = "DEGRADED";
    return { status, version: VERSION, moduleId: MODULE_ID, checks: { hasPort, hasContainerPort, hasTelemetry: !!this._telemetry, errorCount: this._panelErrors.size, hasCurrentError, canRetry: this.canRetry(), loadFailureRate: `${Math.round(loadFailureRate)}%`, mountFailureRate: `${Math.round(mountFailureRate)}%`, avgLoadTime: `${this._metrics.avgLoadTime}ms`, avgMountTime: `${this._metrics.avgMountTime}ms`, p1HexCompliant: true, abortSignalSupport: true, primaryContainerFix: true, lottieLoading: true, titleSync: true }, metrics: this.getMetrics() };
  }
  destroy() {
    this._panelInstances.clear();
    this._panelStates.clear();
    this._panelErrors.clear();
    this._panelTimings.clear();
    this._currentPanel = null;
    this._currentPanelId = null;
    this._currentContainerId = null;
  }
}
function createPanelLifecycleController(panelPort, domAdapter, containerPort, telemetry, orchestrator = null, timerPort = null) {
  return new PanelLifecycleController(panelPort, domAdapter, containerPort, telemetry, orchestrator, timerPort);
}
var panel_lifecycle_controller_default = { PanelLifecycleController, createPanelLifecycleController, NavigationCancelledError, PANEL_STATE, VERSION, MODULE_ID };
export {
  MODULE_ID,
  NavigationCancelledError,
  PanelLifecycleController,
  VERSION,
  createPanelLifecycleController,
  panel_lifecycle_controller_default as default
};
