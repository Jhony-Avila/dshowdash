// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (8.8.0-ENTERPRISE-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-nav-admin:kpi-calculator
// PURPOSE: Panel Nav Admin - KPI Calculator
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   calculateKPIs() — exported function
//   renderKPIs() — exported function
//   VERSION — module constant
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

export const MODULE_ID = 'panel-nav-admin:kpi-calculator';
const VERSION = '9.3.0-P2-ENTERPRISE';

// P3.4: Calcular KPIs baseado em UARPS triggers
export function calculateKPIs(items: Record<string, unknown>[], sections: Record<string, unknown>[]) {
  const totalItems = items ? items.length : 0;
  const activeItems = items ? items.filter((i: Record<string, unknown>) => i.isActive !== false).length : 0;
  const inactiveItems = totalItems - activeItems;
  
  // P3.4: Contar itens protegidos por UARPS (substitui contagem por minLevel)
  const protectedItems = items ? items.filter((i: Record<string, unknown>) => i.uarpsTrigger).length : 0;
  const publicItems = totalItems - protectedItems;
  
  // P3.4: Contar itens admin (trigger contém 'admin')
  const adminItems = items ? items.filter((i: Record<string, unknown>) => i.uarpsTrigger && (i.uarpsTrigger as string).indexOf('admin') !== -1).length : 0;
  
  const totalSections = sections ? sections.length : 0;
  const dividers = items ? items.filter((i: Record<string, unknown>) => i.isDivider).length : 0;
  
  return {
    totalItems,
    activeItems,
    inactiveItems,
    protectedItems,
    publicItems,
    adminItems,
    totalSections,
    dividers,
    healthScore: calculateHealthScore(totalItems, activeItems, protectedItems)
  };
}

// P3.4: Calcular score de saúde
function calculateHealthScore(total: number, active: number, protected_: number) {
  if (total === 0) return 100;
  
  const activeRatio = active / total;
  const protectedRatio = protected_ / total;
  
  // Score baseado em: itens ativos (70%) + itens protegidos (30%)
  const score = (activeRatio * 70) + (protectedRatio * 30);
  
  return Math.round(score);
}

// P3.4: Renderizar KPIs em HTML
export function renderKPIs(kpis: Record<string, unknown>) {
  let html = '<div class="pna-kpis">';
  
  html += renderKpiCard('Total', kpis.totalItems, 'grid', 'default');
  html += renderKpiCard('Ativos', kpis.activeItems, 'check-circle', 'success');
  html += renderKpiCard('Protegidos', kpis.protectedItems, 'shield', 'info');
  html += renderKpiCard('Admin', kpis.adminItems, 'lock', 'warning');
  html += renderKpiCard('Seções', kpis.totalSections, 'folder', 'default');
  
  html += '</div>';
  
  return html;
}

// Helper: Renderizar card de KPI
function renderKpiCard(label: string, value: unknown, icon: string, variant: string) {
  return `<div class="pna-kpi pna-kpi--${variant}"><div class="pna-kpi__value">${value}</div><div class="pna-kpi__label">${label}</div></div>`;
}

// Exports
export { VERSION };
