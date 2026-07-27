// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-05:icons
// PURPOSE: Panel-05 Icons - Compatibility Adapter
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   IconRegistry from /components/icon-registry/index.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   ICONS — exported value
//   getIcon() — exported function
//   hasIcon() — exported function
//   getAllIconNames() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { IconRegistry } from '/components/icon-registry/index.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-05:icons';

// Mapeamento de nomes legacy (camelCase) para IconRegistry (namespace:kebab-case)
const ICON_MAP: Record<string, string> = {
  // Navigation & Actions
  chevronLeft: 'ui:chevron-left',
  chevronRight: 'ui:chevron-right',
  chevronUp: 'ui:chevron-up',
  chevronDown: 'ui:chevron-down',
  arrowUp: 'ui:arrow-up',
  arrowDown: 'ui:arrow-down',
  x: 'ui:x',
  check: 'ui:check',
  search: 'ui:search',
  filter: 'ui:filter',
  refresh: 'ui:refresh',
  refreshCw: 'ui:refresh',
  download: 'ui:download',
  copy: 'ui:copy',
  eye: 'ui:eye',
  list: 'ui:list',
  history: 'system:clock',
  
  // Status & Alerts
  alertCircle: 'system:alert-circle',
  alertTriangle: 'system:alert-triangle',
  checkCircle: 'ui:check-circle',
  xCircle: 'ui:x-circle',
  info: 'system:info',
  lightbulb: 'system:help',
  
  // Trends & Charts
  trendingUp: 'charts:trending-up',
  trendingDown: 'charts:trending-down',
  barChart: 'charts:bar',
  pieChart: 'charts:pie',
  activity: 'charts:activity',
  percent: 'charts:percent',
  target: 'charts:target',
  zap: 'charts:zap',
  
  // Business & Finance
  dollarSign: 'business:dollar',
  building: 'business:building',
  fileText: 'business:file-text',
  inbox: 'business:mail',
  
  // Users & Contacts
  users: 'business:users',
  user: 'business:user',
  userCheck: 'business:user-check',
  userPlus: 'business:user-plus',
  phone: 'business:phone',
  mail: 'business:mail',
  messageCircle: 'business:message',
  
  // Location & Map
  mapPin: 'business:map-pin',
  map: 'business:map',
  
  // Time & Calendar
  clock: 'system:clock',
  calendar: 'business:calendar',
  
  // Awards & Achievements
  trophy: 'business:trophy',
  award: 'business:award',
  star: 'ui:star',
  
  // UI Elements
  keyboard: 'system:help',
  settings: 'system:settings',
  monitor: 'system:info',
  sun: 'system:power',
  moon: 'system:power',
  
  // Loading & States
  loader: 'system:loader',
  
  // Toast variants
  success: 'system:success',
  error: 'system:error',
  warning: 'system:warning'
};

// Proxy object para compatibilidade com ICONS.name
export const ICONS = new Proxy({}, {
  get(target, prop: string | symbol) {
    const mapped = ICON_MAP[prop as string];
    if (mapped) {
      return IconRegistry.get(mapped) || '';
    }
    return '';
  },
  has(target, prop) {
    return prop in ICON_MAP;
  },
  ownKeys() {
    return Object.keys(ICON_MAP);
  },
  getOwnPropertyDescriptor(target, prop) {
    if (prop in ICON_MAP) {
      // @ts-expect-error strict migration — TS2722, TS2554
      return { enumerable: true, configurable: true, value: this.get(target, prop) };
    }
    return undefined;
  }
});

// Helper functions - compatibilidade total
export function getIcon(name: string, fallback = '') {
  const mapped = ICON_MAP[name];
  if (mapped) {
    return IconRegistry.get(mapped) || fallback || IconRegistry.get('system:alert-circle');
  }
  return fallback || IconRegistry.get('system:alert-circle');
}

export function hasIcon(name: string) {
  return name in ICON_MAP;
}

export function getAllIconNames() {
  return Object.keys(ICON_MAP);
}

// Module info
export function info() {
  return { 
    moduleId: MODULE_ID, 
    version: VERSION, 
    iconCount: Object.keys(ICON_MAP).length,
    source: 'IconRegistry',
    registryVersion: IconRegistry.VERSION
  };
}

export function healthCheck() {
  const registryHealth = IconRegistry.healthCheck();
  return { 
    status: registryHealth.status, 
    moduleId: MODULE_ID, 
    version: VERSION, 
    checks: { 
      adapterReady: true, 
      iconCount: Object.keys(ICON_MAP).length,
      registryHealthy: registryHealth.status === 'HEALTHY'
    } 
  };
}

export default ICONS;
