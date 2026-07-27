// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: region-events/state
// PURPOSE: Estado compartilhado do sistema de eventos de região
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   REGION_MAP from ../dom-regions/index.js
// EXPORTS:
//   listeners — Mapa de listeners por região
//   globalListeners — Array de listeners globais
//   eventHistory — Histórico de eventos
//   historyLimit — Limite do histórico
//   initialized — Flag de inicialização
//   domListenersAttached — Flag de listeners DOM
//   metrics — Métricas de uso
// ═══════════════════════════════════════════════════════════════
/**
 * @module RegionEventsState
 * @description Estado centralizado para eventos de região
 * @version 1.0.0-AAA
 * @since 2025-02-02
 */
'use strict';

import { REGION_MAP } from '../dom-regions/index.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.core.region-events.state';

export const listeners = {};
export const globalListeners: DynObj[] = [];
export const eventHistory: DynObj[] = [];
export const historyLimit = { value: 100 };
export const initialized = { value: false };
export const domListenersAttached = { value: false };

export const metrics = {
    eventsEmitted: 0,
    listenersAdded: 0,
    listenersRemoved: 0,
    errors: 0
};

// Inicializa buckets de listeners para cada região
const regionNames = Object.keys(REGION_MAP);
for (let i = 0; i < regionNames.length; i++) {
    (listeners as DynObj)[regionNames[i]] = {};
}
