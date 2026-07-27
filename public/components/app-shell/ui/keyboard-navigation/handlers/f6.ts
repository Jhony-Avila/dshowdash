// @upgrade P2-ENTERPRISE: Elevated to standardized DEPENDENCY CONTRACT
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.0.1-IMPORT-FIX)
// ═══════════════════════════════════════════════════════════════
// MODULE: keyboard-navigation/handlers/f6
// PURPOSE: Handler para tecla F6 (navegação entre regiões)
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   getRegion from ../../../core/dom-regions/index.js
//   isEnabled, setCurrentRegionIndex, incrementMetric, notifyListeners from ../state.js
//   getVisibleRegions from ../helpers/regions.js
//   focusFirstInRegion from ../helpers/focus.js
// EXPORTS:
//   handleF6 — Handler para KeyboardEvent de F6
// ═══════════════════════════════════════════════════════════════
/**
 * @module KeyboardNavigationF6Handler
 * @description Navegação F6 entre regiões (padrão ARIA)
 * @version 1.0.1-IMPORT-FIX-AAA
 * @since 2025-02-02
 * @changelog
 *   v1.0.1-IMPORT-FIX - Fixed import path: ../../core → ../../../core
 */
'use strict';

import { getRegion } from '../../../core/dom-regions/index.js';
import { isEnabled, setCurrentRegionIndex, incrementMetric, notifyListeners } from '../state.js';
import { getVisibleRegions } from '../helpers/regions.js';
import { focusFirstInRegion } from '../helpers/focus.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.ui.keyboard-navigation.handlers.f6';

/**
 * Handler para tecla F6
 * @param {KeyboardEvent} event - Evento de teclado
 * @param {boolean} reverse - Se Shift está pressionado
 */
export function handleF6(event: DynObj, reverse: DynObj) {
    if (!isEnabled()) return;
    
    event.preventDefault();
    
    const visibleRegions = getVisibleRegions();
    if (visibleRegions.length === 0) return;
    
    // Encontra região atual
    let currentIdx = -1;
    const activeElement = document.activeElement;
    
    for (let i = 0; i < visibleRegions.length; i++) {
        const region = getRegion(visibleRegions[i]);
        if (region && region.contains(activeElement)) {
            currentIdx = i;
            break;
        }
    }
    
    // Calcula próximo índice
    let nextIdx;
    if (reverse) {
        nextIdx = currentIdx <= 0 ? visibleRegions.length - 1 : currentIdx - 1;
    } else {
        nextIdx = currentIdx >= visibleRegions.length - 1 ? 0 : currentIdx + 1;
    }
    
    const nextRegion = visibleRegions[nextIdx];
    focusFirstInRegion(nextRegion);
    setCurrentRegionIndex(nextIdx);
    incrementMetric('f6Navigations');
    
    notifyListeners('region-navigate', {
        from: currentIdx >= 0 ? visibleRegions[currentIdx] : null,
        to: nextRegion,
        reverse
    });
}
