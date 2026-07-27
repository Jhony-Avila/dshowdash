// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (v1.1.0-ES6)
// ═══════════════════════════════════════════════════════════════
// MODULE: header/core/constants
// PURPOSE: Centraliza todas as constantes do Header Enterprise
// ───────────────────────────────────────────────────────────────
// PROVIDES:
//   VERSION — versão do módulo
//   MODULE_ID — identificador do módulo
//   TIMEOUTS — timeouts para mount, API, fallback, debounce, etc.
//   INTERVALS — intervalos de polling e cache TTL
//   BACKOFF — configurações de backoff exponencial
//   SELECTORS — seletores CSS do header
//   DATA_ATTRS — atributos data-* dos componentes
//   CRITICALITY — níveis de criticidade (critical/important/optional)
//   COMPONENT_STATUS — estados dos componentes
//   HEALTH_STATUS — estados de saúde
//   CIRCUIT_STATE — estados do circuit breaker
//   NETWORK_STATUS — estados de rede
//   NETWORK_QUALITY — qualidades de rede
//   FALLBACK_TYPE — tipos de fallback
//   FALLBACK_PRIORITY — prioridades de fallback
//   REGIONS — regiões do header (left/center/right)
//   REGION_MAP — mapeamento de regiões
//   COMPONENT_TYPE — tipos de componente
//   CRITICALITY_MAP — mapa tipo->criticidade
//   DEFAULT_CAPABILITIES — capabilities padrão
//   CONTRACT — métodos/propriedades requeridos/recomendados
//   LIMITS — limites operacionais
//   THRESHOLDS — limiares de qualidade
//   ENDPOINTS — endpoints da API
//   CSS_CLASSES — classes CSS
//   STORAGE_KEYS — chaves de localStorage
// ═══════════════════════════════════════════════════════════════
// Header - Constants (Centralized)
// @version 1.1.0-ES6
// @changelog v1.1.0-ES6 - Task 10.1 B12: var → const/let
// Centraliza todas as constantes do Header Enterprise
'use strict';

export const VERSION = '1.1.0-ES6';
export const MODULE_ID = 'header/core/constants';

export const TIMEOUTS = Object.freeze({
  MOUNT_DEFAULT: 5000,
  MOUNT_CRITICAL: 3000,
  MOUNT_OPTIONAL: 8000,
  API_DEFAULT: 6000,
  API_HEALTH: 5000,
  API_ALERTS: 10000,
  FALLBACK_AUTO_HIDE: 8000,
  FALLBACK_TRANSITION: 300,
  TOOLTIP_SHOW: 250,
  TOOLTIP_HIDE: 150,
  DEBOUNCE_DEFAULT: 300,
  DEBOUNCE_SYNC: 1000,
  THROTTLE_REFRESH: 5000,
  CIRCUIT_BREAKER_RESET: 60000,
  SELF_HEALING_CHECK: 30000,
  SELF_HEALING_RETRY: 15000
});

export const INTERVALS = Object.freeze({
  HEALTH_POLLING: 1800000,
  ALERTS_POLLING: 2000000,
  NETWORK_QUALITY: 2000000,
  UPTIME_TRACKING: 5000,
  CACHE_TTL_DEFAULT: 300000,
  CACHE_TTL_REGISTRY: 300000,
  CACHE_TTL_PERMISSIONS: 600000
});

export const BACKOFF = Object.freeze({
  DEFAULT: [5000, 10000, 20000, 30000, 60000],
  AGGRESSIVE: [1000, 2000, 5000, 10000, 30000],
  CONSERVATIVE: [10000, 30000, 60000, 120000, 300000],
  JITTER_FACTOR: 0.3
});

export const SELECTORS = Object.freeze({
  CONTAINER: '#header-container',
  HEADER: '.header',
  HEADER_LEFT: '.header-left',
  HEADER_CENTER: '.header-center',
  HEADER_RIGHT: '.header-right',
  STATUS_TRAY: '.header-status-tray',
  COMPONENT_WRAPPER: '.header-component-wrapper',
  COMPONENT_FALLBACK: '.header-component-fallback',
  COMPONENT_LOADING: '.header-component-loading',
  FALLBACK: '.header-fallback',
  PANEL_TRIGGER: '.header-panel-trigger',
  USER_MENU: '.header-user-menu',
  LOGO: '.header-logo',
  ENV_CHIP: '.header-env-chip'
});

export const DATA_ATTRS = Object.freeze({
  COMPONENT_KEY: 'data-component-key',
  COMPONENT_TYPE: 'data-component-type',
  COMPONENT_LABEL: 'data-component-label',
  COMPONENT_STATUS: 'data-status',
  PANEL_TRIGGER: 'data-panel-trigger',
  UARPS_TRIGGER: 'data-uarps-trigger',
  DRAGGABLE: 'data-draggable',
  FALLBACK_TYPE: 'data-fallback-type',
  EDIT_INDEX: 'data-edit-index'
});

export const CRITICALITY = Object.freeze({
  CRITICAL: 'critical',
  IMPORTANT: 'important',
  OPTIONAL: 'optional'
});

export const COMPONENT_STATUS = Object.freeze({
  PENDING: 'pending',
  LOADING: 'loading',
  MOUNTED: 'mounted',
  DEGRADED: 'degraded',
  FAILED: 'failed',
  UNMOUNTED: 'unmounted',
  TIMEOUT: 'timeout',
  RECOVERING: 'recovering'
});

