import { state } from "../state/store.js";
import { tracker } from "../telemetry/tracker.js";
import { AVAILABLE_LOTTIES, LOTTIES_BASE_PATH } from "../core/lifecycle.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-lotties-management/events";
let _lottieInstance = null;
let _cleanups = [];
async function _loadLottieLib() {
  if (typeof lottie !== "undefined") return true;
  return new Promise((resolve) => {
    const script = document.createElement("script");
    script.src = "https://cdnjs.cloudflare.com/ajax/libs/lottie-web/5.12.2/lottie.min.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });
}
async function _showPreview(lottieId, container) {
  const previewContainer = container.querySelector("[data-preview-container]");
  if (!previewContainer) return;
  if (_lottieInstance) {
    _lottieInstance.destroy();
    _lottieInstance = null;
  }
  const lottieData = AVAILABLE_LOTTIES[lottieId];
  if (!lottieData) return;
  await _loadLottieLib();
  state.setPreview(lottieId);
  tracker.trackPreview(lottieId);
  setTimeout(() => {
    const activeContainer = container.querySelector("[data-preview-container]");
    if (activeContainer && typeof lottie !== "undefined") {
      activeContainer.innerHTML = "";
      _lottieInstance = lottie.loadAnimation({ container: activeContainer, renderer: "svg", loop: true, autoplay: true, path: LOTTIES_BASE_PATH + lottieData.file });
    }
  }, 100);
}
function _closePreview() {
  if (_lottieInstance) {
    _lottieInstance.destroy();
    _lottieInstance = null;
  }
  state.clearPreview();
}
function _handleSelect(lottieId) {
  const currentSelected = state.getState().selectedLottie;
  state.setSelectedLottie(currentSelected === lottieId ? null : lottieId);
}
function _handleAssign(componentId, lottieId) {
  if (lottieId) {
    state.assignLottie(componentId, lottieId);
    tracker.trackAssign(componentId, lottieId);
  } else {
    state.unassignLottie(componentId);
  }
}
function _handleUnassign(componentId) {
  state.unassignLottie(componentId);
}
function setupEventHandlers(container, onRender) {
  const handleClick = (e) => {
    const target = e.target;
    const action = target?.closest("[data-action]")?.dataset.action;
    const lottieId = target?.closest("[data-lottie]")?.dataset.lottie;
    const componentId = target?.closest("[data-component]")?.dataset.component;
    const closePreview = target?.closest("[data-close-preview]");
    if (closePreview) {
      _closePreview();
      if (onRender) onRender();
      return;
    }
    if (!action) return;
    switch (action) {
      case "preview":
        if (lottieId) _showPreview(lottieId, container);
        break;
      case "select":
        if (lottieId) {
          _handleSelect(lottieId);
          if (onRender) onRender();
        }
        break;
      case "unassign":
        if (componentId) {
          _handleUnassign(componentId);
          if (onRender) onRender();
        }
        break;
    }
  };
  const handleChange = (e) => {
    const target = e.target;
    const action = target?.closest("[data-action]")?.dataset.action;
    const componentId = target?.closest("[data-component]")?.dataset.component;
    if (action === "assign" && componentId) {
      _handleAssign(componentId, e.target.value);
      if (onRender) onRender();
    }
  };
  container.addEventListener("click", handleClick);
  container.addEventListener("change", handleChange);
  _cleanups.push(() => container.removeEventListener("click", handleClick), () => container.removeEventListener("change", handleChange));
  return _cleanups;
}
function cleanup() {
  if (_lottieInstance) {
    _lottieInstance.destroy();
    _lottieInstance = null;
  }
  _cleanups.forEach((fn) => {
    try {
      fn();
    } catch (e) {
    }
  });
  _cleanups = [];
}
function healthCheck() {
  return { status: "HEALTHY", version: VERSION, moduleId: MODULE_ID, hasInstance: !!_lottieInstance };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, cleanupCount: _cleanups.length };
}
var events_default = { setupEventHandlers, cleanup, healthCheck, info, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  cleanup,
  events_default as default,
  healthCheck,
  info,
  setupEventHandlers
};
