
// Degradation Notifier - Sistema de notificação de degradações para UI
// @version 1.4.0-DEGRADATION-CONTRACT
// @description #25 Notificação de degradação para UI
// @changelog v1.4.0-DEGRADATION-CONTRACT - Integração com degradation-contract.js
// @changelog v1.3.0-CONTRACTS - Dependency contract formal adicionado
// @changelog v1.2.0-DOMAIN-PURE - Eliminado window.EventBus direto → usa port eventBus via PortsFactory + constantes DEGRADATION_EVENTS
// @changelog v1.1.0-PORTSFACTORY - Migração para PortsFactory (elimina window.Logger)
// @changelog v1.0.0-OBSERVABILITY: Implementação inicial Sprint 3
//
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.4.0)
// ═══════════════════════════════════════════════════════════════
// RECEIVES (via PortsFactory / injectPorts):
//   ports.logger   — Logger for phase-level logging
//   ports.eventBus — EventBus for emitting degradation events
//
// IMPORTS:
//   createCorePorts from /core/runtime/ports-profiles.js
//   DEGRADATION_EVENTS from /core/runtime/events/index.js
//   createHealthResult, HEALTH_STATUS from contracts/health-contract.ts
//   DEGRADATION_SEVERITY, mapLegacyType, createDegradationResult from contracts/degradation-contract.js
//
// EMITS:
//   DEGRADATION_EVENTS.TOAST         — Toast notification data
//   DEGRADATION_EVENTS.BANNER        — Banner show/hide
//   DEGRADATION_EVENTS.NOTIFY        — General notification
//   DEGRADATION_EVENTS.DISMISSED     — Single notification dismissed
//   DEGRADATION_EVENTS.DISMISSED_ALL — All notifications dismissed
//
// WINDOW ACCESS: None (fully PortsFactory-driven)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { createCorePorts } from '/core/runtime/ports-profiles.js';
import { DEGRADATION_EVENTS } from '/core/runtime/events/catalog/degradation.events.js';
import { createHealthResult, HEALTH_STATUS } from '../contracts/health-contract.js';
import {
  DEGRADATION_SEVERITY,
  mapLegacyType,
  createDegradationResult
} from '../contracts/degradation-contract.js';

const MODULE_ID = 'degradation-notifier';
const VERSION = '1.4.0-DEGRADATION-CONTRACT';

// ═══════════════════════════════════════════════════════════════
// PORTS
// ═══════════════════════════════════════════════════════════════

const _Ports = createCorePorts({ moduleId: MODULE_ID });
function _getPort(name: string) { return _Ports.get(name); }

function injectPorts(p: Record<string, unknown>) { return _Ports.inject(p); }
function getPortsSnapshot() { return _Ports.snapshot(); }

// Re-export SEVERITY do contrato para backward compatibility
const SEVERITY = DEGRADATION_SEVERITY;

// Configuração padrão
const DEFAULT_CONFIG = {
  enabled: true,
  showToast: true,
  showBanner: true,
  autoHideDelay: 10000,
  maxNotifications: 5,
  groupSimilar: true,
  persistCritical: true,
  logToConsole: true
};

// Types
interface DegradationNotification {
  id: number;
  type: string;
  message: string;
  details: Record<string, unknown>;
  severity: string;
  status: string;
  timestamp: number;
  dismissed: boolean;
  grouped: boolean;
  groupCount: number;
  lastUpdate?: number;
}

interface BannerContent {
  message: string;
  severity: string;
  status: string;
  type: string;
  count: number;
}

type DegradationListener = (event: string, notification: DegradationNotification | Record<string, unknown>) => void;

// Estado interno
let _config = Object.assign({}, DEFAULT_CONFIG);
let _notifications: DegradationNotification[] = [];
let _listeners: DegradationListener[] = [];
let _notificationId = 0;
let _bannerVisible = false;
let _bannerContent: BannerContent | null = null;

// Criar notificação usando o contrato
function _createNotification(type: string, message: string, details: Record<string, unknown>): DegradationNotification {
  _notificationId++;
  
  // Usar mapLegacyType do contrato para determinar status/severity
  const mapped = mapLegacyType(type);
  
  return {
    id: _notificationId,
    type: type,
    message: message,
    details: details || {},
    severity: mapped.severity,
    status: mapped.status,
    timestamp: Date.now(),
    dismissed: false,
    grouped: false,
    groupCount: 1
  };
}

// Notificar listeners
function _notifyListeners(event: string, notification: DegradationNotification | Record<string, unknown>) {
  for (let i = 0; i < _listeners.length; i++) {
    try {
      _listeners[i](event, notification);
    } catch (e) {
      if (_config.logToConsole) {
        console.warn('[' + MODULE_ID + '] Listener error:', e);
      }
    }
  }
}

// Emitir evento via port EventBus
function _emitEvent(eventName: string, data: Record<string, unknown>) {
  const eventBus = _getPort('eventBus');
  if (eventBus && eventBus.emit) {
    try {
      eventBus.emit(eventName, Object.assign({}, data, {
        source: MODULE_ID,
        timestamp: Date.now()
      }));
    } catch (e) {}
  }
}

