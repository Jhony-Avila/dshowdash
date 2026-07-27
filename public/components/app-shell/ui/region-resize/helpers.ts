// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: region-resize/helpers
// PURPOSE: Helpers para sistema de resize de regiões
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   getRegion from ../../core/dom-regions/index.js
//   RESIZE_CONFIGS from ./constants.js
//   listeners, metrics from ./state.js
// EXPORTS:
//   notifyListeners — Notifica todos os listeners
//   clamp — Limita valor entre min e max
//   setCSSVariable — Define variável CSS
//   applySize — Aplica tamanho a região
// ═══════════════════════════════════════════════════════════════
/**
 * @module RegionResizeHelpers
 * @description Utilitários para resize de regiões
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

import { getRegion } from '../../core/dom-regions/index.js';
import { RESIZE_CONFIGS } from './constants.js';
import { listeners, metrics } from './state.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.ui.region-resize.helpers';

/**
 * Notifica todos os listeners de um evento
 * @param {string} event - Tipo do evento
 * @param {*} data - Dados do evento
 */
export function notifyListeners(event: string, data: DynObj) {
    for (let i = 0; i < listeners.length; i++) {
        try {
            listeners[i]({ type: event, data, timestamp: Date.now() });
        } catch (e) {
            metrics.errors++;
        }
    }
}

/**
 * Limita valor entre mínimo e máximo
 * @param {number} value - Valor a limitar
 * @param {number} min - Mínimo
 * @param {number} max - Máximo
 * @returns {number}
 */
export function clamp(value: DynObj, min: number, max: number) {
    return Math.min(Math.max(value, min), max);
}

/**
 * Define variável CSS no root
 * @param {string} name - Nome da variável
 * @param {number} value - Valor
 * @param {string} unit - Unidade (px, %, etc)
 */
export function setCSSVariable(name: string, value: DynObj, unit: DynObj) {
    if (typeof document !== 'undefined' && document.documentElement) {
        document.documentElement.style.setProperty(name, value + unit);
    }
}

/**
 * Aplica tamanho a uma região
 * @param {string} regionName - Nome da região
 * @param {number} size - Tamanho
 * @returns {boolean} Sucesso
 */
export function applySize(regionName: string, size: DynObj) {
    const config = (RESIZE_CONFIGS as DynObj)[regionName];
    if (!config) return false;
    
    const region = getRegion(regionName);
    if (!region) return false;
    
    region.style[config.property] = size + config.unit;
    
    if (config.cssVar) {
        setCSSVariable(config.cssVar, size, config.unit);
    }
    
    return true;
}
