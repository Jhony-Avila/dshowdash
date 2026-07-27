// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.4.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panels-panel-account-security-ui-renderer
// PURPOSE: Panel Account Security - Renderer
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   renderSkeleton, renderAuthBlocked, renderError, renderSecurity from ./templat...
//
// PROVIDES:
//   render() — exported function
//   renderAuthBlockedView() — exported function
//   renderSkeletonView() — exported function
//   renderErrorView() — exported function
//   MODULE_ID — module constant
//   VERSION — module constant
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   'click'
//   'input'
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { renderSkeleton, renderAuthBlocked, renderError, renderSecurity } from './template.js';

interface RendererHandlers {
  togglePasswordForm?: () => void;
  changePassword?: () => void;
  goToSessions?: () => void;
  logoutAllSessions?: () => void;
  retry?: () => void;
  openLogin?: () => void;
  updatePasswordField?: (field: string | undefined, value: string) => void;
}

interface RendererState {
  loading: unknown;
  error: unknown;
  securityInfo: unknown;
  showPasswordForm: unknown;
  passwordForm: unknown;
  saving: unknown;
}

export function render(container: HTMLElement, state: RendererState, handlers: RendererHandlers) {
  if (!container) return;
  const { loading, error, securityInfo, showPasswordForm, passwordForm, saving } = state;

  if (loading && !securityInfo) { container.innerHTML = renderSkeleton(); return; }
  if (error && !securityInfo) { container.innerHTML = renderError(error as string); setupHandlers(container, handlers); return; }
  if (securityInfo) { container.innerHTML = renderSecurity(securityInfo as Record<string, unknown>, showPasswordForm as boolean, passwordForm as { current: string; new: string; confirm: string }, saving as boolean); setupHandlers(container, handlers); }
}

export function renderAuthBlockedView(container: HTMLElement, handlers: RendererHandlers) {
  if (!container) return;
  container.innerHTML = renderAuthBlocked();
  container.querySelector('[data-action="login"]')?.addEventListener('click', handlers?.openLogin as EventListenerOrEventListenerObject);
}

export function renderSkeletonView(container: HTMLElement) { if (container) container.innerHTML = renderSkeleton(); }
export function renderErrorView(container: HTMLElement, message: string, handlers: RendererHandlers) {
  if (!container) return;
  container.innerHTML = renderError(message);
  setupHandlers(container, handlers);
}

function setupHandlers(container: HTMLElement, handlers: RendererHandlers) {
  if (!handlers) return;

  container.addEventListener('click', (e: Event) => {
    const action = (e.target as HTMLElement).closest('[data-action]') as HTMLElement | null;
    const actionName = action?.dataset.action;
    if (!actionName) return;

    switch (actionName) {
      case 'toggle-password-form': handlers.togglePasswordForm?.(); break;
      case 'change-password': handlers.changePassword?.(); break;
      case 'go-sessions': handlers.goToSessions?.(); break;
      case 'logout-all': handlers.logoutAllSessions?.(); break;
      case 'retry': handlers.retry?.(); break;
      case 'login': handlers.openLogin?.(); break;
    }
  });

  container.querySelectorAll('.password-form input[data-field]').forEach((input: Element) => {
    input.addEventListener('input', (e: Event) => handlers.updatePasswordField?.((e.target as HTMLInputElement).dataset.field, (e.target as HTMLInputElement).value));
  });
}

export default { render, renderAuthBlockedView, renderSkeletonView, renderErrorView };

export const MODULE_ID = 'panels-panel-account-security-ui-renderer';
export const VERSION = '9.3.0-P2-ENTERPRISE';
export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { rendererReady: true } }; }
