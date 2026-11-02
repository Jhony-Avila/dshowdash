// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.1.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: core.kernel.ui.kernel-governance-panel.data
// PURPOSE: Data Fetching & CSS injection
// ───────────────────────────────────────────────────────────────
// IMPORTS: MODULE_ID from ./constants.js, state/getGovernance from ./state.js
// PROVIDES: fetchData(), injectCSS()
// @changelog v2.1.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT
// ═══════════════════════════════════════════════════════════════
'use strict';

import { MODULE_ID } from './constants.js';
import { state, getGovernance } from './state.js';

export const VERSION = '2.2.0-P2-ENTERPRISE';

declare const Logger: Record<string, Function>;

let _cssInjected = false;

export function injectCSS() {
  if (_cssInjected) return;

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = '/core/kernel/ui/kernel-governance-panel.css';
  document.head.appendChild(link);

  _cssInjected = true;
}

export function fetchData() {
  const data: {
    timestamp: number;
    context: unknown;
    manifest: unknown;
    health: unknown;
    telemetry: unknown;
    definitions: unknown;
  } = {
    timestamp: Date.now(),
    context: null,
    manifest: null,
    health: null,
    telemetry: null,
    definitions: null
  };

  const Governance = getGovernance() as any;

  if (!Governance) {
    if (typeof Logger !== 'undefined') Logger.warn(`[${MODULE_ID}] Governance not available yet`); else console.warn(`[${MODULE_ID}] Governance not available yet`);
    state.data = data;
    state.lastUpdate = Date.now();
    return data;
  }

  try {
    if (Governance.getSnapshot) {
      data.context = Governance.getSnapshot() || {};
    }

    if (Governance.info) {
      const info = Governance.info();
      data.manifest = info.manifest || {};
      data.definitions = info.definitions || {};
      data.telemetry = info.telemetry || {};
    }

    if (Governance.getHealth) {
      data.health = Governance.getHealth() || {};
    }
  } catch (e: any) {
    if (typeof Logger !== 'undefined') Logger.warn(`[${MODULE_ID}] Error fetching data: ${e.message || e}`); else console.warn(`[${MODULE_ID}] Error fetching data:`, e);
  }

  state.data = data;
  state.lastUpdate = Date.now();

  return data;
}
