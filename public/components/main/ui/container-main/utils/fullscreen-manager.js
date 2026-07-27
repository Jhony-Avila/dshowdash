import { createLogger } from "./logger.js";
const VERSION = "1.0.0-PHASE7";
const MODULE_ID = "container-main:fullscreen-manager";
function createFullscreenManager(options = {}) {
  const { onEnter = null, onExit = null, onError = null } = options;
  const _logger = createLogger(MODULE_ID);
  const _listeners = /* @__PURE__ */ new Map();
  let _counter = 0;
  let _metrics = { enters: 0, exits: 0, errors: 0 };
  function _getFullscreenElement() {
    return document.fullscreenElement || document.webkitFullscreenElement || document.mozFullScreenElement || document.msFullscreenElement;
  }
  function _requestFullscreen(element) {
    if (element.requestFullscreen) return element.requestFullscreen();
    if (element.webkitRequestFullscreen) return element.webkitRequestFullscreen();
    if (element.mozRequestFullScreen) return element.mozRequestFullScreen();
    if (element.msRequestFullscreen) return element.msRequestFullscreen();
    return Promise.reject(new Error("Fullscreen API not supported"));
  }
  function _exitFullscreen() {
    if (document.exitFullscreen) return document.exitFullscreen();
    if (document.webkitExitFullscreen) return document.webkitExitFullscreen();
    if (document.mozCancelFullScreen) return document.mozCancelFullScreen();
    if (document.msExitFullscreen) return document.msExitFullscreen();
    return Promise.reject(new Error("Fullscreen API not supported"));
  }
  function _notifyListeners(event, data) {
    _listeners.forEach((config) => {
      if (config.event === event || config.event === "all") {
        try {
          config.callback(data);
        } catch (e) {
          _logger.error("Listener error:", e);
        }
      }
    });
  }
  function _handleChange() {
    const isFullscreen2 = !!_getFullscreenElement();
    const data = { isFullscreen: isFullscreen2, element: _getFullscreenElement() };
    if (isFullscreen2) {
      _metrics.enters++;
      _notifyListeners("enter", data);
      onEnter?.(data);
    } else {
      _metrics.exits++;
      _notifyListeners("exit", data);
      onExit?.(data);
    }
    _notifyListeners("change", data);
  }
  function _handleError(e) {
    _metrics.errors++;
    const data = { error: e };
    _notifyListeners("error", data);
    onError?.(data);
  }
  document.addEventListener("fullscreenchange", _handleChange);
  document.addEventListener("webkitfullscreenchange", _handleChange);
  document.addEventListener("mozfullscreenchange", _handleChange);
  document.addEventListener("MSFullscreenChange", _handleChange);
  document.addEventListener("fullscreenerror", _handleError);
  document.addEventListener("webkitfullscreenerror", _handleError);
  document.addEventListener("mozfullscreenerror", _handleError);
  document.addEventListener("MSFullscreenError", _handleError);
  const manager = {
    isSupported() {
      return document.fullscreenEnabled || document.webkitFullscreenEnabled || document.mozFullScreenEnabled || document.msFullscreenEnabled;
    },
    isFullscreen() {
      return !!_getFullscreenElement();
    },
    getFullscreenElement() {
      return _getFullscreenElement();
    },
    async enter(element = document.documentElement) {
      if (typeof element === "string") element = document.querySelector(element);
      if (!element) return Promise.reject(new Error("Element not found"));
      if (!this.isSupported()) return Promise.reject(new Error("Fullscreen not supported"));
      try {
        await _requestFullscreen(element);
        return true;
      } catch (e) {
        _handleError(e);
        throw e;
      }
    },
    async exit() {
      if (!this.isFullscreen()) return true;
      try {
        await _exitFullscreen();
        return true;
      } catch (e) {
        _handleError(e);
        throw e;
      }
    },
    async toggle(element = document.documentElement) {
      if (this.isFullscreen()) {
        await this.exit();
        return false;
      } else {
        await this.enter(element);
        return true;
      }
    },
    onEnter(callback) {
      const id = `enter-${++_counter}`;
      _listeners.set(id, { event: "enter", callback });
      return id;
    },
    onExit(callback) {
      const id = `exit-${++_counter}`;
      _listeners.set(id, { event: "exit", callback });
      return id;
    },
    onChange(callback) {
      const id = `change-${++_counter}`;
      _listeners.set(id, { event: "change", callback });
      return id;
    },
    onError(callback) {
      const id = `error-${++_counter}`;
      _listeners.set(id, { event: "error", callback });
      return id;
    },
    off(id) {
      return _listeners.delete(id);
    },
    getMetrics() {
      return { ..._metrics, isFullscreen: this.isFullscreen(), supported: this.isSupported(), listeners: _listeners.size };
    },
    resetMetrics() {
      _metrics = { enters: 0, exits: 0, errors: 0 };
    },
    healthCheck() {
      return { status: "HEALTHY", version: VERSION, moduleId: MODULE_ID, supported: this.isSupported(), isFullscreen: this.isFullscreen(), metrics: _metrics };
    },
    info() {
      return { moduleId: MODULE_ID, version: VERSION, supported: this.isSupported(), isFullscreen: this.isFullscreen() };
    },
    destroy() {
      document.removeEventListener("fullscreenchange", _handleChange);
      document.removeEventListener("webkitfullscreenchange", _handleChange);
      document.removeEventListener("mozfullscreenchange", _handleChange);
      document.removeEventListener("MSFullscreenChange", _handleChange);
      document.removeEventListener("fullscreenerror", _handleError);
      document.removeEventListener("webkitfullscreenerror", _handleError);
      document.removeEventListener("mozfullscreenerror", _handleError);
      document.removeEventListener("MSFullscreenError", _handleError);
      _listeners.clear();
    }
  };
  return manager;
}
let _instance = null;
function getFullscreenManager(options = {}) {
  if (!_instance) _instance = createFullscreenManager(options);
  return _instance;
}
function resetFullscreenManager() {
  if (_instance) {
    _instance.destroy();
    _instance = null;
  }
}
function enterFullscreen(element) {
  return getFullscreenManager().enter(element);
}
function exitFullscreen() {
  return getFullscreenManager().exit();
}
function toggleFullscreen(element) {
  return getFullscreenManager().toggle(element);
}
function isFullscreen() {
  return getFullscreenManager().isFullscreen();
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  if (_instance) return _instance.healthCheck();
  return { status: "NOT_INITIALIZED", version: VERSION, moduleId: MODULE_ID };
}
var fullscreen_manager_default = { VERSION, MODULE_ID, createFullscreenManager, getFullscreenManager, resetFullscreenManager, enterFullscreen, exitFullscreen, toggleFullscreen, isFullscreen, info, healthCheck };
export {
  MODULE_ID,
  VERSION,
  createFullscreenManager,
  fullscreen_manager_default as default,
  enterFullscreen,
  exitFullscreen,
  getFullscreenManager,
  healthCheck,
  info,
  isFullscreen,
  resetFullscreenManager,
  toggleFullscreen
};
