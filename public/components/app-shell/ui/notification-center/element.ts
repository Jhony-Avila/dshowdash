// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: notification-center/element
// PURPOSE: Criação de elementos de notificação
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   config, metrics from ./state.js
// EXPORTS:
//   getIcon — Retorna emoji de ícone
//   escapeHtml — Escapa HTML
//   createNotificationElement — Cria elemento DOM
// BROWSER APIs: document.createElement
// ═══════════════════════════════════════════════════════════════
/**
 * @module NotificationCenterElement
 * @description Criação de elementos de notificação
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

import { config, metrics } from './state.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.ui.notification-center.element';

const ICONS = {
    info: 'ℹ️',
    success: '✅',
    warning: '⚠️',
    error: '❌',
    loading: '⏳'
};

export function getIcon(type: DynObj) {
    return (ICONS as DynObj)[type] || ICONS.info;
}

export function escapeHtml(str: DynObj) {
    if (!str) return '';
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

export function createNotificationElement(notification: DynObj, dismissFn: DynObj) {
    const el = document.createElement('div');
    el.className = `shell-notification ${notification.type}`;
    el.setAttribute('data-id', notification.id);
    el.setAttribute('role', 'alert');
    
    const html = [
        `<span class="shell-notification-icon">${getIcon(notification.type)}</span>`,
        '<div class="shell-notification-content">'
    ];
    
    if (notification.title) {
        html.push(`<p class="shell-notification-title">${escapeHtml(notification.title)}</p>`);
    }
    
    if (notification.message) {
        html.push(`<p class="shell-notification-message">${escapeHtml(notification.message)}</p>`);
    }
    
    if (notification.actions && notification.actions.length > 0) {
        html.push('<div class="shell-notification-actions">');
        notification.actions.forEach((action: DynObj, idx: DynObj) => {
            html.push(`<button class="shell-notification-action${action.primary ? ' primary' : ''}" data-action="${idx}">${escapeHtml(action.label)}</button>`);
        });
        html.push('</div>');
    }
    
    html.push('</div>');
    
    if (notification.dismissible !== false) {
        html.push('<button class="shell-notification-close" aria-label="Fechar">&times;</button>');
    }
    
    if (config.showProgress && notification.duration && notification.type !== 'loading') {
        html.push('<div class="shell-notification-progress" style="width: 100%;"></div>');
    }
    
    el.innerHTML = html.join('');
    
    // Event listeners
    const closeBtn = el.querySelector('.shell-notification-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', e => {
            e.stopPropagation();
            dismissFn(notification.id);
        });
    }
    
    const actionBtns = el.querySelectorAll('.shell-notification-action');
    actionBtns.forEach(btn => {
        btn.addEventListener('click', e => {
            e.stopPropagation();
            // @ts-expect-error strict migration — TS2345
            const idx = parseInt(btn.getAttribute('data-action'), 10);
            const action = notification.actions[idx];
            if (action && action.onClick) {
                action.onClick(notification);
            }
            if (action && action.dismiss !== false) {
                dismissFn(notification.id);
            }
        });
    });
    
    if (notification.onClick) {
        el.style.cursor = 'pointer';
        el.addEventListener('click', () => {
            metrics.clicked++;
            notification.onClick(notification);
        });
    }
    
    if (config.pauseOnHover && notification.duration) {
        el.addEventListener('mouseenter', () => {
            notification._paused = true;
        });
        el.addEventListener('mouseleave', () => {
            notification._paused = false;
        });
    }
    
    return el;
}
