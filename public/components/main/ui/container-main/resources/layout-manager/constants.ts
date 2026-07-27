// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.0.0-MODULAR-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: container-main:layout-manager
// PURPOSE: Layout Manager Constants
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   LAYOUT_STATES — exported value
//   DOCK_ZONES — exported value
//   SPLIT_MODES — exported value
//   VALID_TRANSITIONS — exported value
//   DEFAULT_CONSTRAINTS — exported value
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

export const VERSION = '1.0.0-MODULAR';
export const MODULE_ID = 'container-main:layout-manager';

// Estados de layout
export const LAYOUT_STATES = Object.freeze({
  NORMAL: 'normal',
  DOCKED: 'docked',
  FLOATING: 'floating',
  MAXIMIZED: 'maximized',
  MINIMIZED: 'minimized',
  FULLSCREEN: 'fullscreen',
  SPLIT_LEFT: 'split-left',
  SPLIT_RIGHT: 'split-right',
  SPLIT_TOP: 'split-top',
  SPLIT_BOTTOM: 'split-bottom'
});

// Zonas de dock
export const DOCK_ZONES = Object.freeze({
  LEFT: 'left',
  RIGHT: 'right',
  TOP: 'top',
  BOTTOM: 'bottom',
  CENTER: 'center'
});

// Modos de split
export const SPLIT_MODES = Object.freeze({
  HORIZONTAL: 'horizontal',
  VERTICAL: 'vertical',
  QUAD: 'quad'
});

// Transições válidas de estado
export const VALID_TRANSITIONS = Object.freeze({
  [LAYOUT_STATES.NORMAL]: [LAYOUT_STATES.DOCKED, LAYOUT_STATES.FLOATING, LAYOUT_STATES.MAXIMIZED, LAYOUT_STATES.MINIMIZED, LAYOUT_STATES.FULLSCREEN, LAYOUT_STATES.SPLIT_LEFT, LAYOUT_STATES.SPLIT_RIGHT, LAYOUT_STATES.SPLIT_TOP, LAYOUT_STATES.SPLIT_BOTTOM],
  [LAYOUT_STATES.DOCKED]: [LAYOUT_STATES.NORMAL, LAYOUT_STATES.FLOATING, LAYOUT_STATES.MAXIMIZED, LAYOUT_STATES.FULLSCREEN],
  [LAYOUT_STATES.FLOATING]: [LAYOUT_STATES.NORMAL, LAYOUT_STATES.DOCKED, LAYOUT_STATES.MAXIMIZED, LAYOUT_STATES.FULLSCREEN],
  [LAYOUT_STATES.MAXIMIZED]: [LAYOUT_STATES.NORMAL, LAYOUT_STATES.FULLSCREEN, LAYOUT_STATES.MINIMIZED],
  [LAYOUT_STATES.MINIMIZED]: [LAYOUT_STATES.NORMAL, LAYOUT_STATES.MAXIMIZED],
  [LAYOUT_STATES.FULLSCREEN]: [LAYOUT_STATES.NORMAL, LAYOUT_STATES.MAXIMIZED],
  [LAYOUT_STATES.SPLIT_LEFT]: [LAYOUT_STATES.NORMAL, LAYOUT_STATES.FULLSCREEN],
  [LAYOUT_STATES.SPLIT_RIGHT]: [LAYOUT_STATES.NORMAL, LAYOUT_STATES.FULLSCREEN],
  [LAYOUT_STATES.SPLIT_TOP]: [LAYOUT_STATES.NORMAL, LAYOUT_STATES.FULLSCREEN],
  [LAYOUT_STATES.SPLIT_BOTTOM]: [LAYOUT_STATES.NORMAL, LAYOUT_STATES.FULLSCREEN]
});

// Constraints padrão
export const DEFAULT_CONSTRAINTS = Object.freeze({
  minWidth: 200,
  minHeight: 100,
  maxWidth: Infinity,
  maxHeight: Infinity,
  aspectRatio: null,
  resizable: true,
  draggable: true,
  dockable: true
});

export default {
  VERSION, MODULE_ID,
  LAYOUT_STATES, DOCK_ZONES, SPLIT_MODES,
  VALID_TRANSITIONS, DEFAULT_CONSTRAINTS
};
