// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-main:zoom-manager
// PURPOSE: Zoom Manager - Constants
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   ZOOM_PRESETS — exported value
//   ZOOM_ORIGINS — exported value
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
export const MODULE_ID = 'container-main:zoom-manager';

export const ZOOM_PRESETS = Object.freeze({
  FIT: 'fit',
  FILL: 'fill',
  ACTUAL: 'actual',
  CUSTOM: 'custom'
});

export const ZOOM_ORIGINS = Object.freeze({
  CENTER: 'center',
  CURSOR: 'cursor',
  TOP_LEFT: 'top-left'
});

export const DEFAULT_CONFIG = Object.freeze({
  minZoom: 0.25,
  maxZoom: 4.0,
  defaultZoom: 1.0,
  zoomStep: 0.1,
  smoothZoom: true,
  animationDuration: 200,
  enablePinchZoom: true,
  enableScrollZoom: true,
  enableDoubleClickZoom: true,
  scrollZoomModifier: 'ctrl',
  doubleClickZoomAmount: 0.5,
  zoomOrigin: 'cursor',
  persistZoom: true,
  showZoomIndicator: true
});

export const STORAGE_KEY = 'dsd:container-main:zoom';

export default {
  VERSION,
  MODULE_ID,
  ZOOM_PRESETS,
  ZOOM_ORIGINS,
  DEFAULT_CONFIG,
  STORAGE_KEY
};
