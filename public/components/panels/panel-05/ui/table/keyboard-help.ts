// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-05:table:keyboard-help
// PURPOSE: Panel-05 Table Keyboard Help
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   ICONS from ./constants.js
//
// PROVIDES:
//   KeyboardHelpMixin — exported value
//   MODULE_ID — module constant
//   VERSION — module constant
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

import { ICONS } from './constants.js';

const ARROW_SVGS = {
  up: '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;"><polyline points="18 15 12 9 6 15"/></svg>',
  down: '<svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle;"><polyline points="6 9 12 15 18 9"/></svg>'
};

export const KeyboardHelpMixin = {
  _showKeyboardHelp() {
    // @ts-expect-error strict migration — TS2339
    if (this._state.keyboardHelpOpen) return;
    // @ts-expect-error strict migration — TS2339
    this._state.keyboardHelpOpen = true;

    const overlay = document.createElement('div');
    overlay.className = 'p05-keyboard-overlay';

    const help = document.createElement('div');
    help.className = 'p05-keyboard-help';
    help.innerHTML = `<div class="p05-kbd-header"><span class="p05-kbd-icon">${ICONS.keyboard}</span><h3>Atalhos de Teclado</h3><button class="p05-kbd-close" data-action="close-shortcuts">${ICONS.x}</button></div><div class="p05-kbd-grid"><div class="p05-kbd-section"><h4>Navegação</h4><div class="p05-kbd-row"><kbd>J</kbd> / <kbd>${ARROW_SVGS.down}</kbd><span>Próxima linha</span></div><div class="p05-kbd-row"><kbd>K</kbd> / <kbd>${ARROW_SVGS.up}</kbd><span>Linha anterior</span></div><div class="p05-kbd-row"><kbd>Enter</kbd><span>Ver detalhes</span></div><div class="p05-kbd-row"><kbd>E</kbd><span>Expandir/Colapsar</span></div></div><div class="p05-kbd-section"><h4>Seleção</h4><div class="p05-kbd-row"><kbd>X</kbd><span>Selecionar linha</span></div><div class="p05-kbd-row"><kbd>Shift</kbd> + <kbd>${ARROW_SVGS.down}${ARROW_SVGS.up}</kbd><span>Estender seleção</span></div><div class="p05-kbd-row"><kbd>Ctrl</kbd> + <kbd>A</kbd><span>Selecionar todos</span></div><div class="p05-kbd-row"><kbd>Esc</kbd><span>Limpar seleção</span></div></div><div class="p05-kbd-section"><h4>Ações</h4><div class="p05-kbd-row"><kbd>V</kbd><span>Ver detalhes</span></div><div class="p05-kbd-row"><kbd>F</kbd><span>Favoritar</span></div><div class="p05-kbd-row"><kbd>D</kbd><span>Excluir</span></div><div class="p05-kbd-row"><kbd>/</kbd> ou <kbd>Ctrl+F</kbd><span>Buscar</span></div></div></div><div class="p05-kbd-footer"><span>Pressione <kbd>?</kbd> para abrir/fechar</span></div>`;

    overlay.appendChild(help);
    // @ts-expect-error strict migration — TS2339
    this._container.appendChild(overlay);

    requestAnimationFrame(() => { overlay.classList.add('p05-visible'); });
  },

  _closeKeyboardHelp() {
    // @ts-expect-error strict migration — TS2339
    const overlay = this._container.querySelector('.p05-keyboard-overlay');
    if (overlay) {
      overlay.classList.remove('p05-visible');
      setTimeout(() => { overlay.remove(); }, 200);
    }
    // @ts-expect-error strict migration — TS2339
    this._state.keyboardHelpOpen = false;
  },

  showShortcuts() {
    this._showKeyboardHelp();
  }
};

export default KeyboardHelpMixin;

export const MODULE_ID = 'panel-05:table:keyboard-help';
export const VERSION = '9.3.0-P2-ENTERPRISE';
export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { ready: true } }; }
