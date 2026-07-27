import { renderSkeleton, renderAuthBlocked, renderError, renderProfile } from "./template.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-user-profile.ui.renderer";
function render(container, state, handlers) {
  if (!container) return;
  const { loading, error, profile, avatars, showAvatarPicker, isDirty, saving } = state;
  if (loading && !profile) {
    container.innerHTML = renderSkeleton();
    return;
  }
  if (error && !profile) {
    container.innerHTML = renderError(error);
    setupEventHandlers(container, handlers);
    return;
  }
  if (!profile) {
    container.innerHTML = renderError("Perfil n\xE3o encontrado");
    setupEventHandlers(container, handlers);
    return;
  }
  container.innerHTML = renderProfile(profile, avatars, showAvatarPicker, isDirty, saving);
  setupEventHandlers(container, handlers);
}
function renderAuthBlockedView(container, handlers) {
  if (!container) return;
  container.innerHTML = renderAuthBlocked();
  setupEventHandlers(container, handlers);
}
function renderSkeletonView(container) {
  if (!container) return;
  container.innerHTML = renderSkeleton();
}
function renderErrorView(container, message, handlers) {
  if (!container) return;
  container.innerHTML = renderError(message);
  setupEventHandlers(container, handlers);
}
function setupEventHandlers(container, handlers) {
  if (!container || !handlers) return;
  container.onclick = (e) => {
    const btn = e.target.closest("[data-action]");
    if (!btn) return;
    const action = btn.dataset.action;
    if (action === "toggle-avatar-picker") handlers.toggleAvatarPicker?.();
    else if (action === "close-picker") handlers.closeAvatarPicker?.();
    else if (action === "select-avatar") handlers.selectAvatar?.(btn.dataset.url);
    else if (action === "save") handlers.save?.();
    else if (action === "cancel" || action === "retry") handlers.cancel?.();
    else if (action === "login") handlers.openLogin?.();
  };
  container.oninput = (e) => {
    const input = e.target.closest("[data-field]");
    if (input) {
      input.classList.add("dirty");
      handlers.updateField?.(input.dataset.field, input.value);
    }
  };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { rendererReady: true } };
}
var renderer_default = { render, renderAuthBlockedView, renderSkeletonView, renderErrorView, info, healthCheck, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  renderer_default as default,
  healthCheck,
  info,
  render,
  renderAuthBlockedView,
  renderErrorView,
  renderSkeletonView
};
