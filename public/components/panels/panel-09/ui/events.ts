// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (9.4.0-LIFECYCLE-CLEANUP)
// ═══════════════════════════════════════════════════════════════
// MODULE: panels-panel-09-ui-events
// PURPOSE: Panel-09 UI Events
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   exportCSV, exportJSON from ./export.js
//
// PROVIDES:
//   bindEvents() — exported function
//   unbindEvents() — exported function
//   updateTabsUI() — exported function
//   bindSummaryCardClicks() — exported function
//   bindTooltips() — exported function
//   MODULE_ID — module constant
//   VERSION — module constant
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (see init function if present)
// EMITS (eventos):
//   (none)
// LISTENS (eventos):
//   'click'
//   'mouseenter'
//   'mouseleave'
// WINDOW ACCESS:
//   (none)
// @changelog v9.4.0-LIFECYCLE-CLEANUP: AbortController cleanup + unbindEvents() (BRF PARTE 3 compliance)
// @changelog v9.3.0-P2-ENTERPRISE: Enterprise P2 compliance
// ═══════════════════════════════════════════════════════════════
'use strict';

import { exportCSV, exportJSON } from './export.js';

export const MODULE_ID = 'panels-panel-09-ui-events';
export const VERSION = '9.3.0-P2-ENTERPRISE';

let _abortController: AbortController | null = null;
let _listenerCount = 0;

function _ensureAbortController() {
  if (!_abortController) {
    _abortController = new AbortController();
  }
  return _abortController.signal;
}

export function bindEvents(container: HTMLElement, state: Record<string, unknown>, handlers: Record<string, () => void>) {
  const signal = _ensureAbortController();
  container.querySelectorAll('[data-tab]').forEach((tab: Element) => {
    const tabEl = tab as HTMLElement;
    tabEl.addEventListener('click', () => {
      state.activeTab = tabEl.dataset.tab;
      handlers.updateTabsUI();
      handlers.renderComparison();
      handlers.renderBarChart();
    }, { signal });
    _listenerCount++;
  });

  const csvBtn = container.querySelector('[data-export="csv"]');
  if (csvBtn) { csvBtn.addEventListener('click', () => exportCSV(state.data as Record<string, unknown>), { signal }); _listenerCount++; }
  const jsonBtn = container.querySelector('[data-export="json"]');
  if (jsonBtn) { jsonBtn.addEventListener('click', () => exportJSON(state.data as Record<string, unknown>), { signal }); _listenerCount++; }
}

export function updateTabsUI(container: HTMLElement, activeTab: string) {
  container.querySelectorAll('[data-tab]').forEach((tab: Element) => {
    const tabEl = tab as HTMLElement;
    if (tabEl.dataset.tab === activeTab) {
      tabEl.style.background = '#6366f1';
      tabEl.style.color = '#fff';
      tabEl.style.border = 'none';
    } else {
      tabEl.style.background = '#16161f';
      tabEl.style.color = '#a0a0b0';
      tabEl.style.border = '1px solid #2a2a3a';
    }
  });
}

export function bindSummaryCardClicks(container: HTMLElement, state: Record<string, unknown>, handlers: Record<string, () => void>) {
  const signal = _ensureAbortController();
  container.querySelectorAll('[data-tab-click]').forEach((card: Element) => {
    const cardEl = card as HTMLElement;
    cardEl.addEventListener('click', () => {
      state.activeTab = cardEl.dataset.tabClick;
      handlers.updateTabsUI();
      handlers.renderSummaryCards();
      handlers.renderComparison();
      handlers.renderBarChart();
    }, { signal });
    _listenerCount++;
  });
}

export function bindTooltips(container: HTMLElement) {
  const signal = _ensureAbortController();
  container.querySelectorAll('[data-tooltip-trigger]').forEach((el: Element) => {
    el.addEventListener('mouseenter', (e: Event) => {
      const tooltip = container.querySelector('[data-tooltip]') as HTMLElement | null;
      if (tooltip) {
        const target = e.target as HTMLElement;
        const me = e as MouseEvent;
        tooltip.innerHTML = `<strong>${target.dataset.date}</strong><br>Total: ${target.dataset.value}<br>Taxa: ${target.dataset.rate}`;
        tooltip.style.left = `${me.pageX + 10}px`;
        tooltip.style.top = `${me.pageY - 40}px`;
        tooltip.classList.add('visible');
      }
    }, { signal });
    _listenerCount++;
    el.addEventListener('mouseleave', () => {
      const tooltip = container.querySelector('[data-tooltip]');
      if (tooltip) tooltip.classList.remove('visible');
    }, { signal });
    _listenerCount++;
  });
}

export function unbindEvents() {
  if (_abortController) {
    _abortController.abort();
    _abortController = null;
    _listenerCount = 0;
  }
}

export function info() { return { moduleId: MODULE_ID, version: VERSION, listenersBound: _listenerCount, hasAbortController: _abortController !== null }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { eventsReady: true, cleanupAvailable: typeof unbindEvents === 'function', listenersTracked: _abortController !== null || _listenerCount === 0 } }; }

export default { bindEvents, unbindEvents, updateTabsUI, bindSummaryCardClicks, bindTooltips };
