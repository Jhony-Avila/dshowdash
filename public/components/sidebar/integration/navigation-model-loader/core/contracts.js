import { MODULE_ID } from "./constants.js";
const VERSION = "2.3.0-FIX";
const EVENTS = {
  LOAD_START: `${MODULE_ID}:load:start`,
  LOAD_SUCCESS: `${MODULE_ID}:load:success`,
  LOAD_ERROR: `${MODULE_ID}:load:error`,
  LOAD_FALLBACK: `${MODULE_ID}:load:fallback`,
  CACHE_HIT: `${MODULE_ID}:cache:hit`,
  CACHE_MISS: `${MODULE_ID}:cache:miss`,
  CACHE_INVALIDATE: `${MODULE_ID}:cache:invalidate`,
  MODEL_READY: `${MODULE_ID}:model:ready`,
  MODEL_UPDATE: `${MODULE_ID}:model:update`
};
const STATES = {
  IDLE: "idle",
  LOADING: "loading",
  LOADED: "loaded",
  ERROR: "error",
  FALLBACK: "fallback"
};
const ERRORS = {
  NETWORK: "NETWORK_ERROR",
  TIMEOUT: "TIMEOUT_ERROR",
  PARSE: "PARSE_ERROR",
  AUTH: "AUTH_ERROR",
  UNKNOWN: "UNKNOWN_ERROR"
};
export {
  ERRORS,
  EVENTS,
  STATES,
  VERSION
};
