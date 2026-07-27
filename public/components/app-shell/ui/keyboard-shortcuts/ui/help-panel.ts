// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: keyboard-shortcuts/ui/help-panel
// PURPOSE: UI do painel de ajuda com lista de shortcuts
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   isHelpPanelOpen, setHelpPanelOpen from ../state.js
//   getGroupList, getByGroup from ../core/registration.js
// EXPORTS:
//   showHelp — Mostra painel de ajuda
//   hideHelp — Esconde painel de ajuda
// BROWSER APIs: document.createElement, document.getElementById, document.body
// ═══════════════════════════════════════════════════════════════
/**
 * @module KeyboardShortcutsHelpPanel
 * @description Painel de ajuda com shortcuts
 * @version 1.0.0-AAA-ES6
 * @since 2025-02-02
 */
'use strict';

import { isHelpPanelOpen, setHelpPanelOpen } from '../state.js';
import { getGroupList, getByGroup } from '../core/registration.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.ui.keyboard-shortcuts.ui.help-panel';

function _escapeHtml(str: DynObj) {
    if (!str) return '';
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

/**
 * Mostra painel de ajuda com shortcuts
 */
export function showHelp() {
    if (isHelpPanelOpen()) {
        hideHelp();
        return;
    }
    
    if (typeof document === 'undefined') return;
    
    const panel = document.createElement('div');
    panel.id = 'shell-shortcuts-help';
    panel.style.cssText = [
        'position: fixed',
        'top: 50%',
        'left: 50%',
        'transform: translate(-50%, -50%)',
        'background: var(--bg-surface, #fff)',
        'border-radius: 12px',
        'box-shadow: 0 8px 32px rgba(0,0,0,0.2)',
        'padding: 24px',
        'z-index: 99999',
        'max-width: 600px',
        'max-height: 80vh',
        'overflow-y: auto',
        'font-family: system-ui, sans-serif'
    ].join(';');
    
    const html = ['<h2 style="margin: 0 0 16px 0; font-size: 18px;">Atalhos de Teclado</h2>'];
    
    const groups = getGroupList();
    groups.forEach(g => {
        const shortcuts = getByGroup(g.name);
        if (shortcuts.length === 0) return;
        
        html.push('<div style="margin-bottom: 16px;">');
        html.push(`<h3 style="margin: 0 0 8px 0; font-size: 14px; color: #666; text-transform: capitalize;">${_escapeHtml(g.name)}</h3>`);
        
        shortcuts.forEach(s => {
            html.push('<div style="display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #eee;">');
            html.push(`<span style="color: #333;">${_escapeHtml(s.description || s.combo)}</span>`);
            html.push(`<kbd style="background: #f5f5f5; padding: 2px 8px; border-radius: 4px; font-family: monospace; font-size: 12px;">${_escapeHtml(s.combo.toUpperCase())}</kbd>`);
            html.push('</div>');
        });
        
        html.push('</div>');
    });
    
    html.push('<button id="shell-shortcuts-help-close" style="margin-top: 16px; padding: 8px 16px; border: none; background: #007bff; color: white; border-radius: 6px; cursor: pointer;">Fechar</button>');
    
    panel.innerHTML = html.join('');
    
    // Backdrop
    const backdrop = document.createElement('div');
    backdrop.id = 'shell-shortcuts-help-backdrop';
    backdrop.style.cssText = 'position: fixed; top: 0; left: 0; right: 0; bottom: 0; background: rgba(0,0,0,0.5); z-index: 99998;';
    backdrop.onclick = hideHelp;
    
    document.body.appendChild(backdrop);
    document.body.appendChild(panel);
    
    (panel.querySelector('#shell-shortcuts-help-close') as any).onclick = hideHelp;
    
    setHelpPanelOpen(true);
}

/**
 * Esconde painel de ajuda
 */
export function hideHelp() {
    if (typeof document === 'undefined') return;
    
    const panel = document.getElementById('shell-shortcuts-help');
    const backdrop = document.getElementById('shell-shortcuts-help-backdrop');
    
    // @ts-expect-error strict migration — TS18047
    if (panel) panel.parentNode.removeChild(panel);
    // @ts-expect-error strict migration — TS18047
    if (backdrop) backdrop.parentNode.removeChild(backdrop);
    
    setHelpPanelOpen(false);
}

export default {
    showHelp, hideHelp
};
