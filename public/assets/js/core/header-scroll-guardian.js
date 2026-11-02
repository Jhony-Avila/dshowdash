var MODULE_ID = "header-scroll-guardian";
var VERSION = "1.4.0-EVENT-DRIVEN";
(function(global) {
  let _scrollHandler = null;
  let _region = null;
  let _active = false;
  const _debug = () => global.APP_CONFIG?.app ? global.APP_CONFIG.app?.debug ?? false : false;
  const Logger = global.Logger;
  const _log = (level, ...args) => {
    if (!Logger) return;
    const prefix = "[" + MODULE_ID + "]";
    if (level === "error") {
      Logger.error?.(prefix, ...args);
      return;
    }
    if (level === "warn") {
      Logger.warn?.(prefix, ...args);
      return;
    }
    if (level === "info") {
      Logger.info?.(prefix, ...args);
      return;
    }
    if (_debug()) Logger.debug?.(prefix, ...args);
  };
  function _findHeaderRegion() {
    return document.querySelector('[data-region="header"]') || document.getElementById("shell-header-region") || document.getElementById("header");
  }
  function startGuardian() {
    if (_active) return;
    const region = _findHeaderRegion();
    if (!region) {
      _log("warn", "Header region not found - guardian not started");
      return;
    }
    _region = region;
    const el = region;
    if (el.style) {
      el.style.overflow = "hidden";
    }
    _scrollHandler = function() {
      if (region.scrollTop !== 0) {
        _log("warn", "Resetando scrollTop:", region.scrollTop, "\u2192 0");
        region.scrollTop = 0;
      }
    };
    region.addEventListener("scroll", _scrollHandler, { passive: true });
    _active = true;
    _log("info", "Ativo (event-driven v1.4.0)");
  }
  function stopGuardian() {
    if (_region && _scrollHandler) {
      _region.removeEventListener("scroll", _scrollHandler);
      _scrollHandler = null;
    }
    _region = null;
    _active = false;
    _log("info", "Desativado");
  }
  function info() {
    return { moduleId: MODULE_ID, version: VERSION, active: _active, mode: "event-driven" };
  }
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", startGuardian);
  } else {
    startGuardian();
  }
  global.HeaderScrollGuardian = { start: startGuardian, stop: stopGuardian, info, MODULE_ID, VERSION };
})(typeof window !== "undefined" ? window : void 0);
