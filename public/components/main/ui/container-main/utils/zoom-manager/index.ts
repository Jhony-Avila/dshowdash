// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.1.0-LOGGER-INTEGRATED)
// ═══════════════════════════════════════════════════════════════
// IMPORTS:
//   VERSION, MODULE_ID, ZOOM_PRESETS, ZOOM_ORIGINS from ./constants.js
//   getInstance, setInstance, getConfig, setConfig, getContainer,
//     setContainer, getContent, setContent, getCurrentZoom,
//     isInitialized, setInitialized, getListeners, loadZoom,
//     resetState from ./state.js
//   applyZoom, emit from ./core/zoom-apply.js
//   setZoom, zoomIn, zoomOut, zoomTo, zoomToFit, zoomToFill,
//     zoomToActual, resetZoom, setMinZoom, setMaxZoom from ./core/zoom-controls.js
//   handleWheel, handleTouchStart, handleTouchMove, handleTouchEnd,
//     handleDoubleClick from ./handlers/events.js
//   removeZoomIndicator from ./ui/indicator.js
//   healthCheck, info from ./diagnostics/health.js
//   createLogger from ../logger.js
//
// PROVIDES: createZoomManager/getZoomManager (factory/singleton),
//   init/destroy (lifecycle), setZoom/zoomIn/zoomOut/zoomTo/zoomToFit/
//   zoomToFill/zoomToActual/resetZoom/setMinZoom/setMaxZoom (controls),
//   subscribe (events), healthCheck/info (diagnostics),
//   VERSION, MODULE_ID, ZOOM_PRESETS, ZOOM_ORIGINS
//
// RECEIVES (via init):
//   container — DOM Element or selector
//   content — DOM Element or selector (optional, defaults to container)
//
// BROWSER APIs (legítimo — zoom interaction):
//   document.querySelector, addEventListener/removeEventListener
//   (wheel, touchstart, touchmove, touchend, dblclick)
// ═══════════════════════════════════════════════════════════════
// Zoom Manager - Orchestrator
// @version 1.1.0-LOGGER-INTEGRATED-ES6
// @changelog v1.1.0 - Migrated from console.* to centralized Logger
// @description Controle de zoom do container (pinch-to-zoom, scroll zoom)
// @changelog v1.0.0 - Sprint 5: Melhoria #34 - Zoom Manager
// @modularized true
'use strict';

// ============================================================================
// IMPORTS
// ============================================================================

import { VERSION as MODULE_ID, ZOOM_PRESETS, ZOOM_ORIGINS } from './constants.js';
import {
  getInstance,
  setInstance,
  getConfig,
  setConfig,
  getContainer,
  setContainer,
  getContent,
  setContent,
  getCurrentZoom,
  isInitialized,
  setInitialized,
  getListeners,
  loadZoom,
  resetState
} from './state.js';

import { applyZoom, emit } from './core/zoom-apply.js';
import {
  setZoom,
  zoomIn,
  zoomOut,
  zoomTo,
  zoomToFit,
  zoomToFill,
  zoomToActual,
  resetZoom,
  setMinZoom,
  setMaxZoom
} from './core/zoom-controls.js';

import {
  handleWheel,
  handleTouchStart,
  handleTouchMove,
  handleTouchEnd,
  handleDoubleClick
} from './handlers/events.js';

import { removeZoomIndicator } from './ui/indicator.js';
import { healthCheck, info } from './diagnostics/health.js';
import { createLogger } from '../logger.js';

export const VERSION = '1.1.0-LOGGER-INTEGRATED';

const logger = createLogger(MODULE_ID);

// ============================================================================
// FACTORY
// ============================================================================

