// toolbar-wiring/wire-content.js
// @version 1.1.0-PAB-ES6
// @description Wiring de bookmark, theme, features-integration (command/split/tour), print
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.1.0)
// ═══════════════════════════════════════════════════════════════
// IMPORTS: getActivePanelId from ./helpers.js
// IMPORTS (dynamic): ../panel-bookmarks-manager/index.js,
//                    ../theme-manager-v2.js, ../features-integration/index.js
// PROVIDES: wireContent(toolbar, wired, failed, logger)
// ACTIONS: bookmark, theme, command, split, tour, print
// STATE-PROVIDERS: bookmark (active)
'use strict';

import { getActivePanelId } from './helpers.js';

export const VERSION = '15.2.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.utils.toolbar-wiring.wire-content';

/**
 * Conecta ações de conteúdo — bookmarks, theme, features, print
 * @param {object} toolbar
 * @param {Array} wired
 * @param {Array} failed
 * @param {object} logger
 */
export async function wireContent(toolbar: Record<string, (...args: unknown[]) => unknown>, wired: string[], failed: string[], logger: { debug: (msg: string, data?: Record<string, unknown>) => void; info: (msg: string, data?: Record<string, unknown>) => void; warn: (msg: string, data?: Record<string, unknown>) => void; error: (msg: string, data?: unknown) => void }) {

  // ── BOOKMARKS ─────────────────────────────────────────────────────────
  try {
    const bmModule = await import('../panel-bookmarks-manager/index.js');
    const bm = (bmModule.getPanelBookmarksManager?.() || bmModule) as Record<string, ((...args: unknown[]) => unknown)>;

    const addFn = bm.addBookmark || bmModule.addBookmark;
    const isBookmarkedFn = bm.isBookmarked || bmModule.isBookmarked;

    if (addFn) {
      toolbar.registerAction('bookmark', () => {
        const panelId = getActivePanelId();
        if (panelId) addFn(panelId);
      });

      if (isBookmarkedFn) {
        toolbar.registerStateProvider('bookmark', () => {
          const panelId = getActivePanelId();
          return { active: panelId ? isBookmarkedFn(panelId) : false };
        });
      }
      wired.push('bookmark');
    }
  } catch (e) {
    logger.warn('Bookmarks indisponível', { error: (e as Error).message });
    failed.push('bookmark');
  }

  // ── THEME ─────────────────────────────────────────────────────────────
  try {
    const themeModule = await import('../theme-manager-v2.js');

    // @ts-expect-error TS migration - TS2339
    const tm = themeModule.default?.toggle ? themeModule.default : themeModule;


    // @ts-expect-error TS migration - TS2339
    if (tm.createThemeManager || tm.toggle) {

      // @ts-expect-error TS migration - TS2339
      const themeManager = tm.toggle ? tm : (tm.createThemeManager ? tm.createThemeManager() : null);

      // @ts-expect-error TS migration - TS2339
      if (themeManager && themeManager.toggle) {

        // @ts-expect-error TS migration - TS2339
        toolbar.registerAction('theme', () => { themeManager.toggle(); });
        wired.push('theme');
      }
    }
  } catch (e) {
    logger.warn('Theme Manager indisponível', { error: (e as Error).message });
    failed.push('theme');
  }

  // ── FEATURES-INTEGRATION (command, split, tour) ───────────────────────
  try {
    const fiModule = await import('../features-integration/index.js');

    if (fiModule.openCommandPalette) {
      toolbar.registerAction('command', () => { fiModule.openCommandPalette(); });
      wired.push('command');
    } else {
      failed.push('command');
    }

    if (fiModule.toggleSplitView) {
      toolbar.registerAction('split', () => { fiModule.toggleSplitView(); });
      wired.push('split');
    } else {
      failed.push('split');
    }

    if (fiModule.startWelcomeTour) {
      toolbar.registerAction('tour', () => { fiModule.startWelcomeTour(); });
      wired.push('tour');
    } else {
      failed.push('tour');
    }
  } catch (e) {
    logger.warn('Features Integration indisponível', { error: (e as Error).message });
    failed.push('command', 'split', 'tour');
  }

  // ── PRINT ─────────────────────────────────────────────────────────────
  try {
    toolbar.registerAction('print', () => {
      window.print();
    });
    wired.push('print');
  } catch (e) {
    failed.push('print');
  }
}
