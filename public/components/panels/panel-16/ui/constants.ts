// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.3.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-16-ui-constants
// PURPOSE: Panel-16 UI Constants
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   MODULE_VERSION — exported value
//   STORAGE_KEYS — exported value
//   COLUMN_TYPES — exported value
//   INFINITE_SCROLL_CONFIG — exported value
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

export const MODULE_ID = 'panel-16-ui-constants';
export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_VERSION = VERSION;

export const STORAGE_KEYS = {
  FILTERS: 'p16_filters',
  VIEW: 'p16_view_mode',
  COLUMNS: 'p16_columns',
  VIEWS: 'p16_saved_views',
  FAVORITES: 'p16_favorites',
  SORT: 'p16_sort',
  PINNED: 'p16_pinned_cols'
};

export const COLUMN_TYPES = {
  checkbox: { type: 'checkbox', align: 'center', width: 40 },
  nome: { type: 'text', align: 'left', width: 250, searchable: true },
  cnpj: { type: 'document', align: 'left', width: 150, searchable: true },
  local: { type: 'text', align: 'left', width: 120, searchable: true },
  total_pago: { type: 'currency', align: 'right', width: 130, sortable: true, filterable: 'range' },
  qtd_requisicoes: { type: 'number', align: 'center', width: 80, sortable: true, filterable: 'range' },
  pix: { type: 'badge', align: 'center', width: 60 },
  status: { type: 'badge', align: 'center', width: 100, sortable: true, filterable: 'select' },
  risco: { type: 'indicator', align: 'center', width: 60, filterable: 'select' },
  action: { type: 'action', align: 'center', width: 60 }
};

export const INFINITE_SCROLL_CONFIG = {
  threshold: 200,
  batchSize: 30,
  maxItems: 500
};

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { constantsLoaded: true } }; }

export default { MODULE_ID, VERSION, MODULE_VERSION, STORAGE_KEYS, COLUMN_TYPES, INFINITE_SCROLL_CONFIG, info, healthCheck };
