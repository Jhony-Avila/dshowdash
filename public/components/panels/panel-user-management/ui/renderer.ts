// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.4.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-user-management.ui.renderer
// PURPOSE: Panel User Management - UI Renderer
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   renderSkeleton, renderAuthBlocked, renderError, renderUserList, renderUserDet...
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   render() — exported function
//   renderAuthBlockedView() — exported function
//   renderSkeletonView() — exported function
//   renderErrorView() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { renderSkeleton, renderAuthBlocked, renderError, renderUserList, renderUserDetail } from './template.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-user-management.ui.renderer';

type Handlers = Record<string, ((...args: unknown[]) => unknown) | undefined>;

export function render(container: HTMLElement, state: Record<string, unknown>, handlers: Handlers) {
  if (!container) return;

  const { loading, error, users, selectedUser, pagination, search, filters, bulkMode, selectedIds } = state;
  const usersArr = (users as Record<string, unknown>[]) || [];

  if (loading && usersArr.length === 0) {
    container.innerHTML = renderSkeleton();
    return;
  }

  if (error && usersArr.length === 0) {
    container.innerHTML = renderError(error as string);
    setupEventHandlers(container, handlers);
    return;
  }

  if (selectedUser) {
    container.innerHTML = renderUserDetail(selectedUser as Record<string, unknown>, state);
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

export function renderAuthBlockedView(container: HTMLElement, handlers: Handlers) {
  if (!container) return;
  container.innerHTML = renderAuthBlocked();
  setupEventHandlers(container, handlers);
}

export function renderSkeletonView(container: HTMLElement) {
  if (!container) return;
  container.innerHTML = renderSkeleton();
}

export function renderErrorView(container: HTMLElement, message: string, handlers: Handlers) {
  if (!container) return;
  container.innerHTML = renderError(message);
  setupEventHandlers(container, handlers);
}

function setupEventHandlers(container: HTMLElement, handlers: Handlers) {
  if (!container || !handlers) return;

  container.onclick = (e: MouseEvent) => {
    const btn = (e.target as HTMLElement).closest('[data-action]') as HTMLElement | null;
    if (!btn) return;

    const action = btn.dataset.action;
    const userId = btn.dataset.userId;
    const page = btn.dataset.page;

    switch (action) {
      case 'view-user':
        if (userId) handlers.viewUser?.(userId);
        break;
      case 'edit-user':
        if (userId) handlers.editUser?.(userId);
        break;
      case 'delete-user':
        if (userId) handlers.deleteUser?.(userId);
        break;
      case 'toggle-status':
        if (userId) handlers.toggleStatus?.(userId);
        break;
      case 'back':
        handlers.back?.();
        break;
      case 'page':
        if (page) handlers.goToPage?.(parseInt(page, 10));
        break;
      case 'toggle-bulk':
        handlers.toggleBulkMode?.();
        break;
      case 'select-user':
        if (userId) handlers.toggleSelect?.(userId);
        break;
      case 'select-all':
        handlers.selectAll?.();
        break;
      case 'bulk-action':
        const bulkAction = btn.dataset.bulkAction;
        if (bulkAction) handlers.bulkAction?.(bulkAction);
        break;
      case 'create-user':
        handlers.createUser?.();
        break;
      case 'retry':
        handlers.retry?.();
        break;
      case 'login':
        handlers.openLogin?.();
        break;
      case 'export':
        handlers.exportUsers?.();
        break;
      case 'refresh':
        handlers.refresh?.();
        break;
    }
  };

  container.oninput = (e: Event) => {
    const input = e.target as HTMLInputElement;
    if (input.dataset.filter === 'search') {
      handlers.search?.(input.value);
    } else if (input.dataset.filter) {
      handlers.filter?.(input.dataset.filter, input.value);
    }
  };

  container.onchange = (e: Event) => {
    const select = e.target as HTMLSelectElement;
    if (select.dataset.filter) {
      handlers.filter?.(select.dataset.filter, select.value);
    }
  };
}

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { rendererReady: true } }; }

export default { render, renderAuthBlockedView, renderSkeletonView, renderErrorView, info, healthCheck, VERSION, MODULE_ID };

// Alias export: consumers import { ui } from this module
export const ui = { render, renderAuthBlockedView, renderSkeletonView, renderErrorView, info, healthCheck, VERSION, MODULE_ID };
