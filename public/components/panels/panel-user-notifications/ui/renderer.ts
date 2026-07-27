// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.4.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panels-panel-user-notifications-ui-renderer
// PURPOSE: Panel User Notifications - Renderer
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   renderSkeleton, renderAuthBlocked, renderError, renderNotifications from ./te...
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
//   'change'
//   'click'
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { renderSkeleton, renderAuthBlocked, renderError, renderNotifications } from './template.js';

interface RendererHandlers {
  save?: () => void;
  cancel?: () => void;
  retry?: () => void;
  openLogin?: () => void;
  updateSetting?: (category: string, key: string, value: unknown) => void;
  [key: string]: unknown;
}

interface RenderState {
  loading?: boolean;
  error?: string | null;
  settings?: Record<string, unknown> | null;
  isDirty?: boolean;
  saving?: boolean;
  [key: string]: unknown;
}

export function render(container: HTMLElement, state: RenderState, handlers: RendererHandlers) {
  if (!container) return;
  const { loading, error, settings, isDirty, saving } = state;

  if (loading && !settings) { container.innerHTML = renderSkeleton(); return; }
  if (error && !settings) { container.innerHTML = renderError(error as string); setupHandlers(container, handlers); return; }
  if (settings) { container.innerHTML = renderNotifications(settings, isDirty as boolean, saving as boolean); setupHandlers(container, handlers); }
}

export function renderAuthBlockedView(container: HTMLElement, handlers: RendererHandlers) {
  if (!container) return;
  container.innerHTML = renderAuthBlocked();
  container.querySelector('[data-action="login"]')?.addEventListener('click', () => handlers?.openLogin?.());
}

export function renderSkeletonView(container: HTMLElement) { if (container) container.innerHTML = renderSkeleton(); }
export function renderErrorView(container: HTMLElement, message: string, handlers: RendererHandlers) {
  if (!container) return;
  container.innerHTML = renderError(message);
  setupHandlers(container, handlers);
}

function setupHandlers(container: HTMLElement, handlers: RendererHandlers) {
  if (!handlers) return;

  container.addEventListener('click', (e: MouseEvent) => {
    const target = e.target as HTMLElement | null;
    const action = target?.closest('[data-action]')?.getAttribute('data-action');
    if (!action) return;
    switch (action) {
      case 'save': handlers.save?.(); break;
      case 'cancel': handlers.cancel?.(); break;
      case 'retry': handlers.retry?.(); break;
      case 'login': handlers.openLogin?.(); break;
    }
  });

  container.addEventListener('change', (e: Event) => {
    const target = e.target as HTMLInputElement | null;
    if (!target) return;
    const category = target.dataset.category;
    const key = target.dataset.key;
    if (!category || !key) return;

    let value: unknown;
    if (target.type === 'checkbox') value = target.checked;
    else if (target.type === 'radio') value = target.value;
    else value = target.value;

    handlers.updateSetting?.(category, key, value);
  });
}

export default { render, renderAuthBlockedView, renderSkeletonView, renderErrorView };

export const MODULE_ID = 'panels-panel-user-notifications-ui-renderer';
export const VERSION = '9.3.0-P2-ENTERPRISE';
export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { rendererReady: true } }; }
