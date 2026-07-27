import {
  VERSION,
  MODULE_ID,
  LOAD_STRATEGIES,
  IMAGE_STATES,
  IMAGE_QUALITY,
  DEFAULT_CONFIG
} from "./config/constants.js";
import { detectFormatSupport, getFormatSupport } from "./core/format-detector.js";
import { generatePlaceholder } from "./core/placeholder-generator.js";
import { optimizeUrl, clearCache as clearUrlCache } from "./core/url-optimizer.js";
import { createImageLoader } from "./core/image-loader.js";
import { createIntersectionHandler } from "./observer/intersection-handler.js";
import { createMetrics, getMetricsReport, performHealthCheck, getInfo } from "./diagnostics/metrics.js";
function createImageVirtualizer(options = {}) {
  const config = { ...DEFAULT_CONFIG, ...options };
  const { eventBus, onLoad, onError, onProgress } = options;
  const _images = /* @__PURE__ */ new Map();
  let _metrics = createMetrics();
  let _destroyed = false;
  function _emit(event, data) {
    if (eventBus?.emit) {
      eventBus.emit(event, { ...data, source: MODULE_ID, timestamp: Date.now() });
    }
  }
  const _loader = createImageLoader({
    config,
    images: _images,
    metrics: _metrics,
    onLoad,
    onError,
    emit: _emit
  });
  const _observer = createIntersectionHandler({
    config,
    images: _images,
    loader: _loader
  });
  const virtualizer = {
    init() {
      detectFormatSupport();
      _observer.init();
      _emit("image-virtualizer:initialized", { formatSupport: getFormatSupport() });
      return this;
    },
    register(element, src, options2 = {}) {
      if (_destroyed) return null;
      const {
        width = 300,
        height = 200,
        quality = IMAGE_QUALITY.MEDIUM,
        strategy = LOAD_STRATEGIES.VIEWPORT,
        placeholder = null,
        priority = 0
      } = options2;
      const imageId = `img-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const record = {
        imageId,
        element,
        originalSrc: src,
        optimizedUrl: optimizeUrl(src, quality, config),
        width,
        height,
        quality,
        strategy,
        priority,
        state: IMAGE_STATES.IDLE,
        loadStartTime: null,
        loadTime: null,
        error: null,
        registeredAt: Date.now()
      };
      _images.set(imageId, record);
      _metrics.totalImages++;
      element.setAttribute("data-virtualized-id", imageId);
      element.setAttribute("data-virtualized", "registered");
      const placeholderSrc = placeholder || generatePlaceholder(width, height);
      if (element.tagName === "IMG") {
        element.src = placeholderSrc;
      } else {
        element.style.backgroundImage = `url(${placeholderSrc})`;
      }
      record.state = IMAGE_STATES.PLACEHOLDER;
      if (strategy === LOAD_STRATEGIES.EAGER) {
        _loader.addToQueue(imageId, true);
      } else if (strategy === LOAD_STRATEGIES.VIEWPORT) {
        _observer.observe(element);
      } else if (strategy === LOAD_STRATEGIES.LAZY) {
        _loader.addToQueue(imageId);
      }
      _emit("image:registered", { imageId, src, strategy });
      return imageId;
    },
    unregister(imageId) {
      const record = _images.get(imageId);
      if (!record) return false;
      if (record.element) {
        _observer.unobserve(record.element);
      }
      _loader.removeFromQueue(imageId);
      _images.delete(imageId);
      _emit("image:unregistered", { imageId });
      return true;
    },
    async loadNow(imageId) {
      const record = _images.get(imageId);
      if (!record) return null;
      _loader.removeFromQueue(imageId);
      return _loader.loadImage(imageId);
    },
    async loadAll() {
      const pending = [];
      _images.forEach((record, imageId) => {
        if (record.state === IMAGE_STATES.PLACEHOLDER || record.state === IMAGE_STATES.IDLE) {
          pending.push(this.loadNow(imageId));
        }
      });
      return Promise.allSettled(pending);
    },
    pause() {
      _loader.clearQueue();
      _emit("image-virtualizer:paused", {});
      return this;
    },
    resume() {
      _images.forEach((record, imageId) => {
        if (record.state === IMAGE_STATES.PLACEHOLDER) {
          _loader.addToQueue(imageId);
        }
      });
      _emit("image-virtualizer:resumed", {});
      return this;
    },
    getState(imageId) {
      return _images.get(imageId)?.state || null;
    },
    getRecord(imageId) {
      const record = _images.get(imageId);
      return record ? { ...record, element: void 0 } : null;
    },
    list() {
      const list = [];
      _images.forEach((record, imageId) => {
        list.push({
          imageId,
          state: record.state,
          loadTime: record.loadTime,
          dimensions: record.naturalWidth ? { width: record.naturalWidth, height: record.naturalHeight } : null
        });
      });
      return list;
    },
    getMetrics() {
      return getMetricsReport(_metrics, _loader);
    },
    clearCache() {
      clearUrlCache();
      _emit("image-virtualizer:cache-cleared", {});
      return this;
    },
    healthCheck() {
      return performHealthCheck(_metrics, config, _loader, _observer);
    },
    info() {
      return getInfo(_images);
    },
    destroy() {
      _destroyed = true;
      _observer.disconnect();
      _images.clear();
      _loader.clearQueue();
      clearUrlCache();
      _emit("image-virtualizer:destroyed", { metrics: _metrics });
    }
  };
  return virtualizer;
}
let _globalVirtualizer = null;
function getImageVirtualizer(options) {
  if (!_globalVirtualizer) {
    _globalVirtualizer = createImageVirtualizer(options);
  }
  return _globalVirtualizer;
}
function resetGlobalVirtualizer() {
  if (_globalVirtualizer) {
    _globalVirtualizer.destroy();
    _globalVirtualizer = null;
  }
}
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    exports: ["createImageVirtualizer", "getImageVirtualizer"]
  };
}
function healthCheck() {
  return {
    status: "HEALTHY",
    version: VERSION,
    moduleId: MODULE_ID,
    hasGlobalVirtualizer: !!_globalVirtualizer
  };
}
var image_virtualizer_default = {
  VERSION,
  MODULE_ID,
  LOAD_STRATEGIES,
  IMAGE_STATES,
  IMAGE_QUALITY,
  createImageVirtualizer,
  getImageVirtualizer,
  resetGlobalVirtualizer,
  info,
  healthCheck
};
export {
  IMAGE_QUALITY,
  IMAGE_STATES,
  LOAD_STRATEGIES,
  MODULE_ID,
  VERSION,
  createImageVirtualizer,
  image_virtualizer_default as default,
  getImageVirtualizer,
  healthCheck,
  info,
  resetGlobalVirtualizer
};
