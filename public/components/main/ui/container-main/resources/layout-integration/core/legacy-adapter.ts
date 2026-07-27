// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-ADAPTIVE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: legacy-adapter
// PURPOSE: Layout Integration - Legacy Adapter
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   createLegacyAdapter() — exported function
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

export const VERSION = '3.3.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.resources.layout-integration.core.legacy-adapter';

/**
 * Cria adaptador para painel legado
 * @param {string} panelId - ID do painel
 * @param {Object} panel - Instância do painel
 * @param {HTMLElement} element - Elemento DOM do painel
 * @returns {Object} Adaptador com métodos padronizados
 */
export function createLegacyAdapter(panelId: string, panel: Record<string, unknown>, element: HTMLElement) {
  return {
    panelId,
    panel,
    element,
    originalMethods: {},

    // Intercepta resize
    resize(width: number, height: number) {
      if (panel.onResize) {
        (panel.onResize as (d: { width: number; height: number }) => void)({ width, height });
      } else if (panel.handleResize) {
        (panel.handleResize as (w: number, h: number) => void)(width, height);
      } else if (panel._resize) {
        (panel._resize as (w: number, h: number) => void)(width, height);
      }

      if (element) {
        element.style.width = `${width}px`;
        element.style.height = `${height}px`;
      }
    },

    // Intercepta move
    move(x: number, y: number) {
      if (panel.onMove) {
        (panel.onMove as (d: { x: number; y: number }) => void)({ x, y });
      } else if (panel.handleMove) {
        (panel.handleMove as (x: number, y: number) => void)(x, y);
      }

      if (element) {
        element.style.left = `${x}px`;
        element.style.top = `${y}px`;
      }
    },

    // Intercepta fullscreen
    setFullscreen(isFullscreen: unknown) {
      if (panel.onFullscreen) {
        (panel.onFullscreen as (v: unknown) => void)(isFullscreen);
      } else if (panel.setFullscreen) {
        (panel.setFullscreen as (v: unknown) => void)(isFullscreen);
      }
    },

    // Obtém estado
    getState() {
      if (panel.getState) {
        return (panel.getState as () => unknown)();
      }
      return {
        width: element?.offsetWidth,
        height: element?.offsetHeight
      };
    }
  };
}

export default { createLegacyAdapter };
