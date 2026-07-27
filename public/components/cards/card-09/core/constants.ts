// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (9.2.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.cards.card-09.core.constants
// PURPOSE: Card 09 constants, config, states and events
// ───────────────────────────────────────────────────────────────
// @contract CONFIG - API endpoint, refresh interval, timeout, retries
// @contract STATES - IDLE/LOADING/SUCCESS/ERROR/PAUSED
// @contract EVENTS - Card intent and event mappings
// ───────────────────────────────────────────────────────────────
// IMPORTS: CARD_INTENTS, CARD_EVENTS from /core/runtime/events/catalog/card.events.js
// PROVIDES: VERSION, MODULE_ID, CARD_ID, CARD_NAME, CONFIG, STATES, EVENTS,
//   info(), healthCheck()
// @changelog v9.2.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v9.1.0-ENTERPRISE: ES6 conversion
// ═══════════════════════════════════════════════════════════════
'use strict';

import { CARD_INTENTS, CARD_EVENTS } from '/core/runtime/events/catalog/card.events.js';

export const VERSION = '9.2.0-P2-ENTERPRISE';
export const MODULE_ID = 'components.cards.card-09.core.constants';
export const CARD_ID = 'card-09';
export const CARD_NAME = 'Total de Execuções';

export const CONFIG = Object.freeze({
  API_ENDPOINT: '/api/modules/cards/card-09/api.php',
  REFRESH_INTERVAL: 60000,
  API_TIMEOUT: 10000,
  API_RETRIES: 2
});

export const STATES = Object.freeze({
  IDLE: 'IDLE',
  LOADING: 'LOADING',
  SUCCESS: 'SUCCESS',
  ERROR: 'ERROR',
  PAUSED: 'PAUSED'
});

export const EVENTS = Object.freeze({
  REFRESH: CARD_INTENTS.REFRESH_ALL,
  CARD_REFRESH: CARD_INTENTS.REFRESH,
  DATA_LOADED: CARD_EVENTS.LOADED,
  ERROR: CARD_EVENTS.ERROR
});

export const info = () => ({ moduleId: MODULE_ID, version: VERSION, cardId: CARD_ID, cardName: CARD_NAME, timestamp: Date.now() });
export const healthCheck = () => ({ status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { constantsReady: true }, timestamp: Date.now() });

export default { VERSION, MODULE_ID, CARD_ID, CARD_NAME, CONFIG, STATES, EVENTS, info, healthCheck };
