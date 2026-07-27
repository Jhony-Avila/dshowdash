// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (5.6.0-UARPS-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: sidebar-items-manifest
// PURPOSE: Sidebar V2 - Items Manifest (fallback estático)
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   SECTIONS — exported value
//   ITEMS — exported value
//   getItemById() — exported function
//   getItemsBySection() — exported function
//   getSectionById() — exported function
//   getSectionIcon() — exported function
//   filterByLevel() — exported function
//   getManifest() — exported function
//   getMetrics() — exported function
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

export const VERSION = '5.6.0-UARPS-ONLY';
export const MODULE_ID = 'sidebar-items-manifest';

let _metrics = { lookups: 0, filters: 0 };

export const SECTIONS = [
  { id: 'main', title: null, icon: 'dashboard', priority: 1, collapsible: false },
  { id: 'operacional', title: null, icon: 'settings', priority: 2, collapsible: false },
  { id: 'admin', title: 'Administração', icon: 'shield', priority: 3, collapsible: true }
];

export const ITEMS = [
  { id: 'principal', sectionId: 'main', title: 'Principal', route: '#/', icon: 'dashboard', priority: 1 },
  { id: 'geral', sectionId: 'main', title: 'Geral', route: '#/geral', icon: 'grid', priority: 2 },
  { id: 'automacoes', sectionId: 'operacional', title: 'Automações', route: '#/automacoes', icon: 'automation', priority: 1 },
  { id: 'bling', sectionId: 'operacional', title: 'Bling', route: '#/bling', icon: 'box', priority: 2 },
  { id: 'clientes', sectionId: 'operacional', title: 'Clientes', route: '#/clientes', icon: 'users', priority: 3 },
  { id: 'colaboradores', sectionId: 'operacional', title: 'Colaboradores', route: '#/colaboradores', icon: 'team', priority: 4 },
  { id: 'comercial', sectionId: 'operacional', title: 'Comercial', route: '#/comercial', icon: 'chart', priority: 5 },
  { id: 'compras', sectionId: 'operacional', title: 'Compras', route: '#/compras', icon: 'cart', priority: 6 },
  { id: 'contratos', sectionId: 'operacional', title: 'Contratos', route: '#/contratos', icon: 'document', priority: 7 },
  { id: 'financeiro', sectionId: 'operacional', title: 'Financeiro', route: '#/financeiro', icon: 'money', priority: 8 },
  { id: 'fornecedores', sectionId: 'operacional', title: 'Fornecedores', route: '#/fornecedores', icon: 'supplier', priority: 9 },
  { id: 'google-ads', sectionId: 'operacional', title: 'Google Ads', route: '#/google-ads', icon: 'ads', priority: 10 },
  { id: 'google-drive', sectionId: 'operacional', title: 'Google Drive', route: '#/google-drive', icon: 'drive', priority: 11 },
  { id: 'importacao', sectionId: 'operacional', title: 'Importação', route: '#/importacao', icon: 'globe', priority: 12 },
  { id: 'instagram', sectionId: 'operacional', title: 'Instagram', route: '#/instagram', icon: 'instagram', priority: 13 },
  { id: 'operacional', sectionId: 'operacional', title: 'Operacional', route: '#/operacional', icon: 'cog', priority: 14 },
  { id: 'orcamento-clientes', sectionId: 'operacional', title: 'Orçamento Clientes', route: '#/orcamento-clientes', icon: 'calculator', priority: 15 },
  { id: 'pipedrive', sectionId: 'operacional', title: 'Pipedrive', route: '#/pipedrive', icon: 'pipeline', priority: 16 },
  { id: 'produtos', sectionId: 'operacional', title: 'Produtos', route: '#/produtos', icon: 'package', priority: 17 },
  { id: 'rh-pessoas', sectionId: 'operacional', title: 'RH Pessoas', route: '#/rh-pessoas', icon: 'people', priority: 18 },
  { id: 'servidores', sectionId: 'operacional', title: 'Servidores', route: '#/servidores', icon: 'server', priority: 19 },
  { id: 'user-management', sectionId: 'admin', title: 'Gestão de Usuários', route: '#/admin/usuarios', icon: 'users-cog', priority: 1 },
  { id: 'permissions-admin', sectionId: 'admin', title: 'Permissões', route: '#/admin/permissoes', icon: 'shield', priority: 2 },
  { id: 'session-admin', sectionId: 'admin', title: 'Sessões', route: '#/admin/sessoes', icon: 'key', priority: 3 },
  { id: 'audit-trail', sectionId: 'admin', title: 'Auditoria', route: '#/admin/auditoria', icon: 'clipboard', priority: 4 },
  { id: 'nav-admin', sectionId: 'admin', title: 'Navegação', route: '#/admin/navegacao', icon: 'nav', priority: 5 },
  { id: 'user-preferences', sectionId: 'admin', title: 'Minhas Preferências', route: '#/preferencias', icon: 'settings', priority: 6 }
];

export function getItemById(id: string) {
  _metrics.lookups++;
  return ITEMS.find(item => item.id === id) || null;
}

export function getItemsBySection(sectionId: string) {
  _metrics.lookups++;
  return ITEMS.filter(item => item.sectionId === sectionId)
    .sort((a, b) => (a.priority || 100) - (b.priority || 100));
}

export function getSectionById(id: string) {
  _metrics.lookups++;
  return SECTIONS.find(section => section.id === id) || null;
}

export function getSectionIcon(id: string) {
  const section = getSectionById(id);
  return section?.icon || 'grid';
}

// @deprecated v5.6.0 — minLevel system removed, use UARPS permissions
export function filterByLevel(items: unknown[], userLevel = 0) {
  _metrics.filters++;
  return [...items];
}

export function getManifest() {
  return { version: VERSION, sections: [...SECTIONS], items: [...ITEMS], timestamp: Date.now() };
}

export function getMetrics() {
  return { ..._metrics, sectionsCount: SECTIONS.length, itemsCount: ITEMS.length };
}

export function info() {
  return { moduleId: MODULE_ID, version: VERSION, sectionsCount: SECTIONS.length, itemsCount: ITEMS.length, metrics: getMetrics() };
}

export function healthCheck() {
  const hasSections = SECTIONS.length > 0;
  const hasItems = ITEMS.length > 0;
  const allSectionsHaveIcons = SECTIONS.every(s => !!s.icon);
  const allItemsHaveRoutes = ITEMS.every(i => !!i.route);
  const checks = { hasSections, hasItems, allSectionsHaveIcons, allItemsHaveRoutes, validStructure: true };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return {
    status: passed === total ? 'HEALTHY' : 'DEGRADED',
    score: passed,
    maxScore: total,
    scoreDisplay: `${passed}/${total}`,
    checks,
    sectionsCount: SECTIONS.length,
    itemsCount: ITEMS.length,
    version: VERSION,
    moduleId: MODULE_ID,
    timestamp: Date.now(),
    metrics: getMetrics()
  };
}

export default { VERSION, MODULE_ID, SECTIONS, ITEMS, getManifest, getItemById, getItemsBySection, getSectionById, getSectionIcon, filterByLevel, info, getMetrics, healthCheck };
