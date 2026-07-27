import { renderSkeleton, renderAuthBlocked, renderError, renderSecurity } from "./template.js";
function render(container, state, handlers) {
  if (!container) return;
  const { loading, error, securityInfo, showPasswordForm, passwordForm, saving } = state;
  if (loading && !securityInfo) {
    container.innerHTML = renderSkeleton();
    return;
  }
  if (error && !securityInfo) {
    container.innerHTML = renderError(error);
    setupHandlers(container, handlers);
    return;
  }
  if (securityInfo) {
    container.innerHTML = renderSecurity(securityInfo, showPasswordForm, passwordForm, saving);
    setupHandlers(container, handlers);
  }
}
function renderAuthBlockedView(container, handlers) {
  if (!container) return;
  container.innerHTML = renderAuthBlocked();
  container.querySelector('[data-action="login"]')?.addEventListener("click", handlers?.openLogin);
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
    const action = e.target.closest("[data-action]");
    const actionName = action?.dataset.action;
    if (!actionName) return;
    switch (actionName) {
      case "toggle-password-form":
        handlers.togglePasswordForm?.();
        break;
      case "change-password":
        handlers.changePassword?.();
        break;
      case "go-sessions":
        handlers.goToSessions?.();
        break;
      case "logout-all":
        handlers.logoutAllSessions?.();
        break;
      case "retry":
        handlers.retry?.();
        break;
      case "login":
        handlers.openLogin?.();
        break;
    }
  });
  container.querySelectorAll(".password-form input[data-field]").forEach((input) => {
    input.addEventListener("input", (e) => handlers.updatePasswordField?.(e.target.dataset.field, e.target.value));
  });
}
var renderer_default = { render, renderAuthBlockedView, renderSkeletonView, renderErrorView };
const MODULE_ID = "panels-panel-account-security-ui-renderer";
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
