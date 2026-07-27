// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: styles
// PURPOSE: Accessibility Manager - Styles
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   _injectStyles() — exported function
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

export const VERSION = '15.2.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.utils.accessibility-manager.ui.styles';

export function _injectStyles() {
  if (document.getElementById('dsd-a11y-styles')) return;
  
  const styles = document.createElement('style');
  styles.id = 'dsd-a11y-styles';
  styles.textContent = `
    .dsd-a11y-sr-only {
      position: absolute !important;
      width: 1px !important;
      height: 1px !important;
      padding: 0 !important;
      margin: -1px !important;
      overflow: hidden !important;
      clip: rect(0, 0, 0, 0) !important;
      white-space: nowrap !important;
      border: 0 !important;
    }
    
    .dsd-focus-outline :focus-visible {
      outline: 3px solid var(--cm-accent-primary, #8b5cf6) !important;
      outline-offset: 2px !important;
    }
    
    .dsd-focus-ring :focus-visible {
      box-shadow: 0 0 0 3px var(--cm-accent-primary, #8b5cf6) !important;
      outline: none !important;
    }
    
    .dsd-focus-glow :focus-visible {
      box-shadow: 0 0 0 3px var(--cm-accent-primary, #8b5cf6), 0 0 15px rgba(139, 92, 246, 0.5) !important;
      outline: none !important;
    }
    
    .dsd-high-contrast {
      --cm-bg-default: #000000;
      --cm-text-primary: #ffffff;
      --cm-border-default: #ffffff;
      --cm-accent-primary: #ffff00;
    }
    
    .dsd-high-contrast * {
      border-color: currentColor !important;
    }
    
    .dsd-highest-contrast {
      filter: contrast(1.5);
    }
    
    .dsd-large-text {
      font-size: 120% !important;
    }
    
    .dsd-large-text * {
      font-size: inherit;
    }
    
    .dsd-reduced-motion *,
    .dsd-reduced-motion *::before,
    .dsd-reduced-motion *::after {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
    
    .dsd-keyboard-only :focus:not(:focus-visible) {
      outline: none !important;
      box-shadow: none !important;
    }
  `;
  document.head.appendChild(styles);
}
