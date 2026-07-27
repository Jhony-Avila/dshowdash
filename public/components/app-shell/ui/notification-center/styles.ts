// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: notification-center/styles
// PURPOSE: Injeção de CSS para notification center
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   config, stylesInjected from ./state.js
// EXPORTS:
//   injectStyles — Injeta CSS no document.head
// BROWSER APIs: document.createElement, document.head
// ═══════════════════════════════════════════════════════════════
/**
 * @module NotificationCenterStyles
 * @description Estilos CSS do notification center
 * @version 1.0.0-AAA-ES6
 * @since 2025-02-02
 */
'use strict';

import { config, stylesInjected } from './state.js';

export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.ui.notification-center.styles';

/**
 * Injeta estilos CSS no document
 */
export function injectStyles() {
    if (stylesInjected.value || typeof document === 'undefined') return;
    
    const css = [
        '.shell-notification-container {',
        '  position: fixed;',
        '  z-index: 99999;',
        '  pointer-events: none;',
        '  display: flex;',
        '  flex-direction: column;',
        `  gap: ${config.stackSpacing}px;`,
        '  max-width: 420px;',
        '  width: 100%;',
        '  padding: 16px;',
        '  box-sizing: border-box;',
        '}',
        '.shell-notification-container.top-right { top: 0; right: 0; }',
        '.shell-notification-container.top-left { top: 0; left: 0; }',
        '.shell-notification-container.top-center { top: 0; left: 50%; transform: translateX(-50%); }',
        '.shell-notification-container.bottom-right { bottom: 0; right: 0; flex-direction: column-reverse; }',
        '.shell-notification-container.bottom-left { bottom: 0; left: 0; flex-direction: column-reverse; }',
        '.shell-notification-container.bottom-center { bottom: 0; left: 50%; transform: translateX(-50%); flex-direction: column-reverse; }',
        '',
        '.shell-notification {',
        '  pointer-events: auto;',
        '  background: var(--notification-bg, #fff);',
        '  border-radius: 8px;',
        '  box-shadow: 0 4px 12px rgba(0,0,0,0.15);',
        '  padding: 14px 16px;',
        '  display: flex;',
        '  align-items: flex-start;',
        '  gap: 12px;',
        '  opacity: 0;',
        '  transform: translateX(100%);',
        `  transition: all ${config.animationDuration}ms ease;`,
        '  position: relative;',
        '  overflow: hidden;',
        '}',
        '.shell-notification.visible { opacity: 1; transform: translateX(0); }',
        '.shell-notification.exiting { opacity: 0; transform: translateX(100%); }',
        '',
        '.shell-notification-icon { font-size: 20px; flex-shrink: 0; line-height: 1; }',
        '.shell-notification.info .shell-notification-icon { color: #2196F3; }',
        '.shell-notification.success .shell-notification-icon { color: #4CAF50; }',
        '.shell-notification.warning .shell-notification-icon { color: #FF9800; }',
        '.shell-notification.error .shell-notification-icon { color: #F44336; }',
        '.shell-notification.loading .shell-notification-icon { color: #9E9E9E; }',
        '',
        '.shell-notification-content { flex: 1; min-width: 0; }',
        '.shell-notification-title { font-weight: 600; font-size: 14px; color: var(--notification-title, #1a1a1a); margin: 0 0 4px 0; }',
        '.shell-notification-message { font-size: 13px; color: var(--notification-message, #666); margin: 0; line-height: 1.4; }',
        '',
        '.shell-notification-close { background: none; border: none; color: var(--notification-close, #999); cursor: pointer; padding: 4px; margin: -4px; font-size: 18px; line-height: 1; opacity: 0.7; transition: opacity 0.2s; }',
        '.shell-notification-close:hover { opacity: 1; }',
        '',
        '.shell-notification-progress { position: absolute; bottom: 0; left: 0; height: 3px; background: currentColor; opacity: 0.3; transition: width linear; }',
        '',
        '.shell-notification-actions { display: flex; gap: 8px; margin-top: 10px; }',
        '.shell-notification-action { padding: 6px 12px; border-radius: 4px; font-size: 12px; font-weight: 500; cursor: pointer; border: 1px solid currentColor; background: transparent; transition: all 0.2s; }',
        '.shell-notification-action.primary { background: currentColor; color: white; }'
    ].join('\n');
    
    const style = document.createElement('style');
    style.id = 'shell-notification-styles';
    style.textContent = css;
    document.head.appendChild(style);
    stylesInjected.value = true;
}
