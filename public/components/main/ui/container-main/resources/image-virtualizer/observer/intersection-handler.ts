// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-MODULAR-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: intersection-handler
// PURPOSE: Image Virtualizer - Intersection Handler
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   IMAGE_STATES from ../config/constants.js
//
// PROVIDES:
//   createIntersectionHandler() — exported function
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
export const MODULE_ID = 'main.ui.container-main.resources.image-virtualizer.observer.intersection-handler';

export function createIntersectionHandler(options: Record<string, any> = {}) {
  const { config, images, loader } = options;
  
  let _observer: IntersectionObserver | null = null;

  function _handleIntersection(entries: IntersectionObserverEntry[]) {
    entries.forEach((entry) => {
      const element = entry.target as HTMLElement;
      const imageId = element.getAttribute('data-virtualized-id');
      
      if (!imageId) return;

      const record = images.get(imageId);
      if (!record) return;

      if (entry.isIntersecting && record.state === IMAGE_STATES.PLACEHOLDER) {
        loader.addToQueue(imageId);
      }
    });
  }

  return {
    init() {
      if (_observer || typeof IntersectionObserver === 'undefined') return this;

      _observer = new IntersectionObserver(_handleIntersection, {
        rootMargin: config.rootMargin,
        threshold: config.threshold
      });
      
      return this;
    },
    
    observe(element: HTMLElement) {
      _observer?.observe(element);
    },
    
    unobserve(element: HTMLElement) {
      _observer?.unobserve(element);
    },
    
    disconnect() {
      _observer?.disconnect();
      _observer = null;
    },
    
    isActive() {
      return !!_observer;
    }
  };
}

export default { createIntersectionHandler };
