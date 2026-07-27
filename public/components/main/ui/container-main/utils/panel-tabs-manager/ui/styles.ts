// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: styles
// PURPOSE: Panel Tabs Manager - Styles
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   getConfig from ../state.js
//
// PROVIDES:
//   getStyles() — exported function
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

import { getConfig } from '../state.js';

export const VERSION = '15.2.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.utils.panel-tabs-manager.ui.styles';

export function getStyles() {
  const config = getConfig();
  
  return `
    .dsd-panel-tabs {
      display: flex;
      align-items: center;
      background: var(--cm-bg-secondary, #0f172a);
      border-bottom: 1px solid var(--cm-border-default, rgba(139, 92, 246, 0.2));
      overflow-x: auto;
      overflow-y: hidden;
      scrollbar-width: none;
      -ms-overflow-style: none;
    }
    
    .dsd-panel-tabs::-webkit-scrollbar {
      display: none;
    }
    
    .dsd-panel-tabs--bottom {
      border-bottom: none;
      border-top: 1px solid var(--cm-border-default, rgba(139, 92, 246, 0.2));
    }
    
    .dsd-pt-tabs-list {
      display: flex;
      flex: 1;
      min-width: 0;
    }
    
    .dsd-pt-tab {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 12px;
      min-width: ${config.tabMinWidth}px;
      max-width: ${config.tabMaxWidth}px;
      background: transparent;
      border: none;
      border-right: 1px solid var(--cm-border-subtle, rgba(255,255,255,0.05));
      color: var(--cm-text-muted, rgba(255,255,255,0.5));
      font-size: 13px;
      cursor: pointer;
      transition: background 0.15s ease, color 0.15s ease;
      position: relative;
      user-select: none;
    }
    
    .dsd-pt-tab:hover {
      background: var(--cm-bg-hover, rgba(139, 92, 246, 0.1));
      color: var(--cm-text-secondary, rgba(255,255,255,0.7));
    }
    
    .dsd-pt-tab--active {
      background: var(--cm-bg-elevated, #1e293b);
      color: var(--cm-text-primary, white);
    }
    
    .dsd-pt-tab--active::after {
      content: '';
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      height: 2px;
      background: var(--cm-accent-primary, #8b5cf6);
    }
    
    .dsd-pt-tab--loading .dsd-pt-tab-icon {
      animation: dsd-pt-spin 1s linear infinite;
    }
    
    @keyframes dsd-pt-spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    
    .dsd-pt-tab--error {
      color: #ef4444;
    }
    
    .dsd-pt-tab--dragging {
      opacity: 0.5;
    }
    
    .dsd-pt-tab--drag-over {
      background: var(--cm-accent-primary, #8b5cf6);
      color: white;
    }
    
    .dsd-pt-tab-icon {
      flex-shrink: 0;
      font-size: 14px;
    }
    
    .dsd-pt-tab-title {
      flex: 1;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      text-align: left;
    }
    
    .dsd-pt-tab-close {
      flex-shrink: 0;
      width: 18px;
      height: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: transparent;
      border: none;
      border-radius: 4px;
      color: inherit;
      opacity: 0;
      cursor: pointer;
      transition: opacity 0.15s ease, background 0.15s ease;
    }
    
    .dsd-pt-tab:hover .dsd-pt-tab-close,
    .dsd-pt-tab--active .dsd-pt-tab-close {
      opacity: 0.7;
    }
    
    .dsd-pt-tab-close:hover {
      opacity: 1;
      background: rgba(239, 68, 68, 0.2);
      color: #ef4444;
    }
    
    .dsd-pt-tab-close svg {
      width: 12px;
      height: 12px;
    }
    
    .dsd-pt-actions {
      display: flex;
      align-items: center;
      padding: 0 8px;
      gap: 4px;
    }
    
    .dsd-pt-btn {
      width: 28px;
      height: 28px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: transparent;
      border: none;
      border-radius: 4px;
      color: var(--cm-text-muted, rgba(255,255,255,0.5));
      cursor: pointer;
      transition: background 0.15s ease, color 0.15s ease;
    }
    
    .dsd-pt-btn:hover {
      background: var(--cm-bg-hover, rgba(139, 92, 246, 0.15));
      color: var(--cm-text-primary, white);
    }
    
    .dsd-pt-btn svg {
      width: 16px;
      height: 16px;
    }
    
    .dsd-pt-content {
      flex: 1;
      overflow: hidden;
      position: relative;
    }
    
    .dsd-pt-panel {
      display: none;
      width: 100%;
      height: 100%;
      overflow: auto;
    }
    
    .dsd-pt-panel--active {
      display: block;
    }
  `;
}
