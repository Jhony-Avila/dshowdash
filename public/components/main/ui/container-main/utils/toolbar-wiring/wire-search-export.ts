// toolbar-wiring/wire-search-export.js
// @version 1.1.0-PAB-ES6
// @description Wiring de search e export (PNG, JPEG, PDF, SVG)
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.1.0)
// ═══════════════════════════════════════════════════════════════
// IMPORTS: getActivePanelElement from ./helpers.js
// IMPORTS (dynamic): ../panel-search-manager/index.js, ../export-content-manager/index.js
// PROVIDES: wireSearchExport(toolbar, wired, failed, logger)
// ACTIONS: search, export, export-png, export-jpeg, export-pdf, export-svg
'use strict';

import { getActivePanelElement } from './helpers.js';

export const VERSION = '15.2.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.utils.toolbar-wiring.wire-search-export';

/**
 * Conecta busca no painel e exportação de conteúdo em múltiplos formatos
 * @param {object} toolbar
 * @param {Array} wired
 * @param {Array} failed
 * @param {object} logger
 */
export async function wireSearchExport(toolbar: Record<string, (...args: unknown[]) => unknown>, wired: string[], failed: string[], logger: { debug: (msg: string, data?: Record<string, unknown>) => void; info: (msg: string, data?: Record<string, unknown>) => void; warn: (msg: string, data?: Record<string, unknown>) => void; error: (msg: string, data?: unknown) => void }) {

  // ── PANEL SEARCH ──────────────────────────────────────────────────────
  try {
    const searchModule = await import('../panel-search-manager/index.js');
    const sm = (searchModule.getPanelSearchManager?.() || searchModule) as Record<string, ((...args: unknown[]) => unknown)>;

    const toggleSearchFn = sm.toggle || searchModule.toggle;
    if (toggleSearchFn) {
      toolbar.registerAction('search', () => { toggleSearchFn(); });
      wired.push('search');
    } else {
      failed.push('search');
    }
  } catch (e) {
    logger.warn('Panel Search Manager indisponível', { error: (e as Error).message });
    failed.push('search');
  }

  // ── EXPORT CONTENT (PNG, JPEG, PDF, SVG) ──────────────────────────────
  try {
    const exportModule = await import('../export-content-manager/index.js');

    const formats = [
      { key: 'export-png',  fn: exportModule.exportToPNG },
      { key: 'export-jpeg', fn: exportModule.exportToJPEG },
      { key: 'export-pdf',  fn: exportModule.exportToPDF },
      { key: 'export-svg',  fn: exportModule.exportToSVG }
    ];

    formats.forEach(fmt => {
      if (fmt.fn) {
        toolbar.registerAction(fmt.key, () => {
          const el = getActivePanelElement();
          // @ts-expect-error strict migration — TS2345
          fmt.fn(el).catch(err => {
            logger.warn(`${fmt.key} failed`, { error: err.message });
          });
        });
        wired.push(fmt.key);
      }
    });

    toolbar.registerAction('export', () => {
      logger.debug('Export dropdown opened');
    });
    wired.push('export');
  } catch (e) {
    logger.warn('Export Content Manager indisponível', { error: (e as Error).message });
    failed.push('export');
  }
}
