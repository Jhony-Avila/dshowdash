/**
 * @file Region Visibility — Core Operations
 * @version 1.0.0-P2-ENTERPRISE
 * @module app-shell/core/region-visibility/core
 * 
 * ============================================================================
 * DEPENDENCY CONTRACT
 * ============================================================================
 * @requires ./constants.js (REGION_MAP, CSS_CLASSES)
 * @requires ./state.js (_state, incrementMetric, notifySubscribers, getDuration)
 * @requires ../dom-regions/index.js (getRegion)
 * 
 * @provides isVisible, show, hide, toggle, setVisibility
 * @provides enterFullscreen, exitFullscreen, toggleFullscreen, isFullscreenMode
 * @provides getVisibilityState, resetVisibility
 * 
 * @browserAPI classList, CSS transitions
 * 
 * @description
 * Core visibility operations for regions. Manages show/hide with
 * CSS class animations and fullscreen mode.
 * 
 * @example
 * import { show, hide, enterFullscreen } from './core.js';
 * await show('sidebar', { animate: true });
 * enterFullscreen();
 * ============================================================================
 */
'use strict';

import { REGION_MAP, CSS_CLASSES } from './constants.js';
import { _state, incrementMetric, notifySubscribers, getDuration } from './state.js';
import { getRegion } from '../dom-regions/index.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.core.region-visibility.core';

export function isVisible(regionName: string) {
  const region = getRegion(regionName);
  if (!region) return false;
  return !region.classList.contains(CSS_CLASSES.HIDDEN);
}

export function show(regionName: string, options: DynObj) {
  options = options || {};
  const region = getRegion(regionName);
  
  if (!region) {
    incrementMetric('errors');
    return Promise.resolve(false);
  }
  
  if (isVisible(regionName)) return Promise.resolve(true);
  
  return new Promise(resolve => {
    if (options.animate !== false) {
      region.classList.add(CSS_CLASSES.SHOWING);
      region.classList.remove(CSS_CLASSES.HIDDEN);
      
      setTimeout(() => {
        region.classList.remove(CSS_CLASSES.SHOWING);
        (_state.visibility as DynObj)[regionName] = true;
        incrementMetric('shows');
        notifySubscribers('show', { region: regionName });
        resolve(true);
      }, getDuration());
    } else {
      region.classList.remove(CSS_CLASSES.HIDDEN);
      (_state.visibility as DynObj)[regionName] = true;
      incrementMetric('shows');
      notifySubscribers('show', { region: regionName });
      resolve(true);
    }
  });
}

export function hide(regionName: string, options: DynObj) {
  options = options || {};
  const region = getRegion(regionName);
  
  if (!region) {
    incrementMetric('errors');
    return Promise.resolve(false);
  }
  
  if (!isVisible(regionName)) return Promise.resolve(true);
  
  return new Promise(resolve => {
    if (options.animate !== false) {
      region.classList.add(CSS_CLASSES.HIDING);
      
      setTimeout(() => {
        region.classList.remove(CSS_CLASSES.HIDING);
        region.classList.add(CSS_CLASSES.HIDDEN);
        (_state.visibility as DynObj)[regionName] = false;
        incrementMetric('hides');
        notifySubscribers('hide', { region: regionName });
        resolve(true);
      }, getDuration());
    } else {
      region.classList.add(CSS_CLASSES.HIDDEN);
      (_state.visibility as DynObj)[regionName] = false;
      incrementMetric('hides');
      notifySubscribers('hide', { region: regionName });
      resolve(true);
    }
  });
}

export function toggle(regionName: string, options: DynObj) {
  if (isVisible(regionName)) {
    return hide(regionName, options);
  }
  return show(regionName, options);
}

export function setVisibility(visibilityMap: DynObj, options: DynObj) {
  const promises = [];
  const keys = Object.keys(visibilityMap);
  
  for (let i = 0; i < keys.length; i++) {
    const regionName = keys[i];
    const visible = visibilityMap[regionName];
    
    if (visible) {
      promises.push(show(regionName, options));
    } else {
      promises.push(hide(regionName, options));
    }
  }
  
  return Promise.all(promises);
}

export function enterFullscreen() {
  const regionsToHide = ['header', 'sidebar', 'nav-rail', 'footer', 'ticker'];
  
  for (let i = 0; i < regionsToHide.length; i++) {
    hide(regionsToHide[i], { animate: false });
  }
  
  _state.isFullscreen = true;
  notifySubscribers('fullscreen-enter', {});
  return true;
}

export function exitFullscreen() {
  const regionsToShow = ['header', 'sidebar', 'nav-rail', 'footer'];
  
  for (let i = 0; i < regionsToShow.length; i++) {
    show(regionsToShow[i], { animate: false });
  }
  
  _state.isFullscreen = false;
  notifySubscribers('fullscreen-exit', {});
  return true;
}

export function toggleFullscreen() {
  if (_state.isFullscreen) {
    return exitFullscreen();
  }
  return enterFullscreen();
}

export function isFullscreenMode() {
  return _state.isFullscreen;
}

export function getVisibilityState() {
  const state = {};
  const regionNames = Object.keys(REGION_MAP);
  
  for (let i = 0; i < regionNames.length; i++) {
    (state as DynObj)[regionNames[i]] = isVisible(regionNames[i]);
  }
  
  return state;
}

export function resetVisibility() {
  const regionNames = Object.keys(REGION_MAP);
  
  for (let i = 0; i < regionNames.length; i++) {
    const config = (REGION_MAP as DynObj)[regionNames[i]];
    if (config.defaultVisible !== false) {
      show(regionNames[i], { animate: false });
    } else {
      hide(regionNames[i], { animate: false });
    }
  }
  
  _state.isFullscreen = false;
  return true;
}
