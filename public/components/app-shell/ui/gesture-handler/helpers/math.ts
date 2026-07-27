// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: gesture-handler/helpers/math
// PURPOSE: Funções matemáticas para cálculos de gestos
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   DIRECTIONS from ../constants.js
// EXPORTS:
//   getDistance — Calcula distância entre dois pontos touch
//   getAngle — Calcula ângulo entre dois pontos
//   getSwipeDirection — Determina direção do swipe
// ═══════════════════════════════════════════════════════════════
/**
 * @module GestureHandlerMathHelpers
 * @description Cálculos matemáticos para reconhecimento de gestos
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

import { DIRECTIONS } from '../constants.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.ui.gesture-handler.helpers.math';

/**
 * Calcula distância euclidiana entre dois pontos touch
 * @param {Touch} touch1 - Primeiro ponto
 * @param {Touch} touch2 - Segundo ponto
 * @returns {number} Distância em pixels
 */
export function getDistance(touch1: DynObj, touch2: DynObj) {
    const dx = touch2.clientX - touch1.clientX;
    const dy = touch2.clientY - touch1.clientY;
    return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Calcula ângulo entre dois pontos
 * @param {Touch} touch1 - Primeiro ponto
 * @param {Touch} touch2 - Segundo ponto
 * @returns {number} Ângulo em graus
 */
export function getAngle(touch1: DynObj, touch2: DynObj) {
    const dx = touch2.clientX - touch1.clientX;
    const dy = touch2.clientY - touch1.clientY;
    return Math.atan2(dy, dx) * 180 / Math.PI;
}

/**
 * Determina a direção do swipe baseado no delta
 * @param {number} dx - Delta X
 * @param {number} dy - Delta Y
 * @returns {string} Direção (left, right, up, down)
 */
export function getSwipeDirection(dx: DynObj, dy: DynObj) {
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    
    if (absDx > absDy) {
        return dx > 0 ? DIRECTIONS.RIGHT : DIRECTIONS.LEFT;
    } else {
        return dy > 0 ? DIRECTIONS.DOWN : DIRECTIONS.UP;
    }
}
