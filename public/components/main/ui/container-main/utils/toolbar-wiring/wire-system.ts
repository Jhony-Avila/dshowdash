// toolbar-wiring/wire-system.js
// @version 1.1.0-PAB-ES6
// @description Wiring de offline, tabs, layout dropdown, devtools
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.1.0)
// ═══════════════════════════════════════════════════════════════
// IMPORTS: getEventBus, getActivePanelId from ./helpers.js
// IMPORTS: LAYOUT_EVENT_NAMES from event-names.js
// IMPORTS (dynamic): ../offline-mode-manager/index.js, ../panel-tabs-manager/index.js,
//                    ../devtools-panel/index.js
// PROVIDES: wireSystem(toolbar, wired, failed, logger)
// ACTIONS: offline, tabs, layout, layout-default, layout-compact, layout-wide, devtools
// STATE-PROVIDERS: offline (active, dot, tooltip), tabs (badge, tooltip),
//                  layout (tooltip), devtools (active, tooltip)
// BROWSER-APIS: document.body.classList (layout classes), navigator.onLine, navigator.wakeLock
// NOTE: Layout classes aplicadas em document.body (alinhado com layout-manager/lifecycle.js)
'use strict';
export const VERSION = '1.0.0-ENTERPRISE';
export const MODULE_ID = 'main.ui.container-main.utils.toolbar-wiring.wire-system';

import { getEventBus, getActivePanelId } from './helpers.js';
import { LAYOUT_EVENT_NAMES } from '/core/runtime/constants/event-names.js';

/**
 * Conecta ações de sistema — offline, tabs, layout, devtools
 * @param {object} toolbar
 * @param {Array} wired
 * @param {Array} failed
 * @param {object} logger
 */
