import { state } from "../state/store.js";
import { tracker } from "../telemetry/tracker.js";
import { garantirLottie } from "../core/catalogo.js";
const VERSION = "10.0.0";
const MODULE_ID = "panel-lotties-management/events";
let _lottieInstance = null;
let _cleanups = [];
let _previewToken = 0;
function _destroyPreviewInstance() {
  if (_lottieInstance) {
    try {
      _lottieInstance.destroy();
    } catch {
    }
    _lottieInstance = null;
  }
}
async function _showPreview(lottieId, container, onRender) {
  const item = state.getState().lotties.find((l) => l.id === lottieId);
  if (!item || item.disponivel === false) return;
  const token = ++_previewToken;
  _destroyPreviewInstance();
  state.setPreview(lottieId);
  tracker.trackPreview(lottieId);
  if (onRender) onRender();
  const ok = await garantirLottie();
  if (token !== _previewToken) return;
  const alvo = container.querySelector("[data-preview-container]");
  if (!alvo) return;
  if (!ok) {
    alvo.innerHTML = '<p class="preview-error" role="alert">Biblioteca lottie-web indisponível (CDN bloqueada?).</p>';
    return;
  }
  alvo.innerHTML = "";
  try {
    _lottieInstance = lottie.loadAnimation({ container: alvo, renderer: "svg", loop: true, autoplay: true, path: item.url });
  } catch (e) {
    alvo.innerHTML = `<p class="preview-error" role="alert">Falha ao carregar a animação: ${String(e.message || e)}</p>`;
  }
}
function _closePreview() {
  _previewToken++;
  _destroyPreviewInstance();
  state.clearPreview();
}
function _handleSelect(lottieId) {
  const current = state.getState().selectedLottie;
  state.setSelectedLottie(current === lottieId ? null : lottieId);
}
function _handleAssign(componentId, lottieId) {
  if (lottieId) {
    state.assignLottie(componentId, lottieId);
    tracker.trackAssign(componentId, lottieId);
  } else state.unassignLottie(componentId);
}
function setupEventHandlers(container, onRender, onReload = null) {
  const handleClick = (e) => {
    const target = e.target;
    if (target?.closest("[data-close-preview]")) {
      _closePreview();
      if (onRender) onRender();
      return;
    }
    const actionEl = target?.closest("[data-action]");
    const action = actionEl?.dataset.action;
    if (!action || actionEl?.tagName === "SELECT") return;
    const lottieId = target?.closest("[data-lottie]")?.dataset.lottie;
    const componentId = target?.closest("[data-component]")?.dataset.component;
    switch (action) {
      case "preview":
        if (lottieId) void _showPreview(lottieId, container, onRender);
        break;
      case "select":
        if (lottieId) {
          _handleSelect(lottieId);
          if (onRender) onRender();
        }
        break;
      case "unassign":
        if (componentId) {
          state.unassignLottie(componentId);
          if (onRender) onRender();
        }
        break;
      case "recarregar":
        if (onReload) onReload();
        break;
    }
  };
  const handleChange = (e) => {
    const target = e.target;
    const action = target?.closest("[data-action]")?.dataset.action;
    const componentId = target?.closest("[data-component]")?.dataset.component;
    if (action === "assign" && componentId && target) {
      _handleAssign(componentId, target.value);
      if (onRender) onRender();
    }
  };
  const handleKey = (e) => {
    if (e.key === "Escape" && state.getState().previewActive) {
      _closePreview();
      if (onRender) onRender();
    }
  };
  container.addEventListener("click", handleClick);
  container.addEventListener("change", handleChange);
  document.addEventListener("keydown", handleKey);
  _cleanups.push(() => container.removeEventListener("click", handleClick), () => container.removeEventListener("change", handleChange), () => document.removeEventListener("keydown", handleKey));
  return _cleanups;
}
function cleanup() {
  _previewToken++;
  _destroyPreviewInstance();
  _cleanups.forEach((fn) => {
    try {
      fn();
    } catch {
    }
  });
  _cleanups = [];
}
function healthCheck() {
  return { status: "HEALTHY", version: VERSION, moduleId: MODULE_ID, hasInstance: !!_lottieInstance, listeners: _cleanups.length };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, cleanupCount: _cleanups.length, hasInstance: !!_lottieInstance };
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