export function createZoomManager(options: Record<string, unknown>) {
  options = options || {};
  setConfig(options);
  
  const initialZoom = loadZoom();
  applyZoom(initialZoom, undefined, false);
  
  logger.debug('Zoom Manager created', { defaultZoom: initialZoom });
  
  return {
    init,
    destroy,
    setZoom,
    getZoom() { return getCurrentZoom(); },
    zoomIn,
    zoomOut,
    zoomTo,
    zoomToFit,
    zoomToFill,
    zoomToActual,
    resetZoom,
    setMinZoom,
    setMaxZoom,
    getZoomRange() {
      const config = getConfig();
      return { min: config.minZoom, max: config.maxZoom };
    },
    subscribe,
    healthCheck,
    info
  };
}

export function getZoomManager(options: Record<string, unknown>) {
  let instance = getInstance();
  if (!instance) {
    instance = createZoomManager(options);
    setInstance(instance);
  }
  return instance;
}

// ============================================================================
// LIFECYCLE
// ============================================================================

export function init(container: HTMLElement, content: string) {
  if (isInitialized()) return true;
  
  const containerEl = typeof container === 'string' 
    ? document.querySelector(container) 
    : container;
  
  const contentEl = content
    ? (typeof content === 'string' ? document.querySelector(content) : content)
    : containerEl;
  
  if (!containerEl) {
    logger.error('Container not found');
    return false;
  }
  
  setContainer(containerEl);
  // @ts-expect-error TS migration - TS2345
  setContent(contentEl);
  
  const config = getConfig();
  
  if (config.enableScrollZoom) {
    containerEl.addEventListener('wheel', handleWheel, { passive: false });
  }
  
  if (config.enablePinchZoom) {
    containerEl.addEventListener('touchstart', handleTouchStart, { passive: true });
    containerEl.addEventListener('touchmove', handleTouchMove, { passive: false });
    containerEl.addEventListener('touchend', handleTouchEnd, { passive: true });
  }
  
  if (config.enableDoubleClickZoom) {
    containerEl.addEventListener('dblclick', handleDoubleClick);
  }
  
  applyZoom(getCurrentZoom(), undefined, false);
  
  setInitialized(true);
  emit('initialized', { zoom: getCurrentZoom() });
  logger.debug('Initialized');
  
  return true;
}

export function destroy() {
  if (!isInitialized()) return true;
  
  const container = getContainer();
  
  if (container) {
    container.removeEventListener('wheel', handleWheel);
    container.removeEventListener('touchstart', handleTouchStart);
    container.removeEventListener('touchmove', handleTouchMove);
    container.removeEventListener('touchend', handleTouchEnd);
    container.removeEventListener('dblclick', handleDoubleClick);
  }
  
  removeZoomIndicator();
  resetState();
  
  logger.debug('Destroyed');
  return true;
}

// ============================================================================
// SUBSCRIPTION
// ============================================================================

export function subscribe(callback: (...args: unknown[]) => void) {
  if (typeof callback !== 'function') return () => {};
  
  const listeners = getListeners();
  listeners.push(callback);
  
  return () => {
    const idx = listeners.indexOf(callback);
    if (idx >= 0) listeners.splice(idx, 1);
  };
}

// ============================================================================
// RE-EXPORTS
// ============================================================================

export { MODULE_ID, ZOOM_PRESETS, ZOOM_ORIGINS };
export { setZoom, zoomIn, zoomOut, zoomTo, zoomToFit, zoomToFill, zoomToActual, resetZoom };
export { setMinZoom, setMaxZoom };
export { healthCheck, info };

// ============================================================================
// DEFAULT EXPORT
// ============================================================================

export default {
  VERSION,
  MODULE_ID,
  ZOOM_PRESETS,
  ZOOM_ORIGINS,
  createZoomManager,
  getZoomManager,
  init,
  destroy,
  setZoom,
  zoomIn,
  zoomOut,
  zoomTo,
  zoomToFit,
  zoomToFill,
  zoomToActual,
  resetZoom,
  setMinZoom,
  setMaxZoom,
  subscribe,
  healthCheck,
  info
};
