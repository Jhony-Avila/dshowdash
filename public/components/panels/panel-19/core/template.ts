// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-P17WI-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-19/core/template
// PURPOSE: Panel-19 - HTML Template Gráfico Taxa de Sucesso
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
export const MODULE_ID = 'panel-19/core/template';

export function renderStructure(container: HTMLElement) {
  container.innerHTML = `
    <div class="p19-wrapper" role="region" aria-label="Gráfico Taxa de Sucesso">
      <header class="p19-header">
        <div class="p19-identity">
          <div class="p19-identity-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg></div>
          <h2 class="p19-title">Gráfico Taxa de Sucesso</h2>
        </div>
        <div class="p19-actions">
          <div class="p19-auto-refresh"><button class="p19-auto-toggle active" data-action="toggle-auto-refresh" type="button"></button><span class="p19-countdown active" data-countdown>60</span></div>
          <div class="p19-actions-cluster"><button class="p19-action-btn p19-action-btn--refresh" data-action="refresh" type="button"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15"/></svg></button></div>
          <span class="p19-timestamp" data-last-update><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg><span>--:--:--</span></span>
        </div>
      </header>
      <main id="${PAINEL_ID}-content" class="p19-content" aria-busy="true"></main>
      <footer class="p19-footer"><div class="p19-footer-left"><span class="p19-footer-info">Gráfico Taxa de Sucesso (30 dias)</span></div><div class="p19-footer-right"><span class="p19-footer-info" data-refresh-interval>Auto-refresh: 1min</span></div></footer>
    </div>
  `;
}

export function updateRefreshBtn(container: HTMLElement, text: string, loading: boolean) { const btn = container?.querySelector('[data-action="refresh"]'); if (!btn) return; if (loading) { btn.classList.add('p19-action-btn--loading'); btn.setAttribute('disabled', 'true'); } else { btn.classList.remove('p19-action-btn--loading'); btn.removeAttribute('disabled'); } }
export function updateTimestamp(container: HTMLElement, timestamp: number) { const el = container?.querySelector('[data-last-update] span'); if (!el || !timestamp) return; el.textContent = new Date(timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' }); }
export function updateCountdown(container: HTMLElement, seconds: number) { const el = container?.querySelector('[data-countdown]'); if (el) el.textContent = String(seconds); }
export function setAutoRefreshState(container: HTMLElement, active: boolean) { const toggle = container?.querySelector('[data-action="toggle-auto-refresh"]'); const countdown = container?.querySelector('[data-countdown]'); if (toggle) toggle.classList.toggle('active', active); if (countdown) countdown.classList.toggle('active', active); }
export function updateStatusBadges(container: HTMLElement, stats: Record<string, unknown>) {}
export function updateFooterStats(container: HTMLElement, stats: Record<string, unknown>) {}
export function updateFilterCount(container: HTMLElement, visible: number, total: number) {}
export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION }; }

export default { renderStructure, updateRefreshBtn, updateTimestamp, updateCountdown, setAutoRefreshState, updateStatusBadges, updateFooterStats, updateFilterCount, info, healthCheck };
