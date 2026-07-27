import { renderSkeleton, renderAuthBlocked, renderError, renderNotifications } from "./template.js";
function render(container, state, handlers) {
  if (!container) return;
  const { loading, error, settings, isDirty, saving } = state;
  if (loading && !settings) {
    container.innerHTML = renderSkeleton();
    return;
  }
  if (error && !settings) {
    container.innerHTML = renderError(error);
    setupHandlers(container, handlers);
    return;
  }
  if (settings) {
    container.innerHTML = renderNotifications(settings, isDirty, saving);
    setupHandlers(container, handlers);
  }
}
function renderAuthBlockedView(container, handlers) {
  if (!container) return;
  container.innerHTML = renderAuthBlocked();
  container.querySelector('[data-action="login"]')?.addEventListener("click", () => handlers?.openLogin?.());
}
function renderSkeletonView(container) {
  if (container) container.innerHTML = renderSkeleton();
}
function renderErrorView(container, message, handlers) {
  if (!container) return;
  container.innerHTML = renderError(message);
  setupHandlers(container, handlers);
}
function setupHandlers(container, handlers) {
  if (!handlers) return;
  container.addEventListener("click", (e) => {
    const target = e.target;
    const action = target?.closest("[data-action]")?.getAttribute("data-action");
    if (!action) return;
    switch (action) {
      case "save":
        handlers.save?.();
        break;
      case "cancel":
        handlers.cancel?.();
        break;
      case "retry":
        handlers.retry?.();
        break;
      case "login":
        handlers.openLogin?.();
        break;
    }
  });
  container.addEventListener("change", (e) => {
    const target = e.target;
    if (!target) return;
    const category = target.dataset.category;
    const key = target.dataset.key;
    if (!category || !key) return;
    let value;
    if (target.type === "checkbox") value = target.checked;
    else if (target.type === "radio") value = target.value;
    else value = target.value;
    handlers.updateSetting?.(category, key, value);
  });
}
var renderer_default = { render, renderAuthBlockedView, renderSkeletonView, renderErrorView };
const MODULE_ID = "panels-panel-user-notifications-ui-renderer";
const VERSION = "9.3.0-P2-ENTERPRISE";
function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}
function healthCheck() {
  return { status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { rendererReady: true } };
}
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
