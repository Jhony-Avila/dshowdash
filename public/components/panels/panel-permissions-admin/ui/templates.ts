// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.4.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: uarps-admin-templates
// PURPOSE: UARPS Admin - Templates (Orchestrator)
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   Templates — exported value
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

// Módulos especializados
import * as Helpers from './templates-helpers.js';
import * as Skeletons from './templates-skeletons.js';
import * as Layout from './templates-layout.js';
import * as Users from './templates-users.js';
import * as Regions from './templates-regions.js';
import * as Stats from './templates-stats.js';
import * as Compare from './templates-compare.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'uarps-admin-templates';

// === RE-EXPORTS HELPERS ===
export const { getInitials, getLevelClass, groupByArea, formatArea, formatTimeAgo, calculatePercentage } = Helpers;

// === RE-EXPORTS SKELETONS ===
export const { skeletonUserGrid, skeletonUserFocus, skeletonMatrix } = Skeletons;

// === RE-EXPORTS LAYOUT ===
export const { layout } = Layout;

// === RE-EXPORTS USERS ===
export const { userCard, userFocus, userFocusEmpty } = Users;

// === RE-EXPORTS REGIONS ===
export const { regionMatrix, matrixEmpty } = Regions;

// === RE-EXPORTS STATS ===
export const { stats, statsExpanded, activityTimeline, coverageBar, lastEditBadge, modalPreview } = Stats;

// === RE-EXPORTS COMPARE ===
export const { compareLegend, compareUsers, compareStats, triggerMatrixCompare, keyboardNavHint } = Compare;

// === BACKWARD COMPATIBILITY OBJECT ===
export const Templates = {
  // Layout
  layout,
  // Skeletons
  skeletonUserGrid, skeletonUserFocus, skeletonMatrix,
  // Users
  userCard, userFocus, userFocusEmpty,
  // Regions
  regionMatrix, matrixEmpty,
  // Stats
  stats, statsExpanded, activityTimeline, coverageBar, lastEditBadge, modalPreview,
  // Compare
  compareLegend, compareUsers, compareStats, triggerMatrixCompare, keyboardNavHint,
  // Meta
  VERSION, MODULE_ID
};

export default Templates;
