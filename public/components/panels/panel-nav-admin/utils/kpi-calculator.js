const MODULE_ID = "panel-nav-admin:kpi-calculator";
const VERSION = "9.3.0-P2-ENTERPRISE";
function calculateKPIs(items, sections) {
  const totalItems = items ? items.length : 0;
  const activeItems = items ? items.filter((i) => i.isActive !== false).length : 0;
  const inactiveItems = totalItems - activeItems;
  const protectedItems = items ? items.filter((i) => i.uarpsTrigger).length : 0;
  const publicItems = totalItems - protectedItems;
  const adminItems = items ? items.filter((i) => i.uarpsTrigger && i.uarpsTrigger.indexOf("admin") !== -1).length : 0;
  const totalSections = sections ? sections.length : 0;
  const dividers = items ? items.filter((i) => i.isDivider).length : 0;
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
function calculateHealthScore(total, active, protected_) {
  if (total === 0) return 100;
  const activeRatio = active / total;
  const protectedRatio = protected_ / total;
  const score = activeRatio * 70 + protectedRatio * 30;
  return Math.round(score);
}
function renderKPIs(kpis) {
  let html = '<div class="pna-kpis">';
  html += renderKpiCard("Total", kpis.totalItems, "grid", "default");
  html += renderKpiCard("Ativos", kpis.activeItems, "check-circle", "success");
  html += renderKpiCard("Protegidos", kpis.protectedItems, "shield", "info");
  html += renderKpiCard("Admin", kpis.adminItems, "lock", "warning");
  html += renderKpiCard("Se\xE7\xF5es", kpis.totalSections, "folder", "default");
  html += "</div>";
  return html;
}
function renderKpiCard(label, value, icon, variant) {
  return `<div class="pna-kpi pna-kpi--${variant}"><div class="pna-kpi__value">${value}</div><div class="pna-kpi__label">${label}</div></div>`;
}
export {
  MODULE_ID,
  VERSION,
  calculateKPIs,
  renderKPIs
};
