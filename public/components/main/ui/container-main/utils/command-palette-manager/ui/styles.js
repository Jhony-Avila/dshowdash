import { getConfig } from "../state.js";
const VERSION = "15.2.0-MODULAR";
const MODULE_ID = "main.ui.container-main.utils.command-palette-manager.ui.styles";
function getStyles() {
  const config = getConfig();
  return `
    .dsd-command-palette {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      z-index: 100000;
      display: none;
      align-items: flex-start;
      justify-content: center;
      padding-top: 15vh;
      background: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(4px);
      opacity: 0;
      transition: opacity ${config.animationDuration}ms ease;
    }
    
    .dsd-command-palette--open {
      display: flex;
      opacity: 1;
    }
    
    .dsd-cp-container {
      width: 100%;
      max-width: 600px;
      background: var(--cm-bg-elevated, #1e293b);
      border: 1px solid var(--cm-border-default, rgba(139, 92, 246, 0.2));
      border-radius: 12px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
      overflow: hidden;
      transform: scale(0.95) translateY(-10px);
      transition: transform ${config.animationDuration}ms ease;
    }
    
    .dsd-command-palette--open .dsd-cp-container {
      transform: scale(1) translateY(0);
    }
    
    .dsd-cp-input-wrapper {
      display: flex;
      align-items: center;
      padding: 16px;
      border-bottom: 1px solid var(--cm-border-subtle, rgba(255,255,255,0.1));
    }
    
    .dsd-cp-icon {
      width: 20px;
      height: 20px;
      margin-right: 12px;
      color: var(--cm-text-muted, rgba(255,255,255,0.5));
    }
    
    .dsd-cp-input {
      flex: 1;
      background: transparent;
      border: none;
      outline: none;
      font-size: 16px;
      color: var(--cm-text-primary, white);
      font-family: inherit;
    }
    
    .dsd-cp-input::placeholder {
      color: var(--cm-text-muted, rgba(255,255,255,0.4));
    }
    
    .dsd-cp-shortcut {
      padding: 4px 8px;
      background: var(--cm-bg-tertiary, rgba(255,255,255,0.1));
      border-radius: 4px;
      font-size: 12px;
      color: var(--cm-text-muted, rgba(255,255,255,0.5));
    }
    
    .dsd-cp-results {
      max-height: 400px;
      overflow-y: auto;
    }
    
    .dsd-cp-section {
      padding: 8px 0;
    }
    
    .dsd-cp-section-title {
      padding: 8px 16px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--cm-text-muted, rgba(255,255,255,0.4));
    }
    
    .dsd-cp-item {
      display: flex;
      align-items: center;
      padding: 10px 16px;
      cursor: pointer;
      transition: background 0.1s ease;
    }
    
    .dsd-cp-item:hover,
    .dsd-cp-item--selected {
      background: var(--cm-bg-hover, rgba(139, 92, 246, 0.15));
    }
    
    .dsd-cp-item-icon {
      width: 32px;
      height: 32px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-right: 12px;
      background: var(--cm-bg-tertiary, rgba(255,255,255,0.1));
      border-radius: 8px;
      font-size: 16px;
    }
    
    .dsd-cp-item-content {
      flex: 1;
      min-width: 0;
    }
    
    .dsd-cp-item-title {
      font-size: 14px;
      color: var(--cm-text-primary, white);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .dsd-cp-item-description {
      font-size: 12px;
      color: var(--cm-text-muted, rgba(255,255,255,0.5));
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .dsd-cp-item-shortcut {
      padding: 4px 8px;
      background: var(--cm-bg-tertiary, rgba(255,255,255,0.1));
      border-radius: 4px;
      font-size: 11px;
      color: var(--cm-text-muted, rgba(255,255,255,0.5));
      font-family: monospace;
    }
    
    .dsd-cp-highlight {
      background: var(--cm-accent-primary, #8b5cf6);
      color: white;
      border-radius: 2px;
      padding: 0 2px;
    }
    
    .dsd-cp-empty {
      padding: 32px 16px;
      text-align: center;
      color: var(--cm-text-muted, rgba(255,255,255,0.4));
    }
    
    .dsd-cp-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      border-top: 1px solid var(--cm-border-subtle, rgba(255,255,255,0.1));
      font-size: 12px;
      color: var(--cm-text-muted, rgba(255,255,255,0.4));
    }
    
    .dsd-cp-footer-hints {
      display: flex;
      gap: 16px;
    }
    
    .dsd-cp-footer-hint {
      display: flex;
      align-items: center;
      gap: 4px;
    }
    
    .dsd-cp-footer-hint kbd {
      padding: 2px 6px;
      background: var(--cm-bg-tertiary, rgba(255,255,255,0.1));
      border-radius: 4px;
      font-family: monospace;
    }
  `;
}
export {
  MODULE_ID,
  VERSION,
  getStyles
};
