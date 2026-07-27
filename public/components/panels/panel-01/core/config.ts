// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (9.0.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-01/core/config
// PURPOSE: Panel-01 Configuration
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   CONFIG — exported value
//   getConfig() — exported function
//   setConfig() — exported function
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

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-01/core/config';

export const CONFIG = {
  api: {
    baseUrl: '/api/requisicoes',
    timeout: 30000,
    retries: 3,
    retryDelay: 1000
  },
  refresh: {
    interval: 30000,
    enabled: true
  },
  pagination: {
    defaultLimit: 25,
    limits: [10, 25, 50, 100]
  },
  table: {
    defaultSort: { field: 'Data_Requisicao', order: 'DESC' },
    defaultDensity: 'normal',
    virtualScroll: { enabled: true, rowHeight: 44, bufferSize: 5 },
    stickyColumns: { left: ['select', 'id'], right: ['actions'] },
    editableFields: ['descricao', 'observacao']
  },
  features: {
    autoRefresh: true,
    keyboardNav: true,
    contextMenu: true,
    bulkActions: true,
    urlState: true,
    localStorage: true,
    virtualScroll: true,
    lazyLoading: true,
    webWorkers: true,
    memoization: true,
    debounce: true,
    prefetch: true,
    indexedDB: true,
    serviceWorker: false,
    dragDrop: true,
    columnResize: true,
    stickyColumns: false,
    inlineEdit: true,
    multiSort: true,
    savedViews: true,
    animations: true,
    hapticFeedback: true,
    fuzzySearch: true,
    bulkEdit: true,
    importExport: true,
    exportPDF: true,
    tags: true,
    preview: true,
    duplicate: true,
    websocket: false,
    badgeNew: true,
    errorBoundary: true
  },
  performance: {
    memoization: { maxSize: 500, ttl: 60000 },
    debounce: { search: 400, filter: 300, resize: 150 },
    prefetch: { maxCached: 5, ttl: 60000 },
    indexedDB: { ttl: 300000 }
  },
  websocket: {
    url: null as string | null,
    reconnectDelay: 3000,
    maxReconnects: 5
  }
};

export function getConfig(path: string): unknown {
  return path.split('.').reduce((obj: Record<string, unknown> | null, key: string) => obj && (obj[key] as Record<string, unknown>), CONFIG as unknown as Record<string, unknown>);
}

export function setConfig(path: string, value: unknown): void {
  const keys = path.split('.');
  const last = keys.pop()!;
  const target = keys.reduce((obj: Record<string, unknown>, key: string) => { obj[key] = obj[key] || {}; return obj[key] as Record<string, unknown>; }, CONFIG as unknown as Record<string, unknown>);
  target[last] = value;
}

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION }; }
export default CONFIG;
