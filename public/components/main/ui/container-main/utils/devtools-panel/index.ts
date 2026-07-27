// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.0.0)
// ═══════════════════════════════════════════════════════════════
// IMPORTS:
//   createLogger from ../logger.js
//   getEnv, ENV from ../../config.js
//   createStyles from ./styles.js
//   formatTimestamp from ./helpers.js
//   renderOverview from ./renderers/overview.js
//   renderLogs from ./renderers/logs.js
//   renderPerformance from ./renderers/performance.js
//   renderPlugins from ./renderers/plugins.js
//
// PROVIDES:
//   createDevToolsPanel(), getDevToolsPanel(),
//   resetDevToolsPanel(), info(), healthCheck(),
//   VERSION, MODULE_ID
//
// RECEIVES (via createDevToolsPanel options):
//   options.position, options.collapsed,
//   options.theme, options.shortcut,
//   options.autoHideInProduction, options.maxLogs
//
// BROWSER APIs (legítimo — devtools panel):
//   document.createElement, document.body.appendChild — DOM
//   document.head.appendChild — style injection
//   document.addEventListener(keydown) — shortcut
//
// WINDOW ACCESS (legítimo — devtools):
//   (window as any).__cmDevTools — devtools panel instance
// ═══════════════════════════════════════════════════════════════
// DevTools Panel - Painel de ferramentas para desenvolvimento
// @version 1.0.0-MODULAR
// @description Painel visual para debug, inspeção e diagnóstico
'use strict';

import { createLogger } from '../logger.js';
import { getEnv, ENV } from '../../config.js';
import { createStyles } from './styles.js';
import { formatTimestamp } from './helpers.js';
import { renderOverview } from './renderers/overview.js';
import { renderLogs } from './renderers/logs.js';
import { renderPerformance } from './renderers/performance.js';
import { renderPlugins } from './renderers/plugins.js';

export const VERSION = '1.0.0-MODULAR';
export const MODULE_ID = 'container-main:devtools-panel';

// Re-exports
export { createStyles } from './styles.js';
export { formatStatus, createElement, formatTimestamp } from './helpers.js';