// Log via PortsFactory
function _log(level: string, message: string, data?: unknown) {
  if (!_config.logToConsole) return;

  const prefix = '[' + MODULE_ID + ']';
  const logger = _getPort('logger');
  if (logger && logger[level]) {
    logger[level](prefix + ' ' + message, data || '');
  }
}

// Mostrar toast na UI
function _showToast(notification: DegradationNotification) {
  if (!_config.showToast) return;

  _emitEvent(DEGRADATION_EVENTS.TOAST, {
    id: notification.id,
    type: notification.type,
    message: notification.message,
    severity: notification.severity,
    status: notification.status,
    autoHide: notification.severity !== SEVERITY.CRITICAL || !_config.persistCritical,
    autoHideDelay: _config.autoHideDelay
  });

  _log('info', 'Toast emitted', { id: notification.id, type: notification.type });
}

// Mostrar/atualizar banner
function _updateBanner(show: boolean, content: BannerContent | null) {
  _bannerVisible = show;
  _bannerContent = content;

  _emitEvent(DEGRADATION_EVENTS.BANNER, {
    visible: show,
    content: content,
    severity: content ? content.severity : null
  });

  if (show) {
    _log('warn', 'Banner shown', content);
  } else {
    _log('info', 'Banner hidden');
  }
}

// Agrupar notificações similares
function _tryGroupNotification(notification: DegradationNotification) {
  if (!_config.groupSimilar) return false;

  for (let i = 0; i < _notifications.length; i++) {
    const existing = _notifications[i];
    if (!existing.dismissed && existing.type === notification.type) {
      existing.groupCount++;
      existing.grouped = true;
      existing.lastUpdate = Date.now();
      _notifyListeners('grouped', existing);
      return true;
    }
  }
  return false;
}

// Limitar número de notificações
function _enforceMaxNotifications() {
  const active = _notifications.filter(function(n) { return !n.dismissed; });

  if (active.length > _config.maxNotifications) {
    const toRemove = active
      .filter(function(n) { return n.severity !== SEVERITY.CRITICAL; })
      .sort(function(a, b) { return a.timestamp - b.timestamp; });

    const removeCount = active.length - _config.maxNotifications;
    for (let i = 0; i < removeCount && i < toRemove.length; i++) {
      toRemove[i].dismissed = true;
      _notifyListeners('auto-dismissed', toRemove[i]);
    }
  }
}

// ============================================================================
// API PÚBLICA
// ============================================================================

function notify(type: string, message: string, details: Record<string, unknown>) {
  if (!_config.enabled) return null;

  const notification = _createNotification(type, message, details);

  if (_tryGroupNotification(notification)) {
    return null;
  }

  _notifications.push(notification);
  _enforceMaxNotifications();

  _showToast(notification);

  if (notification.severity === SEVERITY.CRITICAL || notification.severity === SEVERITY.ERROR) {
    _updateBanner(true, {
      message: notification.message,
      severity: notification.severity,
      status: notification.status,
      type: notification.type,
      count: _notifications.filter(function(n) {
        return !n.dismissed && (n.severity === SEVERITY.CRITICAL || n.severity === SEVERITY.ERROR);
      }).length
    });
  }

  _notifyListeners('notify', notification);

  _emitEvent(DEGRADATION_EVENTS.NOTIFY, notification as unknown as Record<string, unknown>);

  _log(notification.severity === SEVERITY.CRITICAL ? 'error' : 'warn',
       'Degradation notified: ' + type, { message: message, details: details });

  return notification;
}

function notifyPhaseDegraded(phaseId: string, reason: string) {
  return notify('phase-degraded', 'Fase ' + phaseId + ' em modo degradado', {
    phaseId: phaseId,
    reason: reason
  });
}

function notifyPhaseFailed(phaseId: string, error: string, critical: boolean) {
  const type = critical ? 'critical-phase-failed' : 'phase-failed';
  return notify(type, 'Fase ' + phaseId + ' falhou' + (critical ? ' (crítica)' : ''), {
    phaseId: phaseId,
    error: error,
    critical: critical
  });
}

function notifyCircuitBreakerOpen(moduleId: string, stats: Record<string, unknown>) {
  return notify('circuit-breaker-open', 'Circuit Breaker aberto: ' + moduleId, {
    moduleId: moduleId,
    stats: stats
  });
}

function notifyBootDegraded(reason: string, details: Record<string, unknown>) {
  return notify('degraded', 'Sistema em modo degradado: ' + reason, details);
}

function notifyBootFailed(error: string) {
  return notify('boot-failed', 'Falha no boot: ' + error, { error: error });
}

function notifyTimeoutWarning(elapsed: number, timeout: number) {
  return notify('timeout-warning', 'Boot demorando mais que o esperado', {
    elapsed: elapsed,
    timeout: timeout
  });
}

