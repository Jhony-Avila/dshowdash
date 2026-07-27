// toolbar-wiring/wire-clipboard-capture.js
// @version 1.1.0-PAB-ES6
// @description Wiring de clipboard (copy-url, copy-content), screenshot (png, pdf), wake lock
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.1.0)
// ═══════════════════════════════════════════════════════════════
// IMPORTS: getActivePanelElement from ./helpers.js
// IMPORTS (dynamic): ../clipboard-manager.js, ../export-content-manager/index.js,
//                    ../wake-lock-manager.js
// PROVIDES: wireClipboardCapture(toolbar, wired, failed, logger)
// ACTIONS: clipboard, clipboard-copy-url, clipboard-copy-content,
//          screenshot, screenshot-png, screenshot-pdf, wakeLock
// STATE-PROVIDERS: clipboard (badge, tooltip), wakeLock (active, dot, disabled, tooltip)
'use strict';

import { getActivePanelElement } from './helpers.js';

export const VERSION = '15.2.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.utils.toolbar-wiring.wire-clipboard-capture';

/**
 * Conecta clipboard, screenshot e wake lock à toolbar
 * @param {object} toolbar
 * @param {Array} wired
 * @param {Array} failed
 * @param {object} logger
 */
export async function wireClipboardCapture(toolbar: Record<string, (...args: unknown[]) => unknown>, wired: string[], failed: string[], logger: { debug: (msg: string, data?: Record<string, unknown>) => void; info: (msg: string, data?: Record<string, unknown>) => void; warn: (msg: string, data?: Record<string, unknown>) => void; error: (msg: string, data?: unknown) => void }) {

  // ── CLIPBOARD ─────────────────────────────────────────────────────────
  try {
    const clipModule = await import('../clipboard-manager.js');
    const clipMgr = (clipModule.getClipboardManager ? clipModule.getClipboardManager() : null) as Record<string, ((...args: unknown[]) => unknown)> | null;

    toolbar.registerAction('clipboard', () => {
      logger.debug('Clipboard dropdown opened');
    });
    wired.push('clipboard');

    toolbar.registerAction('clipboard-copy-url', () => {
      const url = window.location.href;
      if (clipMgr && clipMgr.copy) {
        // @ts-expect-error TS migration - TS2339
        clipMgr.copy(url, { notify: true }).then((ok: unknown) => {
          if (ok) logger.debug('URL copiada', { url });
        });
      } else if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(url).catch(() => {});
        logger.debug('URL copiada (fallback)', { url });
      }
    });
    wired.push('clipboard-copy-url');

    toolbar.registerAction('clipboard-copy-content', () => {
      const panelEl = getActivePanelElement();
      if (!panelEl) {
        logger.warn('Clipboard: nenhum painel ativo');
        return;
      }
      if (clipMgr && clipMgr.copyFromElement) {
        // @ts-expect-error TS migration - TS2339
        clipMgr.copyFromElement(panelEl, { notify: true }).then((ok: unknown) => {
          if (ok) logger.debug('Conteúdo do painel copiado');
        });
      } else {
        const text = panelEl.textContent || '';
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).catch(() => {});
        }
        logger.debug('Conteúdo copiado (fallback)', { length: text.length });
      }
    });
    wired.push('clipboard-copy-content');

    if (clipMgr && clipMgr.getHistory) {
      toolbar.registerStateProvider('clipboard', () => {
        let history = [];
        // @ts-expect-error TS migration - TS2740
        try { history = clipMgr.getHistory(); } catch (_e) {}
        const count = history.length || 0;
        return {
          badge: count > 0 ? count : undefined,
          tooltip: `Clipboard${count > 0 ? ` (${count})` : ''}`
        };
      });
    }
  } catch (e) {
    logger.warn('Clipboard Manager indisponível', { error: (e as Error).message });
    toolbar.registerAction('clipboard', () => { logger.debug('Clipboard dropdown (sem manager)'); });
    wired.push('clipboard');

    toolbar.registerAction('clipboard-copy-url', () => {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(window.location.href).catch(() => {});
      }
    });
    wired.push('clipboard-copy-url');

    toolbar.registerAction('clipboard-copy-content', () => {
      const panelEl = getActivePanelElement();
      if (panelEl && navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(panelEl.textContent || '').catch(() => {});
      }
    });
    wired.push('clipboard-copy-content');
  }

  // ── SCREENSHOT ────────────────────────────────────────────────────────
  try {
    const screenshotModule = await import('../export-content-manager/index.js');

    const ssExportPNG = screenshotModule.exportToPNG;
    const ssExportPDF = screenshotModule.exportToPDF;

    toolbar.registerAction('screenshot', () => {
      logger.debug('Screenshot dropdown opened');
    });
    wired.push('screenshot');

    if (ssExportPNG) {
      toolbar.registerAction('screenshot-png', () => {
        const el = getActivePanelElement();
        logger.debug('Screenshot PNG: capturing', { element: el!.id || el!.className });
        // @ts-expect-error strict migration — TS2345
        ssExportPNG(el, { filename: `screenshot-${Date.now()}` }).catch(err => {
          logger.warn('Screenshot PNG failed', { error: err.message });
        });
      });
      wired.push('screenshot-png');
    } else {
      failed.push('screenshot-png');
    }

    if (ssExportPDF) {
      toolbar.registerAction('screenshot-pdf', () => {
        const el = getActivePanelElement();
        logger.debug('Screenshot PDF: capturing', { element: el!.id || el!.className });
        // @ts-expect-error strict migration — TS2345
        ssExportPDF(el, { filename: `screenshot-${Date.now()}` }).catch(err => {
          logger.warn('Screenshot PDF failed', { error: err.message });
        });
      });
      wired.push('screenshot-pdf');
    } else {
      failed.push('screenshot-pdf');
    }
  } catch (e) {
    logger.warn('Screenshot (Export Content Manager) indisponível', { error: (e as Error).message });
    toolbar.registerAction('screenshot', () => { logger.debug('Screenshot dropdown (sem manager)'); });
    wired.push('screenshot');
    failed.push('screenshot-png', 'screenshot-pdf');
  }

  // ── WAKE LOCK ─────────────────────────────────────────────────────────
  try {
    const wlModule = await import('../wake-lock-manager.js');
    const wlMgr = (wlModule.getWakeLockManager ? wlModule.getWakeLockManager() : null) as Record<string, ((...args: unknown[]) => unknown)> | null;

    if (wlMgr && wlMgr.toggle) {
      toolbar.registerAction('wakeLock', () => {
        // @ts-expect-error TS migration - TS2339
        wlMgr.toggle().then((isActive: boolean) => {
          logger.debug('Wake Lock toggled', { active: isActive });
        }).catch((err: Error) => {
          logger.warn('Wake Lock toggle failed', { error: err.message });
        });
      });

      toolbar.registerStateProvider('wakeLock', () => {
        let active = false;
        let supported = false;
        try {
          active = wlMgr.isActive() as boolean;
          supported = wlMgr.isSupported() as boolean;
        } catch (_e) {}
        return {
          active,
          dot: active,
          disabled: !supported,
          tooltip: !supported ? 'Wake Lock não suportado' : (active ? 'Tela Ligada (ativo)' : 'Manter Tela Ligada')
        };
      });
      wired.push('wakeLock');
    } else {
      toolbar.registerAction('wakeLock', () => {
        logger.debug('Wake Lock (manager sem toggle)');
      });
      toolbar.registerStateProvider('wakeLock', () => ({
        disabled: !('wakeLock' in navigator),
        tooltip: 'Manter Tela Ligada'
      }));
      wired.push('wakeLock');
    }
  } catch (e) {
    logger.warn('Wake Lock Manager indisponível', { error: (e as Error).message });
    toolbar.registerAction('wakeLock', () => {
      logger.debug('Wake Lock (sem manager)');
    });
    toolbar.registerStateProvider('wakeLock', () => ({
      disabled: true,
      tooltip: 'Wake Lock indisponível'
    }));
    wired.push('wakeLock');
  }
}
