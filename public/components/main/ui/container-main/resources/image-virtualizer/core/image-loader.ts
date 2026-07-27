// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-MODULAR-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: image-loader
// PURPOSE: Image Virtualizer - Image Loader
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   IMAGE_STATES from ../config/constants.js
//
// PROVIDES:
//   createImageLoader() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { IMAGE_STATES } from '../config/constants.js';

export const VERSION = '3.3.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.resources.image-virtualizer.core.image-loader';

export function createImageLoader(options: Record<string, any> = {}) {
  const {
    config,
    images,
    metrics,
    onLoad,
    onError,
    emit
  } = options;

  const _loadQueue: unknown[] = [];
  let _activeLoads = 0;

  function _applyImage(element: HTMLElement, src: string) {
    if (!element) return;

    element.style.opacity = '0';
    element.style.transition = `opacity ${config.fadeInDuration}ms ease-in`;

    if (element.tagName === 'IMG') {
      (element as HTMLImageElement).src = src;
    } else {
      element.style.backgroundImage = `url(${src})`;
    }

    element.offsetHeight; // Force reflow
    element.style.opacity = '1';
    element.setAttribute('data-virtualized', 'loaded');
  }

  function _processQueue() {
    while (_loadQueue.length > 0 && _activeLoads < config.maxConcurrent) {
      const imageId = _loadQueue.shift();
      loadImage(imageId).catch(() => {});
    }
  }

  async function loadImage(imageId: unknown) {
    const record = images.get(imageId);
    if (!record || record.state === IMAGE_STATES.LOADED) return;

    record.state = IMAGE_STATES.LOADING;
    record.loadStartTime = performance.now();
    _activeLoads++;

    const img = new Image();
    
    return new Promise((resolve, reject) => {
      let retries = 0;

      const attemptLoad = () => {
        img.onload = () => {
          const loadTime = performance.now() - record.loadStartTime;
          
          record.state = IMAGE_STATES.LOADED;
          record.loadTime = loadTime;
          record.naturalWidth = img.naturalWidth;
          record.naturalHeight = img.naturalHeight;
          
          metrics.loaded++;
          metrics.loadTimes.push(loadTime);
          if (metrics.loadTimes.length > 100) metrics.loadTimes.shift();
          metrics.avgLoadTime = (metrics.loadTimes as number[]).reduce((a: number, b: number) => a + b, 0) / metrics.loadTimes.length;

          if (record.element) {
            _applyImage(record.element, record.optimizedUrl);
          }

          _activeLoads--;
          _processQueue();

          onLoad?.(imageId, record);
          emit?.('image:loaded', { imageId, loadTime, dimensions: { width: img.naturalWidth, height: img.naturalHeight } });
          
          resolve(record);
        };

        img.onerror = () => {
          retries++;
          if (retries <= config.retryAttempts) {
            setTimeout(attemptLoad, config.retryDelay * retries);
            return;
          }

          record.state = IMAGE_STATES.ERROR;
          record.error = 'Failed to load';
          metrics.errors++;
          _activeLoads--;
          _processQueue();

          onError?.(imageId, record.error);
          emit?.('image:error', { imageId, error: record.error });
          
          reject(new Error(record.error));
        };

        img.src = record.optimizedUrl;
      };

      attemptLoad();
    });
  }

  return {
    loadImage,
    addToQueue(imageId: unknown, priority = false) {
      if (!_loadQueue.includes(imageId)) {
        if (priority) {
          _loadQueue.unshift(imageId);
        } else {
          _loadQueue.push(imageId);
        }
      }
      _processQueue();
    },
    removeFromQueue(imageId: unknown) {
      const index = _loadQueue.indexOf(imageId);
      if (index > -1) {
        _loadQueue.splice(index, 1);
        return true;
      }
      return false;
    },
    clearQueue() {
      _loadQueue.length = 0;
    },
    getQueueLength() {
      return _loadQueue.length;
    },
    getActiveLoads() {
      return _activeLoads;
    },
    processQueue: _processQueue
  };
}

export default { createImageLoader };
