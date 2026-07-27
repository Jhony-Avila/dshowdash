// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-LOGGER-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: state
// PURPOSE: Zoom Manager - State
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   DEFAULT_CONFIG, STORAGE_KEY from ./constants.js
//   createLogger from ../logger.js
//
// PROVIDES:
//   getInstance() — exported function
//   setInstance() — exported function
//   getConfig() — exported function
//   setConfig() — exported function
//   getContainer() — exported function
//   setContainer() — exported function
//   getContent() — exported function
//   setContent() — exported function
//   getCurrentZoom() — exported function
//   setCurrentZoom() — exported function
//   isInitialized() — exported function
//   setInitialized() — exported function
//   isPinching() — exported function
//   setPinching() — exported function
//   getInitialPinchDistance() — exported function
//   setInitialPinchDistance() — exported function
//   getInitialPinchZoom() — exported function
//   setInitialPinchZoom() — exported function
//   getZoomIndicator() — exported function
//   setZoomIndicator() — exported function
//   ... and 8 more exports
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

import { DEFAULT_CONFIG, STORAGE_KEY } from './constants.js';
import { createLogger } from '../logger.js';

export const VERSION = '1.1.0-LOGGER-INTEGRATED';
export const MODULE_ID = 'main.ui.container-main.utils.zoom-manager.state';

const logger = createLogger('container-main:zoom-manager:state');

// ============================================================================
// STATE STORE
// ============================================================================

const state = {
  instance: null as Record<string, unknown> | null,
  config: Object.assign({}, DEFAULT_CONFIG),
  container: null as HTMLElement | null,
  content: null as HTMLElement | null,
  currentZoom: 1.0,
  isInitialized: false,
  isPinching: false,
  initialPinchDistance: 0,
  initialPinchZoom: 1.0,
  zoomIndicator: null as Record<string, unknown> | null,
  indicatorTimeout: null as Record<string, unknown> | null,
  listeners: [] as unknown[],
  metrics: {
    zoomChanges: 0,
    pinchZooms: 0,
    scrollZooms: 0,
    errors: 0
  }
};

// ============================================================================
// STATE ACCESSORS
// ============================================================================

export function getInstance() {
  return state.instance;
}

export function setInstance(inst: Record<string, unknown> | null) {
  state.instance = inst;
}

export function getConfig() {
  return state.config;
}

export function setConfig(newConfig: unknown) {
  state.config = Object.assign({}, DEFAULT_CONFIG, newConfig);
}

export function getContainer() {
  return state.container;
}

export function setContainer(el: HTMLElement) {
  state.container = el;
}

export function getContent() {
  return state.content;
}

export function setContent(el: HTMLElement) {
  state.content = el;
}

export function getCurrentZoom() {
  return state.currentZoom;
}

export function setCurrentZoom(zoom: number) {
  state.currentZoom = zoom;
}

export function isInitialized() {
  return state.isInitialized;
}

export function setInitialized(val: boolean) {
  state.isInitialized = !!val;
}

export function isPinching() {
  return state.isPinching;
}

export function setPinching(val: unknown) {
  state.isPinching = !!val;
}

export function getInitialPinchDistance() {
  return state.initialPinchDistance;
}

export function setInitialPinchDistance(val: unknown) {
  state.initialPinchDistance = (val) as number;
}

export function getInitialPinchZoom() {
  return state.initialPinchZoom;
}

export function setInitialPinchZoom(val: unknown) {
  state.initialPinchZoom = (val) as number;
}

export function getZoomIndicator() {
  return state.zoomIndicator;
}

export function setZoomIndicator(el: HTMLElement) {
  // @ts-expect-error TS migration - TS2352
  state.zoomIndicator = el as Record<string, unknown>;
}

export function getIndicatorTimeout() {
  return state.indicatorTimeout;
}

export function setIndicatorTimeout(timeout: number) {
  // @ts-expect-error TS migration - TS2352
  state.indicatorTimeout = timeout as Record<string, unknown>;
}

export function getListeners() {
  return state.listeners;
}

export function getMetrics() {
  return state.metrics;
}

export function incrementMetric(name: string) {
  if ((state.metrics as Record<string, unknown>)[name] !== undefined) {
    // @ts-expect-error TS migration - TS2356
    (state.metrics as Record<string, unknown>)[name]++;
  }
}

// ============================================================================
// PERSISTENCE
// ============================================================================

export function saveZoom() {
  if (!state.config.persistZoom) return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ zoom: state.currentZoom }));
  } catch (e) {
    logger.warn('Failed to save zoom', { error: (e as Error).message });
  }
}

export function loadZoom() {
  if (!state.config.persistZoom) return state.config.defaultZoom;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      return data.zoom || state.config.defaultZoom;
    }
  } catch (e) {
    logger.warn('Failed to load zoom', { error: (e as Error).message });
  }
  return state.config.defaultZoom;
}

// ============================================================================
// RESET
// ============================================================================

export function resetState() {
  state.container = null;
  state.content = null;
  state.isInitialized = false;
  state.isPinching = false;
  state.initialPinchDistance = 0;
  state.initialPinchZoom = 1.0;
  state.zoomIndicator = null;
  state.indicatorTimeout = null;
  state.listeners.length = 0;
}

export default state;
