// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (5.7.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.notification-manager
// PURPOSE: Notification manager with polling, server sync and event system
// ───────────────────────────────────────────────────────────────
// @contract INIT - init(options) initializes notification manager
// @contract DESTROY - destroy() destroys notification manager
// @contract IS_INITIALIZED - isInitialized() checks init state
// @contract FETCH - fetch()/fetchFromServer() fetches notifications
// @contract MARK_AS_READ - markAsRead(id) marks notification as read
// @contract MARK_ALL_AS_READ - markAllAsRead() marks all as read
// @contract DELETE - delete(id)/deleteNotification(id) deletes notification
// @contract CREATE - create(data)/createNotification(data) creates notification
// @contract START_POLLING - startPolling() starts polling
// @contract STOP_POLLING - stopPolling() stops polling
// @contract SHOW - show(notification) shows notification toast
// @contract HIDE - hide(id) hides notification toast
// @contract GET_NOTIFICATIONS - getNotifications() gets all notifications
// @contract GET_UNREAD_COUNT - getUnreadCount() gets unread count
// @contract ON - on(event, callback) subscribes to events
// @contract OFF - off(event, callback) unsubscribes from events
// @contract PORTS - injectPorts()/getPorts() for dependency injection
// @contract HEALTH - healthCheck() and info() for observability
// ───────────────────────────────────────────────────────────────
// IMPORTS: createCorePorts from /core/runtime/ports-profiles.js
// IMPORTS: CONFIG, NOTIFICATION_TYPES, NOTIFICATION_PRIORITIES, state, log from ./state.js
// IMPORTS: fetchFromServer, markAsRead, markAllAsRead, deleteNotification, createNotification from ./api.js
// IMPORTS: startPolling, stopPolling, restartPolling, isPollingActive, setPollingInterval, forcePoll from ./polling.js
// IMPORTS: EVENTS, on, off, emit, once, clearListeners, getRegisteredEvents, syncWithGlobalState, notifyOrchestrator from ./events.js
// PROVIDES: NotificationManager, notify, toast, CONFIG, NOTIFICATION_TYPES, NOTIFICATION_PRIORITIES,
//           EVENTS, injectPorts, getPorts, VERSION, MODULE_ID
// @changelog v5.7.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v5.6.0-ENTERPRISE: ES6 modernization (const/let, arrow functions, template literals, optional chaining)
// @changelog v5.5.1-ENTERPRISE: ES5 conversion (Object.values → for loop)
// @changelog v5.5.0-P18EC: Fixed duplicate exports (VERSION, MODULE_ID)
// ═══════════════════════════════════════════════════════════════
// P18EC-REVIEWED: Uses internal ./events.js emit system (not global EventBus with hardcoded strings)
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';

export const VERSION = '5.7.0-P2-ENTERPRISE';
export const MODULE_ID = 'notification-manager';

// Re-export from state.js (excluding VERSION and MODULE_ID to avoid duplicates)

// @ts-expect-error TS migration - TS2614, TS2724
export { CONFIG, NOTIFICATION_TYPES, NOTIFICATION_PRIORITIES, state, log, setDebug, isDebug, updateConfig, getState, resetState, incrementMetric } from './state.js';
export { fetchFromServer, markAsRead, markAllAsRead, deleteNotification, createNotification } from './api.js';
export { startPolling, stopPolling, restartPolling, isPollingActive, setPollingInterval, forcePoll } from './polling.js';
export { EVENTS, on, off, emit, once, clearListeners, getRegisteredEvents, syncWithGlobalState, notifyOrchestrator } from './events.js';


// @ts-expect-error TS migration - TS2614, TS2724
import { state, log, setDebug, resetState, getState, CONFIG, updateConfig, NOTIFICATION_TYPES, NOTIFICATION_PRIORITIES } from './state.js';
import { fetchFromServer, markAsRead, markAllAsRead, deleteNotification, createNotification } from './api.js';
import { startPolling, stopPolling, restartPolling, isPollingActive, setPollingInterval, forcePoll } from './polling.js';
import { EVENTS, on, off, emit, once, clearListeners, getRegisteredEvents, syncWithGlobalState, notifyOrchestrator } from './events.js';

