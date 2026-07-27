const MODULE_ID = "navigation-model-loader";
const VERSION = "2.3.0-FIX";
const TOKENS = {
  CACHE_KEY: "dshow_nav_model_v3",
  SESSION_KEY: "dshow_nav_session_v3",
  CACHE_TTL: 5 * 60 * 1e3,
  SESSION_TTL: 30 * 60 * 1e3,
  API_TIMEOUT: 8e3,
  RETRY_ATTEMPTS: 2,
  RETRY_DELAY: 1e3
};
const API_ENDPOINTS = {
  NAVIGATION_MODEL: "/api/ui/navigation.php?action=manifest"
};
export {
  API_ENDPOINTS,
  MODULE_ID,
  TOKENS,
  VERSION
};
