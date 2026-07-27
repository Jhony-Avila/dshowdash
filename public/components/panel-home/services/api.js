import { CONFIG } from "../core/config.js";
const VERSION = "1.1.0-P2-ENTERPRISE";
const MODULE_ID = "panel-home.services.api";
let _cache = {
  messages: null,
  timestamp: 0
};
function isCacheValid() {
  if (!_cache.messages) return false;
  const elapsed = Date.now() - _cache.timestamp;
  return elapsed < CONFIG.api.cacheTime;
}
async function fetchMessages() {
  if (isCacheValid()) {
    return _cache.messages;
  }
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.api.timeout);
    const response = await fetch(CONFIG.api.endpoint, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json"
      },
      credentials: "same-origin",
      signal: controller.signal
    });
    clearTimeout(timeoutId);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const data = await response.json();
    const messages = Array.isArray(data) ? data : data.messages || data.data || [];
    _cache.messages = messages;
    _cache.timestamp = Date.now();
    return messages;
  } catch (error) {
    if (_cache.messages) {
      console.debug("[panel-home:api] Fetch failed, using stale cache:", error.message);
      return _cache.messages;
    }
    console.debug("[panel-home:api] Fetch failed, no cache available:", error.message);
    return [];
  }
}
function clearCache() {
  _cache.messages = null;
  _cache.timestamp = 0;
}
async function refreshMessages() {
  clearCache();
  return fetchMessages();
}
function getCacheStats() {
  return {
    hasCache: !!_cache.messages,
    messageCount: _cache.messages?.length || 0,
    cacheAge: _cache.timestamp ? Date.now() - _cache.timestamp : null,
    isValid: isCacheValid()
  };
}
var api_default = {
  fetchMessages,
  clearCache,
  refreshMessages,
  getCacheStats
};
export {
  MODULE_ID,
  VERSION,
  clearCache,
  api_default as default,
  fetchMessages,
  getCacheStats,
  refreshMessages
};
