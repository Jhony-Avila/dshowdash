// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.1.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: core.kernel.ui.kernel-governance-panel.events
// PURPOSE: Event Handlers para o painel
// ───────────────────────────────────────────────────────────────
// IMPORTS: state, getGovernance from ./state.js
// PROVIDES: attachEvents(), toggleMinimize(), toggleFeatureFlag(), setApiRef()
// @changelog v2.1.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT
// ═══════════════════════════════════════════════════════════════
'use strict';

import { state, getGovernance } from './state.js';

export const VERSION = '1.1.0-P2-ENTERPRISE';
export const MODULE_ID = 'core.kernel.ui.kernel-governance-panel.events';

let _apiRef: Record<string, (...args: unknown[]) => unknown> | null = null;

export function setApiRef(api: Record<string, (...args: unknown[]) => unknown>) {
  _apiRef = api;
}

export function attachEvents() {
  if (!state.container) return;

  state.container.addEventListener('click', (e: Event) => {
    const target = (e.target as HTMLElement).closest('[data-action]') as HTMLElement | null;
    if (!target) return;

    const action = target.dataset.action;

    if (action === 'close' && _apiRef) {
      _apiRef.hide();
    } else if (action === 'minimize') {
      toggleMinimize();
    } else if (action === 'refresh' && _apiRef) {
      _apiRef.refresh();
    } else if (action === 'export' && _apiRef) {
      _apiRef.exportJSON();
    } else if (action === 'toggle') {
      const featureId = target.dataset.feature;
      const enabled = target.dataset.enabled === 'true';
      const canDisable = target.dataset.canDisable === 'true';

      if (canDisable) {
        // @ts-expect-error strict migration — TS2345
        toggleFeatureFlag(featureId, !enabled);
      }
    }
  });

  state.container.addEventListener('change', (e: Event) => {
    const target = (e.target as HTMLElement).closest('[data-action]') as HTMLElement | null;
    if (!target) return;

    if (target.dataset.action === 'filter') {
      state.filter = (target as HTMLSelectElement).value;
      if (_apiRef && _apiRef.render) {
        _apiRef.render();
      }
    }
  });
}

export function toggleMinimize() {
  state.minimized = !state.minimized;
  if (state.container) {
    state.container.classList.toggle('kgp--minimized', state.minimized);
  }
}

export function toggleFeatureFlag(featureId: string, enabled: boolean) {
  const Governance = getGovernance() as any;
  if (Governance && Governance.setFlag) {
    Governance.setFlag(featureId, enabled, 'override', 'governance-panel');
    if (_apiRef && _apiRef.refresh) {
      _apiRef.refresh();
    }
  }
}
