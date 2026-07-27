import { renderSkeleton, renderAuthBlocked, renderError, renderSessions } from "./template.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-user-sessions.ui.renderer";
function render(container, state, handlers) {
  if (!container) return;
  const { loading, error, sessions, currentSessionId, loginHistory, terminating } = state;
  if (loading && sessions.length === 0) {
    container.innerHTML = renderSkeleton();
    return;
  }
  if (error && sessions.length === 0) {
    container.innerHTML = renderError(error);
    setupHandlers(container, handlers);
    return;
  }
  container.innerHTML = renderSessions(sessions, currentSessionId, loginHistory, terminating);
  setupHandlers(container, handlers);
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
    const btn = e.target?.closest("[data-action]");
    if (!btn) return;
    const action = btn.dataset.action;
    switch (action) {
      case "terminate":
        const sessionId = btn.dataset.sessionId;
        if (sessionId) handlers.terminateSession?.(sessionId);
        break;
      case "terminate-all":
        handlers.terminateAllOthers?.();
        break;
      case "retry":
        handlers.retry?.();
        break;
      case "login":
        handlers.openLogin?.();
        break;
    }
  });
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
