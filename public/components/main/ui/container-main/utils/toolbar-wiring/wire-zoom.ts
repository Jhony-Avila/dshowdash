// toolbar-wiring/wire-zoom.js
// @version 1.1.0-PAB-ES6
// @description Wiring de zoomIn, zoomOut, zoomReset com auto-init
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.1.0)
// ═══════════════════════════════════════════════════════════════
// IMPORTS (dynamic): ../zoom-manager/index.js
// PROVIDES: wireZoom(toolbar, wired, failed, logger)
// ACTIONS: zoomIn, zoomOut, zoomReset
// STATE-PROVIDERS: zoomReset (tooltip com %)
// BROWSER-APIS: document.getElementById, document.querySelector
'use strict';

export const VERSION = '15.2.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.utils.toolbar-wiring.wire-zoom';

/**
 * Conecta botões de zoom — auto-inicializa o zoom-manager no primeiro uso
 * @param {object} toolbar
 * @param {Array} wired
 * @param {Array} failed
 * @param {object} logger
 */
export async function wireZoom(toolbar: Record<string, (...args: unknown[]) => unknown>, wired: string[], failed: string[], logger: { debug: (msg: string, data?: Record<string, unknown>) => void; info: (msg: string, data?: Record<string, unknown>) => void; warn: (msg: string, data?: Record<string, unknown>) => void; error: (msg: string, data?: unknown) => void }) {
  try {
    const zoomModule: any = await import('../zoom-manager/index.js');

    const zoomInitFn = zoomModule.init;
    const zoomGetCurrentZoom = zoomModule.getCurrentZoom;
    let zoomInitialized = false;

    function _ensureZoomInit() {
      if (zoomInitialized) return true;
      if (!zoomInitFn) return false;

      const container = document.getElementById('container-main');
      if (!container) return false;

      const content = container.querySelector('.dsd-container__body')
        || container.querySelector('.panel-active')
        || container;

      zoomInitFn(container, content);
      zoomInitialized = true;
      logger.debug('Zoom manager auto-initialized', {
        content: content.className || content.id || 'container'
      });
      return true;
    }

    if (zoomModule.zoomIn) {
      toolbar.registerAction('zoomIn', () => {
        _ensureZoomInit();
        zoomModule.zoomIn();
      });
      wired.push('zoomIn');
    }

    if (zoomModule.zoomOut) {
      toolbar.registerAction('zoomOut', () => {
        _ensureZoomInit();
        zoomModule.zoomOut();
      });
      wired.push('zoomOut');
    }

    if (zoomModule.resetZoom) {
      toolbar.registerAction('zoomReset', () => {
        _ensureZoomInit();
        zoomModule.resetZoom();
      });
      toolbar.registerStateProvider('zoomReset', () => {
        const zoom = zoomGetCurrentZoom ? zoomGetCurrentZoom() : 1;
        return { tooltip: `Zoom ${Math.round(zoom * 100)}%` };
      });
      wired.push('zoomReset');
    }
  } catch (e) {
    logger.warn('Zoom Manager indisponível', { error: (e as Error).message });
    failed.push('zoom');
  }
}
