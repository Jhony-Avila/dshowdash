// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.2.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-04-ui-template
// PURPOSE: Panel-04 UI - Template
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   ICONS from ../../../_shared/icons.js
//
// PROVIDES:
//   MODULE_ID — module constant
//   VERSION — module constant
//   renderStructure() — exported function
//   updateCountdown() — exported function
//   setAutoRefreshState() — exported function
//   updateFooterStats() — exported function
//   updateLastSync() — exported function
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

import { ICONS } from '../../../_shared/icons.js';

export const MODULE_ID = 'panel-04-ui-template';
export const VERSION = '9.3.0-P2-ENTERPRISE';

export function renderStructure() {
  return `<div class="p04-dashboard" style="display:flex;flex-direction:column;gap:12px;padding:16px;height:100%;"><div class="p04-top-toolbar" style="display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;"><div style="display:flex;align-items:center;gap:8px;"><div class="p04-period-selector" style="display:flex;background:#12121a;border-radius:6px;overflow:hidden;border:1px solid #2a2a3a;"><button data-period="1h" class="p04-period-btn" style="padding:6px 12px;background:transparent;border:none;color:#a0a0b0;font-size:11px;cursor:pointer;transition:all 0.2s;">1h</button><button data-period="6h" class="p04-period-btn" style="padding:6px 12px;background:transparent;border:none;color:#a0a0b0;font-size:11px;cursor:pointer;transition:all 0.2s;">6h</button><button data-period="12h" class="p04-period-btn" style="padding:6px 12px;background:transparent;border:none;color:#a0a0b0;font-size:11px;cursor:pointer;transition:all 0.2s;">12h</button><button data-period="24h" class="p04-period-btn p04-period-active" style="padding:6px 12px;background:#6366f1;border:none;color:#fff;font-size:11px;cursor:pointer;transition:all 0.2s;">24h</button></div><div class="p04-view-selector" style="display:flex;background:#12121a;border-radius:6px;overflow:hidden;border:1px solid #2a2a3a;"><button data-view="table" class="p04-view-btn p04-view-active" style="padding:6px 12px;background:#6366f1;border:none;color:#fff;font-size:11px;cursor:pointer;display:flex;align-items:center;gap:4px;" title="Visualizacao em Tabela"><span class="p04-icon">${ICONS.table}</span></button><button data-view="grouped" class="p04-view-btn" style="padding:6px 12px;background:transparent;border:none;color:#a0a0b0;font-size:11px;cursor:pointer;display:flex;align-items:center;gap:4px;" title="Agrupar por Job"><span class="p04-icon">${ICONS.folder}</span></button></div></div><div style="display:flex;align-items:center;gap:8px;"><div class="p04-auto-refresh" style="display:flex;align-items:center;gap:6px;padding:4px 10px;background:#12121a;border:1px solid #2a2a3a;border-radius:6px;" title="Auto-refresh"><button data-action="toggle-auto-refresh" class="p04-auto-toggle active" style="width:32px;height:18px;background:#22c55e;border:none;border-radius:9px;cursor:pointer;position:relative;transition:background 0.2s;" aria-label="Toggle auto-refresh"><span style="position:absolute;top:2px;left:16px;width:14px;height:14px;background:#fff;border-radius:50%;transition:left 0.2s;"></span></button><span data-countdown class="p04-countdown active" style="font-size:12px;font-weight:600;color:#22c55e;min-width:24px;text-align:center;">60</span><span style="font-size:10px;color:#606070;">s</span></div><button data-sound-toggle class="p04-btn-icon" style="padding:6px 10px;background:#12121a;border:1px solid #2a2a3a;border-radius:6px;color:#606070;font-size:14px;cursor:pointer;display:flex;align-items:center;" title="Ativar som para alertas criticos"><span class="p04-icon">${ICONS.volumeOff}</span></button><button data-export="csv" class="p04-btn" style="padding:6px 12px;background:#12121a;border:1px solid #2a2a3a;border-radius:6px;color:#a0a0b0;font-size:11px;cursor:pointer;display:flex;align-items:center;gap:4px;"><span class="p04-icon">${ICONS.download}</span> CSV</button><button data-export="json" class="p04-btn" style="padding:6px 12px;background:#12121a;border:1px solid #2a2a3a;border-radius:6px;color:#a0a0b0;font-size:11px;cursor:pointer;display:flex;align-items:center;gap:4px;"><span class="p04-icon">${ICONS.download}</span> JSON</button><button data-refresh class="p04-btn" style="padding:6px 12px;background:#22c55e;border:none;border-radius:6px;color:#fff;font-size:11px;cursor:pointer;font-weight:500;display:flex;align-items:center;gap:4px;"><span class="p04-icon" style="color:#fff;">${ICONS.refresh}</span> Atualizar</button></div></div><div class="p04-cards" style="display:grid;grid-template-columns:repeat(6,1fr);gap:10px;"><div class="p04-card p04-card-total" data-filter-btn="all" style="display:flex;flex-direction:column;padding:12px;background:#16161f;border:1px solid #2a2a3a;border-radius:8px;cursor:pointer;transition:all 0.2s;position:relative;"><span style="font-size:10px;color:#606070;text-transform:uppercase;">TOTAL</span><span data-total style="font-size:24px;font-weight:700;color:#f0f0f5;">--</span><div data-sparkline-total style="height:20px;margin-top:4px;"></div><span data-recent style="font-size:9px;color:#6366f1;position:absolute;top:8px;right:8px;"></span></div><div class="p04-card p04-card-critical" data-filter-btn="alert-critical" style="display:flex;flex-direction:column;padding:12px;background:#16161f;border:1px solid #2a2a3a;border-left:3px solid #dc2626;border-radius:8px;cursor:pointer;transition:all 0.2s;"><span style="font-size:10px;color:#606070;text-transform:uppercase;display:flex;align-items:center;gap:4px;"><span class="p04-severity-icon">${ICONS.severityCritical}</span> CRITICO</span><span data-critical style="font-size:24px;font-weight:700;color:#dc2626;">--</span><div data-sparkline-critical style="height:20px;margin-top:4px;"></div></div><div class="p04-card" data-filter-btn="alert-high" style="display:flex;flex-direction:column;padding:12px;background:#16161f;border:1px solid #2a2a3a;border-left:3px solid #ef4444;border-radius:8px;cursor:pointer;transition:all 0.2s;"><span style="font-size:10px;color:#606070;text-transform:uppercase;display:flex;align-items:center;gap:4px;"><span class="p04-severity-icon">${ICONS.severityHigh}</span> ALTO</span><span data-high style="font-size:24px;font-weight:700;color:#ef4444;">--</span><div data-sparkline-high style="height:20px;margin-top:4px;"></div></div><div class="p04-card" data-filter-btn="alert-medium" style="display:flex;flex-direction:column;padding:12px;background:#16161f;border:1px solid #2a2a3a;border-left:3px solid #f59e0b;border-radius:8px;cursor:pointer;transition:all 0.2s;"><span style="font-size:10px;color:#606070;text-transform:uppercase;display:flex;align-items:center;gap:4px;"><span class="p04-severity-icon">${ICONS.severityMedium}</span> MEDIO</span><span data-medium style="font-size:24px;font-weight:700;color:#f59e0b;">--</span><div data-sparkline-medium style="height:20px;margin-top:4px;"></div></div><div class="p04-card" data-filter-btn="alert-low" style="display:flex;flex-direction:column;padding:12px;background:#16161f;border:1px solid #2a2a3a;border-left:3px solid #22c55e;border-radius:8px;cursor:pointer;transition:all 0.2s;"><span style="font-size:10px;color:#606070;text-transform:uppercase;display:flex;align-items:center;gap:4px;"><span class="p04-severity-icon">${ICONS.severityLow}</span> BAIXO</span><span data-low style="font-size:24px;font-weight:700;color:#22c55e;">--</span><div data-sparkline-low style="height:20px;margin-top:4px;"></div></div><div class="p04-card" style="display:flex;flex-direction:column;padding:12px;background:#16161f;border:1px solid #2a2a3a;border-radius:8px;"><span style="font-size:10px;color:#606070;text-transform:uppercase;">JOBS</span><span data-unique-jobs style="font-size:24px;font-weight:700;color:#a78bfa;">--</span></div></div><div style="display:grid;grid-template-columns:2fr 1fr;gap:12px;"><div style="background:#16161f;border:1px solid #2a2a3a;border-radius:8px;padding:14px;"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;"><span style="font-size:12px;font-weight:600;color:#f0f0f5;display:flex;align-items:center;gap:6px;"><span class="p04-icon" style="color:#6366f1;">${ICONS.trendingUp}</span> Timeline de Alertas</span><span data-timeline-period style="font-size:10px;color:#606070;">24h</span></div><div data-timeline style="height:80px;position:relative;"></div></div><div style="background:#16161f;border:1px solid #2a2a3a;border-radius:8px;padding:14px;"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;"><span style="font-size:12px;font-weight:600;color:#f0f0f5;display:flex;align-items:center;gap:6px;"><span class="p04-icon" style="color:#f59e0b;">${ICONS.trophy}</span> Top Jobs Problematicos</span><span style="font-size:10px;color:#606070;">7 dias</span></div><div data-top-jobs style="display:flex;flex-direction:column;gap:4px;max-height:80px;overflow-y:auto;"></div></div></div><div class="p04-toolbar" style="display:flex;align-items:center;gap:12px;"><div style="flex:1;position:relative;"><span style="position:absolute;left:10px;top:50%;transform:translateY(-50%);color:#606070;">${ICONS.search}</span><input type="text" data-filter placeholder="Filtrar por job ou mensagem..." style="width:100%;padding:8px 12px 8px 32px;background:#12121a;border:1px solid #2a2a3a;border-radius:6px;color:#f0f0f5;font-size:12px;outline:none;"></div><div data-active-filter style="font-size:11px;color:#6366f1;"></div><span data-count style="font-size:11px;color:#606070;">0 registros</span><button data-clear-filter style="padding:5px 10px;background:#2a2a3a;border:none;border-radius:4px;color:#a0a0b0;font-size:10px;cursor:pointer;display:none;">X Limpar</button></div><div data-content-area style="flex:1;overflow:hidden;"><div data-table-view class="p04-table-wrap" style="background:#16161f;border:1px solid #2a2a3a;border-radius:8px;overflow:hidden;height:100%;"><table class="p04-table" style="width:100%;border-collapse:collapse;"><thead><tr style="background:#12121a;position:sticky;top:0;z-index:1;"><th data-sort="type" style="padding:10px 14px;text-align:left;font-size:10px;color:#606070;text-transform:uppercase;cursor:pointer;user-select:none;width:90px;">Tipo</th><th data-sort="job_name" style="padding:10px 14px;text-align:left;font-size:10px;color:#606070;text-transform:uppercase;cursor:pointer;user-select:none;width:180px;">Job</th><th data-sort="message" style="padding:10px 14px;text-align:left;font-size:10px;color:#606070;text-transform:uppercase;cursor:pointer;user-select:none;">Mensagem</th><th data-sort="created_at" style="padding:10px 14px;text-align:left;font-size:10px;color:#606070;text-transform:uppercase;cursor:pointer;user-select:none;width:100px;">Data</th></tr></thead><tbody data-tbody style="max-height:280px;overflow-y:auto;"></tbody></table></div><div data-grouped-view style="display:none;"></div></div><div data-pagination style="display:flex;align-items:center;justify-content:center;gap:8px;padding:8px 0;"></div><footer class="p04-footer" style="display:flex;align-items:center;justify-content:space-between;padding:8px 12px;background:#12121a;border:1px solid #2a2a3a;border-radius:6px;font-size:11px;"><div class="p04-footer-left" style="display:flex;align-items:center;gap:16px;"><span class="p04-footer-stat" data-stat="total" style="display:flex;align-items:center;gap:4px;color:#a0a0b0;"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="12" height="12"><rect x="3" y="3" width="18" height="18" rx="2"/></svg>Total: <strong style="color:#f0f0f5;">--</strong></span><span class="p04-footer-stat" data-stat="critical" style="display:flex;align-items:center;gap:4px;color:#a0a0b0;"><svg viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2" width="12" height="12"><circle cx="12" cy="12" r="10"/><path d="M15 9l-6 6M9 9l6 6"/></svg>Críticos: <strong style="color:#dc2626;">--</strong></span><span class="p04-footer-stat" data-stat="jobs" style="display:flex;align-items:center;gap:4px;color:#a0a0b0;"><svg viewBox="0 0 24 24" fill="none" stroke="#a78bfa" stroke-width="2" width="12" height="12"><path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/></svg>Jobs: <strong style="color:#a78bfa;">--</strong></span></div><div class="p04-footer-right" style="display:flex;align-items:center;gap:12px;color:#606070;"><span data-refresh-interval>Auto-refresh: 60s</span><span data-last-sync>Sync: --:--:--</span></div></footer></div>`;
}

