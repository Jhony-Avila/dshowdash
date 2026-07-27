/**
 * @file Gesture Handler - Core Registration
 * @version 1.0.0-P2-ENTERPRISE
 * @module app-shell/ui/gesture-handler/registration/core
 * 
 * ============================================================================
 * DEPENDENCY CONTRACT
 * ============================================================================
 * @requires ../state.js (handlers)
 * @provides on, off, once, offAll
 * 
 * @description
 * Core gesture handler registration. Manages gesture event subscriptions
 * with support for one-time handlers and cleanup.
 * 
 * @example
 * import { on, off, once } from './core.js';
 * const unsub = on('swipe-left', (data) => console.log(data));
 * once('tap', (data) => console.log('tapped once'));
 * ============================================================================
 */
'use strict';

import { handlers } from '../state.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.ui.gesture-handler.registration.core';

export function on(gesture: string, handler: DynObj) {
  if (!handlers.has(gesture)) {
    handlers.set(gesture, new Set());
  }
  handlers.get(gesture).add(handler);
  
  return () => {
    off(gesture, handler);
  };
}

export function off(gesture: string, handler: DynObj) {
  const gestureHandlers = handlers.get(gesture);
  if (gestureHandlers) {
    gestureHandlers.delete(handler);
  }
}

export function once(gesture: string, handler: DynObj) {
  const wrapper = (data: DynObj) => {
    off(gesture, wrapper);
    handler(data);
  };
  return on(gesture, wrapper);
}

export function offAll(gesture: string) {
  if (gesture) {
    handlers.delete(gesture);
  } else {
    handlers.clear();
  }
}
