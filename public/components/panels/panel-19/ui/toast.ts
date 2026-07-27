// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.4.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: toast
// PURPOSE: Panel module
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   showToast() — exported function
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

export const MODULE_ID = 'panel-19.ui.toast';
export const VERSION = '9.3.0-P2-ENTERPRISE';
/**
 * Panel 19 - Toast Notifications
 * @module panel-19/ui/toast
 * @version 1.1.0-AAA
 */

const TOAST_DURATION = 3000;

export function showToast(message: string, type = 'info') {
    const container = getToastContainer();
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <i class="fas ${getToastIcon(type)}"></i>
        <span class="toast-message">${message}</span>
    `;
    
    container.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 10);
    setTimeout(() => removeToast(toast), TOAST_DURATION);
}

function getToastContainer() {
    let container = document.querySelector('.toast-container');
    if (!container) {
        container = document.createElement('div');
        container.className = 'toast-container';
        document.body.appendChild(container);
    }
    return container;
}

function getToastIcon(type: string) {
    const icons: Record<string, string> = { success: 'fa-check-circle', error: 'fa-times-circle', warning: 'fa-exclamation-triangle', info: 'fa-info-circle' };
    return icons[type] || icons.info;
}

function removeToast(toast: HTMLElement) {
    toast.classList.remove('show');
    setTimeout(() => toast.remove(), 300);
}

export default { showToast };

// Alias export for consumers expecting ToastManager
export const ToastManager = { showToast };
