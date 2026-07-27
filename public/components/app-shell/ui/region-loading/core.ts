/**
 * @file Region Loading — Core Operations
 * @version 1.1.0-P2-ENTERPRISE
 * @module app-shell/ui/region-loading/core
 * 
 * ============================================================================
 * DEPENDENCY CONTRACT
 * ============================================================================
 * @requires ../../core/dom-regions/index.js (getRegion)
 * @requires ./dom-helpers.js (LOADING_CLASS, SKELETON_CLASS, createOverlay, removeOverlay)
 * 
 * @provides isLoading, setLoading, startLoading, endLoading, setSkeleton
 * @provides setMultipleLoading, endAllLoading
 * @provides getLoadingState, getLoadingRegions, isAnyLoading
 * 
 * @description
 * Core loading state operations for regions. Manages loading indicators,
 * skeleton loaders, and overlays with spinner support.
 * 
 * @example
 * import { setLoading, isLoading, endAllLoading } from './core.js';
 * setLoading('main', true, { skeleton: true }, state);
 * if (isLoading('main', state)) console.log('Loading...');
 * ============================================================================
 */
'use strict';

import { getRegion } from '../../core/dom-regions/index.js';
import {

  LOADING_CLASS, SKELETON_CLASS,
  createOverlay, removeOverlay
} from './dom-helpers.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;

export const VERSION = '1.1.0-MODULAR';
export const MODULE_ID = 'app-shell.ui.region-loading.core';

// ── Core API ────────────────────────────────────────────────────────

export function isLoading(regionName: string, state: DynObj) {
  const s = state.loadingState[regionName];
  return s ? s.loading : false;
}

export function setLoading(regionName: string, loading: boolean, options: DynObj, state: DynObj) {
  options = options || {};
  const useSkeleton = options.skeleton === true;
  const showOverlay = options.overlay !== false;
  const showSpinner = options.spinner !== false;

  const region = getRegion(regionName);
  if (!region) {
    state.metrics.errors++;
    return false;
  }

  let s = state.loadingState[regionName];
  if (!s) {
    s = { loading: false, skeleton: false, startedAt: null };
    state.loadingState[regionName] = s;
  }

  if (loading) {
    region.classList.add(LOADING_CLASS);
    region.setAttribute('aria-busy', 'true');

    if (useSkeleton) {
      region.classList.add(SKELETON_CLASS);
      s.skeleton = true;
    } else if (showOverlay) {
      removeOverlay(region);
      region.appendChild(createOverlay(showSpinner));
    }

    s.loading = true;
    s.startedAt = Date.now();
    state.metrics.loadingStarts++;

    state.notify('loading-start', { region: regionName, skeleton: useSkeleton });
  } else {
    region.classList.remove(LOADING_CLASS, SKELETON_CLASS);
    region.setAttribute('aria-busy', 'false');
    removeOverlay(region);

    const duration = s.startedAt ? Date.now() - s.startedAt : 0;

    s.loading = false;
    s.skeleton = false;
    s.startedAt = null;
    state.metrics.loadingEnds++;

    state.notify('loading-end', { region: regionName, duration });
  }

  return true;
}

export function startLoading(regionName: string, options: DynObj, state: DynObj) {
  return setLoading(regionName, true, options, state);
}

export function endLoading(regionName: string, state: DynObj) {
  return setLoading(regionName, false, null, state);
}

export function setSkeleton(regionName: string, loading: boolean, state: DynObj) {
  return setLoading(regionName, loading, { skeleton: true, overlay: false }, state);
}

export function setMultipleLoading(loadingMap: DynObj, options: DynObj, state: DynObj) {
  const results = {};
  const keys = Object.keys(loadingMap);
  for (let i = 0; i < keys.length; i++) {
    (results as DynObj)[keys[i]] = setLoading(keys[i], loadingMap[keys[i]], options, state);
  }
  return results;
}

export function endAllLoading(state: DynObj) {
  const keys = Object.keys(state.loadingState);
  for (let i = 0; i < keys.length; i++) {
    if (state.loadingState[keys[i]].loading) {
      setLoading(keys[i], false, null, state);
    }
  }
  state.notify('all-loading-ended', null);
  return true;
}

// ── Getters ─────────────────────────────────────────────────────────

export function getLoadingState(state: DynObj) {
  const result = {};
  const keys = Object.keys(state.loadingState);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const s = state.loadingState[key];
    (result as DynObj)[key] = {
      loading: s.loading,
      skeleton: s.skeleton,
      duration: s.startedAt ? Date.now() - s.startedAt : null
    };
  }
  return result;
}

export function getLoadingRegions(state: DynObj) {
  const loading = [];
  const keys = Object.keys(state.loadingState);
  for (let i = 0; i < keys.length; i++) {
    if (state.loadingState[keys[i]].loading) {
      loading.push(keys[i]);
    }
  }
  return loading;
}

export function isAnyLoading(state: DynObj) {
  const keys = Object.keys(state.loadingState);
  for (let i = 0; i < keys.length; i++) {
    if (state.loadingState[keys[i]].loading) return true;
  }
  return false;
}