// v1.4.0: Nova função usando contrato formal
function notifyPhaseRollback(phaseId: string, rollbackResult: Record<string, unknown>) {
  return notify('phase-rollback', 'Fase ' + phaseId + ' sofreu rollback', {
    phaseId: phaseId,
    rollbackResult: rollbackResult
  });
}

function dismiss(notificationId: number) {
  for (let i = 0; i < _notifications.length; i++) {
    if (_notifications[i].id === notificationId) {
      _notifications[i].dismissed = true;
      _notifyListeners('dismissed', _notifications[i]);
      _emitEvent(DEGRADATION_EVENTS.DISMISSED, { id: notificationId });

      const hasCritical = _notifications.some(function(n) {
        return !n.dismissed && (n.severity === SEVERITY.CRITICAL || n.severity === SEVERITY.ERROR);
      });

      if (!hasCritical && _bannerVisible) {
        _updateBanner(false, null);
      }

      return true;
    }
  }
  return false;
}

function dismissAll() {
  let dismissed = 0;
  for (let i = 0; i < _notifications.length; i++) {
    if (!_notifications[i].dismissed) {
      _notifications[i].dismissed = true;
      dismissed++;
    }
  }
  _updateBanner(false, null);
  _notifyListeners('dismissed-all', { count: dismissed });
  _emitEvent(DEGRADATION_EVENTS.DISMISSED_ALL, { count: dismissed });
  return dismissed;
}

function getActive() {
  return _notifications.filter(function(n) { return !n.dismissed; });
}

function getAll() {
  return _notifications.slice();
}

function getBannerStatus() {
  return {
    visible: _bannerVisible,
    content: _bannerContent
  };
}

function subscribe(callback: DegradationListener) {
  if (typeof callback === 'function') {
    _listeners.push(callback);
    return function unsubscribe() {
      const idx = _listeners.indexOf(callback);
      if (idx !== -1) _listeners.splice(idx, 1);
    };
  }
  return function() {};
}

function configure(options: Partial<typeof DEFAULT_CONFIG>) {
  _config = Object.assign({}, _config, options);
  _log('info', 'Configuration updated', _config);
}

function getConfig() {
  return Object.assign({}, _config);
}

function reset() {
  _notifications = [];
  _bannerVisible = false;
  _bannerContent = null;
  _updateBanner(false, null);
  _log('info', 'Reset complete');
}

function info() {
  const active = getActive();
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    enabled: _config.enabled,
    portsInitialized: _Ports.isInitialized(),
    totalNotifications: _notifications.length,
    activeNotifications: active.length,
    criticalCount: active.filter(function(n) { return n.severity === SEVERITY.CRITICAL; }).length,
    errorCount: active.filter(function(n) { return n.severity === SEVERITY.ERROR; }).length,
    warningCount: active.filter(function(n) { return n.severity === SEVERITY.WARNING; }).length,
    bannerVisible: _bannerVisible,
    listeners: _listeners.length,
    contractVersion: '1.0.0',
    improvements: ['#25-DegradationNotifier', 'DEGRADATION-CONTRACT']
  };
}

function healthCheck() {
  return createHealthResult({
    status: HEALTH_STATUS.HEALTHY,
    moduleId: MODULE_ID,
    version: VERSION,
    details: {
      portsInitialized: _Ports.isInitialized(),
      enabled: _config.enabled,
      activeNotifications: getActive().length,
      contractIntegrated: true
    }
  });
}

export {
  MODULE_ID,
  VERSION,
  SEVERITY,
  notify,
  notifyPhaseDegraded,
  notifyPhaseFailed,
  notifyCircuitBreakerOpen,
  notifyBootDegraded,
  notifyBootFailed,
  notifyTimeoutWarning,
  notifyPhaseRollback,
  dismiss,
  dismissAll,
  getActive,
  getAll,
  getBannerStatus,
  subscribe,
  configure,
  getConfig,
  reset,
  info,
  healthCheck,
  injectPorts,
  getPortsSnapshot
};

export default {
  MODULE_ID: MODULE_ID,
  VERSION: VERSION,
  SEVERITY: SEVERITY,
  notify: notify,
  notifyPhaseDegraded: notifyPhaseDegraded,
  notifyPhaseFailed: notifyPhaseFailed,
  notifyCircuitBreakerOpen: notifyCircuitBreakerOpen,
  notifyBootDegraded: notifyBootDegraded,
  notifyBootFailed: notifyBootFailed,
  notifyTimeoutWarning: notifyTimeoutWarning,
  notifyPhaseRollback: notifyPhaseRollback,
  dismiss: dismiss,
  dismissAll: dismissAll,
  getActive: getActive,
  getAll: getAll,
  getBannerStatus: getBannerStatus,
  subscribe: subscribe,
  configure: configure,
  getConfig: getConfig,
  reset: reset,
  info: info,
  healthCheck: healthCheck,
  injectPorts: injectPorts,
  getPorts: getPortsSnapshot
};
