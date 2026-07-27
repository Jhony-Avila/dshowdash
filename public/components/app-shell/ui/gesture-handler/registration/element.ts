// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: gesture-handler/registration/element
// PURPOSE: Registro de gestos em elementos específicos
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   elementHandlers, config from ../state.js
// EXPORTS:
//   addToElement — Adiciona handler de gesto a elemento
//   removeFromElement — Remove handler de elemento
// ═══════════════════════════════════════════════════════════════
/**
 * @module GestureHandlerElementRegistration
 * @description Registro de gestos por elemento
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

import { elementHandlers, config } from '../state.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.ui.gesture-handler.registration.element';

function handleElementTouch(element: HTMLElement, phase: DynObj, event: DynObj) {
    // Element-specific touch handling placeholder
}

/**
 * Adiciona handler de gesto a elemento
 * @param {string|HTMLElement} element - Elemento ou seletor
 * @param {string} gesture - Tipo do gesto
 * @param {Function} handler - Callback
 * @returns {Function|null} Função de cleanup ou null
 */
export function addToElement(element: HTMLElement, gesture: string, handler: DynObj) {
    const el = typeof element === 'string' ? document.querySelector(element) : element;
    if (!el) return null;
    
    const key = el;
    if (!elementHandlers.has(key)) {
        elementHandlers.set(key, new Map());
        
        el.addEventListener('touchstart', (e: Event) => {
            handleElementTouch(el, 'start', e);
        }, { passive: !config.preventDefaultSwipe });
        
        el.addEventListener('touchmove', (e: Event) => {
            handleElementTouch(el, 'move', e);
        }, { passive: !config.preventDefaultSwipe });
        
        el.addEventListener('touchend', (e: Event) => {
            handleElementTouch(el, 'end', e);
        }, { passive: true });
    }
    
    const gestures = elementHandlers.get(key);
    if (!gestures.has(gesture)) {
        gestures.set(gesture, new Set());
    }
    gestures.get(gesture).add(handler);
    
    return function unsubscribeElement() {
        removeFromElement(el, gesture, handler);
    };
}

/**
 * Remove handler de elemento
 * @param {string|HTMLElement} element - Elemento ou seletor
 * @param {string} gesture - Tipo do gesto
 * @param {Function} handler - Callback a remover
 */
export function removeFromElement(element: HTMLElement, gesture: string, handler: DynObj) {
    const el = typeof element === 'string' ? document.querySelector(element) : element;
    if (!el) return;
    
    const gestures = elementHandlers.get(el);
    if (!gestures) return;
    
    const gestureHandlers = gestures.get(gesture);
    if (gestureHandlers) {
        gestureHandlers.delete(handler);
    }
}
