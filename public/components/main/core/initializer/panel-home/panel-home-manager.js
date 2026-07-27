const VERSION = "1.0.0-ENTERPRISE";
const MODULE_ID = "main.core.initializer.panel-home.panel-home-manager";
import { PANEL_HOME_PATH } from "../constants.js";
import { createLogger } from "/assets/js/core/logger-global/index.js";
import {
  getPanelHomeInstance,
  setPanelHomeInstance,
  clearPanelHomeInstance,
  incrementPanelHomeLoads,
  incrementPanelHomeErrors,
  isPanelHomeMounted as _isPanelHomeMounted
} from "../state.js";
const _logger = createLogger("initializer");
let _logLevel = 1;
const LOG_LEVELS = { debug: 0, info: 1, warn: 2, error: 3, none: 99 };
function _log(level, msg, data) {
  const levelNum = LOG_LEVELS[level] || 1;
  if (levelNum < _logLevel) return;
  const context = data !== void 0 ? { data } : {};
  if (level === "error") _logger.error(msg, context);
  else if (level === "warn") _logger.warn(msg, context);
  else if (level === "debug") _logger.debug(msg, context);
  else _logger.info(msg, context);
}
function setLogLevel(level) {
  if (typeof level === "string") _logLevel = LOG_LEVELS[level] !== void 0 ? LOG_LEVELS[level] : 1;
  else if (typeof level === "number") _logLevel = level;
  return _logLevel;
}
async function loadPanelHome(contentEl) {
  try {
    incrementPanelHomeLoads();
    const panelHomeModule = await import(PANEL_HOME_PATH);
    const instance = await panelHomeModule.mount(contentEl, {});
    setPanelHomeInstance(instance);
    try {
      const wrapper = contentEl.querySelector(".ph-wrapper");
      if (wrapper) {
        const fx = await import("/components/panel-home/weather-fx/index.js");
        fx.mount(wrapper);
      }
    } catch (fxErr) {
      _log("warn", "weather-fx mount skipped:", fxErr && fxErr.message);
    }
    _log("debug", "panel-home loaded successfully");
    return true;
  } catch (error) {
    incrementPanelHomeErrors();
    _log("warn", "Failed to load panel-home, using fallback placeholder:", error.message);
    return false;
  }
}
async function unmountPanelHome() {
  try {
    const fx = await import("/components/panel-home/weather-fx/index.js");
    fx.destroy();
  } catch (fxErr) {
    _log("warn", "weather-fx destroy skipped:", fxErr && fxErr.message);
  }
  if (getPanelHomeInstance()) {
    try {
      const panelHomeModule = await import(PANEL_HOME_PATH);
      await panelHomeModule.unmount();
      clearPanelHomeInstance();
      _log("debug", "panel-home unmounted");
    } catch (error) {
      _log("warn", "Failed to unmount panel-home:", error.message);
    }
  }
}
function isPanelHomeMounted() {
  return _isPanelHomeMounted();
}
var panel_home_manager_default = {
  loadPanelHome,
  unmountPanelHome,
  isPanelHomeMounted,
  setLogLevel
};
export {
  MODULE_ID,
  VERSION,
  panel_home_manager_default as default,
  isPanelHomeMounted,
  loadPanelHome,
  setLogLevel,
  unmountPanelHome
};
