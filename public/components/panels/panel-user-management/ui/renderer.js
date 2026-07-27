import { renderSkeleton, renderAuthBlocked, renderError, renderUserList, renderUserDetail } from "./template.js";
const VERSION = "9.3.0-P2-ENTERPRISE";
const MODULE_ID = "panel-user-management.ui.renderer";
function render(container, state, handlers) {
  if (!container) return;
  const { loading, error, users, selectedUser, pagination, search, filters, bulkMode, selectedIds } = state;
  const usersArr = users || [];
  if (loading && usersArr.length === 0) {
    container.innerHTML = renderSkeleton();
    return;
  }
  if (error && usersArr.length === 0) {
    container.innerHTML = renderError(error);
    setupEventHandlers(container, handlers);
    return;
  }
  if (selectedUser) {
    container.innerHTML = renderUserDetail(selectedUser, state);
    setupEventHandlers(container, handlers);
    return;
  }
  container.innerHTML = renderUserList(usersArr, {
    pagination,
    search,
    filters,
    bulkMode,
    selectedIds,
    loading
  });
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
    const userId = btn.dataset.userId;
    const page = btn.dataset.page;
    switch (action) {
      case "view-user":
        if (userId) handlers.viewUser?.(userId);
        break;
      case "edit-user":
        if (userId) handlers.editUser?.(userId);
        break;
      case "delete-user":
        if (userId) handlers.deleteUser?.(userId);
        break;
      case "toggle-status":
        if (userId) handlers.toggleStatus?.(userId);
        break;
      case "back":
        handlers.back?.();
        break;
      case "page":
        if (page) handlers.goToPage?.(parseInt(page, 10));
        break;
      case "toggle-bulk":
        handlers.toggleBulkMode?.();
        break;
      case "select-user":
        if (userId) handlers.toggleSelect?.(userId);
        break;
      case "select-all":
        handlers.selectAll?.();
        break;
      case "bulk-action":
        const bulkAction = btn.dataset.bulkAction;
        if (bulkAction) handlers.bulkAction?.(bulkAction);
        break;
      case "create-user":
        handlers.createUser?.();
        break;
      case "retry":
        handlers.retry?.();
        break;
      case "login":
        handlers.openLogin?.();
        break;
      case "export":
        handlers.exportUsers?.();
        break;
      case "refresh":
        handlers.refresh?.();
        break;
    }
  };
  container.oninput = (e) => {
    const input = e.target;
    if (input.dataset.filter === "search") {
      handlers.search?.(input.value);
    } else if (input.dataset.filter) {
      handlers.filter?.(input.dataset.filter, input.value);
    }
  };
  container.onchange = (e) => {
    const select = e.target;
    if (select.dataset.filter) {
      handlers.filter?.(select.dataset.filter, select.value);
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
const ui = { render, renderAuthBlockedView, renderSkeletonView, renderErrorView, info, healthCheck, VERSION, MODULE_ID };
export {
  MODULE_ID,
  VERSION,
  renderer_default as default,
  healthCheck,
  info,
  render,
  renderAuthBlockedView,
  renderErrorView,
  renderSkeletonView,
  ui
};
