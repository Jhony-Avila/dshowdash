// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.4.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-user-profile.ui.renderer
// PURPOSE: Panel User Profile - Renderer
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   renderSkeleton, renderAuthBlocked, renderError, renderProfile from ./template.js
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

import { renderSkeleton, renderAuthBlocked, renderError, renderProfile } from './template.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-user-profile.ui.renderer';

export function render(container: HTMLElement, state: Record<string, unknown>, handlers: Record<string, ((...args: unknown[]) => void) | undefined>) {
  if (!container) return;

  const { loading, error, profile, avatars, showAvatarPicker, isDirty, saving } = state;

  if (loading && !profile) {
    container.innerHTML = renderSkeleton();
    return;
  }

  if (error && !profile) {
    container.innerHTML = renderError(error as string);
    setupEventHandlers(container, handlers);
    return;
  }

  if (!profile) {
    container.innerHTML = renderError('Perfil não encontrado');
    setupEventHandlers(container, handlers);
    return;
  }

  container.innerHTML = renderProfile(profile as Record<string, unknown>, avatars as Array<{ url: string; name?: string }>, showAvatarPicker as boolean, isDirty as boolean, saving as boolean);
  setupEventHandlers(container, handlers);
}

export function renderAuthBlockedView(container: HTMLElement, handlers: Record<string, ((...args: unknown[]) => void) | undefined>) {
  if (!container) return;
  container.innerHTML = renderAuthBlocked();
  setupEventHandlers(container, handlers);
}

export function renderSkeletonView(container: HTMLElement) {
  if (!container) return;
  container.innerHTML = renderSkeleton();
}

export function renderErrorView(container: HTMLElement, message: string, handlers: Record<string, ((...args: unknown[]) => void) | undefined>) {
  if (!container) return;
  container.innerHTML = renderError(message);
  setupEventHandlers(container, handlers);
}

function setupEventHandlers(container: HTMLElement, handlers: Record<string, ((...args: unknown[]) => void) | undefined>) {
  if (!container || !handlers) return;

  container.onclick = (e: MouseEvent) => {
    const btn = (e.target as HTMLElement).closest('[data-action]') as HTMLElement | null;
    if (!btn) return;

    const action = btn.dataset.action;
    if (action === 'toggle-avatar-picker') handlers.toggleAvatarPicker?.();
    else if (action === 'close-picker') handlers.closeAvatarPicker?.();
    else if (action === 'select-avatar') handlers.selectAvatar?.(btn.dataset.url);
    else if (action === 'save') handlers.save?.();
    else if (action === 'cancel' || action === 'retry') handlers.cancel?.();
    else if (action === 'login') handlers.openLogin?.();
  };

  container.oninput = (e: Event) => {
    const input = (e.target as HTMLElement).closest('[data-field]') as HTMLInputElement | null;
    if (input) {
      input.classList.add('dirty');
      handlers.updateField?.(input.dataset.field, input.value);
    }
  };
}

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { rendererReady: true } }; }

export default { render, renderAuthBlockedView, renderSkeletonView, renderErrorView, info, healthCheck, VERSION, MODULE_ID };
