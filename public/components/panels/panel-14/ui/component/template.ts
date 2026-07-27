// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.8.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panels-ui-component-template
// PURPOSE: Panel-14 UI Component - Template
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   renderStructure() — exported function
//   MODULE_ID — module constant
//   VERSION — module constant
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

const SVGS = Object.freeze({
  circle: '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><circle cx="12" cy="12" r="8"/></svg>',
  download: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>',
  x: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
  alertCircle: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>',
  calendar: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>',
  barChart: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>',
  flame: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z"/></svg>',
  target: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/></svg>',
  mapPin: '<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>'
});

export const renderStructure = () => `<div class="p14-dashboard p14-animate" style="display:flex;flex-direction:column;gap:14px;padding:16px;"><div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;"><div style="display:flex;align-items:center;gap:8px;"><span style="font-size:14px;color:#ef4444;">${SVGS.circle}</span><span style="font-size:12px;color:#a0a0b0;">Últimos 7 dias</span><span data-period style="font-size:11px;color:#606070;"></span></div><div style="display:flex;gap:6px;"><button data-export="csv" style="padding:5px 10px;background:#16161f;border:1px solid #2a2a3a;border-radius:5px;color:#a0a0b0;font-size:10px;cursor:pointer;display:flex;align-items:center;gap:4px;">${SVGS.download} CSV</button></div></div><div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;"><div class="p14-card" style="background:linear-gradient(135deg,#2d1a1a,#1a1a24);border:1px solid #3a2a2a;border-radius:8px;padding:14px;transition:all 0.2s;"><div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;"><span style="font-size:16px;color:#ef4444;">${SVGS.x}</span><span style="font-size:10px;color:#606070;text-transform:uppercase;">Total Erros</span></div><div data-total-errors style="font-size:28px;font-weight:700;color:#ef4444;">--</div><div data-avg-day style="font-size:10px;color:#606070;margin-top:4px;"></div></div><div class="p14-card" style="background:#16161f;border:1px solid #2a2a3a;border-left:3px solid #ef4444;border-radius:8px;padding:14px;transition:all 0.2s;"><div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;"><span style="font-size:16px;color:#ef4444;">${SVGS.circle}</span><span style="font-size:10px;color:#606070;text-transform:uppercase;">Críticos</span></div><div data-critical-count style="font-size:24px;font-weight:700;color:#ef4444;">--</div></div><div class="p14-card" style="background:#16161f;border:1px solid #2a2a3a;border-left:3px solid #f59e0b;border-radius:8px;padding:14px;transition:all 0.2s;"><div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;"><span style="font-size:16px;color:#f59e0b;">${SVGS.alertCircle}</span><span style="font-size:10px;color:#606070;text-transform:uppercase;">Altos</span></div><div data-high-count style="font-size:24px;font-weight:700;color:#f59e0b;">--</div></div><div class="p14-card" style="background:#16161f;border:1px solid #2a2a3a;border-left:3px solid #a78bfa;border-radius:8px;padding:14px;transition:all 0.2s;"><div style="display:flex;align-items:center;gap:6px;margin-bottom:8px;"><span style="font-size:16px;color:#a78bfa;">${SVGS.calendar}</span><span style="font-size:10px;color:#606070;text-transform:uppercase;">Dias c/ Erros</span></div><div data-days-with-errors style="font-size:24px;font-weight:700;color:#a78bfa;">--</div></div></div><div class="p14-card" style="background:#16161f;border:1px solid #2a2a3a;border-radius:8px;padding:14px;transition:all 0.2s;"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;"><span style="font-size:12px;font-weight:600;color:#f0f0f5;display:flex;align-items:center;gap:6px;">${SVGS.barChart} Erros por Dia</span></div><div data-daily-chart style="height:80px;"></div></div><div class="p14-card" style="background:#16161f;border:1px solid #2a2a3a;border-radius:8px;padding:14px;transition:all 0.2s;"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:12px;"><span style="font-size:12px;font-weight:600;color:#f0f0f5;display:flex;align-items:center;gap:6px;">${SVGS.flame} Top Erros Mais Frequentes</span><span data-errors-count style="font-size:11px;color:#606070;"></span></div><div data-errors-list style="max-height:300px;overflow-y:auto;"></div><div data-pagination style="display:flex;justify-content:center;gap:8px;margin-top:12px;"></div></div><div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;"><div class="p14-card" style="background:#16161f;border:1px solid #2a2a3a;border-radius:8px;padding:14px;transition:all 0.2s;"><div style="margin-bottom:10px;"><span style="font-size:12px;font-weight:600;color:#f0f0f5;display:flex;align-items:center;gap:6px;">${SVGS.target} Por Severidade</span></div><div style="display:flex;align-items:center;gap:16px;"><div data-severity-donut style="width:100px;height:100px;"></div><div data-severity-legend style="flex:1;"></div></div></div><div class="p14-card" style="background:#16161f;border:1px solid #2a2a3a;border-radius:8px;padding:14px;transition:all 0.2s;"><div style="margin-bottom:10px;"><span style="font-size:12px;font-weight:600;color:#f0f0f5;display:flex;align-items:center;gap:6px;">${SVGS.mapPin} Procedures Ausentes</span></div><div data-top-procedures style="max-height:120px;overflow-y:auto;"></div></div></div></div>`;

export const MODULE_ID = 'panels-ui-component-template';
export const VERSION = '9.3.0-P2-ENTERPRISE';
export const info = () => ({ moduleId: MODULE_ID, version: VERSION });
export const healthCheck = () => ({ status: 'HEALTHY', moduleId: MODULE_ID, version: VERSION, checks: { templateReady: true } });

export default { renderStructure };
