import { createCorePorts } from "/core/runtime/ports-profiles.js";
const MODULE_ID = "navrail-ui-behaviors";
const VERSION = "5.1.0-ES6";
const Ports = createCorePorts({ moduleId: MODULE_ID });
function _initPorts() {
  Ports.init();
}
function _getPort(name) {
  return Ports.get(name);
}
function injectPorts(p) {
  return Ports.inject(p);
}
function getPorts() {
  return Ports.snapshot();
}
const _log = function(level, ...args) {
  const logger = _getPort("logger");
  if (!logger) return;
  const fn = logger[level] || logger.info;
  if (typeof fn === "function") fn.apply(logger, [`[${MODULE_ID}]`].concat(args));
};
function _debounce(fn, delay) {
  let timeoutId = null;
  return function(...invokeArgs) {
    const self = this;
    const args = invokeArgs;
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => {
      fn.apply(self, args);
      timeoutId = null;
    }, delay);
  };
}
const NavRailBehaviors = {
  _root: null,
  _resizeHandler: null,
  _resizeHandlerRaw: null,
  _keyboardHandler: null,
  _config: null,
  _onModeChange: null,
  _initialized: false,
  _currentMode: "desktop",
  _metrics: { resizeEvents: 0, resizeExecutions: 0, keyboardEvents: 0, modeChanges: 0 },
  init(root, config, onModeChange) {
    const self = this;
    if (this._initialized) {
      _log("warn", "Already initialized");
      return this;
    }
    this._root = root;
    this._config = config;
    this._onModeChange = onModeChange;
    this._bindResponsive();
    this._bindKeyboard();
    this._initialized = true;
    _log("info", "Behaviors initialized with debounced resize");
    return this;
  },
  _bindResponsive() {
    const self = this;
    const debounceDelay = this._config && this._config.resizeDebounce ? this._config.resizeDebounce : 150;
    this._resizeHandlerRaw = () => {
      self._metrics.resizeExecutions++;
      const width = window.innerWidth;
      const breakpoint = self._config && self._config.mobileBreakpoint ? self._config.mobileBreakpoint : 500;
      const newMode = width < breakpoint ? "mobile" : "desktop";
      if (newMode !== self._currentMode) {
        self._currentMode = newMode;
        self._metrics.modeChanges++;
        if (self._onModeChange) self._onModeChange(newMode);
        _log("info", "Mode changed", { mode: newMode, width });
      }
    };
    const debouncedHandler = _debounce(() => {
      if (self._resizeHandlerRaw) self._resizeHandlerRaw();
    }, debounceDelay);
    this._resizeHandler = debouncedHandler;
    const wrappedHandler = () => {
      self._metrics.resizeEvents++;
      if (self._resizeHandler) self._resizeHandler();
    };
    window.addEventListener("resize", wrappedHandler);
    debouncedHandler._wrapped = wrappedHandler;
    if (this._resizeHandlerRaw) this._resizeHandlerRaw();
  },
  _bindKeyboard() {
    const self = this;
    this._keyboardHandler = (e) => {
      const items = Array.from(self._root ? self._root.querySelectorAll(".navrail-btn, .nav-rail__item") : []);
      const currentIndex = items.indexOf(document.activeElement);
      if (currentIndex === -1) return;
      self._metrics.keyboardEvents++;
      let nextIndex = currentIndex;
      if (e.key === "ArrowDown" || e.key === "ArrowRight") {
        e.preventDefault();
        nextIndex = (currentIndex + 1) % items.length;
      } else if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
        e.preventDefault();
        nextIndex = (currentIndex - 1 + items.length) % items.length;
      } else if (e.key === "Home") {
        e.preventDefault();
        nextIndex = 0;
      } else if (e.key === "End") {
        e.preventDefault();
        nextIndex = items.length - 1;
      }
      if (nextIndex !== currentIndex && items[nextIndex]) {
        items[nextIndex].focus();
      }
    };
    if (this._root) this._root.addEventListener("keydown", this._keyboardHandler);
  },
  getCurrentMode() {
    return this._currentMode;
  },
  getConfig() {
    return this._config ? Object.assign({}, this._config) : null;
  },
  destroy() {
    if (this._resizeHandler && this._resizeHandler._wrapped) {
      window.removeEventListener("resize", this._resizeHandler._wrapped);
      this._resizeHandler = null;
      this._resizeHandlerRaw = null;
    }
    if (this._keyboardHandler && this._root) {
      this._root.removeEventListener("keydown", this._keyboardHandler);
      this._keyboardHandler = null;
    }
    this._root = null;
    this._config = null;
    this._onModeChange = null;
    this._initialized = false;
    this._currentMode = "desktop";
    _log("info", "Behaviors destroyed");
    return this;
  },
  healthCheck() {
    const ps = Ports.snapshot();
    const logger = _getPort("logger");
    const checks = {
      initialized: this._initialized,
      hasRoot: !!this._root,
      hasConfig: !!this._config,
      hasResizeHandler: !!this._resizeHandler,
      hasKeyboardHandler: !!this._keyboardHandler,
      hasModeCallback: typeof this._onModeChange === "function",
      loggerAvailable: !!logger,
      portsInitialized: ps._initialized
    };
    const passed = Object.values(checks).filter(Boolean).length;
    const total = Object.keys(checks).length;
    return {
      status: passed === total ? "HEALTHY" : passed >= 4 ? "DEGRADED" : "UNHEALTHY",
      score: `${passed}/${total}`,
      checks,
      currentMode: this._currentMode,
      breakpoint: this._config && this._config.mobileBreakpoint ? this._config.mobileBreakpoint : 500,
      debounceDelay: this._config && this._config.resizeDebounce ? this._config.resizeDebounce : 150,
      metrics: Object.assign({}, this._metrics),
      efficiency: this._metrics.resizeEvents > 0 ? `${Math.round((1 - this._metrics.resizeExecutions / this._metrics.resizeEvents) * 100)}%` : "N/A",
      version: VERSION,
      moduleId: MODULE_ID,
      portsInitialized: ps._initialized,
      timestamp: Date.now()
    };
  },
  info() {
    const ps = Ports.snapshot();
    return {
      moduleId: MODULE_ID,
      version: VERSION,
      initialized: this._initialized,
      currentMode: this._currentMode,
      hasRoot: !!this._root,
      config: this._config ? { mobileBreakpoint: this._config.mobileBreakpoint, resizeDebounce: this._config.resizeDebounce || 150 } : null,
      metrics: Object.assign({}, this._metrics),
      features: ["responsive", "keyboard-navigation", "home-end-keys", "debounced-resize"],
      portsInitialized: ps._initialized,
      timestamp: Date.now()
    };
  }
};
var behaviors_default = NavRailBehaviors;
export {
  MODULE_ID,
  NavRailBehaviors,
  VERSION,
  behaviors_default as default,
  getPorts,
  injectPorts
};
