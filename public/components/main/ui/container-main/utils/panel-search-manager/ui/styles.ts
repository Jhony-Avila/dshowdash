// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: styles
// PURPOSE: Panel Search Manager - Styles
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   getSearchStyles() — exported function
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
export const MODULE_ID = 'main.ui.container-main.utils.panel-search-manager.ui.styles';

export function getSearchStyles() {
  return `
    .dsd-panel-search {
      position: fixed;
      top: 60px;
      right: 20px;
      z-index: 10000;
      display: none;
      background: var(--cm-bg-elevated, #1e293b);
      border: 1px solid var(--cm-border-default, rgba(139, 92, 246, 0.2));
      border-radius: 8px;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
      overflow: hidden;
      transform: translateY(-10px);
      opacity: 0;
      transition: transform 0.15s ease, opacity 0.15s ease;
    }
    
    .dsd-panel-search--open {
      display: block;
      transform: translateY(0);
      opacity: 1;
    }
    
    .dsd-ps-input-row {
      display: flex;
      align-items: center;
      padding: 8px 12px;
      gap: 8px;
    }
    
    .dsd-ps-input {
      flex: 1;
      min-width: 200px;
      padding: 8px 12px;
      background: var(--cm-bg-tertiary, rgba(255,255,255,0.05));
      border: 1px solid transparent;
      border-radius: 6px;
      color: var(--cm-text-primary, white);
      font-size: 14px;
      outline: none;
      transition: border-color 0.15s ease;
    }
    
    .dsd-ps-input:focus {
      border-color: var(--cm-accent-primary, #8b5cf6);
    }
    
    .dsd-ps-input::placeholder {
      color: var(--cm-text-muted, rgba(255,255,255,0.4));
    }
    
    .dsd-ps-count {
      font-size: 12px;
      color: var(--cm-text-muted, rgba(255,255,255,0.5));
      white-space: nowrap;
      min-width: 60px;
      text-align: center;
    }
    
    .dsd-ps-nav {
      display: flex;
      gap: 4px;
    }
    
    .dsd-ps-btn {
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: var(--cm-bg-tertiary, rgba(255,255,255,0.1));
      border: none;
      border-radius: 4px;
      color: var(--cm-text-secondary, rgba(255,255,255,0.7));
      cursor: pointer;
      transition: background 0.15s ease, color 0.15s ease;
    }
    
    .dsd-ps-btn:hover {
      background: var(--cm-accent-primary, #8b5cf6);
      color: white;
    }
    
    .dsd-ps-btn:disabled {
      opacity: 0.3;
      cursor: not-allowed;
    }
    
    .dsd-ps-btn svg {
      width: 14px;
      height: 14px;
    }
    
    .dsd-ps-close {
      background: transparent;
    }
    
    .dsd-ps-close:hover {
      background: rgba(239, 68, 68, 0.2);
      color: #ef4444;
    }
    
    .dsd-ps-options {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 6px 12px;
      border-top: 1px solid var(--cm-border-subtle, rgba(255,255,255,0.1));
      font-size: 12px;
    }
    
    .dsd-ps-option {
      display: flex;
      align-items: center;
      gap: 4px;
      color: var(--cm-text-muted, rgba(255,255,255,0.5));
      cursor: pointer;
    }
    
    .dsd-ps-option input {
      accent-color: var(--cm-accent-primary, #8b5cf6);
    }
    
    .dsd-search-highlight {
      background: var(--dsd-search-highlight, rgba(139, 92, 246, 0.4));
      border-radius: 2px;
      padding: 0 1px;
    }
    
    .dsd-search-highlight--active {
      background: var(--dsd-search-highlight-active, rgba(139, 92, 246, 0.8));
      outline: 2px solid var(--cm-accent-primary, #8b5cf6);
    }
  `;
}
