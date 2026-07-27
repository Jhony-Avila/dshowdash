// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: region-events/helpers
// PURPOSE: Funções auxiliares para sistema de eventos de região
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   getRegion from ../dom-regions/index.js
//   MODULE_ID from ./constants.js
//   eventHistory, historyLimit from ./state.js
// EXPORTS:
//   addToHistory — Adiciona evento ao histórico
//   createEvent — Cria objeto de evento padronizado
//   getRegionElement — Obtém elemento DOM da região
// ═══════════════════════════════════════════════════════════════
/**
 * @module RegionEventsHelpers
 * @description Helpers para eventos de região
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

import { getRegion } from '../dom-regions/index.js';
import { MODULE_ID } from './constants.js';
import { eventHistory, historyLimit } from './state.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '1.0.1-AAA';

/**
 * Adiciona evento ao histórico com limite
 * @param {Object} event - Evento a adicionar
 */
export function addToHistory(event: DynObj) {
    eventHistory.push(event);
    if (eventHistory.length > historyLimit.value) {
        eventHistory.shift();
    }
}

/**
 * Cria objeto de evento padronizado
 * @param {string} regionName - Nome da região
 * @param {string} eventType - Tipo do evento
 * @param {*} data - Dados do evento
 * @returns {Object} Evento formatado
 */
export function createEvent(regionName: string, eventType: DynObj, data: DynObj) {
    return {
        type: eventType,
        region: regionName,
        data: data || null,
        timestamp: Date.now(),
        id: `${MODULE_ID}:${Date.now()}:${Math.random().toString(36).substr(2, 9)}`
    };
}

/**
 * Obtém elemento DOM da região
 * @param {string} regionName - Nome da região
 * @returns {HTMLElement|null}
 */
export function getRegionElement(regionName: string) {
    return getRegion(regionName);
}
