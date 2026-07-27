// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-ADAPTIVE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: resize-observer
// PURPOSE: Layout Integration - Resize Observer
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   LAYOUT_EVENTS from ../core/constants.js
//
// PROVIDES:
//   setupResizeObserver() — exported function
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

import { LAYOUT_EVENTS } from '../core/constants.js';

export const VERSION = '3.3.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.resources.layout-integration.ui.resize-observer';

/**
 * Configura ResizeObserver para um elemento
 * @param {string} panelId - ID do painel
 * @param {HTMLElement} element - Elemento a observar
 * @param {Function} emit - Função para emitir eventos
 * @param {Function} onLayoutChange - Callback de mudança de layout
 * @returns {ResizeObserver|null} Observer ou null se não suportado
 */
export function setupResizeObserver(panelId: string, element: HTMLElement, emit: (event: string, data: Record<string, unknown>) => void, onLayoutChange: ((...args: unknown[]) => void) | null) {
  if (!element || typeof ResizeObserver === 'undefined') {
    return null;
  }

  const observer = new ResizeObserver(entries => {
    entries.forEach(entry => {
      const { width, height } = entry.contentRect;
      emit(LAYOUT_EVENTS.RESIZE_END, { panelId, width, height });
      onLayoutChange?.(panelId, 'resize', { width, height });
    });
  });

  observer.observe(element);
  return observer;
}

export default { setupResizeObserver };