export const HEALTH_STATUS = Object.freeze({
  HEALTHY: 'HEALTHY',
  DEGRADED: 'DEGRADED',
  UNHEALTHY: 'UNHEALTHY',
  UNKNOWN: 'UNKNOWN'
});

export const CIRCUIT_STATE = Object.freeze({
  CLOSED: 'CLOSED',
  OPEN: 'OPEN',
  HALF_OPEN: 'HALF_OPEN'
});

export const NETWORK_STATUS = Object.freeze({
  ONLINE: 'online',
  OFFLINE: 'offline',
  DEGRADED: 'degraded',
  POOR: 'poor'
});

export const NETWORK_QUALITY = Object.freeze({
  EXCELLENT: 'excellent',
  GOOD: 'good',
  REGULAR: 'regular',
  POOR: 'poor',
  OFFLINE: 'offline'
});

export const FALLBACK_TYPE = Object.freeze({
  NETWORK: 'network',
  API: 'api',
  TIMEOUT: 'timeout',
  GENERIC: 'generic'
});

export const FALLBACK_PRIORITY = Object.freeze({
  api: 1,
  generic: 1,
  network: 2,
  timeout: 3
});

export const REGIONS = Object.freeze({
  LEFT: 'left',
  CENTER: 'center',
  RIGHT: 'right'
});

export const REGION_MAP = Object.freeze({
  left: 'left',
  center: 'right',
  right: 'right'
});

export const COMPONENT_TYPE = Object.freeze({
  BRAND: 'brand',
  MENU: 'menu',
  ACTION: 'action',
  INDICATOR: 'indicator',
  INFO: 'info',
  PANEL: 'panel',
  INTEGRATION: 'integration'
});

export const CRITICALITY_MAP = Object.freeze({
  brand: CRITICALITY.CRITICAL,
  menu: CRITICALITY.CRITICAL,
  action: CRITICALITY.IMPORTANT,
  indicator: CRITICALITY.IMPORTANT,
  info: CRITICALITY.OPTIONAL,
  panel: CRITICALITY.OPTIONAL,
  integration: CRITICALITY.OPTIONAL
});

export const DEFAULT_CAPABILITIES = Object.freeze({
  reorderable: true,
  hideable: true,
  critical: false,
  refreshable: false,
  configurable: false
});

export const CONTRACT = Object.freeze({
  REQUIRED_METHODS: ['mount', 'unmount'],
  RECOMMENDED_METHODS: ['healthCheck', 'info', 'destroy'],
  REQUIRED_PROPERTIES: ['VERSION', 'id'],
  RECOMMENDED_PROPERTIES: ['MODULE_ID', 'capabilities']
});

export const LIMITS = Object.freeze({
  MAX_MOUNT_FAILURES: 3,
  MAX_RETRY_ATTEMPTS: 5,
  MAX_COMPONENTS: 50,
  MAX_HISTORY_SIZE: 50,
  MAX_UNDO_STACK: 20,
  MAX_ERROR_COUNT: 10,
  RTT_SAMPLES: 10
});

export const THRESHOLDS = Object.freeze({
  RTT_ONLINE: 120,
  RTT_DEGRADED: 350,
  SUCCESS_RATE_GOOD: 0.7,
  SUCCESS_RATE_DEGRADED: 0.5,
  GOVERNANCE_RATE_GOOD: 0.8,
  DOWNLINK_EXCELLENT: 10,
  DOWNLINK_GOOD: 5,
  DOWNLINK_REGULAR: 1,
  JITTER_EXCELLENT: 10,
  JITTER_GOOD: 30,
  JITTER_REGULAR: 60
});

export const ENDPOINTS = Object.freeze({
  HEALTH: '/api/health/status.php',
  ALERTS: '/api/alerts/header-alerts.php',
  COMPONENTS: '/api/ui/header/components',
  PERMISSIONS: '/api/permissions/me',
  ORDER_SAVE: '/api/ui/header/order'
});

export const CSS_CLASSES = Object.freeze({
  FALLBACK_VISIBLE: 'header-fallback-visible',
  FALLBACK_HIDING: 'header-fallback-hiding',
  COMPONENT_WRAPPER: 'header-component-wrapper',
  COMPONENT_FALLBACK: 'header-component-fallback',
  KEYBOARD_SELECTED: 'hie-keyboard-selected',
  ANIMATE_IN: 'hie-animate-in',
  POSITION_BADGE: 'hie-position-badge'
});

export const STORAGE_KEYS = Object.freeze({
  COMPONENT_ORDER: 'header:component-order',
  USER_PREFERENCES: 'header:user-preferences',
  DEBUG_MODE: 'header:debug',
  FEATURE_FLAGS: 'header:feature-flags'
});

export default {
  VERSION,
  MODULE_ID,
  TIMEOUTS,
  INTERVALS,
  BACKOFF,
  SELECTORS,
  DATA_ATTRS,
  CRITICALITY,
  COMPONENT_STATUS,
  HEALTH_STATUS,
  CIRCUIT_STATE,
  NETWORK_STATUS,
  NETWORK_QUALITY,
  FALLBACK_TYPE,
  FALLBACK_PRIORITY,
  REGIONS,
  REGION_MAP,
  COMPONENT_TYPE,
  CRITICALITY_MAP,
  DEFAULT_CAPABILITIES,
  CONTRACT,
  LIMITS,
  THRESHOLDS,
  ENDPOINTS,
  CSS_CLASSES,
  STORAGE_KEYS
};
