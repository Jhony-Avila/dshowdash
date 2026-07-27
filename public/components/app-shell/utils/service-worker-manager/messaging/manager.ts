/**
 * @file Service Worker Manager - Messaging
 * @version 1.0.0-P2-ENTERPRISE
 * @module app-shell/utils/service-worker-manager/messaging/manager
 * 
 * ============================================================================
 * DEPENDENCY CONTRACT
 * ============================================================================
 * @requires ../state.js (incrementMetric)
 * @requires ../registration/manager.js (isSupported)
 * @provides postMessage, onMessage
 * 
 * @browserAPI navigator.serviceWorker.controller, MessageChannel
 * 
 * @description
 * Handles messaging between the main thread and service worker.
 * Uses MessageChannel for two-way communication with response handling.
 * 
 * @example
 * import { postMessage, onMessage } from './manager.js';
 * const result = await postMessage({ type: 'CACHE_STATUS' });
 * const unsub = onMessage((data) => console.log(data));
 * ============================================================================
 */
'use strict';

import { incrementMetric } from '../state.js';
import { isSupported } from '../registration/manager.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.utils.service-worker-manager.messaging.manager';

export function postMessage(message: DynObj) {
  if (!navigator.serviceWorker.controller) {
    return Promise.resolve({ ok: false, error: 'No controller' });
  }
  
  return new Promise(resolve => {
    const channel = new MessageChannel();
    
    channel.port1.onmessage = event => {
      incrementMetric('messagesReceived');
      resolve({ ok: true, response: event.data });
    };
    
    // @ts-expect-error strict migration — TS18047
    navigator.serviceWorker.controller.postMessage(message, [channel.port2]);
    incrementMetric('messagesSent');
  });
}

export function onMessage(handler: DynObj) {
  if (!isSupported()) return () => {};
  
  const listener = (event: DynObj) => {
    incrementMetric('messagesReceived');
    handler(event.data, event);
  };
  
  navigator.serviceWorker.addEventListener('message', listener);
  
  return () => {
    navigator.serviceWorker.removeEventListener('message', listener);
  };
}
