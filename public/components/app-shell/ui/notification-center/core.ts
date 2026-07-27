/**
 * @file Notification Center — Core Operations
 * @version 1.0.0-P2-ENTERPRISE
 * @module app-shell/ui/notification-center/core
 * 
 * ============================================================================
 * DEPENDENCY CONTRACT
 * ============================================================================
 * @requires ./constants.js (NOTIFICATION_TYPES, DEFAULT_DURATION, MAX_VISIBLE)
 * @requires ./state.js (notifications, queue, incrementMetric, notifySubscribers, getConfig)
 * @requires ./dom.js (createNotificationElement, removeNotificationElement, updateProgressBar)
 * 
 * @provides show, dismiss, dismissAll, update
 * 
 * @browserAPI setTimeout, clearTimeout, DOM manipulation
 * 
 * @description
 * Core notification operations. Shows, dismisses, and updates notifications
 * with auto-dismiss timers, progress bars, and queue management.
 * 
 * @example
 * import { show, dismiss, dismissAll } from './core.js';
 * const id = show({ title: 'Success', type: 'success', duration: 3000 });
 * dismiss(id);
 * ============================================================================
 */
'use strict';

import { NOTIFICATION_TYPES, DEFAULT_DURATION, MAX_VISIBLE } from './constants.js';
import { 
  notifications, queue, 
  incrementMetric, notifySubscribers, getConfig 
} from './state.js';
import { 

  createNotificationElement, 
  removeNotificationElement,
  updateProgressBar 
} from './dom.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;

export const VERSION = '1.1.0-FIX-MISSING-EXPORTS';
export const MODULE_ID = 'app-shell.ui.notification-center.core';

let _idCounter = 0;

function _generateId() {
  return `notif-${Date.now()}-${++_idCounter}`;
}

export function show(options: DynObj) {
  options = options || {};
  
  const id = options.id || _generateId();
  const type = options.type || NOTIFICATION_TYPES.INFO;
  const duration = options.duration !== undefined ? options.duration : DEFAULT_DURATION;
  const config = getConfig();
  
  if (notifications.size >= (config.maxVisible || MAX_VISIBLE)) {
    if (config.queueOverflow) {
      queue.push({ id, options });
      incrementMetric('queued');
      return id;
    }
    const oldest = notifications.keys().next().value;
    if (oldest) dismiss(oldest);
  }
  
  const notification: Record<string, any> = {
    id,
    type,
    title: options.title || '',
    message: options.message || '',
    icon: options.icon || null,
    actions: options.actions || [],
    dismissible: options.dismissible !== false,
    duration,
    progress: options.progress !== false && duration > 0,
    createdAt: Date.now(),
    paused: false,
    remaining: duration,
    timerId: null,
    progressInterval: null
  };
  
  const element = createNotificationElement(notification);
  notification.element = element;
  
  notifications.set(id, notification);
  incrementMetric('shown');
  
  if (duration > 0) {
    _startDismissTimer(notification);
  }
  
  notifySubscribers('show', { id, notification });
  
  return id;
}

function _startDismissTimer(notification: DynObj) {
  const startTime = Date.now();
  const duration = notification.remaining;
  
  if (notification.progress) {
    notification.progressInterval = setInterval(() => {
      if (notification.paused) return;
      
      const elapsed = Date.now() - startTime;
      const progress = Math.max(0, 100 - (elapsed / duration * 100));
      updateProgressBar(notification.element, progress);
    }, 100);
  }
  
  notification.timerId = setTimeout(() => {
    if (notification.progressInterval) {
      clearInterval(notification.progressInterval);
    }
    dismiss(notification.id);
    incrementMetric('expired');
  }, duration);
}

export function dismiss(id: DynObj) {
  const notification = notifications.get(id);
  if (!notification) return false;
  
  if (notification.timerId) {
    clearTimeout(notification.timerId);
  }
  if (notification.progressInterval) {
    clearInterval(notification.progressInterval);
  }
  
  removeNotificationElement(notification.element);
  notifications.delete(id);
  incrementMetric('dismissed');
  
  notifySubscribers('dismiss', { id });
  
  if (queue.length > 0) {
    const next = queue.shift();
    show(next.options);
  }
  
  return true;
}

export function dismissAll() {
  const ids = Array.from(notifications.keys());
  
  for (let i = 0; i < ids.length; i++) {
    dismiss(ids[i]);
  }
  
  queue.length = 0;
  
  return ids.length;
}

export function update(id: DynObj, updates: DynObj) {
  const notification = notifications.get(id);
  if (!notification) return false;
  
  if (updates.title !== undefined) {
    notification.title = updates.title;
    const titleEl = notification.element.querySelector('.notification-title');
    if (titleEl) titleEl.textContent = updates.title;
  }
  
  if (updates.message !== undefined) {
    notification.message = updates.message;
    const msgEl = notification.element.querySelector('.notification-message');
    if (msgEl) msgEl.textContent = updates.message;
  }
  
  if (updates.type !== undefined) {
    notification.element.classList.remove(`notification--${notification.type}`);
    notification.type = updates.type;
    notification.element.classList.add(`notification--${updates.type}`);
  }
  
  if (updates.progress !== undefined && notification.progress) {
    updateProgressBar(notification.element, updates.progress);
  }
  
  notifySubscribers('update', { id, updates });
  
  return true;
}

export function pause(id: DynObj) {
  const notification = notifications.get(id);
  if (!notification || notification.paused) return false;
  
  notification.paused = true;
  notification.remaining = notification.remaining - (Date.now() - notification.createdAt);
  
  if (notification.timerId) {
    clearTimeout(notification.timerId);
    notification.timerId = null;
  }
  
  return true;
}

export function resume(id: DynObj) {
  const notification = notifications.get(id);
  if (!notification || !notification.paused) return false;
  
  notification.paused = false;
  notification.createdAt = Date.now();
  
  if (notification.remaining > 0) {
    _startDismissTimer(notification);
  }
  
  return true;
}
