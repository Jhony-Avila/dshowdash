// toolbar-wiring/wire-navigation.js
// @version 1.1.0-PAB-ES6
// @description Wiring de back, forward, history dropdown + sub-ações
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.1.0)
// ═══════════════════════════════════════════════════════════════
// IMPORTS (dynamic): ../navigation-history/index.js
// PROVIDES: wireNavigation(toolbar, wired, failed, logger)
// ACTIONS: back, forward, history, history-back-all, history-clear
// STATE-PROVIDERS: back (disabled), forward (disabled), history (badge, tooltip)
'use strict';

export const VERSION = '15.2.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.utils.toolbar-wiring.wire-navigation';

/**
 * Conecta navegação — back, forward, history dropdown com sub-ações
 * @param {object} toolbar
 * @param {Array} wired
 * @param {Array} failed
 * @param {object} logger
 */
export async function wireNavigation(toolbar: Record<string, (...args: unknown[]) => unknown>, wired: string[], failed: string[], logger: { debug: (msg: string, data?: Record<string, unknown>) => void; info: (msg: string, data?: Record<string, unknown>) => void; warn: (msg: string, data?: Record<string, unknown>) => void; error: (msg: string, data?: unknown) => void }) {
  try {
    const navModule = await import('../navigation-history/index.js');
    const nh = (navModule.getNavigationHistory?.() || navModule) as Record<string, ((...args: unknown[]) => unknown)>;

    if (nh.goBack) {
      toolbar.registerAction('back', () => { nh.goBack(); });
      toolbar.registerStateProvider('back', () => ({
        disabled: nh.canGoBack ? !nh.canGoBack() : false
      }));
      wired.push('back');
    }

    if (nh.goForward) {
      toolbar.registerAction('forward', () => { nh.goForward(); });
      toolbar.registerStateProvider('forward', () => ({
        disabled: nh.canGoForward ? !nh.canGoForward() : false
      }));
      wired.push('forward');
    }

    toolbar.registerAction('history', () => {
      logger.debug('History dropdown opened');
    });
    wired.push('history');

    if (nh.goBack) {
      toolbar.registerAction('history-back-all', () => {
        const maxSteps = 50;
        let steps = 0;
        while (nh.canGoBack && nh.canGoBack() && steps < maxSteps) {
          nh.goBack();
          steps++;
        }
        logger.debug('History: back-all executed', { steps });
      });
      wired.push('history-back-all');
    }

    const clearHistoryFn = nh.clear || nh.clearHistory || nh.reset;
    if (clearHistoryFn) {
      toolbar.registerAction('history-clear', () => {
        clearHistoryFn();
        logger.debug('History: cleared');
      });
      wired.push('history-clear');
    } else {
      toolbar.registerAction('history-clear', () => {
        logger.info('History clear triggered (manager sem clear)');
      });
      wired.push('history-clear');
    }

    if (nh.getHistory || nh.getEntries || nh.size) {
      toolbar.registerStateProvider('history', () => {
        let count = 0;
        try {
          if (nh.size) {
            count = (typeof nh.size === 'function' ? nh.size() : nh.size) as number;
          } else if (nh.getHistory) {
            // @ts-expect-error TS migration - TS2339
            count = nh.getHistory().length;
          } else if (nh.getEntries) {
            // @ts-expect-error TS migration - TS2339
            count = nh.getEntries().length;
          }
        } catch (_e) {}
        return {
          badge: count > 1 ? count : undefined,
          tooltip: `Histórico (${count})`
        };
      });
    }
  } catch (e) {
    logger.warn('Navigation History indisponível', { error: (e as Error).message });
    failed.push('navigation');
  }
}