export function updateCountdown(container: HTMLElement, seconds: number) {
  if (!container) return;
  const el = container.querySelector('[data-countdown]');
  if (el) el.textContent = String(seconds);
}

export function setAutoRefreshState(container: HTMLElement, active: boolean) {
  if (!container) return;
  const toggle = container.querySelector('[data-action="toggle-auto-refresh"]') as HTMLElement | null;
  const countdown = container.querySelector('[data-countdown]') as HTMLElement | null;
  if (toggle) {
    toggle.classList.toggle('active', active);
    toggle.style.background = active ? '#22c55e' : '#2a2a3a';
    const knob = toggle.querySelector('span') as HTMLElement | null;
    if (knob) knob.style.left = active ? '16px' : '2px';
  }
  if (countdown) {
    countdown.classList.toggle('active', active);
    countdown.style.color = active ? '#22c55e' : '#606070';
  }
  const refreshInfo = container.querySelector('[data-refresh-interval]');
  if (refreshInfo) refreshInfo.textContent = active ? 'Auto-refresh: 60s' : 'Auto-refresh: pausado';
}

export function updateFooterStats(container: HTMLElement, stats: Record<string, unknown>) {
  if (!container || !stats) return;
  const total = container.querySelector('[data-stat="total"] strong');
  const critical = container.querySelector('[data-stat="critical"] strong');
  const jobs = container.querySelector('[data-stat="jobs"] strong');
  if (total) total.textContent = stats.total != null ? String(stats.total) : '--';
  if (critical) critical.textContent = stats.critical != null ? String(stats.critical) : '--';
  if (jobs) jobs.textContent = stats.unique_jobs != null ? String(stats.unique_jobs) : '--';
}

export function updateLastSync(container: HTMLElement, timestamp: number) {
  if (!container) return;
  const el = container.querySelector('[data-last-sync]');
  if (!el || !timestamp) return;
  const time = new Date(timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  el.textContent = `Sync: ${time}`;
}

export function info() { return { moduleId: MODULE_ID, version: VERSION }; }
export function healthCheck() { return { status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { renderStructureReady: typeof renderStructure === 'function', updateCountdownReady: typeof updateCountdown === 'function' } }; }

export default { renderStructure, updateCountdown, setAutoRefreshState, updateFooterStats, updateLastSync, info, healthCheck };
