// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.4.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-user-sessions.ui.renderer
// PURPOSE: Panel User Sessions - Renderer
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   renderSkeleton, renderAuthBlocked, renderError, renderSessions from ./templat...
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
//   'click'
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { renderSkeleton, renderAuthBlocked, renderError, renderSessions, Session, LoginHistoryEntry } from './template.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-user-sessions.ui.renderer';

interface RendererState {
  loading: boolean;
  error: string | null;
  sessions: Session[];
  currentSessionId: string | null;
  loginHistory: LoginHistoryEntry[];
  terminating: string | null;
}

interface RendererHandlers {
  terminateSession?: (sessionId: string) => void;
  terminateAllOthers?: () => void;
  retry?: () => void;
  openLogin?: () => void;
}

export function render(container: HTMLElement, state: RendererState, handlers: RendererHandlers) {
  if (!container) return;
  const { loading, error, sessions, currentSessionId, loginHistory, terminating } = state;
  
  if (loading && sessions.length === 0) { container.innerHTML = renderSkeleton(); return; }
  if (error && sessions.length === 0) { container.innerHTML = renderError(error); setupHandlers(container, handlers); return; }
  container.innerHTML = renderSessions(sessions, currentSessionId, loginHistory, terminating);
  setupHandlers(container, handlers);
}

export function renderAuthBlockedView(container: HTMLElement, handlers: RendererHandlers) {
  if (!container) return;
  container.innerHTML = renderAuthBlocked();
  // @ts-expect-error strict migration — TS2769
  container.querySelector('[data-action="login"]')?.addEventListener('click', handlers?.openLogin);
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
    const btn = (e.target as Element | null)?.closest('[data-action]') as HTMLElement | null;
    if (!btn) return;
    const action = btn.dataset.action;
    
    switch (action) {
      case 'terminate':
        const sessionId = btn.dataset.sessionId;
        if (sessionId) handlers.terminateSession?.(sessionId);
        break;
      case 'terminate-all':
        handlers.terminateAllOthers?.();
        break;
      case 'retry':
        handlers.retry?.();
        break;
      case 'login':
        handlers.openLogin?.();
        break;
    }
  });
}

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { rendererReady: true } }; }

export default { render, renderAuthBlockedView, renderSkeletonView, renderErrorView, info, healthCheck, VERSION, MODULE_ID };
