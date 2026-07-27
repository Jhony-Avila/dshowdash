// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-nav-admin-handlers-keyboard
// PURPOSE: Keyboard Handler - Enterprise AAA
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   PANEL_ID from ../core/contracts.js
//
// PROVIDES:
//   createKeyboardHandlers() — exported function
//   KEYBOARD_SHORTCUTS — exported value
//   info() — exported function
//   healthCheck() — exported function
//   MODULE_ID — module constant
//   VERSION — module constant
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

import * as crud from './crud.js';
import * as uiActions from './ui-actions.js';
import { PANEL_ID } from '../core/contracts.js';
import { clearEditState } from './inline-edit.js';

const MODULE_ID = 'panel-nav-admin-handlers-keyboard';
const VERSION = '11.7.0-ESCAPE-EDIT';

interface KeyboardDeps {
    container: HTMLElement;
    refs: Record<string, HTMLElement>;
    scheduler: { refresh: () => void };
}

export function createKeyboardHandlers(deps: KeyboardDeps) {
    const { container, refs, scheduler } = deps;

    function handleGlobalKeydown(e: KeyboardEvent) {
        if (!container) return;
        const activeEl = document.activeElement;
        if (!activeEl || !activeEl.closest || !activeEl.closest(`[data-panel-id="${PANEL_ID}"]`)) return;
        const isInputFocused = ['INPUT', 'TEXTAREA', 'SELECT'].indexOf((e.target as HTMLElement)?.tagName) !== -1;
        if (e.ctrlKey && e.key === 's') { e.preventDefault(); return; }
        if (e.key === 'Escape') {
            // v11.7.0: Cancel active inline edit first, then close modals
            clearEditState();
            uiActions.closeAllModals(container);
            if (refs?.quickActions) refs.quickActions.classList.remove('open');
            if (refs?.searchWrapper) refs.searchWrapper.classList.remove('has-results');
            return;
        }
        if (isInputFocused) return;
        if (e.key === 'r' && !e.ctrlKey && !e.metaKey) { e.preventDefault(); scheduler.refresh(); return; }
        if (e.key === 'n' && !e.ctrlKey && !e.metaKey) { e.preventDefault(); crud.openItemForm(container); return; }
        if (e.key === '/') { e.preventDefault(); if (refs?.filterSearch) refs.filterSearch.focus(); return; }
        if (e.key === '?' && e.shiftKey) { e.preventDefault(); return; }
    }

    function handleInputKeydown(e: KeyboardEvent) {
        if (e.key === 'Enter' && (e.target as HTMLElement)?.dataset?.input === 'validate-route') { e.preventDefault(); return { action: 'validate-route' }; }
        if (e.key === 'Escape' && refs?.searchWrapper?.classList.contains('has-results')) { refs.searchWrapper.classList.remove('has-results'); return { action: 'close-autocomplete' }; }
        return null;
    }

    return { handleGlobalKeydown, handleInputKeydown };
}

export const KEYBOARD_SHORTCUTS = {
    'r': 'Atualizar dados (refresh)',
    'n': 'Novo item (abrir formulário)',
    '/': 'Focar busca',
    'Escape': 'Cancelar edição ativa / Fechar modais',
    'Ctrl+S': 'Salvar (prevenido)',
    '?': 'Mostrar atalhos'
};

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { keyboardReady: true } }; }

export { MODULE_ID, VERSION };
