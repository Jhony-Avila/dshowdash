// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: region-events/dom-listeners
// PURPOSE: Handlers de eventos DOM para regiões
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   REGION_MAP from ../dom-regions/index.js
//   REGION_EVENTS from ./constants.js
//   getRegionElement from ./helpers.js
//   emit from ./core.js
// EXPORTS:
//   onFocusIn — Handler para focusin
//   onFocusOut — Handler para focusout
//   onClick — Handler para click
// ═══════════════════════════════════════════════════════════════
/**
 * @module RegionEventsDOMListeners
 * @description Event handlers DOM para regiões
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

import { REGION_MAP } from '../dom-regions/index.js';
import { REGION_EVENTS } from './constants.js';
import { getRegionElement } from './helpers.js';
import { emit } from './core.js';

type DynObj = any;

export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.core.region-events.dom-listeners';

/**
 * Handler para focusin
 * @param {FocusEvent} event
 */
export function onFocusIn(event: DynObj) {
    const target = event.target;
    const keys = Object.keys(REGION_MAP);
    
    for (let i = 0; i < keys.length; i++) {
        const regionName = keys[i];
        const region = getRegionElement(regionName);
        
        if (region && region.contains(target)) {
            emit(regionName, REGION_EVENTS.FOCUS_ENTER, { element: target });
            break;
        }
    }
}

/**
 * Handler para focusout
 * @param {FocusEvent} event
 */
export function onFocusOut(event: DynObj) {
    const target = event.target;
    const relatedTarget = event.relatedTarget;
    const keys = Object.keys(REGION_MAP);
    
    for (let i = 0; i < keys.length; i++) {
        const regionName = keys[i];
        const region = getRegionElement(regionName);
        
        if (region && region.contains(target) && !region.contains(relatedTarget)) {
            emit(regionName, REGION_EVENTS.FOCUS_LEAVE, {
                element: target,
                relatedTarget
            });
            break;
        }
    }
}

/**
 * Handler para click
 * @param {MouseEvent} event
 */
export function onClick(event: DynObj) {
    const target = event.target;
    const keys = Object.keys(REGION_MAP);
    
    for (let i = 0; i < keys.length; i++) {
        const regionName = keys[i];
        const region = getRegionElement(regionName);
        
        if (region && region.contains(target)) {
            emit(regionName, REGION_EVENTS.CLICK, {
                element: target,
                x: event.clientX,
                y: event.clientY
            });
            break;
        }
    }
}
