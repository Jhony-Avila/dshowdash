// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.1.0-P18EC)
// ═══════════════════════════════════════════════════════════════
// MODULE: table-engine.constants
// PURPOSE: Table Engine - Constants & Tokens
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   TABLE_EVENTS as CENTRAL_TABLE_EVENTS from /core/runtime/events/catalog/table.events.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   DEFAULT_CSS_PREFIX — exported value
//   TABLE_EVENTS — exported value
//   SHORTCUTS — exported value
//   DEFAULTS — exported value
//   COLUMN_TYPES — exported value
//
// RECEIVES (via init/options): (none)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   (none)
// WINDOW ACCESS:
//   (none)
// ═══════════════════════════════════════════════════════════════
'use strict';

import { TABLE_EVENTS as CENTRAL_TABLE_EVENTS } from '/core/runtime/events/catalog/table.events.js';

export const VERSION = '1.1.0-P18EC';
export const MODULE_ID = 'table-engine.constants';

// CSS Prefix padrão (configurável via options)
export const DEFAULT_CSS_PREFIX = 'tbl-';

// Re-export eventos do catálogo central
export const TABLE_EVENTS = CENTRAL_TABLE_EVENTS;

// Atalhos de teclado
export const SHORTCUTS = {
  SELECT_ALL: 'ctrl+a',
  DESELECT: 'escape',
  DELETE: 'delete',
  COPY: 'ctrl+c',
  SEARCH: 'ctrl+f',
  EXPORT: 'ctrl+e',
  REFRESH: 'f5',
  HELP: 'f1',
  UP: 'arrowup',
  DOWN: 'arrowdown',
  EXPAND: 'enter',
  COLLAPSE: 'escape'
};

// Configurações padrão
export const DEFAULTS = {
  pageSize: 25,
  pageSizes: [10, 25, 50, 100],
  density: 'normal',
  densities: ['compact', 'normal', 'comfortable'],
  virtualScroll: true,
  virtualScrollBuffer: 10,
  resizable: true,
  reorderable: true,
  selectable: true,
  expandable: true,
  exportable: true,
  searchable: true,
  sortable: true
};

// Tipos de coluna
export const COLUMN_TYPES = {
  TEXT: 'text',
  NUMBER: 'number',
  CURRENCY: 'currency',
  DATE: 'date',
  DATETIME: 'datetime',
  BOOLEAN: 'boolean',
  STATUS: 'status',
  ACTIONS: 'actions',
  CUSTOM: 'custom'
};

export default { VERSION, MODULE_ID, DEFAULT_CSS_PREFIX, TABLE_EVENTS, SHORTCUTS, DEFAULTS, COLUMN_TYPES };
