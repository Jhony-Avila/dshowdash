// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.2.0-P04-XSS)
// ═══════════════════════════════════════════════════════════════
// MODULE: notification-manager-core-renderer
// PURPOSE: Notification Manager - Core Renderer
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   createNotificationElement() — exported function
//   healthCheck() — exported function
//   info() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '2.2.0-P04-XSS';
export const MODULE_ID = 'notification-manager-core-renderer';

function escapeHtml(str: string) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
}

export function createNotificationElement(notification: { id: string; type?: string; message?: string; [key: string]: unknown }) {
    const el = document.createElement('div');
    // @ts-expect-error strict migration — TS2345
    el.className = `notification notification-${escapeHtml(notification.type) || 'info'}`;
    el.dataset.notificationId = notification.id;
    // @ts-expect-error strict migration — TS2345
    el.innerHTML = `<div class="notification-content">${escapeHtml(notification.message)}</div>`;
    return el;
}

export function healthCheck() {
    return {
        status: 'HEALTHY',
        score: '1/1',
        checks: { available: true, xssSanitized: true },
        version: VERSION,
        moduleId: MODULE_ID,
        p04Compliant: true,
        timestamp: Date.now()
    };
}

export function info() {
    return { moduleId: MODULE_ID, version: VERSION, p04Compliant: true, timestamp: Date.now() };
}

export default { createNotificationElement, healthCheck, info, VERSION, MODULE_ID };