const Ports = createCorePorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const _getPort = (name: string) => Ports.get(name);
export const injectPorts = (p: Record<string, unknown>) => Ports.inject(p);
export const getPorts = () => Ports.snapshot();

export const NotificationManager = {
  VERSION, MODULE_ID,
  TYPES: NOTIFICATION_TYPES,
  PRIORITIES: NOTIFICATION_PRIORITIES,
  EVENTS,

  init: (options: { debug?: boolean; config?: Record<string, unknown> } & Record<string, unknown> = {}) => {
    if (state.initialized) { log('warn', 'NotificationManager já inicializado'); return true; }
    if (options.debug) setDebug(true);
    if (options.config) updateConfig(options.config);
    _initPorts();
    state.abortController = new AbortController();
    state.initialized = true;
    if (options.autoPolling !== false) startPolling();
    syncWithGlobalState();
    log('info', 'NotificationManager inicializado');
    return true;
  },

  destroy: () => { stopPolling(); clearListeners(); state.abortController?.abort(); resetState(); log('info', 'NotificationManager destruído'); },
  isInitialized: () => state.initialized,
  setDebug,
  getState,
  updateConfig,
  fetch: fetchFromServer,
  fetchFromServer,
  markAsRead,
  markAllAsRead,
  delete: deleteNotification,
  deleteNotification,
  create: createNotification,
  createNotification,
  startPolling,
  stopPolling,
  restartPolling,
  isPollingActive,
  setPollingInterval,
  forcePoll,
  on, off, emit, once, clearListeners,
  injectPorts, getPorts,

  getNotifications: () => state.notifications.slice(),
  getUnreadCount: () => state.unreadCount,
  getNotificationById: (id: string | number) => state.notifications.find((n: Record<string, unknown>) => n.id === id) || null,
  getUnreadNotifications: () => state.notifications.filter((n: Record<string, unknown>) => !n.read),
  getNotificationsByType: (type: string) => state.notifications.filter((n: Record<string, unknown>) => n.type === type),

  show: (notification: Record<string, unknown>) => {
    const id = (notification.id as string | number) || `notif-${Date.now()}`;
    const notif = { id, type: notification.type || NOTIFICATION_TYPES.INFO, title: notification.title || '', message: notification.message || '', priority: notification.priority || NOTIFICATION_PRIORITIES.NORMAL, autoHide: notification.autoHide !== false, duration: notification.duration || CONFIG.autoHideDelay, createdAt: Date.now(), read: false };
    state.visibleNotifications.unshift(notif);
    if (state.visibleNotifications.length > CONFIG.maxVisible) state.visibleNotifications.pop();
    emit('notificationCreated', notif);
    if (notif.autoHide) setTimeout(() => NotificationManager.hide(id), notif.duration);
    return id;
  },

  hide: (id: string | number) => { const index = state.visibleNotifications.findIndex((n: Record<string, unknown>) => n.id === id); if (index !== -1) { state.visibleNotifications.splice(index, 1); emit('visibilityChanged', { id, visible: false }); } },
  hideAll: () => { state.visibleNotifications = []; emit('visibilityChanged', { all: true, visible: false }); },

  healthCheck: () => {
    const checks = { initialized: state.initialized, pollingActive: state.pollingActive, noRecentErrors: state.metrics.errors === 0 || (Date.now() - (state.lastError?.time || 0)) > 60000, hasFetched: state.lastFetch !== null, portsInitialized: Ports.isInitialized() };
    const passed = Object.values(checks).filter(Boolean).length;
    const total = Object.keys(checks).length;
    return { status: passed === total ? 'HEALTHY' : (passed >= 3 ? 'DEGRADED' : 'UNHEALTHY'), score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, portsInitialized: Ports.isInitialized(), metrics: { ...state.metrics }, unreadCount: state.unreadCount, notificationCount: state.notifications.length, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
  },

  info: () => ({ version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), state: getState(), healthCheck: NotificationManager.healthCheck(), registeredEvents: getRegisteredEvents() })
};

export const notify = NotificationManager.show.bind(NotificationManager);
export const toast = NotificationManager.show.bind(NotificationManager);

export default NotificationManager;
