/**
 * @file Notification Center — State Management
 * @version 1.1.0-P2-ENTERPRISE
 * @module app-shell/ui/notification-center/state
 * 
 * ============================================================================
 * DEPENDENCY CONTRACT
 * ============================================================================
 * @requires none
 * 
 * @provides notifications, notificationId, containerElement, subscribers, queue
 * @provides processing, stylesInjected, config, metrics
 * @provides resetMetrics, incrementMetric, notifySubscribers, getConfig
 * 
 * @description
 * Centralized state for notification center including metrics and subscribers.
 * ============================================================================
 */
'use strict';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.ui.notification-center.state';

export const notifications = new Map();
export const notificationId = { value: 0 };
export const containerElement = { value: null as DynObj };
export const subscribers: DynObj[] = [];
export const queue: DynObj[] = [];
export const processing = { value: false };
export const stylesInjected = { value: false };

export const config = {
  position: 'top-right',
  maxVisible: 5,
  defaultDuration: 5000,
  animationDuration: 300,
  pauseOnHover: true,
  stackSpacing: 12,
  showProgress: true,
  groupSimilar: true,
  soundEnabled: false,
  queueOverflow: true
};

export const metrics = {
  shown: 0,
  dismissed: 0,
  clicked: 0,
  expired: 0,
  queued: 0
};

export function resetMetrics() {
  metrics.shown = 0;
  metrics.dismissed = 0;
  metrics.clicked = 0;
  metrics.expired = 0;
  metrics.queued = 0;
}

export function incrementMetric(key: string) {
  if (metrics.hasOwnProperty(key)) {
    (metrics as DynObj)[key]++;
  }
}

export function notifySubscribers(event: string, data: DynObj) {
  for (let i = 0; i < subscribers.length; i++) {
    try {
      subscribers[i](event, data);
    } catch (e) {
      // Ignore subscriber errors
    }
  }
}

export function getConfig() {
  return Object.assign({}, config);
}

export function setConfig(key: string, value: DynObj) {
  if (config.hasOwnProperty(key)) {
    (config as DynObj)[key] = value;
  }
}

export function getMetrics() {
  return Object.assign({}, metrics);
}
