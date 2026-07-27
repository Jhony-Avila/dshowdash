// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-03/core/template
// PURPOSE: Panel-03 - HTML Template Execuções por Hora
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   PAINEL_ID from ./constants.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   renderStructure() — exported function
//   updateRefreshBtn() — exported function
//   updateTimestamp() — exported function
//   updateCountdown() — exported function
//   setAutoRefreshState() — exported function
//   updateStatusBadges() — exported function
//   updateFooterStats() — exported function
//   updateFilterCount() — exported function
//   info() — exported function
//   healthCheck() — exported function
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

import { PAINEL_ID } from './constants.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-03/core/template';

export function renderStructure(container: HTMLElement) {
  container.innerHTML = `
    <div class="p03-wrapper" role="region" aria-label="Execuções por Hora">
      <header class="p03-header">
        <div class="p03-identity">
          <div class="p03-identity-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg></div>
          <h2 class="p03-title">Execuções por Hora</h2>
        </div>
        <div class="p03-actions">
          <div class="p03-auto-refresh"><button class="p03-auto-toggle active" data-action="toggle-auto-refresh" type="button"></button><span class="p03-countdown active" data-countdown>30</span></div>
          <div class="p03-actions-cluster"><button class="p03-action-btn p03-action-btn--refresh" data-action="refresh" type="button"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg></button></div>
          <span class="p03-timestamp" data-last-update><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg><span>--:--:--</span></span>
        </div>
      </header>
      <main id="${PAINEL_ID}-content" class="p03-content" aria-busy="true"></main>
      <footer class="p03-footer"><div class="p03-footer-left"><span class="p03-footer-info">Execuções por Hora</span></div><div class="p03-footer-right"><span class="p03-footer-info" data-refresh-interval>Auto-refresh: 5min</span></div></footer>
    </div>
  `;
}

export function updateRefreshBtn(container: HTMLElement | null, text: string, loading: boolean) { const btn = container?.querySelector('[data-action="refresh"]'); if (!btn) return; if (loading) { btn.classList.add('p03-action-btn--loading'); btn.setAttribute('disabled', 'true'); } else { btn.classList.remove('p03-action-btn--loading'); btn.removeAttribute('disabled'); } }
export function updateTimestamp(container: HTMLElement | null, timestamp: number) { const el = container?.querySelector('[data-last-update] span'); if (!el || !timestamp) return; el.textContent = new Date(timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }); }
export function updateCountdown(container: HTMLElement | null, seconds: number) { const el = container?.querySelector('[data-countdown]'); if (el) el.textContent = String(seconds); }
export function setAutoRefreshState(container: HTMLElement | null, active: boolean) { const toggle = container?.querySelector('[data-action="toggle-auto-refresh"]'); const countdown = container?.querySelector('[data-countdown]'); if (toggle) toggle.classList.toggle('active', active); if (countdown) countdown.classList.toggle('active', active); }
export function updateStatusBadges(container: HTMLElement | null, stats: Record<string, unknown>) {}
export function updateFooterStats(container: HTMLElement | null, stats: Record<string, unknown>) {}
export function updateFilterCount(container: HTMLElement | null, visible: number, total: number) {}
export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION }; }

export default { renderStructure, updateRefreshBtn, updateTimestamp, updateCountdown, setAutoRefreshState, updateStatusBadges, updateFooterStats, updateFilterCount, info, healthCheck };
