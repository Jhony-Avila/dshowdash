// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-map
// PURPOSE: Skeleton Manager - Panel Mapping
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   SKELETON_TYPES from ../constants.js
//
// PROVIDES:
//   PANEL_TYPE_MAP — exported value
//   getTypeForPanel() — exported function
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

import { SKELETON_TYPES } from '../constants.js';

export const VERSION = '15.2.0-MODULAR';
export const MODULE_ID = 'main.ui.container-main.utils.skeleton-manager.mappings.panel-map';

// ============================================================================
// PANEL TYPE MAP
// ============================================================================

export const PANEL_TYPE_MAP = {
  'panel-home': SKELETON_TYPES.DASHBOARD,
  'panel-dashboard': SKELETON_TYPES.DASHBOARD,
  'panel-analytics': SKELETON_TYPES.CHART,
  'panel-users': SKELETON_TYPES.TABLE,
  'panel-products': SKELETON_TYPES.TABLE,
  'panel-orders': SKELETON_TYPES.TABLE,
  'panel-reports': SKELETON_TYPES.TABLE,
  'panel-settings': SKELETON_TYPES.FORM,
  'panel-profile': SKELETON_TYPES.PROFILE,
  'panel-messages': SKELETON_TYPES.LIST,
  'panel-notifications': SKELETON_TYPES.LIST,
  'panel-media': SKELETON_TYPES.CARDS,
  'panel-gallery': SKELETON_TYPES.CARDS
};

/**
 * Determina tipo de skeleton baseado no painel
 * @param {string} panelId
 * @param {Object} customMap
 * @param {string} defaultType
 * @returns {string}
 */
export function getTypeForPanel(panelId: string, customMap: unknown, defaultType: unknown) {
  customMap = customMap || {};
  defaultType = defaultType || SKELETON_TYPES.GENERIC;
  
  const mergedMap = Object.assign({}, PANEL_TYPE_MAP, customMap);
  
  // Mapeamento direto
  if ((mergedMap as Record<string, unknown>)[panelId]) {
    return (mergedMap as Record<string, unknown>)[panelId];
  }
  
  // Inferência por nome
  const lowerPanelId = panelId.toLowerCase();
  
  if (lowerPanelId.indexOf('dashboard') >= 0 || lowerPanelId.indexOf('home') >= 0) {
    return SKELETON_TYPES.DASHBOARD;
  }
  if ((lowerPanelId.indexOf('table') >= 0) || (lowerPanelId.indexOf('list') >= 0 && lowerPanelId.indexOf('user') >= 0)) {
    return SKELETON_TYPES.TABLE;
  }
  if (lowerPanelId.indexOf('chart') >= 0 || lowerPanelId.indexOf('analytics') >= 0) {
    return SKELETON_TYPES.CHART;
  }
  if (lowerPanelId.indexOf('form') >= 0 || lowerPanelId.indexOf('settings') >= 0 || lowerPanelId.indexOf('edit') >= 0) {
    return SKELETON_TYPES.FORM;
  }
  if (lowerPanelId.indexOf('profile') >= 0 || lowerPanelId.indexOf('account') >= 0) {
    return SKELETON_TYPES.PROFILE;
  }
  if (lowerPanelId.indexOf('message') >= 0 || lowerPanelId.indexOf('notification') >= 0 || lowerPanelId.indexOf('feed') >= 0) {
    return SKELETON_TYPES.LIST;
  }
  if (lowerPanelId.indexOf('media') >= 0 || lowerPanelId.indexOf('gallery') >= 0 || lowerPanelId.indexOf('card') >= 0) {
    return SKELETON_TYPES.CARDS;
  }
  
  return defaultType;
}

export default {
  PANEL_TYPE_MAP,
  getTypeForPanel
};
