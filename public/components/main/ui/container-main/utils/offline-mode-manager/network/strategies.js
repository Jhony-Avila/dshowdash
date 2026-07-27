import { CACHE_STRATEGIES, OFFLINE_STATES } from "../constants.js";
import { getConfig, getState, incrementMetric } from "../state.js";
import { _cacheResponse, _getCachedResponse } from "../cache/manager.js";
const VERSION = "15.2.0-MODULAR";
const MODULE_ID = "main.ui.container-main.utils.offline-mode-manager.network.strategies";
async function cachedFetch(url, options = {}) {
  const config = getConfig();
  const strategy = options.strategy || config.strategy;
  switch (strategy) {
    case CACHE_STRATEGIES.CACHE_FIRST:
      return _cacheFirstFetch(url, options);
    case CACHE_STRATEGIES.CACHE_ONLY:
      return _cacheOnlyFetch(url);
    case CACHE_STRATEGIES.NETWORK_ONLY:
      return _networkOnlyFetch(url, options);
    case CACHE_STRATEGIES.STALE_WHILE_REVALIDATE:
      return _staleWhileRevalidateFetch(url, options);
    case CACHE_STRATEGIES.NETWORK_FIRST:
    default:
      return _networkFirstFetch(url, options);
  }
}
async function _networkFirstFetch(url, options) {
  if (getState() === OFFLINE_STATES.OFFLINE) {
    const cached = await _getCachedResponse(url);
    if (cached) {
      incrementMetric("offlineServes");
      return cached;
    }
    throw new Error("Offline and no cached response available");
  }
  try {
    incrementMetric("networkRequests");
    const response = await fetch(url, options);
    if (response.ok) {
      await _cacheResponse(url, response);
    }
    return response;
  } catch (error) {
    const cached = await _getCachedResponse(url);
    if (cached) {
      incrementMetric("offlineServes");
      return cached;
    }
    throw error;
  }
}
async function _cacheFirstFetch(url, options) {
  const cached = await _getCachedResponse(url);
  if (cached) return cached;
  if (getState() === OFFLINE_STATES.OFFLINE) {
    throw new Error("Offline and no cached response available");
  }
  incrementMetric("networkRequests");
  const response = await fetch(url, options);
  if (response.ok) {
    await _cacheResponse(url, response);
  }
  return response;
}
async function _cacheOnlyFetch(url) {
  const cached = await _getCachedResponse(url);
  if (cached) return cached;
  throw new Error("No cached response available");
}
async function _networkOnlyFetch(url, options) {
  if (getState() === OFFLINE_STATES.OFFLINE) {
    throw new Error("Offline");
  }
  incrementMetric("networkRequests");
  return fetch(url, options);
}
async function _staleWhileRevalidateFetch(url, options) {
  const cached = await _getCachedResponse(url);
  if (getState() === OFFLINE_STATES.ONLINE) {
    incrementMetric("networkRequests");
    fetch(url, options).then((response) => {
      if (response.ok) _cacheResponse(url, response);
    }).catch(() => {
      incrementMetric("revalidationFailed");
    });
  }
  if (cached) return cached;
  if (getState() === OFFLINE_STATES.OFFLINE) {
    throw new Error("Offline and no cached response available");
  }
  return fetch(url, options);
}
export {
  MODULE_ID,
  VERSION,
  cachedFetch
};
