const VERSION = "5.6.0-UARPS-ONLY";
const MODULE_ID = "sidebar-items-manifest";
let _metrics = { lookups: 0, filters: 0 };
const SECTIONS = [
  { id: "main", title: null, icon: "dashboard", priority: 1, collapsible: false },
  { id: "operacional", title: null, icon: "settings", priority: 2, collapsible: false },
  { id: "admin", title: "Administra\xE7\xE3o", icon: "shield", priority: 3, collapsible: true }
];
const ITEMS = [
  { id: "principal", sectionId: "main", title: "Principal", route: "#/", icon: "dashboard", priority: 1 },
  { id: "geral", sectionId: "main", title: "Geral", route: "#/geral", icon: "grid", priority: 2 },
  { id: "automacoes", sectionId: "operacional", title: "Automa\xE7\xF5es", route: "#/automacoes", icon: "automation", priority: 1 },
  { id: "bling", sectionId: "operacional", title: "Bling", route: "#/bling", icon: "box", priority: 2 },
  { id: "clientes", sectionId: "operacional", title: "Clientes", route: "#/clientes", icon: "users", priority: 3 },
  { id: "colaboradores", sectionId: "operacional", title: "Colaboradores", route: "#/colaboradores", icon: "team", priority: 4 },
  { id: "comercial", sectionId: "operacional", title: "Comercial", route: "#/comercial", icon: "chart", priority: 5 },
  { id: "compras", sectionId: "operacional", title: "Compras", route: "#/compras", icon: "cart", priority: 6 },
  { id: "contratos", sectionId: "operacional", title: "Contratos", route: "#/contratos", icon: "document", priority: 7 },
  { id: "financeiro", sectionId: "operacional", title: "Financeiro", route: "#/financeiro", icon: "money", priority: 8 },
  { id: "fornecedores", sectionId: "operacional", title: "Fornecedores", route: "#/fornecedores", icon: "supplier", priority: 9 },
  { id: "google-ads", sectionId: "operacional", title: "Google Ads", route: "#/google-ads", icon: "ads", priority: 10 },
  { id: "google-drive", sectionId: "operacional", title: "Google Drive", route: "#/google-drive", icon: "drive", priority: 11 },
  { id: "importacao", sectionId: "operacional", title: "Importa\xE7\xE3o", route: "#/importacao", icon: "globe", priority: 12 },
  { id: "instagram", sectionId: "operacional", title: "Instagram", route: "#/instagram", icon: "instagram", priority: 13 },
  { id: "operacional", sectionId: "operacional", title: "Operacional", route: "#/operacional", icon: "cog", priority: 14 },
  { id: "orcamento-clientes", sectionId: "operacional", title: "Or\xE7amento Clientes", route: "#/orcamento-clientes", icon: "calculator", priority: 15 },
  { id: "pipedrive", sectionId: "operacional", title: "Pipedrive", route: "#/pipedrive", icon: "pipeline", priority: 16 },
  { id: "produtos", sectionId: "operacional", title: "Produtos", route: "#/produtos", icon: "package", priority: 17 },
  { id: "rh-pessoas", sectionId: "operacional", title: "RH Pessoas", route: "#/rh-pessoas", icon: "people", priority: 18 },
  { id: "servidores", sectionId: "operacional", title: "Servidores", route: "#/servidores", icon: "server", priority: 19 },
  { id: "user-management", sectionId: "admin", title: "Gest\xE3o de Usu\xE1rios", route: "#/admin/usuarios", icon: "users-cog", priority: 1 },
  { id: "permissions-admin", sectionId: "admin", title: "Permiss\xF5es", route: "#/admin/permissoes", icon: "shield", priority: 2 },
  { id: "session-admin", sectionId: "admin", title: "Sess\xF5es", route: "#/admin/sessoes", icon: "key", priority: 3 },
  { id: "audit-trail", sectionId: "admin", title: "Auditoria", route: "#/admin/auditoria", icon: "clipboard", priority: 4 },
  { id: "nav-admin", sectionId: "admin", title: "Navega\xE7\xE3o", route: "#/admin/navegacao", icon: "nav", priority: 5 },
  { id: "user-preferences", sectionId: "admin", title: "Minhas Prefer\xEAncias", route: "#/preferencias", icon: "settings", priority: 6 }
];
function getItemById(id) {
  _metrics.lookups++;
  return ITEMS.find((item) => item.id === id) || null;
}
function getItemsBySection(sectionId) {
  _metrics.lookups++;
  return ITEMS.filter((item) => item.sectionId === sectionId).sort((a, b) => (a.priority || 100) - (b.priority || 100));
}
function getSectionById(id) {
  _metrics.lookups++;
  return SECTIONS.find((section) => section.id === id) || null;
}
function getSectionIcon(id) {
  const section = getSectionById(id);
  return section?.icon || "grid";
}
function filterByLevel(items, userLevel = 0) {
  _metrics.filters++;
  return [...items];
}
function getManifest() {
  return { version: VERSION, sections: [...SECTIONS], items: [...ITEMS], timestamp: Date.now() };
}
function getMetrics() {
  return { ..._metrics, sectionsCount: SECTIONS.length, itemsCount: ITEMS.length };
}
function info() {
  return { moduleId: MODULE_ID, version: VERSION, sectionsCount: SECTIONS.length, itemsCount: ITEMS.length, metrics: getMetrics() };
}
function healthCheck() {
  const hasSections = SECTIONS.length > 0;
  const hasItems = ITEMS.length > 0;
  const allSectionsHaveIcons = SECTIONS.every((s) => !!s.icon);
  const allItemsHaveRoutes = ITEMS.every((i) => !!i.route);
  const checks = { hasSections, hasItems, allSectionsHaveIcons, allItemsHaveRoutes, validStructure: true };
  const passed = Object.values(checks).filter(Boolean).length;
  const total = Object.keys(checks).length;
  return {
    status: passed === total ? "HEALTHY" : "DEGRADED",
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
var items_manifest_default = { VERSION, MODULE_ID, SECTIONS, ITEMS, getManifest, getItemById, getItemsBySection, getSectionById, getSectionIcon, filterByLevel, info, getMetrics, healthCheck };
export {
  ITEMS,
  MODULE_ID,
  SECTIONS,
  VERSION,
  items_manifest_default as default,
  filterByLevel,
  getItemById,
  getItemsBySection,
  getManifest,
  getMetrics,
  getSectionById,
  getSectionIcon,
  healthCheck,
  info
};
