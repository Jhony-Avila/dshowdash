// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-ADAPTIVE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: drag-handler
// PURPOSE: Layout Integration - Drag Handler
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   LAYOUT_EVENTS from ../core/constants.js
//
// PROVIDES:
//   setupDragListeners() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   'mousedown'
//   'mousemove'
//   'mouseup'
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { LAYOUT_EVENTS } from '../core/constants.js';

export const VERSION = '3.3.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.resources.layout-integration.ui.drag-handler';

/**
 * Configura listeners de drag para um elemento
 * @param {string} panelId - ID do painel
 * @param {HTMLElement} element - Elemento arrastável
 * @param {Object} layoutManager - Instância do layout manager
 * @param {Function} emit - Função para emitir eventos
 * @param {HTMLElement|null} handle - Handle de drag customizado
 * @returns {Function|null} Função de cleanup ou null
 */
export function setupDragListeners(panelId: string, element: HTMLElement, layoutManager: Record<string, (...args: unknown[]) => unknown>, emit: (event: string, data: Record<string, unknown>) => void, handle: HTMLElement | null = null) {
  if (!element) return null;

  const dragHandle = handle || element.querySelector('[data-drag-handle]') || element;
  let isDragging = false;
  let startX: number, startY: number, startLeft: number, startTop: number;

  const onMouseDown = (e: MouseEvent) => {
    if (e.target !== dragHandle && !(dragHandle as HTMLElement).contains(e.target as Node)) return;

    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    startLeft = element.offsetLeft;
    startTop = element.offsetTop;

    emit(LAYOUT_EVENTS.MOVE_START, { panelId });
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  const onMouseMove = (e: MouseEvent) => {
    if (!isDragging) return;

    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    layoutManager.move(panelId, startLeft + dx, startTop + dy, { animate: false });
  };

  const onMouseUp = () => {
    if (!isDragging) return;

    isDragging = false;
    emit(LAYOUT_EVENTS.MOVE_END, { panelId });
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
  };

  (dragHandle as HTMLElement).addEventListener('mousedown', onMouseDown);

  // Retorna função de cleanup
  return () => {
    (dragHandle as HTMLElement).removeEventListener('mousedown', onMouseDown);
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);
  };
}

export default { setupDragListeners };
