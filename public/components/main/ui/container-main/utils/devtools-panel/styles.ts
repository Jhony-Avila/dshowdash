// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-MODULAR-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-main:devtools-panel:styles
// PURPOSE: DevTools Panel - Estilos
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   createStyles() — exported function
//   info() — exported function
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

export const VERSION = '1.0.0-MODULAR';
export const MODULE_ID = 'container-main:devtools-panel:styles';

// Gera estilos baseados no tema
export function createStyles(theme = 'dark') {
  const isDark = theme === 'dark';
  
  const colors = {
    bg: isDark ? '#1e1e1e' : '#f5f5f5',
    text: isDark ? '#d4d4d4' : '#333',
    border: isDark ? '#333' : '#ccc',
    headerBg: isDark ? '#252526' : '#e8e8e8',
    tabBg: isDark ? '#2d2d2d' : '#ddd',
    tabHover: isDark ? '#3c3c3c' : '#ccc',
    label: isDark ? '#9cdcfe' : '#0066cc',
    value: isDark ? '#ce9178' : '#a31515',
    logBg: isDark ? '#2d2d2d' : '#eee',
    rowBorder: isDark ? '#333' : '#ddd'
  };

  return `
    .cm-devtools {
      position: fixed;
      z-index: 99999;
      font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
      font-size: 12px;
      background: ${colors.bg};
      color: ${colors.text};
      border: 1px solid ${colors.border};
      border-radius: 8px;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      overflow: hidden;
      transition: all 0.2s ease;
    }
    .cm-devtools.bottom-right { bottom: 20px; right: 20px; }
    .cm-devtools.bottom-left { bottom: 20px; left: 20px; }
    .cm-devtools.top-right { top: 20px; right: 20px; }
    .cm-devtools.top-left { top: 20px; left: 20px; }
    .cm-devtools.collapsed { width: 50px; height: 50px; }
    .cm-devtools.expanded { width: 500px; height: 400px; max-width: 90vw; max-height: 70vh; }
    .cm-devtools-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 8px 12px;
      background: ${colors.headerBg};
      border-bottom: 1px solid ${colors.border};
      cursor: move;
    }
    .cm-devtools-title { font-weight: bold; font-size: 13px; }
    .cm-devtools-toggle {
      width: 50px;
      height: 50px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      font-size: 20px;
    }
    .cm-devtools-tabs {
      display: flex;
      background: ${colors.tabBg};
      border-bottom: 1px solid ${colors.border};
    }
    .cm-devtools-tab {
      padding: 8px 16px;
      cursor: pointer;
      border: none;
      background: transparent;
      color: inherit;
      font-size: 11px;
      transition: background 0.2s;
    }
    .cm-devtools-tab:hover { background: ${colors.tabHover}; }
    .cm-devtools-tab.active {
      background: ${colors.bg};
      border-bottom: 2px solid #007acc;
    }
    .cm-devtools-content {
      padding: 12px;
      overflow: auto;
      height: calc(100% - 90px);
    }
    .cm-devtools-section { margin-bottom: 16px; }
    .cm-devtools-section-title {
      font-weight: bold;
      font-size: 11px;
      text-transform: uppercase;
      color: ${isDark ? '#888' : '#666'};
      margin-bottom: 8px;
    }
    .cm-devtools-row {
      display: flex;
      justify-content: space-between;
      padding: 4px 0;
      border-bottom: 1px solid ${colors.rowBorder};
    }
    .cm-devtools-label { color: ${colors.label}; }
    .cm-devtools-value { color: ${colors.value}; }
    .cm-devtools-status {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 4px;
      font-size: 10px;
      font-weight: bold;
    }
    .cm-devtools-status.healthy { background: #28a745; color: white; }
    .cm-devtools-status.warning { background: #ffc107; color: black; }
    .cm-devtools-status.error { background: #dc3545; color: white; }
    .cm-devtools-status.degraded { background: #fd7e14; color: white; }
    .cm-devtools-log {
      padding: 4px 8px;
      margin: 2px 0;
      border-radius: 4px;
      font-size: 11px;
      background: ${colors.logBg};
    }
    .cm-devtools-log.error { border-left: 3px solid #dc3545; }
    .cm-devtools-log.warn { border-left: 3px solid #ffc107; }
    .cm-devtools-log.info { border-left: 3px solid #17a2b8; }
    .cm-devtools-btn {
      padding: 6px 12px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 11px;
      margin-right: 8px;
      background: #007acc;
      color: white;
    }
    .cm-devtools-btn:hover { background: #005a9e; }
    .cm-devtools-btn.danger { background: #dc3545; }
    .cm-devtools-btn.danger:hover { background: #c82333; }
  `;
}

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    themes: ['dark', 'light']
  };
}

export default {
  VERSION,
  MODULE_ID,
  createStyles,
  info
};