export async function wireSystem(toolbar: Record<string, (...args: unknown[]) => unknown>, wired: string[], failed: string[], logger: { debug: (msg: string, data?: Record<string, unknown>) => void; info: (msg: string, data?: Record<string, unknown>) => void; warn: (msg: string, data?: Record<string, unknown>) => void; error: (msg: string, data?: unknown) => void }) {

  // ── OFFLINE MODE ──────────────────────────────────────────────────────
  try {
    const offlineModule = await import('../offline-mode-manager/index.js');
    const offlineMgr = (offlineModule.getOfflineModeManager ? offlineModule.getOfflineModeManager() : null) as Record<string, ((...args: unknown[]) => unknown)> | null;

    if (offlineMgr) {
      toolbar.registerAction('offline', () => {
        if (offlineMgr.init) {
          // @ts-expect-error TS migration - TS2339
          offlineMgr.init().then(() => {
            const state = offlineMgr.getState ? offlineMgr.getState() : 'unknown';
            const cacheSize = offlineMgr.getCacheSize ? offlineMgr.getCacheSize() : null;
            logger.debug('Offline manager initialized', {
              state,
              cache: cacheSize ? (cacheSize as Record<string, unknown>).formatted : 'N/A'
            });
          }).catch((err: Error) => {
            logger.warn('Offline manager init failed', { error: err.message });
          });
        }
      });

      toolbar.registerStateProvider('offline', () => {
        const isOff = offlineMgr.isOffline ? offlineMgr.isOffline() : !navigator.onLine;
        let cacheSize = null;
        try { cacheSize = offlineMgr.getCacheSize ? offlineMgr.getCacheSize() : null; } catch (_e) {}
        const cacheInfo = cacheSize ? ` | Cache: ${(cacheSize as Record<string, unknown>).formatted}` : '';
        return {
          active: isOff,
          dot: isOff,
          tooltip: isOff ? `Offline${cacheInfo}` : `Online${cacheInfo}`
        };
      });
      wired.push('offline');
    } else {
      toolbar.registerAction('offline', () => {
        logger.debug(`Offline status: ${navigator.onLine ? 'online' : 'offline'}`);
      });
      toolbar.registerStateProvider('offline', () => {
        const isOff = !navigator.onLine;
        return { active: isOff, dot: isOff, tooltip: isOff ? 'Offline' : 'Online' };
      });
      wired.push('offline');
    }
  } catch (e) {
    logger.warn('Offline Mode Manager indisponível', { error: (e as Error).message });
    toolbar.registerAction('offline', () => {
      logger.debug(`Offline status: ${navigator.onLine ? 'online' : 'offline'}`);
    });
    toolbar.registerStateProvider('offline', () => ({
      active: !navigator.onLine,
      dot: !navigator.onLine,
      tooltip: navigator.onLine ? 'Online' : 'Offline'
    }));
    wired.push('offline');
  }

  // ── PANEL TABS ────────────────────────────────────────────────────────
  try {
    const tabsModule = await import('../panel-tabs-manager/index.js');
    const tabsMgr = (tabsModule.getPanelTabsManager?.() || tabsModule.default || tabsModule) as Record<string, ((...args: unknown[]) => unknown)>;

    const tabsInit = tabsMgr.init || tabsModule.init;
    const tabsAddTab = tabsMgr.addTab || tabsModule.addTab;
    const tabsGetTabs = tabsMgr.getAllTabs || tabsMgr.getTabs || tabsModule.getAllTabs;

    let _tabsInitialized = false;

    toolbar.registerAction('tabs', () => {
      if (!_tabsInitialized && tabsInit) {
        const container = document.getElementById('container-main');
        if (container) {
          const result = tabsInit(container);
          _tabsInitialized = result !== false;
          logger.debug('Panel Tabs initialized', { success: _tabsInitialized });
        }
      }

      if (tabsAddTab) {
        const panelId = getActivePanelId();
        if (panelId) {
          tabsAddTab(panelId, { title: panelId });
          logger.debug('Tab added for panel', { panelId });
        }
      }
    });

    if (tabsGetTabs) {
      toolbar.registerStateProvider('tabs', () => {
        let tabs = [];
        // @ts-expect-error TS migration - TS2740
        try { tabs = tabsGetTabs(); } catch (_e) {}
        const count = Array.isArray(tabs) ? tabs.length : 0;
        return {
          badge: count > 1 ? count : undefined,
          tooltip: `Abas (${count})`
        };
      });
    }
    wired.push('tabs');
  } catch (e) {
    logger.warn('Panel Tabs Manager indisponível', { error: (e as Error).message });
    toolbar.registerAction('tabs', () => {
      logger.debug('Tabs: manager indisponível');
    });
    wired.push('tabs');
  }

  // ── LAYOUT DROPDOWN ───────────────────────────────────────────────────
  // NOTE: Classes aplicadas em document.body (alinhado com layout-manager/lifecycle.js
  //       que usa body.classList.toggle('layout-compact', compact))
  try {
    toolbar.registerAction('layout', () => {
      logger.debug('Layout dropdown opened');
    });
    wired.push('layout');

    toolbar.registerAction('layout-default', () => {
      const eventBus = getEventBus();
      if (eventBus && eventBus.emit) {
        eventBus.emit(LAYOUT_EVENT_NAMES.CHANGE, { layout: 'default', source: 'toolbar' });
      }
      document.body.classList.remove('layout-compact', 'layout-wide');
      logger.debug('Layout set to default');
    });
    wired.push('layout-default');

    toolbar.registerAction('layout-compact', () => {
      const eventBus = getEventBus();
      if (eventBus && eventBus.emit) {
        eventBus.emit(LAYOUT_EVENT_NAMES.CHANGE, { layout: 'compact', source: 'toolbar' });
      }
      document.body.classList.remove('layout-wide');
      document.body.classList.add('layout-compact');
      logger.debug('Layout set to compact');
    });
    wired.push('layout-compact');

    toolbar.registerAction('layout-wide', () => {
      const eventBus = getEventBus();
      if (eventBus && eventBus.emit) {
        eventBus.emit(LAYOUT_EVENT_NAMES.CHANGE, { layout: 'wide', source: 'toolbar' });
      }
      document.body.classList.remove('layout-compact');
      document.body.classList.add('layout-wide');
      logger.debug('Layout set to wide');
    });
    wired.push('layout-wide');

    toolbar.registerStateProvider('layout', () => {
      let current = 'default';
      if (document.body.classList.contains('layout-compact')) current = 'compact';
      else if (document.body.classList.contains('layout-wide')) current = 'wide';
      return { tooltip: `Layout: ${current}` };
    });
  } catch (e) {
    logger.warn('Layout wiring failed', { error: (e as Error).message });
    toolbar.registerAction('layout', () => { logger.debug('Layout dropdown (fallback)'); });
    wired.push('layout');
    failed.push('layout-default', 'layout-compact', 'layout-wide');
  }

  // ── DEVTOOLS PANEL ────────────────────────────────────────────────────
  try {
    const devtoolsModule = await import('../devtools-panel/index.js');
    const devtoolsPanel = devtoolsModule.getDevToolsPanel({ autoHideInProduction: false }) as Record<string, ((...args: unknown[]) => unknown)> | null;

    if (devtoolsPanel && devtoolsPanel.toggle) {
      toolbar.registerAction('devtools', () => { devtoolsPanel.toggle(); });
      toolbar.registerStateProvider('devtools', () => {
        let isVisible = false;
        // @ts-expect-error TS migration - TS2322
        try { isVisible = devtoolsPanel.isVisible?.() || false as boolean; } catch (_e) {}
        return { active: isVisible, tooltip: isVisible ? 'Fechar DevTools' : 'Abrir DevTools' };
      });
      wired.push('devtools');
    } else {
      toolbar.registerAction('devtools', () => {
        try {
          const panel = devtoolsModule.createDevToolsPanel({ autoHideInProduction: false });
          if (panel && panel.toggle) panel.toggle();
        } catch (_e) {
          logger.debug('DevTools: falha ao criar painel');
        }
      });
      wired.push('devtools');
    }
  } catch (e) {
    logger.warn('DevTools Panel indisponível', { error: (e as Error).message });
    failed.push('devtools');
  }
}
