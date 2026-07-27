// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: styles
// PURPOSE: Split View Manager - Styles
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   _createStyles() — exported function
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
export const MODULE_ID = 'main.ui.container-main.utils.split-view-manager.dom.styles';

export function _createStyles() {
  if (document.getElementById('split-view-styles')) return;
  
  const styles = document.createElement('style');
  styles.id = 'split-view-styles';
  styles.textContent = `
    .dsd-split-view {
      display: flex;
      width: 100%;
      height: 100%;
      overflow: hidden;
      position: relative;
    }
    
    .dsd-split-view--horizontal {
      flex-direction: row;
    }
    
    .dsd-split-view--vertical {
      flex-direction: column;
    }
    
    .dsd-split-view__panel {
      overflow: auto;
      position: relative;
      transition: flex-basis var(--split-duration, 200ms) ease;
    }
    
    .dsd-split-view__panel--primary {
      flex: 0 0 auto;
    }
    
    .dsd-split-view__panel--secondary {
      flex: 1 1 auto;
    }
    
    .dsd-split-view__panel--collapsed {
      flex-basis: 0 !important;
      min-width: 0 !important;
      min-height: 0 !important;
      overflow: hidden;
    }
    
    .dsd-split-view__gutter {
      flex: 0 0 var(--split-gutter, 8px);
      background: var(--cm-border-default, rgba(139, 92, 246, 0.15));
      position: relative;
      z-index: 10;
      transition: background 0.15s ease;
    }
    
    .dsd-split-view__gutter:hover,
    .dsd-split-view__gutter--active {
      background: var(--cm-accent-primary, #8b5cf6);
    }
    
    .dsd-split-view--horizontal .dsd-split-view__gutter {
      cursor: col-resize;
      width: var(--split-gutter, 8px);
    }
    
    .dsd-split-view--vertical .dsd-split-view__gutter {
      cursor: row-resize;
      height: var(--split-gutter, 8px);
    }
    
    .dsd-split-view__gutter::after {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: var(--cm-text-muted, rgba(255,255,255,0.3));
      border-radius: 2px;
    }
    
    .dsd-split-view--horizontal .dsd-split-view__gutter::after {
      width: 4px;
      height: 32px;
    }
    
    .dsd-split-view--vertical .dsd-split-view__gutter::after {
      width: 32px;
      height: 4px;
    }
    
    .dsd-split-view__collapse-btn {
      position: absolute;
      top: 50%;
      transform: translateY(-50%);
      width: 20px;
      height: 40px;
      background: var(--cm-bg-secondary, rgba(30, 41, 59, 0.8));
      border: 1px solid var(--cm-border-default, rgba(139, 92, 246, 0.15));
      border-radius: 4px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: var(--cm-text-secondary, rgba(255,255,255,0.7));
      font-size: 12px;
      opacity: 0;
      transition: opacity 0.15s ease, background 0.15s ease;
      z-index: 11;
    }
    
    .dsd-split-view__gutter:hover .dsd-split-view__collapse-btn,
    .dsd-split-view__collapse-btn:focus {
      opacity: 1;
    }
    
    .dsd-split-view__collapse-btn:hover {
      background: var(--cm-accent-primary, #8b5cf6);
      color: white;
    }
    
    .dsd-split-view--horizontal .dsd-split-view__collapse-btn--left {
      left: -24px;
    }
    
    .dsd-split-view--horizontal .dsd-split-view__collapse-btn--right {
      right: -24px;
    }
    
    .dsd-split-view--resizing {
      user-select: none;
      cursor: col-resize;
    }
    
    .dsd-split-view--resizing.dsd-split-view--vertical {
      cursor: row-resize;
    }
    
    .dsd-split-view--resizing .dsd-split-view__panel {
      transition: none;
      pointer-events: none;
    }
  `;
  document.head.appendChild(styles);
}
