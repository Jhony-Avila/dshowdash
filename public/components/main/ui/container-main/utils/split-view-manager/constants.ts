// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-main:split-view-manager
// PURPOSE: Split View Manager - Constants
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   SPLIT_ORIENTATIONS — exported value
//   SPLIT_POSITIONS — exported value
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
export const MODULE_ID = 'container-main:split-view-manager';

export const SPLIT_ORIENTATIONS = Object.freeze({
  HORIZONTAL: 'horizontal',
  VERTICAL: 'vertical'
});

export const SPLIT_POSITIONS = Object.freeze({
  PRIMARY: 'primary',
  SECONDARY: 'secondary'
});

export const DEFAULT_CONFIG = Object.freeze({
  orientation: SPLIT_ORIENTATIONS.HORIZONTAL,
  ratio: 0.5,
  minSize: 200,
  maxSize: null,
  resizable: true,
  collapsible: true,
  persistState: true,
  animationDuration: 200,
  gutter: 8
});

export const STORAGE_KEY = 'dsd:container-main:split-view';
