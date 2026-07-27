// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: notification-center/container
// PURPOSE: Gerenciamento do container DOM de notificações
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   config, containerElement from ./state.js
//   injectStyles from ./styles.js
// EXPORTS:
//   ensureContainer — Garante existência do container
//   updateContainerPosition — Atualiza posição do container
// BROWSER APIs: document.createElement, document.body
// ARIA: role="alert", aria-live
// ═══════════════════════════════════════════════════════════════
/**
 * @module NotificationCenterContainer
 * @description Gerenciamento do container de notificações
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

import { config, containerElement } from './state.js';
import { injectStyles } from './styles.js';

export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.ui.notification-center.container';

/**
 * Garante que o container de notificações existe
 * @returns {HTMLElement} O container
 */
export function ensureContainer() {
    if (containerElement.value && document.body.contains(containerElement.value)) {
        return containerElement.value;
    }
    
    injectStyles();
    
    containerElement.value = document.createElement('div');
    containerElement.value.className = `shell-notification-container ${config.position}`;
    containerElement.value.setAttribute('role', 'alert');
    containerElement.value.setAttribute('aria-live', 'polite');
    document.body.appendChild(containerElement.value);
    
    return containerElement.value;
}

/**
 * Atualiza a posição do container
 */
export function updateContainerPosition() {
    if (!containerElement.value) return;
    containerElement.value.className = `shell-notification-container ${config.position}`;
}
