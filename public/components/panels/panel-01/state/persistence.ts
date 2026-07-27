// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-01:state:persistence
// PURPOSE: Panel-01 - State Persistence
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   CONFIG from ../core/config.js
//   store from ./store.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   saveState() — exported function
//   restoreState() — exported function
//   info() — exported function
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

import { CONFIG } from '../core/config.js';
import { store } from './store.js';
import * as Storage from '../utils/storage.js';
import * as UrlState from '../utils/url-state.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-01:state:persistence';

export function saveState() {
  const state = store.getState();
  Storage.setFilters(state.filters);
  Storage.setSort(state.sort);
  if (CONFIG.features.urlState) {

    UrlState.setState({
      ...state.filters,
      page: state.pagination.page,
      sort: state.sort.field,
      order: state.sort.order
    });
  }
}

export function restoreState() {
  if (CONFIG.features.urlState) {
    const urlState = UrlState.getState();
    if (Object.keys(urlState).length > 0) {
      if (urlState.page) store.setPage(urlState.page);
      if (urlState.sortField) store.setSort(urlState.sortField, urlState.sortOrder || 'DESC');
      ['situacao', 'centro', 'q', 'dataInicio', 'dataFim'].forEach(key => {
        if (urlState[key]) store.setFilter(key, urlState[key]);
      });
      return;
    }
  }
  if (CONFIG.features.localStorage) {
    const savedFilters = Storage.getFilters();
    const savedSort = Storage.getSort();
    Object.entries(savedFilters).forEach(([k, v]) => store.setFilter(k, v));
    if (savedSort.field) store.setSort(savedSort.field, savedSort.order);
  }
}

export function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}

export default { saveState, restoreState, info, VERSION, MODULE_ID };
