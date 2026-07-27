/**
 * @file Debug Panel — Event Handlers
 * @version 2.1.0-P2-ENTERPRISE
 * @module app-shell/devtools/panel/event-handlers
 * 
 * ============================================================================
 * DEPENDENCY CONTRACT
 * ============================================================================
 * @requires ./helpers.js (icon)
 * 
 * @provides attachEventListeners
 * 
 * @browserAPI addEventListener, querySelector, querySelectorAll
 * 
 * @description
 * Centralizes all debug panel event handler attachment.
 * Handles button clicks, tab switching, search, and all panel interactions.
 * 
 * @example
 * import { attachEventListeners } from './event-handlers.js';
 * attachEventListeners(panelElement, state, callbacks);
 * ============================================================================
 */
'use strict';

import { icon } from './helpers.js';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DynObj = any;


export const VERSION = '7.5.0-P2-ENTERPRISE';
export const MODULE_ID = 'app-shell.devtools.panel.event-handlers';

export function attachEventListeners(panel: DynObj, state: DynObj, callbacks: DynObj) {
  if (!panel) return;
  
  // Close button
  const closeBtn = panel.querySelector('#dsd-debug-close');
  if (closeBtn) closeBtn.onclick = callbacks.close;
  
  // Refresh button
  const refreshBtn = panel.querySelector('#dsd-debug-refresh');
  if (refreshBtn) refreshBtn.onclick = callbacks.forceRender;
  
  // Export button
  const exportBtn = panel.querySelector('#dsd-debug-export');
  if (exportBtn) exportBtn.onclick = callbacks.exportDiagnostic;
  
  // Copy button
  const copyBtn = panel.querySelector('#dsd-debug-copy');
  if (copyBtn) copyBtn.onclick = callbacks.copyTabData;
  
  // Compact toggle
  const compactBtn = panel.querySelector('#dsd-debug-compact');
  if (compactBtn) compactBtn.onclick = callbacks.toggleCompact;
  
  // Pin tab
  const pinBtn = panel.querySelector('#dsd-debug-pin');
  if (pinBtn) pinBtn.onclick = callbacks.togglePinTab;
  
  // Theme toggle
  const themeBtn = panel.querySelector('#dsd-debug-theme');
  if (themeBtn) themeBtn.onclick = callbacks.toggleTheme;
  
  // Tab buttons
  const tabBtns = panel.querySelectorAll('.dsd-ui-tab');
  tabBtns.forEach((btn: DynObj) => {
    btn.onclick = () => {
      const tabId = btn.getAttribute('data-tab');
      if (tabId) callbacks.switchTab(tabId);
    };
  });
  
  // Search input
  const searchInput = panel.querySelector('#dsd-debug-search');
  if (searchInput) {
    searchInput.value = state.searchQuery || '';
    searchInput.oninput = (e: DynObj) => {
      callbacks.onSearchInput(e.target.value);
    };
  }
  
  // Collapsible sections
  const sectionTitles = panel.querySelectorAll('.dsd-ui-section__title--collapsible');
  sectionTitles.forEach((title: DynObj) => {
    title.onclick = () => {
      const sectionId = title.getAttribute('data-section');
      if (sectionId) callbacks.toggleSection(sectionId);
    };
  });
  
  // Clear network
  const clearNetworkBtn = panel.querySelector('#dsd-debug-clear-network');
  if (clearNetworkBtn) clearNetworkBtn.onclick = callbacks.clearNetwork;
  
  // Scan IndexedDB
  const scanIdbBtn = panel.querySelector('#dsd-debug-scan-idb');
  if (scanIdbBtn) scanIdbBtn.onclick = callbacks.scanIdb;
  
  // Diff viewer selects
  const diffLeftSelect = panel.querySelector('#dsd-diff-left');
  const diffRightSelect = panel.querySelector('#dsd-diff-right');
  const diffRunBtn = panel.querySelector('#dsd-diff-run');
  
  if (diffRunBtn && diffLeftSelect && diffRightSelect) {
    diffRunBtn.onclick = () => {
      callbacks.runDiff(diffLeftSelect.value, diffRightSelect.value);
    };
  }
  
  // OTel export
  const otelExportBtn = panel.querySelector('#dsd-otel-export');
  if (otelExportBtn && callbacks.otelExport) {
    otelExportBtn.onclick = callbacks.otelExport;
  }
  
  // Manifest validation
  const validateManifestBtn = panel.querySelector('#dsd-validate-manifest');
  if (validateManifestBtn && callbacks.validateManifest) {
    validateManifestBtn.onclick = callbacks.validateManifest;
  }
  
  // Cancel boot
  const cancelBootBtn = panel.querySelector('#dsd-cancel-boot');
  if (cancelBootBtn && callbacks.cancelBoot) {
    cancelBootBtn.onclick = callbacks.cancelBoot;
  }
  
  // Snapshot buttons
  const snapshotBtns = panel.querySelectorAll('[data-snapshot-action]');
  snapshotBtns.forEach((btn: DynObj) => {
    btn.onclick = () => {
      const action = btn.getAttribute('data-snapshot-action');
      const id = btn.getAttribute('data-snapshot-id');
      if (callbacks.snapshotAction) callbacks.snapshotAction(action, id);
    };
  });
  
  // Metrics buttons
  const metricsBtns = panel.querySelectorAll('[data-metrics-action]');
  metricsBtns.forEach((btn: DynObj) => {
    btn.onclick = () => {
      const action = btn.getAttribute('data-metrics-action');
      if (callbacks.metricsAction) callbacks.metricsAction(action);
    };
  });
  
  // Preset buttons
  const presetBtns = panel.querySelectorAll('.dsd-ui-preset-btn');
  presetBtns.forEach((btn: DynObj) => {
    btn.onclick = () => {
      const preset = btn.getAttribute('data-preset');
      if (callbacks.applyPreset) callbacks.applyPreset(preset);
    };
  });
  
  // API metrics buttons
  const apiMetricsBtns = panel.querySelectorAll('[data-api-action]');
  apiMetricsBtns.forEach((btn: DynObj) => {
    btn.onclick = () => {
      const action = btn.getAttribute('data-api-action');
      if (callbacks.apiAction) callbacks.apiAction(action);
    };
  });
  
  // Memory leak buttons
  const memoryBtns = panel.querySelectorAll('[data-memory-action]');
  memoryBtns.forEach((btn: DynObj) => {
    btn.onclick = () => {
      const action = btn.getAttribute('data-memory-action');
      if (callbacks.memoryAction) callbacks.memoryAction(action);
    };
  });
  
  // Docs example buttons
  const docExampleBtns = panel.querySelectorAll('[data-doc-example]');
  docExampleBtns.forEach((btn: DynObj) => {
    btn.onclick = () => {
      const example = btn.getAttribute('data-doc-example');
      if (callbacks.runDocExample) callbacks.runDocExample(example);
    };
  });
}

export default { attachEventListeners };
