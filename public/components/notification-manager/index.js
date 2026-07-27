import { createCorePorts } from "/core/runtime/ports-profiles.js";
const VERSION = "5.7.0-P2-ENTERPRISE";
const MODULE_ID = "notification-manager";
import { CONFIG, NOTIFICATION_TYPES, NOTIFICATION_PRIORITIES, state, log, setDebug, isDebug, updateConfig, getState, resetState, incrementMetric } from "./state.js";
import { fetchFromServer, markAsRead, markAllAsRead, deleteNotification, createNotification } from "./api.js";
import { startPolling, stopPolling, restartPolling, isPollingActive, setPollingInterval, forcePoll } from "./polling.js";
import { EVENTS, on, off, emit, once, clearListeners, getRegisteredEvents, syncWithGlobalState, notifyOrchestrator } from "./events.js";
import { state as state2, log as log2, setDebug as setDebug2, resetState as resetState2, getState as getState2, CONFIG as CONFIG2, updateConfig as updateConfig2, NOTIFICATION_TYPES as NOTIFICATION_TYPES2, NOTIFICATION_PRIORITIES as NOTIFICATION_PRIORITIES2 } from "./state.js";
import { fetchFromServer as fetchFromServer2, markAsRead as markAsRead2, markAllAsRead as markAllAsRead2, deleteNotification as deleteNotification2, createNotification as createNotification2 } from "./api.js";
import { startPolling as startPolling2, stopPolling as stopPolling2, restartPolling as restartPolling2, isPollingActive as isPollingActive2, setPollingInterval as setPollingInterval2, forcePoll as forcePoll2 } from "./polling.js";
import { EVENTS as EVENTS2, on as on2, off as off2, emit as emit2, once as once2, clearListeners as clearListeners2, getRegisteredEvents as getRegisteredEvents2, syncWithGlobalState as syncWithGlobalState2 } from "./events.js";
const Ports = createCorePorts({ moduleId: MODULE_ID });
const _initPorts = () => Ports.init();
const _getPort = (name) => Ports.get(name);
const injectPorts = (p) => Ports.inject(p);
const getPorts = () => Ports.snapshot();
const NotificationManager = {
  VERSION,
  MODULE_ID,
  TYPES: NOTIFICATION_TYPES2,
  PRIORITIES: NOTIFICATION_PRIORITIES2,
  EVENTS: EVENTS2,
  init: (options = {}) => {
    if (state2.initialized) {
      log2("warn", "NotificationManager j\xE1 inicializado");
      return true;
    }
    if (options.debug) setDebug2(true);
    if (options.config) updateConfig2(options.config);
    _initPorts();
    state2.abortController = new AbortController();
    state2.initialized = true;
    if (options.autoPolling !== false) startPolling2();
    syncWithGlobalState2();
    log2("info", "NotificationManager inicializado");
    return true;
  },
  destroy: () => {
    stopPolling2();
    clearListeners2();
    state2.abortController?.abort();
    resetState2();
    log2("info", "NotificationManager destru\xEDdo");
  },
  isInitialized: () => state2.initialized,
  setDebug: setDebug2,
  getState: getState2,
  updateConfig: updateConfig2,
  fetch: fetchFromServer2,
  fetchFromServer: fetchFromServer2,
  markAsRead: markAsRead2,
  markAllAsRead: markAllAsRead2,
  delete: deleteNotification2,
  deleteNotification: deleteNotification2,
  create: createNotification2,
  createNotification: createNotification2,
  startPolling: startPolling2,
  stopPolling: stopPolling2,
  restartPolling: restartPolling2,
  isPollingActive: isPollingActive2,
  setPollingInterval: setPollingInterval2,
  forcePoll: forcePoll2,
  on: on2,
  off: off2,
  emit: emit2,
  once: once2,
  clearListeners: clearListeners2,
  injectPorts,
  getPorts,
  getNotifications: () => state2.notifications.slice(),
  getUnreadCount: () => state2.unreadCount,
  getNotificationById: (id) => state2.notifications.find((n) => n.id === id) || null,
  getUnreadNotifications: () => state2.notifications.filter((n) => !n.read),
  getNotificationsByType: (type) => state2.notifications.filter((n) => n.type === type),
  show: (notification) => {
    const id = notification.id || `notif-${Date.now()}`;
    const notif = { id, type: notification.type || NOTIFICATION_TYPES2.INFO, title: notification.title || "", message: notification.message || "", priority: notification.priority || NOTIFICATION_PRIORITIES2.NORMAL, autoHide: notification.autoHide !== false, duration: notification.duration || CONFIG2.autoHideDelay, createdAt: Date.now(), read: false };
    state2.visibleNotifications.unshift(notif);
    if (state2.visibleNotifications.length > CONFIG2.maxVisible) state2.visibleNotifications.pop();
    emit2("notificationCreated", notif);
    if (notif.autoHide) setTimeout(() => NotificationManager.hide(id), notif.duration);
    return id;
  },
  hide: (id) => {
    const index = state2.visibleNotifications.findIndex((n) => n.id === id);
    if (index !== -1) {
      state2.visibleNotifications.splice(index, 1);
      emit2("visibilityChanged", { id, visible: false });
    }
  },
  hideAll: () => {
    state2.visibleNotifications = [];
    emit2("visibilityChanged", { all: true, visible: false });
  },
  healthCheck: () => {
    const checks = { initialized: state2.initialized, pollingActive: state2.pollingActive, noRecentErrors: state2.metrics.errors === 0 || Date.now() - (state2.lastError?.time || 0) > 6e4, hasFetched: state2.lastFetch !== null, portsInitialized: Ports.isInitialized() };
    const passed = Object.values(checks).filter(Boolean).length;
    const total = Object.keys(checks).length;
    return { status: passed === total ? "HEALTHY" : passed >= 3 ? "DEGRADED" : "UNHEALTHY", score: passed, maxScore: total, scoreDisplay: `${passed}/${total}`, checks, portsInitialized: Ports.isInitialized(), metrics: { ...state2.metrics }, unreadCount: state2.unreadCount, notificationCount: state2.notifications.length, version: VERSION, moduleId: MODULE_ID, timestamp: Date.now() };
  },
  info: () => ({ version: VERSION, moduleId: MODULE_ID, portsInitialized: Ports.isInitialized(), state: getState2(), healthCheck: NotificationManager.healthCheck(), registeredEvents: getRegisteredEvents2() })
};
const notify = NotificationManager.show.bind(NotificationManager);
const toast = NotificationManager.show.bind(NotificationManager);
var notification_manager_default = NotificationManager;
export {
  CONFIG,
  EVENTS,
  MODULE_ID,
  NOTIFICATION_PRIORITIES,
  NOTIFICATION_TYPES,
  NotificationManager,
  VERSION,
  clearListeners,
  createNotification,
  notification_manager_default as default,
  deleteNotification,
  emit,
  fetchFromServer,
  forcePoll,
  getPorts,
  getRegisteredEvents,
  getState,
  incrementMetric,
  injectPorts,
  isDebug,
  isPollingActive,
  log,
  markAllAsRead,
  markAsRead,
  notify,
  notifyOrchestrator,
  off,
  on,
  once,
  resetState,
  restartPolling,
  setDebug,
  setPollingInterval,
  startPolling,
  state,
  stopPolling,
  syncWithGlobalState,
  toast,
  updateConfig
};
