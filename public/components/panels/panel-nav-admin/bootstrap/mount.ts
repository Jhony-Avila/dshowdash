// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (9.4.0-P18EC-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panels.panel-nav-admin.bootstrap.mount
// PURPOSE: Panel Nav Admin - Bootstrap Mount
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   initLifecycle from ../core/lifecycle.js
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   mount() — exported function
//   unmount() — exported function
//   isMounted() — exported function
//   getRefs() — exported function
//
// @changelog
//   9.4.0-P18EC - Add getRefs() consumed by index.js
//   8.2.0-P17WI-AAA - Previous version
// ═══════════════════════════════════════════════════════════════
'use strict';

export var VERSION = '9.4.0-P18EC-ENTERPRISE';
export var MODULE_ID = 'panels.panel-nav-admin.bootstrap.mount';

import { initLifecycle } from '../core/lifecycle.js';

var _mounted = false;
var _container: HTMLElement | null = null;
var _refs: Record<string, unknown> = {};

function _buildRefs(container: HTMLElement) {
  if (!container) return {};
  return {
    container: container,
    content: container.querySelector('.pna-content') || container.querySelector('[data-content]') || container,
    itemsContainer: container.querySelector('.pna-items') || container.querySelector('[data-items]'),
    itemsList: container.querySelector('.pna-items-list') || container.querySelector('[data-items-list]'),
    sectionsContainer: container.querySelector('.pna-sections') || container.querySelector('[data-sections]'),
    sectionsList: container.querySelector('.pna-sections-list') || container.querySelector('[data-sections-list]'),
    groupsContainer: container.querySelector('.pna-groups') || container.querySelector('[data-groups]'),
    tableBody: container.querySelector('.pna-table tbody') || container.querySelector('[data-table-body]'),
    loadingOverlay: container.querySelector('.pna-loading') || container.querySelector('[data-loading]'),
    loading: container.querySelector('.pna-loading-indicator'),
    errorMessage: container.querySelector('.pna-error') || container.querySelector('[data-error]'),
    error: container.querySelector('.pna-error-message'),
    countdownEl: container.querySelector('.pna-countdown') || container.querySelector('[data-countdown]'),
    countdown: container.querySelector('[data-refresh-countdown]'),
    refreshCountdown: container.querySelector('.pna-refresh-countdown'),
    filterSelect: container.querySelector('.pna-filter select') || container.querySelector('[data-filter-select]'),
    filterDropdown: container.querySelector('.pna-filter-dropdown'),
    filterChips: container.querySelector('.pna-filter-chips') || container.querySelector('[data-filter-chips]'),
    toolbar: container.querySelector('.pna-toolbar') || container.querySelector('[data-toolbar]'),
    tabs: container.querySelector('.pna-tabs') || container.querySelector('[data-tabs]'),
    searchInput: container.querySelector('.pna-search input') || container.querySelector('[data-search]'),
    diagnosticContainer: container.querySelector('.pna-diagnostic') || container.querySelector('[data-diagnostic]')
  };
}

export async function mount(container: HTMLElement, options: Record<string, unknown>) {
  options = options || {};
  if (_mounted) {
    console.warn('[panel-nav-admin] Already mounted');
    return;
  }
  try {
    await initLifecycle(container, options);
    _container = container;
    _refs = _buildRefs(container);
    _mounted = true;
  } catch (error) {
    console.error('[panel-nav-admin] Mount failed:', error);
    throw error;
  }
}

export function unmount() {
  _mounted = false;
  _container = null;

  _refs = {};
}

export function isMounted() {
  return _mounted;
}

// v9.4.0-P18EC: getRefs - Returns DOM references for the panel, consumed by index.js
// @returns {Object} DOM references built from the panel container
export function getRefs() {
  if (_container && (!_refs || !_refs.container)) {
    _refs = _buildRefs(_container);
  }
  return _refs || {};
}

export default { mount, unmount, isMounted, getRefs };
