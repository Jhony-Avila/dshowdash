import { CARD_INTENTS, CARD_EVENTS } from "/core/runtime/events/catalog/card.events.js";
const VERSION = "9.2.0-P2-ENTERPRISE";
const MODULE_ID = "components.cards.card-03.core.constants";
const CARD_ID = "card-03";
const CARD_NAME = "Performance Score";
const CONFIG = Object.freeze({
  API_ENDPOINT: "/api/modules/cards/card-03/api.php",
  REFRESH_INTERVAL: 6e4,
  API_TIMEOUT: 1e4,
  API_RETRIES: 2
});
const STATES = Object.freeze({
  IDLE: "IDLE",
  LOADING: "LOADING",
  SUCCESS: "SUCCESS",
  ERROR: "ERROR",
  PAUSED: "PAUSED"
});
const EVENTS = Object.freeze({
  REFRESH: CARD_INTENTS.REFRESH_ALL,
  DATA_LOADED: CARD_EVENTS.LOADED,
  ERROR: CARD_EVENTS.ERROR
});
const info = () => ({ moduleId: MODULE_ID, version: VERSION, cardId: CARD_ID, cardName: CARD_NAME, timestamp: Date.now() });
const healthCheck = () => ({ status: "HEALTHY", moduleId: MODULE_ID, version: VERSION, checks: { constantsReady: true }, timestamp: Date.now() });
var constants_default = { VERSION, MODULE_ID, CARD_ID, CARD_NAME, CONFIG, STATES, EVENTS, info, healthCheck };
export {
  CARD_ID,
  CARD_NAME,
  CONFIG,
  EVENTS,
  MODULE_ID,
  STATES,
  VERSION,
  constants_default as default,
  healthCheck,
  info
};
