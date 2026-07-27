// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.8.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: push-notifications
// PURPOSE: Panel module
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   isSupported() — exported function
//   isPermissionGranted() — exported function
//   showNotification() — exported function
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

export const MODULE_ID = 'panel-01.utils.push-notifications';
export const VERSION = '9.3.0-P2-ENTERPRISE';
/**
 * Panel 01 - Push Notifications Utility
 * @module panel-01/utils/push-notifications
 * @version 1.1.0-AAA
 */

export async function requestPermission() {
    if (!('Notification' in window)) return false;
    
    const permission = await Notification.requestPermission();
    return permission === 'granted';
}

export function isSupported() {
    return 'Notification' in window;
}

export function isPermissionGranted() {
    return Notification.permission === 'granted';
}

export function showNotification(title: string, options: Record<string, unknown> = {}) {
    if (!isPermissionGranted()) return null;
    
    return new Notification(title, {
        icon: '/assets/icons/notification-icon.png',
        badge: '/assets/icons/badge-icon.png',
        ...options
    });
}

export default { requestPermission, isSupported, isPermissionGranted, showNotification };
