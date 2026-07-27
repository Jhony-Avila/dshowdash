// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-main:panel-tabs
// PURPOSE: Panel Tabs Manager - Constants
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   TAB_STATES — exported value
//   TAB_POSITIONS — exported value
//   CLOSE_BEHAVIORS — exported value
//   DEFAULT_CONFIG — exported value
//   STORAGE_KEY — exported value
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

export const VERSION = '1.0.0';
export const MODULE_ID = 'container-main:panel-tabs';

export const TAB_STATES = Object.freeze({
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  LOADING: 'loading',
  ERROR: 'error'
});

export const TAB_POSITIONS = Object.freeze({
  TOP: 'top',
  BOTTOM: 'bottom'
});

export const CLOSE_BEHAVIORS = Object.freeze({
  ACTIVATE_PREVIOUS: 'activate-previous',
  ACTIVATE_NEXT: 'activate-next',
  ACTIVATE_FIRST: 'activate-first'
});

export const DEFAULT_CONFIG = Object.freeze({
  maxTabs: 20,
  position: TAB_POSITIONS.TOP,
  closeBehavior: CLOSE_BEHAVIORS.ACTIVATE_PREVIOUS,
  showCloseButton: true,
  showTabIcons: true,
  allowReorder: true,
  allowDuplicates: false,
  confirmClose: false,
  persistTabs: true,
  animationDuration: 150,
  tabMinWidth: 100,
  tabMaxWidth: 200,
  newTabTitle: 'Nova Aba',
  newTabIcon: '📄'
});

export const STORAGE_KEY = 'dsd:container-main:panel-tabs';
