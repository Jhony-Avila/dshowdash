/**
 * @file Focus Manager — Core Operations
 * @version 1.0.0-P2-ENTERPRISE
 * @module app-shell/ui/focus-manager/core
 * 
 * ============================================================================
 * DEPENDENCY CONTRACT
 * ============================================================================
 * @requires ./state.js (focusHistory, currentFocus, incrementMetric, notifySubscribers)
 * @requires ./constants.js (FOCUS_STRATEGIES, FOCUSABLE_SELECTOR)
 * 
 * @provides focusElement, focusRegion, focusNext, focusPrevious
 * @provides getCurrentFocus, isFocused, getFocusableIn
 * 
 * @browserAPI document.activeElement, element.focus(), element.scrollIntoView
 * 
 * @description
 * Core focus management operations. Handles focusing elements, regions,
 * and sequential navigation through focusable elements.
 * 
 * @example
 * import { focusElement, focusRegion, focusNext } from './core.js';
 * focusElement(element, { preventScroll: true });
 * focusRegion('main', { strategy: 'FIRST' });
 * ============================================================================
 */
'use strict';

import { 
  focusHistory, currentFocus, 
  incrementMetric, notifySubscribers 
} from './state.js';
import { FOCUS_STRATEGIES, FOCUSABLE_SELECTOR } from './constants.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '1.0.0-AAA';
export const MODULE_ID = 'app-shell.ui.focus-manager.core';

export function focusElement(element: DynObj, options?: DynObj) {
  options = options || {};
  
  if (!element || typeof element.focus !== 'function') {
    return false;
  }
  
  const delay = options.delay || 0;
  
  function doFocus() {
    try {
      element.focus({ preventScroll: options.preventScroll });
      
      if (options.scrollIntoView) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      
      focusHistory.push(currentFocus.element);
      if (focusHistory.length > 50) focusHistory.shift();
      
      currentFocus.element = element;
      incrementMetric('focusChanges');
      notifySubscribers('focus-change', { element });
      
      return true;
    } catch (e) {
      return false;
    }
  }
  
  if (delay > 0) {
    setTimeout(doFocus, delay);
    return true;
  }
  
  return doFocus();
}

export function focusRegion(regionName: string, options: DynObj) {
  options = options || {};
  const strategy = options.strategy || FOCUS_STRATEGIES.FIRST;
  
  const region = document.getElementById(regionName) || 
                 document.querySelector(`[data-region="${regionName}"]`);
  
  if (!region) return false;
  
  const focusables = getFocusableIn(region);
  
  if (focusables.length === 0) {
    region.setAttribute('tabindex', '-1');
    return focusElement(region, options);
  }
  
  switch (strategy) {
    case FOCUS_STRATEGIES.FIRST:
      return focusElement(focusables[0], options);
    case FOCUS_STRATEGIES.LAST:
      return focusElement(focusables[focusables.length - 1], options);
    case FOCUS_STRATEGIES.SPECIFIC:
      if (options.selector) {
        const target = region.querySelector(options.selector);
        if (target) return focusElement(target, options);
      }
      return focusElement(focusables[0], options);
    case FOCUS_STRATEGIES.RESTORE:
      if (currentFocus.saved && region.contains(currentFocus.saved)) {
        return focusElement(currentFocus.saved, options);
      }
      return focusElement(focusables[0], options);
    default:
      return focusElement(focusables[0], options);
  }
}

export function focusNext(container: HTMLElement) {
  container = container || document.body;
  const focusables = getFocusableIn(container);
  const current = document.activeElement;
  // @ts-expect-error strict migration — TS2345
  const index = focusables.indexOf(current);
  
  if (index === -1 || index === focusables.length - 1) {
    return focusElement(focusables[0]);
  }
  
  return focusElement(focusables[index + 1]);
}

export function focusPrevious(container: HTMLElement) {
  container = container || document.body;
  const focusables = getFocusableIn(container);
  const current = document.activeElement;
  // @ts-expect-error strict migration — TS2345
  const index = focusables.indexOf(current);
  
  if (index <= 0) {
    return focusElement(focusables[focusables.length - 1]);
  }
  
  return focusElement(focusables[index - 1]);
}

export function getCurrentFocus() {
  return document.activeElement;
}

export function isFocused(element: HTMLElement) {
  return document.activeElement === element;
}

export function getFocusableIn(container: HTMLElement) {
  container = container || document.body;
  const elements = container.querySelectorAll(FOCUSABLE_SELECTOR);
  const result = [];
  
  for (let i = 0; i < elements.length; i++) {
    const el = elements[i];
    if ((el as DynObj).offsetParent !== null && !(el as DynObj).disabled && (el as DynObj).tabIndex >= 0) {
      result.push(el);
    }
  }
  
  return result;
}
