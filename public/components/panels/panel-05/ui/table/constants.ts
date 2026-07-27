// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-05:table
// PURPOSE: Panel-05 Table Constants
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   IconRegistry from /components/icon-registry/index.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   ICONS — exported value
//   SHORTCUTS — exported value
//   TABLE_COLUMNS — exported value
//   DENSITY_MODES — exported value
//   DEFAULT_COLUMN_ORDER — exported value
//   SCROLL_MODES — exported value
//   ROW_HEIGHTS — exported value
//   VIRTUAL_BUFFER — exported value
//   INFINITE_THRESHOLD — exported value
//   SEARCH_DEBOUNCE — exported value
//   DEFAULT_PER_PAGE — exported value
//   DEFAULT_INFINITE_CHUNK — exported value
//   info() — exported function
//   ... and 1 more exports
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
export const MODULE_ID = 'panel-05:table';

// Mapeamento para IconRegistry
const ICON_MAP = {
  chevronDown: 'ui:chevron-down',
  chevronUp: 'ui:chevron-up',
  chevronLeft: 'ui:chevron-left',
  chevronRight: 'ui:chevron-right',
  x: 'ui:x',
  star: 'ui:star',
  eye: 'ui:eye',
  columns: 'table:columns',
  inbox: 'business:mail',
  pin: 'ui:bookmark',
  arrowLeftToLine: 'table:page-first',
  arrowRightToLine: 'table:page-last',
  alignJustify: 'table:density-normal',
  menu: 'ui:menu',
  minimize: 'ui:minus',
  copy: 'ui:copy',
  messageCircle: 'business:message',
  dollarSign: 'business:dollar',
  calendar: 'business:calendar',
  gripVertical: 'table:drag',
  loader: 'system:loader',
  search: 'ui:search',
  download: 'ui:download',
  trash: 'ui:trash',
  fileText: 'business:file-text',
  check: 'ui:check',
  checkSquare: 'ui:check-square',
  edit: 'ui:edit',
  externalLink: 'ui:external-link',
  moreVertical: 'ui:more-vertical',
  keyboard: 'system:help'
};

// Proxy para compatibilidade
/** @type {any} */
export const ICONS: Record<string, any> = new Proxy({}, {
  get(target, prop) {
    const mapped = typeof prop === 'string' ? (ICON_MAP as Record<string, string>)[prop] : undefined;
    return mapped ? (IconRegistry.get(mapped) || '') : '';
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

// KEYBOARD SHORTCUTS
export const SHORTCUTS = {
  'j': { action: 'next-row', desc: 'Próxima linha' },
  'k': { action: 'prev-row', desc: 'Linha anterior' },
  'e': { action: 'expand-row', desc: 'Expandir/Colapsar' },
  'v': { action: 'view-row', desc: 'Ver detalhes' },
  'f': { action: 'toggle-fav', desc: 'Favoritar' },
  'd': { action: 'delete-row', desc: 'Excluir' },
  'x': { action: 'toggle-select', desc: 'Selecionar' },
  'Escape': { action: 'clear', desc: 'Limpar seleção' },
  '?': { action: 'show-help', desc: 'Mostrar atalhos' }
};

// TABLE COLUMNS
export const TABLE_COLUMNS = [
  { id: 'expand', label: '', width: 32, resizable: false, hideable: false, type: 'expand', pinnable: false, reorderable: false, searchable: false },
  { id: 'checkbox', label: '', width: 40, resizable: false, hideable: false, type: 'checkbox', pinnable: false, reorderable: false, searchable: false },
  { id: 'fav', label: '', width: 40, resizable: false, hideable: false, type: 'action', pinnable: false, reorderable: false, searchable: false },
  { id: 'nome', label: 'Cliente', width: 220, resizable: true, hideable: false, sortable: true, type: 'text', pinnable: true, reorderable: true, searchable: true, exportKey: 'nome' },
  { id: 'cidade', label: 'Cidade/UF', width: 140, resizable: true, hideable: true, sortable: true, type: 'text', pinnable: true, reorderable: true, searchable: true, exportKey: 'cidade' },
  { id: 'receita', label: 'Receita', width: 120, resizable: true, hideable: true, sortable: true, type: 'currency', pinnable: true, reorderable: true, searchable: false, exportKey: 'receita' },
  { id: 'status', label: 'Status', width: 100, resizable: true, hideable: true, sortable: true, type: 'badge', pinnable: true, reorderable: true, searchable: true, exportKey: 'status' },
  { id: 'actions', label: 'Ações', width: 60, resizable: false, hideable: false, type: 'action', pinnable: true, reorderable: false, searchable: false }
];

// CONFIG CONSTANTS
export const DENSITY_MODES = ['compact', 'comfortable', 'expanded'];
export const DEFAULT_COLUMN_ORDER = TABLE_COLUMNS.map(c => c.id);
export const SCROLL_MODES = ['pagination', 'virtual', 'infinite'];
export const ROW_HEIGHTS = { compact: 36, comfortable: 48, expanded: 64 };
export const VIRTUAL_BUFFER = 5;
export const INFINITE_THRESHOLD = 200;
export const SEARCH_DEBOUNCE = 250;
export const DEFAULT_PER_PAGE = 25;
export const DEFAULT_INFINITE_CHUNK = 50;

export function info() { 
  return { 
    moduleId: MODULE_ID, 
    version: VERSION,
    iconCount: Object.keys(ICON_MAP).length,
    source: 'IconRegistry'
  }; 
}

export function healthCheck() { 
  return { 
    status: 'HEALTHY', 
    moduleId: MODULE_ID, 
    version: VERSION, 
    checks: { constantsLoaded: true, iconsMapped: Object.keys(ICON_MAP).length } 
  }; 
}
