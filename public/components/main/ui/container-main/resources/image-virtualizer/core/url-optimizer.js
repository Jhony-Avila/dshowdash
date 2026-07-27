import { IMAGE_QUALITY } from "../config/constants.js";
import { getFormatSupport } from "./format-detector.js";
const VERSION = "3.3.0-MODULAR";
const MODULE_ID = "main.ui.container-main.resources.image-virtualizer.core.url-optimizer";
const _urlCache = /* @__PURE__ */ new Map();
function optimizeUrl(url, quality = IMAGE_QUALITY.MEDIUM, config = {}) {
  const cacheKey = `${url}:${quality}`;
  if (_urlCache.has(cacheKey)) {
    return _urlCache.get(cacheKey);
  }
  let optimizedUrl = url;
  const formatSupport = getFormatSupport();
  if (config.enableWebP && formatSupport.webp) {
  }
  _urlCache.set(cacheKey, optimizedUrl);
  return optimizedUrl;
}
function getCachedUrl(url, quality = IMAGE_QUALITY.MEDIUM) {
  return _urlCache.get(`${url}:${quality}`) || null;
}
function clearCache() {
  _urlCache.clear();
}
function getCacheSize() {
  return _urlCache.size;
}
var url_optimizer_default = { optimizeUrl, getCachedUrl, clearCache, getCacheSize };
export {
  MODULE_ID,
  VERSION,
  clearCache,
  url_optimizer_default as default,
  getCacheSize,
  getCachedUrl,
  optimizeUrl
};
