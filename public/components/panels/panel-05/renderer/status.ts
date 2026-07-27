// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-05:renderer:status
// PURPOSE: Panel-05 Status Renderer - AAA
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   updateLoading() — exported function
//   updateError() — exported function
//   updateCountdown() — exported function
//   hideStatus() — exported function
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

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-05:renderer:status';

// ═══════════════════════════════════════════════════════════════
// UPDATE LOADING
// ═══════════════════════════════════════════════════════════════
export function updateLoading(refs: Record<string, unknown> | null, isLoading: boolean) {
    if (!refs?.statusOverlay) return;
    const statusOverlay = refs.statusOverlay as HTMLElement;
    const spinner = refs.spinner as HTMLElement | null;
    const statusMessage = refs.statusMessage as HTMLElement | null;
    const retryBtn = refs.retryBtn as HTMLElement | null;

    if (isLoading) {
        statusOverlay.style.display = 'flex';
        statusOverlay.classList.add('p05-loading');
        statusOverlay.classList.remove('p05-error');
        if (spinner) spinner.style.display = 'block';
        if (statusMessage) statusMessage.textContent = 'Carregando...';
        if (retryBtn) retryBtn.style.display = 'none';
    } else {
        statusOverlay.classList.remove('p05-loading');
    }
}

// ═══════════════════════════════════════════════════════════════
// UPDATE ERROR
// ═══════════════════════════════════════════════════════════════
export function updateError(refs: Record<string, unknown> | null, error: unknown) {
    if (!refs?.statusOverlay) return;
    const statusOverlay = refs.statusOverlay as HTMLElement;
    const spinner = refs.spinner as HTMLElement | null;
    const statusMessage = refs.statusMessage as HTMLElement | null;
    const retryBtn = refs.retryBtn as HTMLElement | null;

    if (error) {
        statusOverlay.style.display = 'flex';
        statusOverlay.classList.remove('p05-loading');
        statusOverlay.classList.add('p05-error');
        if (spinner) spinner.style.display = 'none';
        if (statusMessage) {
            const msg = typeof error === 'string' ? error : 'Erro ao carregar dados';
            statusMessage.textContent = msg;
        }
        if (retryBtn) retryBtn.style.display = 'inline-block';
    } else {
        statusOverlay.classList.remove('p05-error');
        if (!statusOverlay.classList.contains('p05-loading')) {
            statusOverlay.style.display = 'none';
        }
    }
}

// ═══════════════════════════════════════════════════════════════
// UPDATE COUNTDOWN
// ═══════════════════════════════════════════════════════════════
export function updateCountdown(refs: Record<string, unknown> | null, seconds: number | null | undefined) {
    if (!refs?.countdown) return;
    const countdown = refs.countdown as HTMLElement;

    if (seconds === null || seconds === undefined) {
        countdown.textContent = '--';
        countdown.className = 'p05-countdown p05-paused';
    } else if (seconds <= 5) {
        countdown.textContent = `${seconds}s`;
        countdown.className = 'p05-countdown p05-warning';
    } else {
        countdown.textContent = `${seconds}s`;
        countdown.className = 'p05-countdown p05-active';
    }
}

// ═══════════════════════════════════════════════════════════════
// HIDE STATUS (when data loaded successfully)
// ═══════════════════════════════════════════════════════════════
export function hideStatus(refs: Record<string, unknown> | null) {
    if (!refs?.statusOverlay) return;
    const statusOverlay = refs.statusOverlay as HTMLElement;
    statusOverlay.style.display = 'none';
    statusOverlay.classList.remove('p05-loading', 'p05-error');
}

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { statusReady: true } }; }

export default { updateLoading, updateError, updateCountdown, hideStatus, info, healthCheck };
