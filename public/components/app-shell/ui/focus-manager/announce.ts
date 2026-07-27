// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: focus-manager/announce
// PURPOSE: Anúncios para screen readers (ARIA live regions)
// ───────────────────────────────────────────────────────────────
// IMPORTS: none
// EXPORTS:
//   announce — Anuncia mensagem para screen readers
// BROWSER APIs: document.createElement, document.getElementById
// ARIA: role="status", aria-live, aria-atomic
// ═══════════════════════════════════════════════════════════════
/**
 * @module FocusManagerAnnounce
 * @description Anúncios de acessibilidade via ARIA live regions
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

type DynObj = any;

export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.ui.focus-manager.announce';

/**
 * Anuncia mensagem para screen readers
 * @param {string} message - Mensagem a anunciar
 * @param {string} priority - 'polite' ou 'assertive'
 * @returns {Object} Resultado { ok: true }
 */
export function announce(message: string, priority: DynObj) {
    priority = priority || 'polite';
    
    let announcer = document.getElementById('shell-announcer');
    
    if (!announcer) {
        announcer = document.createElement('div');
        announcer.id = 'shell-announcer';
        announcer.setAttribute('role', 'status');
        announcer.setAttribute('aria-live', priority);
        announcer.setAttribute('aria-atomic', 'true');
        announcer.style.cssText = 'position: absolute; left: -10000px; width: 1px; height: 1px; overflow: hidden;';
        document.body.appendChild(announcer);
    }
    
    announcer.setAttribute('aria-live', priority);
    announcer.textContent = '';
    
    // Delay para garantir que screen readers detectem a mudança
    setTimeout(() => {
        announcer.textContent = message;
    }, 50);
    
    return { ok: true };
}
