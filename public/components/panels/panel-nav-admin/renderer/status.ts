// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (9.4.0-P18EC-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-nav-admin.renderer.status
// PURPOSE: Panel Nav Admin - Status Renderer
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   renderStatus() — exported function
//   updateLoading() — exported function
//   updateError() — exported function
//   hideStatus() — exported function
//   updateCountdown() — exported function
//
// @changelog
//   9.4.0-P18EC - Add updateCountdown() consumed by index.js
//   8.1.0-ENTERPRISE-AAA - Previous version
// ═══════════════════════════════════════════════════════════════
'use strict';

export const MODULE_ID = 'panel-nav-admin.renderer.status';
export const VERSION = '9.4.0-P18EC-ENTERPRISE';

export function renderStatus(container: HTMLElement | string, status: string) {
  const statusConfig: Record<string, { icon: string; class: string; label: string }> = {
    active: { icon: 'fa-check-circle', class: 'status-active', label: 'Ativo' },
    inactive: { icon: 'fa-times-circle', class: 'status-inactive', label: 'Inativo' },
    pending: { icon: 'fa-clock', class: 'status-pending', label: 'Pendente' },
    error: { icon: 'fa-exclamation-circle', class: 'status-error', label: 'Erro' }
  };

  const config = statusConfig[status] || statusConfig.inactive;

  const html = '<span class="nav-item-status ' + config.class + '"><i class="fas ' + config.icon + '"></i><span class="status-label">' + config.label + '</span></span>';

  if (typeof container === 'string') {
    const el = document.querySelector(container);
    if (el) el.innerHTML = html;
  } else if (container instanceof HTMLElement) {
    container.innerHTML = html;
  }

  return html;
}

interface StatusRefs {
  loadingOverlay?: HTMLElement | null;
  loading?: HTMLElement | null;
  content?: HTMLElement | null;
  errorMessage?: HTMLElement | null;
  error?: HTMLElement | null;
  countdownEl?: HTMLElement | null;
  countdown?: HTMLElement | null;
  refreshCountdown?: HTMLElement | null;
  [key: string]: unknown;
}

export function updateLoading(refs: StatusRefs, isLoading: boolean) {
  if (!refs) return;
  const el = refs.loadingOverlay || refs.loading;
  if (el) el.style.display = isLoading ? '' : 'none';
  // Anti-flicker: não alterar opacity durante refresh — causa flickering visual
}

export function updateError(refs: StatusRefs, error: Error | string | null) {
  if (!refs) return;
  const el = refs.errorMessage || refs.error;
  if (el) {
    el.style.display = error ? '' : 'none';
    el.textContent = (error instanceof Error ? error.message : null) || (typeof error === 'string' ? error : '');
  }
}

export function hideStatus(refs: StatusRefs) {
  if (!refs) return;
  const el = refs.loadingOverlay || refs.loading;
  if (el) el.style.display = 'none';
  const err = refs.errorMessage || refs.error;
  if (err) err.style.display = 'none';
}

// v9.4.0-P18EC: updateCountdown - Updates countdown timer display, consumed by index.js
// @param {Object} refs - DOM references containing countdownEl or countdown element
// @param {number} seconds - Remaining seconds to display
export function updateCountdown(refs: StatusRefs, seconds: number) {
  if (!refs) return;
  const el = refs.countdownEl || refs.countdown || refs.refreshCountdown;
  if (!el) return;
  if (seconds <= 0) {
    el.textContent = 'Atualizando...';
    return;
  }
  const min = Math.floor(seconds / 60);
  const sec = seconds % 60;
  el.textContent = min > 0 ? min + 'm ' + sec + 's' : sec + 's';
}

export default { renderStatus, updateLoading, updateError, hideStatus, updateCountdown };
