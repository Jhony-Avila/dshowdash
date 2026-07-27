// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: dom-builder
// PURPOSE: Command Palette - DOM Builder
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   getConfig, getPaletteElement, setPaletteElement, setInputElement, setResultsE...
//   getStyles from ./styles.js
//   _handleInput, _handleKeyDown, _handleBackdropClick from ../events/handlers.js
//
// PROVIDES:
//   _createPaletteDOM() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   'click'
//   'input'
//   'keydown'
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { getConfig, getPaletteElement, setPaletteElement, setInputElement, setResultsElement } from '../state.js';
import { getStyles } from './styles.js';
import { _handleInput, _handleKeyDown, _handleBackdropClick } from '../events/handlers.js';

export const VERSION = '15.2.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.utils.command-palette-manager.ui.dom-builder';

export function _createPaletteDOM() {
  if (getPaletteElement()) return;
  
  const config = getConfig();
  const paletteElement = document.createElement('div');
  paletteElement.id = 'dsd-command-palette';
  paletteElement.className = 'dsd-command-palette';
  paletteElement.innerHTML = `
    <style>${getStyles()}</style>
    
    <div class="dsd-cp-container">
      <div class="dsd-cp-input-wrapper">
        <svg class="dsd-cp-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
        </svg>
        <input type="text" class="dsd-cp-input" placeholder="${config.placeholder}" autocomplete="off" spellcheck="false">
        <span class="dsd-cp-shortcut">ESC</span>
      </div>
      
      <div class="dsd-cp-results"></div>
      
      <div class="dsd-cp-footer">
        <div class="dsd-cp-footer-hints">
          <span class="dsd-cp-footer-hint"><kbd>↑↓</kbd> navegar</span>
          <span class="dsd-cp-footer-hint"><kbd>↵</kbd> executar</span>
          <span class="dsd-cp-footer-hint"><kbd>esc</kbd> fechar</span>
        </div>
        <div class="dsd-cp-footer-mode"></div>
      </div>
    </div>
  `;
  
  document.body.appendChild(paletteElement);
  
  setPaletteElement(paletteElement);
  // @ts-expect-error strict migration — TS2345
  setInputElement(paletteElement.querySelector('.dsd-cp-input'));
  // @ts-expect-error strict migration — TS2345
  setResultsElement(paletteElement.querySelector('.dsd-cp-results'));
  
  // Event listeners
  const inputElement = paletteElement.querySelector('.dsd-cp-input');
  inputElement!.addEventListener('input', _handleInput);
  // @ts-expect-error strict migration — TS2769
  inputElement!.addEventListener('keydown', _handleKeyDown);
  paletteElement.addEventListener('click', _handleBackdropClick);
}
