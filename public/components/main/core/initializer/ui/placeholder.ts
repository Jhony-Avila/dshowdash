// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (3.6.0-PATH-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: placeholder
// PURPOSE: Initializer - Placeholder
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   createPlaceholder() — exported function
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

export const VERSION = '5.8.0-P2-ENTERPRISE';
export const MODULE_ID = 'main.core.initializer.ui.placeholder';

// ============================================================================
// PLACEHOLDER
// ============================================================================

/**
 * Cria elemento placeholder
 * @returns {HTMLElement}
 */
export function createPlaceholder() {
  const placeholder = document.createElement('div');
  placeholder.className = 'dsd-container__placeholder';
  placeholder.setAttribute('data-placeholder', 'true');
  
  const icon = document.createElement('span');
  icon.className = 'dsd-container__placeholder-icon';
  icon.textContent = '';
  
  const text = document.createElement('span');
  text.className = 'dsd-container__placeholder-text';
  text.textContent = 'Selecione um módulo no menu';
  
  const hint = document.createElement('span');
  hint.className = 'dsd-container__placeholder-hint';
  hint.textContent = 'Use a barra lateral para navegar';
  
  placeholder.appendChild(icon);
  placeholder.appendChild(text);
  placeholder.appendChild(hint);
  
  placeholder.style.cssText = 'display:flex;flex-direction:column;align-items:center;justify-content:center;min-height:300px;color:rgba(255,255,255,0.5);gap:1rem;text-align:center;';
  icon.style.cssText = 'font-size:3rem;';
  text.style.cssText = 'font-size:1.25rem;font-weight:500;';
  hint.style.cssText = 'font-size:0.875rem;opacity:0.7;';
  
  return placeholder;
}

export default {
  createPlaceholder
};
