// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.1.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: core.kernel.ui.kernel-governance-panel.state
// PURPOSE: State Management - estado do painel
// ───────────────────────────────────────────────────────────────
// IMPORTS: DEFAULT_CONFIG from ./constants.js
// PROVIDES: state, config, getGovernance(), resetState()
// @changelog v2.1.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT
// ═══════════════════════════════════════════════════════════════
'use strict';

import { DEFAULT_CONFIG } from './constants.js';

export const VERSION = '1.1.0-P2-ENTERPRISE';
export const MODULE_ID = 'core.kernel.ui.kernel-governance-panel.state';

export const state: {
  visible: boolean;
  minimized: boolean;
  container: HTMLElement | null;
  refreshInterval: ReturnType<typeof setInterval> | null;
  lastUpdate: number | null;
  filter: string;
  data: unknown;
} = {
  visible: false,
  minimized: false,
  container: null,
  refreshInterval: null,
  lastUpdate: null,
  filter: 'all',
  data: null
};

export const config = {
  autoRefresh: DEFAULT_CONFIG.autoRefresh,
  refreshInterval: DEFAULT_CONFIG.refreshInterval,
  position: { bottom: DEFAULT_CONFIG.position.bottom, right: DEFAULT_CONFIG.position.right }
};

export function getGovernance() {
  return window.Governance || (window.Core && window.Core.Governance) || null;
}

export function resetState() {
  state.visible = false;
  state.minimized = false;
  state.container = null;
  state.refreshInterval = null;
  state.lastUpdate = null;
  state.filter = 'all';
  state.data = null;
}
