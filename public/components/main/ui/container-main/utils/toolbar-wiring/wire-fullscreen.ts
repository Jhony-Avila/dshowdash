// toolbar-wiring/wire-fullscreen.js
// @version 1.1.0-PAB-ES6
// @description Wiring do fullscreen via manager ou fallback nativo
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.1.0)
// ═══════════════════════════════════════════════════════════════
// IMPORTS (dynamic): ../fullscreen-manager.js
// PROVIDES: wireFullscreen(toolbar, wired, failed, logger)
// ACTIONS: fullscreen
// STATE-PROVIDERS: fullscreen (active)
'use strict';

export const VERSION = '15.2.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.utils.toolbar-wiring.wire-fullscreen';

/**
 * Conecta botão fullscreen — usa manager se disponível, senão fallback nativo
 * @param {object} toolbar
 * @param {Array} wired
 * @param {Array} failed
 * @param {object} logger
 */
export async function wireFullscreen(toolbar: Record<string, (...args: unknown[]) => unknown>, wired: string[], failed: string[], logger: { debug: (msg: string, data?: Record<string, unknown>) => void; info: (msg: string, data?: Record<string, unknown>) => void; warn: (msg: string, data?: Record<string, unknown>) => void; error: (msg: string, data?: unknown) => void }) {
  function _getContainer() {
    return document.getElementById('container-main') || document.documentElement;
  }

  function _nativeFullscreenToggle() {
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      _getContainer().requestFullscreen().catch(() => {});
    }
  }

  try {
    const fsModule = await import('../fullscreen-manager.js');
    const fsMgr = (fsModule.getFullscreenManager ? fsModule.getFullscreenManager() : null) as Record<string, ((...args: unknown[]) => unknown)> | null;

    if (fsMgr && fsMgr.toggle) {
      toolbar.registerAction('fullscreen', () => {
        // @ts-expect-error TS migration - TS2339
        fsMgr.toggle(_getContainer()).catch((err: Error) => {
          logger.warn('Fullscreen toggle failed', { error: err.message });
        });
      });
      toolbar.registerStateProvider('fullscreen', () => ({
        active: fsMgr.isFullscreen()
      }));
      wired.push('fullscreen');
    } else {
      toolbar.registerAction('fullscreen', _nativeFullscreenToggle);
      wired.push('fullscreen');
    }
  } catch (e) {
    logger.warn('Fullscreen Manager indisponível, usando fallback nativo', { error: (e as Error).message });
    toolbar.registerAction('fullscreen', _nativeFullscreenToggle);
    wired.push('fullscreen');
  }
}
