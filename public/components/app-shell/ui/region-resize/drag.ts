// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: region-resize/drag
// PURPOSE: Drag resize de regiões
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   LayoutPersistence from ../../state/layout-persistence.js
//   RESIZE_CONFIGS from ./constants.js
//   sizes, resizing, metrics, dragState from ./state.js
//   notifyListeners from ./helpers.js
//   setSize from ./core.js
// EXPORTS:
//   startDragResize — Inicia drag resize
//   isDragging — Verifica se está arrastando
//   getDraggingRegion — Retorna região sendo arrastada
// BROWSER APIs: document.addEventListener, document.removeEventListener
// ═══════════════════════════════════════════════════════════════
/**
 * @module RegionResizeDrag
 * @description Drag resize de regiões
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

import LayoutPersistence from '../../state/layout-persistence.js';
import { RESIZE_CONFIGS } from './constants.js';
import { sizes, resizing, metrics, dragState } from './state.js';
import { notifyListeners } from './helpers.js';
import { setSize } from './core.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;

export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.ui.region-resize.drag';

function onDragMove(event: DynObj) {
    if (!dragState.active) return;
    
    event.preventDefault();
    
    const currentPos = dragState.config.property === 'width' 
        ? (event.clientX || event.touches?.[0]?.clientX || 0)
        : (event.clientY || event.touches?.[0]?.clientY || 0);
    
    const delta = currentPos - dragState.startPos;
    const newSize = dragState.startSize + delta;
    
    setSize(dragState.region, newSize, { persist: false, animate: false });
}

function onDragEnd(event: DynObj) {
    if (!dragState.active) return;
    
    const config = dragState.config;
    const regionName = dragState.region;
    
    if (config.persist && config.persistKey) {
        LayoutPersistence.setPreference(config.persistKey, (sizes as DynObj)[regionName]);
    }
    
    metrics.dragResizes++;
    notifyListeners('drag-end', { region: regionName, size: (sizes as DynObj)[regionName] });
    
    dragState.active = false;
    dragState.region = null;
    dragState.config = null;
    resizing.value = null;
    
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
    
    document.removeEventListener('mousemove', onDragMove);
    document.removeEventListener('mouseup', onDragEnd);
    document.removeEventListener('touchmove', onDragMove);
    document.removeEventListener('touchend', onDragEnd);
}

/**
 * Inicia drag resize
 * @param {string} regionName - Nome da região
 * @param {Event} event - Evento de mouse/touch
 * @returns {boolean} Sucesso
 */
export function startDragResize(regionName: string, event: DynObj) {
    const config = (RESIZE_CONFIGS as DynObj)[regionName];
    if (!config) return false;
    
    event.preventDefault();
    
    const startPos = config.property === 'width'
        ? (event.clientX || event.touches?.[0]?.clientX || 0)
        : (event.clientY || event.touches?.[0]?.clientY || 0);
    
    dragState.active = true;
    dragState.region = regionName;
    dragState.startPos = startPos;
    dragState.startSize = (sizes as DynObj)[regionName];
    dragState.config = config;
    resizing.value = regionName;
    
    document.body.style.cursor = config.property === 'width' ? 'col-resize' : 'row-resize';
    document.body.style.userSelect = 'none';
    
    document.addEventListener('mousemove', onDragMove);
    document.addEventListener('mouseup', onDragEnd);
    document.addEventListener('touchmove', onDragMove, { passive: false });
    document.addEventListener('touchend', onDragEnd);
    
    notifyListeners('drag-start', { region: regionName, startSize: dragState.startSize });
    return true;
}

export function isDragging() {
    return dragState.active;
}

export function getDraggingRegion() {
    return resizing.value;
}
