// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: region-slots/core/slot-helpers
// PURPOSE: Funções auxiliares para slots
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   SLOT_ATTRIBUTE, SLOT_ID_ATTRIBUTE, SLOT_PRIORITY_ATTRIBUTE from ../constants.js
//   getListeners, incrementMetric from ../state.js
// EXPORTS:
//   notifyListeners — Notifica listeners de eventos
//   generateSlotId — Gera ID único
//   createSlotElement — Cria elemento DOM de slot
//   insertByPriority — Insere elemento por prioridade
// BROWSER APIs: document.createElement
// ═══════════════════════════════════════════════════════════════
/**
 * @module RegionSlotsHelpers
 * @description Helpers para manipulação de slots
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

import { SLOT_ATTRIBUTE, SLOT_ID_ATTRIBUTE, SLOT_PRIORITY_ATTRIBUTE } from '../constants.js';
import { getListeners, incrementMetric } from '../state.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.core.region-slots.core.slot-helpers';

/**
 * Notifica listeners de eventos
 * @param {string} event - Tipo do evento
 * @param {*} data - Dados
 */
export function notifyListeners(event: string, data: DynObj) {
    const listeners = getListeners();
    for (let i = 0; i < listeners.length; i++) {
        try {
            listeners[i]({ type: event, data, timestamp: Date.now() });
        } catch (e) {
            incrementMetric('errors');
        }
    }
}

/**
 * Gera ID único para slot
 * @returns {string}
 */
export function generateSlotId() {
    return `slot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Cria elemento DOM de slot
 * @param {string} slotId - ID do slot
 * @param {string|HTMLElement|Object} content - Conteúdo
 * @param {Object} config - Configuração
 * @returns {HTMLElement}
 */
export function createSlotElement(slotId: string, content: DynObj, config: DynObj) {
    const element = document.createElement('div');
    element.setAttribute(SLOT_ATTRIBUTE, config.name || 'default');
    element.setAttribute(SLOT_ID_ATTRIBUTE, slotId);
    element.setAttribute(SLOT_PRIORITY_ATTRIBUTE, String(config.priority || 0));
    element.className = `dsd-slot dsd-slot--${config.name || 'default'}`;
    
    if (typeof content === 'string') {
        element.innerHTML = content;
    } else if (content instanceof HTMLElement) {
        element.appendChild(content);
    } else if (content && typeof content.render === 'function') {
        const rendered = content.render();
        if (typeof rendered === 'string') {
            element.innerHTML = rendered;
        } else if (rendered instanceof HTMLElement) {
            element.appendChild(rendered);
        }
    }
    
    return element;
}

/**
 * Insere elemento por prioridade
 * @param {HTMLElement} container - Container
 * @param {HTMLElement} newElement - Novo elemento
 * @param {number} priority - Prioridade
 */
export function insertByPriority(container: HTMLElement, newElement: DynObj, priority: number) {
    const slots = container.querySelectorAll(`[${SLOT_ATTRIBUTE}]`);
    let inserted = false;
    
    for (let i = 0; i < slots.length; i++) {
        const existingPriority = parseInt(slots[i].getAttribute(SLOT_PRIORITY_ATTRIBUTE) || '0', 10);
        if (priority > existingPriority) {
            container.insertBefore(newElement, slots[i]);
            inserted = true;
            break;
        }
    }
    
    if (!inserted) {
        container.appendChild(newElement);
    }
}

export default {
    notifyListeners, generateSlotId, createSlotElement, insertByPriority
};
