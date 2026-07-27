import { VERSION, MODULE_ID } from "./constants.js";
import {
  getConfig,
  setConfig,
  isVisible as _isVisible,
  setVisible,
  setOverlayLayer,
  getPanelElement,
  setRefreshIntervalId,
  clearRefreshInterval,
  resetState
} from "./state.js";
import { removeStyles } from "./styles.js";
import { ensurePanelElement, removePanelElement, updatePanelClasses } from "./ui/panel.js";
import { refresh } from "./ui/renderer.js";
import { logEvent, clearEventLog, closeAll, scanOrphans, exportInfo } from "./actions/debug-actions.js";
import { healthCheck, info } from "./diagnostics/health.js";
function inject(dependencies) {
  if (dependencies && dependencies.overlayLayer) {
    setOverlayLayer(dependencies.overlayLayer);
  }
}
function show() {
  if (typeof document === "undefined") {
    return { ok: false, error: "no-document" };
  }
  const panel = ensurePanelElement();
  setVisible(true);
  panel.style.display = "block";
  refresh();
  const config = getConfig();
  if (config.refreshInterval > 0) {
    const intervalId = setInterval(refresh, config.refreshInterval);
    setRefreshIntervalId(intervalId);
  }
  return { ok: true };
}
function hide() {
  setVisible(false);
  const panel = getPanelElement();
  if (panel) {
    panel.style.display = "none";
  }
  clearRefreshInterval();
  return { ok: true };
}
function toggle() {
  if (_isVisible()) {
    hide();
  } else {
    show();
  }
  return { ok: true, visible: _isVisible() };
}
function toggleCollapse() {
  const config = getConfig();
  setConfig({ collapsed: !config.collapsed });
  const panel = getPanelElement();
  if (panel) {
    panel.classList.toggle("collapsed", getConfig().collapsed);
    refresh();
  }
  return { ok: true, collapsed: getConfig().collapsed };
}
function setupHotkey() {
  if (typeof document === "undefined") return;
  document.addEventListener("keydown", (e) => {
    const config = getConfig();
    const hotkey = config.hotkey.toLowerCase();
    const keys = hotkey.split("+");
    const ctrlMatch = keys.indexOf("ctrl") >= 0 === e.ctrlKey;
    const shiftMatch = keys.indexOf("shift") >= 0 === e.shiftKey;
    const altMatch = keys.indexOf("alt") >= 0 === e.altKey;
    let keyMatch = false;
    for (let i = 0; i < keys.length; i++) {
      const k = keys[i];
      if (k !== "ctrl" && k !== "shift" && k !== "alt") {
        if (e.key.toLowerCase() === k) {
          keyMatch = true;
          break;
        }
      }
    }
    if (ctrlMatch && shiftMatch && altMatch && keyMatch) {
      e.preventDefault();
      toggle();
    }
  });
}
function init(overlayLayerRef) {
  if (overlayLayerRef) {
    setOverlayLayer(overlayLayerRef);
  }
  setupHotkey();
  if (typeof window !== "undefined") {
    window.__overlayDebugPanel = {
      toggle: toggleCollapse,
      closeAll,
      scanOrphans,
      exportInfo
    };
  }
  setConfig({ enabled: true });
  return { ok: true };
}
function destroy() {
  hide();
  removePanelElement();
  removeStyles();
  if (typeof window !== "undefined") {
    delete window.__overlayDebugPanel;
  }
  setConfig({ enabled: false });
  resetState();
  return { ok: true };
}
function configure(config) {
  if (!config || typeof config !== "object") return false;
  setConfig(config);
  updatePanelClasses();
  return true;
}
function isVisible() {
  return _isVisible();
}
function getConfigExport() {
  return Object.assign({}, getConfig());
}
var debug_panel_default = {
  inject,
  init,
  destroy,
  show,
  hide,
  toggle,
  toggleCollapse,
  logEvent,
  clearEventLog,
  closeAll,
  scanOrphans,
  exportInfo,
  configure,
  getConfig: getConfigExport,
  isVisible,
  healthCheck,
  info,
  VERSION,
  MODULE_ID
};
export {
  MODULE_ID,
  VERSION,
  clearEventLog,
  closeAll,
  configure,
  debug_panel_default as default,
  destroy,
  exportInfo,
  getConfigExport,
  healthCheck,
  hide,
  info,
  init,
  inject,
  isVisible,
  logEvent,
  scanOrphans,
  show,
  toggle,
  toggleCollapse
};
