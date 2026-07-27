// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.1.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-01:render:kpis
// PURPOSE: Panel-01 - KPIs Renderer
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   formatCurrency, formatNumber from ../utils/formatters.js
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   renderKPIs() — exported function
//   info() — exported function
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

import { formatCurrency, formatNumber } from '../utils/formatters.js';

export const VERSION = '9.3.0-P2-ENTERPRISE';
export const MODULE_ID = 'panel-01:render:kpis';

const ICONS = {
  'file-text': '<path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/><path d="M16 13H8M16 17H8M10 9H8"/>',
  'dollar-sign': '<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/>',
  'clock': '<circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>',
  'credit-card': '<rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/>',
  'check-circle': '<path d="M22 11.08V12a10 10 0 11-5.93-9.14"/><path d="M22 4L12 14.01l-3-3"/>',
  'trending-up': '<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>'
};

export function renderKPIs(kpisEl: HTMLElement | null | undefined, kpis: Record<string, unknown> | null | undefined, animations: Record<string, (...a: unknown[]) => void> | null | undefined) {
  if (!kpisEl || !kpis) return;

  const cards = [
    { id: 'total', label: 'Total Requisicoes', value: formatNumber(kpis.total || 0), icon: 'file-text', color: '#7C3AED' },
    { id: 'valor', label: 'Valor Total', value: formatCurrency(kpis.valorTotal || 0), icon: 'dollar-sign', color: '#22C55E' },
    { id: 'pendente', label: 'Pendente Lancamento', value: formatNumber(kpis.pendenteLancamento ? (kpis.pendenteLancamento as Record<string, unknown>).qtd : 0), subvalue: formatCurrency(kpis.pendenteLancamento ? (kpis.pendenteLancamento as Record<string, unknown>).valor : 0), icon: 'clock', color: '#EAB308' },
    { id: 'pagamento', label: 'Pendente Pagamento', value: formatNumber(kpis.pendentePagamento ? (kpis.pendentePagamento as Record<string, unknown>).qtd : 0), subvalue: formatCurrency(kpis.pendentePagamento ? (kpis.pendentePagamento as Record<string, unknown>).valor : 0), icon: 'credit-card', color: '#3B82F6' },
    { id: 'pago', label: 'Pagas', value: formatNumber(kpis.pago ? (kpis.pago as Record<string, unknown>).qtd : 0), subvalue: formatCurrency(kpis.pago ? (kpis.pago as Record<string, unknown>).valor : 0), icon: 'check-circle', color: '#22C55E' },
    { id: 'mes', label: 'Este Mes', value: formatNumber(kpis.esteMes ? (kpis.esteMes as Record<string, unknown>).qtd : 0), subvalue: formatCurrency(kpis.esteMes ? (kpis.esteMes as Record<string, unknown>).valor : 0), trend: kpis.esteMes ? (kpis.esteMes as Record<string, unknown>).variacaoQtd : undefined, icon: 'trending-up', color: '#8B5CF6' }
  ];

  if (animations) kpisEl.style.opacity = '0';

  kpisEl.innerHTML = cards.map(c => {
    const iconPath = (ICONS as Record<string, string>)[c.icon] || ICONS['file-text'];
    const bgColor = hexToRgba(c.color, 0.12);
    
    return `<div class="p01-kpi-card" data-kpi="${c.id}" data-type="${c.id}">
      <div class="p01-kpi-icon" style="background: ${bgColor}; color: ${c.color}">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${iconPath}</svg>
      </div>
      <div class="p01-kpi-content">
        <span class="p01-kpi-label">${c.label}</span>
        <span class="p01-kpi-value">${c.value}</span>
        ${c.subvalue ? `<span class="p01-kpi-subvalue">${c.subvalue}</span>` : ''}
        ${c.trend !== undefined ? `<span class="p01-kpi-trend ${(c.trend as number) >= 0 ? 'positive' : 'negative'}">${(c.trend as number) >= 0 ? '+' : ''}${(c.trend as number).toFixed(1)}%</span>` : ''}
      </div>
    </div>`;
  }).join('');

  if (animations) animations.fadeIn(kpisEl);
}

function hexToRgba(hex: string, alpha: number) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function info() {
  return { moduleId: MODULE_ID, version: VERSION };
}

export default { renderKPIs, info, VERSION, MODULE_ID };