// Cria o DevTools Panel
export function createDevToolsPanel(options: Record<string, any> = {}) {
  const {
    position = 'bottom-right',
    collapsed = true,
    theme = 'dark',
    shortcut = 'ctrl+shift+d',
    autoHideInProduction = true,
    maxLogs = 200
  } = options;

  const _logger = createLogger(MODULE_ID);
  let _container: HTMLElement | null = null;
  let _isCollapsed = collapsed;
  let _bootstrap: unknown = null;
  let _eventBus = null;
  let _logs: unknown[] = [];
  let _activeTab = 'overview';
  let _stylesInjected = false;

  // Adiciona log
  function _addLog(level: string, message: string) {
    const timestamp = formatTimestamp();
    _logs.push({ level, message, timestamp });
    if (_logs.length > maxLogs) _logs.shift();
    if (_activeTab === 'logs' && !_isCollapsed) _render();
  }

  // Renderiza conteúdo baseado na tab ativa
  function _renderContent() {
    switch (_activeTab) {
      case 'logs': return renderLogs(_logs);
      case 'performance': return renderPerformance(_bootstrap);
      case 'plugins': return renderPlugins(_bootstrap);
      default: return renderOverview((_bootstrap as Record<string, unknown>));
    }
  }

  // Renderiza panel completo
  function _render() {
    if (!_container) return;

    if (_isCollapsed) {
      _container.innerHTML = `<div class="cm-devtools-toggle" onclick="window.__cmDevTools.toggle()">🛠️</div>`;
      _container.className = `cm-devtools ${position} collapsed`;
    } else {
      _container.className = `cm-devtools ${position} expanded`;
      _container.innerHTML = `
        <div class="cm-devtools-header">
          <span class="cm-devtools-title">🛠️ Container-Main DevTools</span>
          <button class="cm-devtools-btn" onclick="window.__cmDevTools.toggle()">−</button>
        </div>
        <div class="cm-devtools-tabs">
          <button class="cm-devtools-tab ${_activeTab === 'overview' ? 'active' : ''}" onclick="window.__cmDevTools.setTab('overview')">Overview</button>
          <button class="cm-devtools-tab ${_activeTab === 'logs' ? 'active' : ''}" onclick="window.__cmDevTools.setTab('logs')">Logs</button>
          <button class="cm-devtools-tab ${_activeTab === 'performance' ? 'active' : ''}" onclick="window.__cmDevTools.setTab('performance')">Performance</button>
          <button class="cm-devtools-tab ${_activeTab === 'plugins' ? 'active' : ''}" onclick="window.__cmDevTools.setTab('plugins')">Plugins</button>
        </div>
        <div class="cm-devtools-content">${_renderContent()}</div>
      `;
    }
  }

  // Injeta estilos
  function _injectStyles() {
    if (_stylesInjected) return;
    const styleEl = document.createElement('style');
    styleEl.textContent = createStyles(theme);
    document.head.appendChild(styleEl);
    _stylesInjected = true;
  }

  // Inicializa
  function _init() {
    if (typeof document === 'undefined') return;
    if (autoHideInProduction && getEnv() === ENV.PRODUCTION) return;

    _injectStyles();

    _container = document.createElement('div');
    _container.id = 'cm-devtools';
    document.body.appendChild(_container);

    // Registra atalho
    document.addEventListener('keydown', (e) => {
      const keys = shortcut.split('+');
      const ctrl = keys.includes('ctrl') ? e.ctrlKey : true;
      const shift = keys.includes('shift') ? e.shiftKey : true;
      const key = keys[keys.length - 1].toLowerCase();
      
      if (ctrl && shift && e.key.toLowerCase() === key) {
        e.preventDefault();
        panel.toggle();
      }
    });

    _render();
    _logger.debug('DevTools panel initialized');
  }

  const panel = {
    inject({ bootstrap, eventBus }: Record<string, unknown>) {
      _bootstrap = bootstrap;
      _eventBus = eventBus;

      if (_eventBus) {
        ((_eventBus as Record<string, unknown>).on as (...args: unknown[]) => unknown)('bootstrap:error', (data: Record<string, unknown>) => _addLog('error', (data.message as string) || 'Error'));
        ((_eventBus as Record<string, unknown>).on as (...args: unknown[]) => unknown)('bootstrap:state-changed', (data: Record<string, unknown>) => _addLog('info', `State: ${data.state}`));
        ((_eventBus as Record<string, unknown>).on as (...args: unknown[]) => unknown)('bootstrap:performance-critical', () => _addLog('warn', 'Performance critical!'));
      }

      _render();
    },

    toggle() {
      _isCollapsed = !_isCollapsed;
      _render();
    },

    show() {
      _isCollapsed = false;
      _render();
    },

    hide() {
      _isCollapsed = true;
      _render();
    },

    setTab(tab: HTMLElement) {
      // @ts-expect-error TS migration - TS2352
      _activeTab = (tab) as string;
      _render();
    },

    refresh() {
      _render();
    },

    snapshot() {
      // @ts-expect-error TS migration - TS2339
      const snapshots = _bootstrap?.getStateSnapshots();
      if (snapshots) {
        const id = snapshots.create('devtools-manual');
        _addLog('info', `Snapshot created: ${id}`);
      }
    },

    async reboot() {
      if (confirm('Reboot the application?')) {
        // @ts-expect-error TS migration - TS2339
        await _bootstrap?.reboot();
      }
    },

    clearLogs() {
      _logs = [];
      _render();
    },

    log(level: string, message: string) {
      _addLog(level, message);
    },

    healthCheck() {
      return {
        status: 'HEALTHY',
        version: VERSION,
        moduleId: MODULE_ID,
        visible: !_isCollapsed,
        logsCount: _logs.length
      };
    },

    info() {
      return {
        moduleId: MODULE_ID,
        version: VERSION,
        position,
        shortcut,
        theme
      };
    },

    destroy() {
      if (_container) {
        _container.remove();
        _container = null;
      }
    }
  };

  if (typeof window !== 'undefined') {
    (window as any).__cmDevTools = panel;
  }

  _init();

  return panel;
}

// Singleton
let _instance: Record<string, unknown> | null = null;

export function getDevToolsPanel(options: Record<string, any> = {}) {
  if (!_instance) {
    _instance = createDevToolsPanel(options);
  }
  return _instance;
}

export function resetDevToolsPanel() {
  if (_instance) {
    (_instance.destroy as (...args: unknown[]) => unknown)();
    _instance = null;
  }
}

export function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}

export function healthCheck() {
  if (_instance) return (_instance.healthCheck as (...args: unknown[]) => unknown)();
  return { status: 'NOT_INITIALIZED', version: VERSION, moduleId: MODULE_ID };
}

export default {
  VERSION, MODULE_ID,
  createDevToolsPanel, getDevToolsPanel, resetDevToolsPanel,
  info, healthCheck
};
