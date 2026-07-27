const VERSION = "2.1.0-P2-ENTERPRISE";
const MODULE_ID = "intent-rules";
const ACTIONS = {
  NAVIGATE: "navigate",
  OPEN_PANEL: "openPanel",
  OPEN_MODAL: "openModal",
  OPEN_OVERLAY: "openOverlay",
  TOGGLE: "toggle",
  SYSTEM: "system"
};
const REGIONS = {
  MAIN: "main",
  SIDE: "side",
  MODAL: "modal",
  OVERLAY: "overlay"
};
const NAVRAIL_RULES = [
  // === OPERATIONS GROUP ===
  { intentId: "navrail.open.home", action: ACTIONS.NAVIGATE, targetId: "home", route: "#/home", region: REGIONS.MAIN, label: "Home", icon: "home" },
  { intentId: "navrail.open.dashboard", action: ACTIONS.NAVIGATE, targetId: "cards", route: "#/cards", region: REGIONS.MAIN, label: "Dashboard", icon: "grid" },
  { intentId: "navrail.open.financeiro", action: ACTIONS.NAVIGATE, targetId: "financeiro", route: "#/financeiro", region: REGIONS.MAIN, label: "Financeiro", icon: "dollar-sign" },
  { intentId: "navrail.open.comercial", action: ACTIONS.NAVIGATE, targetId: "comercial", route: "#/comercial", region: REGIONS.MAIN, label: "Comercial", icon: "briefcase" },
  { intentId: "navrail.open.clientes", action: ACTIONS.NAVIGATE, targetId: "clientes", route: "#/clientes", region: REGIONS.MAIN, label: "Clientes", icon: "users" },
  // === ANALYTICS GROUP ===
  { intentId: "navrail.open.analytics", action: ACTIONS.NAVIGATE, targetId: "02", route: "#/02", region: REGIONS.MAIN, label: "Analytics", icon: "bar-chart-2" },
  { intentId: "navrail.open.relatorios", action: ACTIONS.NAVIGATE, targetId: "relatorios", route: "#/relatorios", region: REGIONS.MAIN, label: "Relat\xF3rios", icon: "file-text" },
  { intentId: "navrail.open.charts", action: ACTIONS.NAVIGATE, targetId: "charts", route: "#/charts", region: REGIONS.MAIN, label: "Gr\xE1ficos", icon: "trending-up" },
  // === DATA GROUP ===
  { intentId: "navrail.open.database", action: ACTIONS.NAVIGATE, targetId: "database", route: "#/database", region: REGIONS.MAIN, label: "Banco de Dados", icon: "database" },
  { intentId: "navrail.open.folder", action: ACTIONS.NAVIGATE, targetId: "files", route: "#/files", region: REGIONS.MAIN, label: "Arquivos", icon: "folder" },
  { intentId: "navrail.open.docs", action: ACTIONS.NAVIGATE, targetId: "docs", route: "#/docs", region: REGIONS.MAIN, label: "Documentos", icon: "book-open" },
  // === INTEGRATIONS GROUP ===
  { intentId: "navrail.open.api", action: ACTIONS.NAVIGATE, targetId: "api", route: "#/api", region: REGIONS.MAIN, label: "API", icon: "zap" },
  { intentId: "navrail.open.pipedrive", action: ACTIONS.NAVIGATE, targetId: "pipedrive", route: "#/pipedrive", region: REGIONS.MAIN, label: "Pipedrive", icon: "target" },
  { intentId: "navrail.open.location", action: ACTIONS.NAVIGATE, targetId: "locations", route: "#/locations", region: REGIONS.MAIN, label: "Localiza\xE7\xF5es", icon: "map-pin" },
  // === ADMIN GROUP ===
  { intentId: "navrail.open.admin-users", action: ACTIONS.NAVIGATE, targetId: "user-management", route: "#/user-management", region: REGIONS.MAIN, label: "Usu\xE1rios", icon: "user-cog", requiresPermission: "admin.users.view" },
  { intentId: "navrail.open.admin-settings", action: ACTIONS.NAVIGATE, targetId: "settings", route: "#/settings", region: REGIONS.MAIN, label: "Configura\xE7\xF5es", icon: "settings", requiresPermission: "admin.settings.view" },
  { intentId: "navrail.open.code", action: ACTIONS.NAVIGATE, targetId: "code", route: "#/code", region: REGIONS.MAIN, label: "C\xF3digo", icon: "code", requiresPermission: "admin.code.view" },
  // === SYSTEM GROUP ===
  { intentId: "navrail.open.bell", action: ACTIONS.OPEN_OVERLAY, targetId: "notifications", region: REGIONS.OVERLAY, label: "Notifica\xE7\xF5es", icon: "bell" },
  { intentId: "navrail.open.help", action: ACTIONS.OPEN_MODAL, targetId: "help", region: REGIONS.MODAL, label: "Ajuda", icon: "help-circle" },
  { intentId: "navrail.toggle.sidebar", action: ACTIONS.TOGGLE, targetId: "sidebar", region: null, label: "Sidebar", icon: "sidebar" }
];
const SIDEBAR_RULES = [
  { intentId: "sidebar.navigate", action: ACTIONS.NAVIGATE, targetId: null, region: REGIONS.MAIN, routeFromMeta: true }
];
const HEADER_RULES = [
  { intentId: "header.open.user-menu", action: ACTIONS.OPEN_OVERLAY, targetId: "user-menu", region: REGIONS.OVERLAY },
  { intentId: "header.action.refresh", action: ACTIONS.SYSTEM, targetId: "refresh", systemEvent: "app:refresh" },
  { intentId: "header.action.fullscreen", action: ACTIONS.SYSTEM, targetId: "fullscreen", systemEvent: "app:fullscreen-toggle" },
  { intentId: "header.action.logout", action: ACTIONS.SYSTEM, targetId: "logout", systemEvent: "auth:logout" }
];
const FOOTER_RULES = [
  { intentId: "footer.open.termos", action: ACTIONS.OPEN_MODAL, targetId: "termos", region: REGIONS.MODAL },
  { intentId: "footer.open.privacidade", action: ACTIONS.OPEN_MODAL, targetId: "privacidade", region: REGIONS.MODAL },
  { intentId: "footer.open.lgpd", action: ACTIONS.OPEN_MODAL, targetId: "lgpd", region: REGIONS.MODAL },
  { intentId: "footer.action.logout", action: ACTIONS.SYSTEM, targetId: "logout", systemEvent: "auth:logout" }
];
const ADMIN_RULES = [
  { intentId: "admin.open.usuarios", action: ACTIONS.NAVIGATE, targetId: "panel-user-management", route: "#/admin/usuarios", region: REGIONS.MAIN, label: "Gest\xE3o de Usu\xE1rios", icon: "users", requiresPermission: "admin.users.manage", minLevel: 80 },
  { intentId: "admin.open.permissoes", action: ACTIONS.NAVIGATE, targetId: "panel-permissions-admin", route: "#/admin/permissoes", region: REGIONS.MAIN, label: "Roles e Permiss\xF5es", icon: "shield", requiresPermission: "super_admin", minLevel: 100 },
  { intentId: "admin.open.sessoes", action: ACTIONS.NAVIGATE, targetId: "panel-session-admin", route: "#/admin/sessoes", region: REGIONS.MAIN, label: "Gerenciamento de Sess\xF5es", icon: "activity", requiresPermission: "admin.sessions.view", minLevel: 60 },
  { intentId: "admin.open.feature-flags", action: ACTIONS.NAVIGATE, targetId: "panel-feature-flags-admin", route: "#/admin/feature-flags", region: REGIONS.MAIN, label: "Feature Flags", icon: "flag", requiresPermission: "admin.flags.manage", minLevel: 80 },
  { intentId: "admin.open.auditoria", action: ACTIONS.NAVIGATE, targetId: "panel-audit-trail", route: "#/admin/auditoria", region: REGIONS.MAIN, label: "Auditoria e Logs", icon: "file-search", requiresPermission: "admin.audit.view", minLevel: 60 },
  { intentId: "admin.open.navegacao", action: ACTIONS.NAVIGATE, targetId: "panel-nav-admin", route: "#/admin/navegacao", region: REGIONS.MAIN, label: "Administra\xE7\xE3o de Navega\xE7\xE3o", icon: "navigation", requiresPermission: "super_admin", minLevel: 100 }
];
const USER_RULES = [
  { intentId: "user.open.perfil", action: ACTIONS.NAVIGATE, targetId: "panel-user-profile", route: "#/meu-perfil", region: REGIONS.MAIN, label: "Meu Perfil", icon: "user" },
  { intentId: "user.open.preferencias", action: ACTIONS.NAVIGATE, targetId: "panel-user-preferences", route: "#/preferencias", region: REGIONS.MAIN, label: "Prefer\xEAncias", icon: "sliders" },
  { intentId: "user.open.seguranca", action: ACTIONS.NAVIGATE, targetId: "panel-account-security", route: "#/seguranca-conta", region: REGIONS.MAIN, label: "Seguran\xE7a da Conta", icon: "lock" },
  { intentId: "user.open.notificacoes", action: ACTIONS.NAVIGATE, targetId: "panel-user-notifications", route: "#/notificacoes", region: REGIONS.MAIN, label: "Notifica\xE7\xF5es", icon: "bell" },
  { intentId: "user.open.sessoes", action: ACTIONS.NAVIGATE, targetId: "panel-user-sessions", route: "#/sessoes-ativas", region: REGIONS.MAIN, label: "Sess\xF5es Ativas", icon: "monitor" }
];
const SYSTEM_RULES = [
  { intentId: "system.action.refresh", action: ACTIONS.SYSTEM, targetId: "refresh", systemEvent: "app:refresh", label: "Atualizar" },
  { intentId: "system.action.fullscreen", action: ACTIONS.SYSTEM, targetId: "fullscreen", systemEvent: "app:fullscreen-toggle", label: "Tela Cheia" },
  { intentId: "system.action.logout", action: ACTIONS.SYSTEM, targetId: "logout", systemEvent: "auth:logout", label: "Sair" },
  { intentId: "system.toggle.theme", action: ACTIONS.SYSTEM, targetId: "theme", systemEvent: "theme:toggle", label: "Alternar Tema" }
];
const PANEL_RULES = [
  { intentId: "panel.open.analytics", action: ACTIONS.NAVIGATE, targetId: "panel-analytics", route: "#/analytics", region: REGIONS.MAIN, label: "Analytics Dashboard", icon: "pie-chart" },
  { intentId: "panel.open.charts", action: ACTIONS.NAVIGATE, targetId: "panel-charts", route: "#/charts", region: REGIONS.MAIN, label: "Charts", icon: "bar-chart" },
  { intentId: "panel.open.datahub", action: ACTIONS.NAVIGATE, targetId: "panel-datahub", route: "#/datahub", region: REGIONS.MAIN, label: "Data Hub", icon: "database" },
  { intentId: "panel.open.enterprise", action: ACTIONS.NAVIGATE, targetId: "panel-enterprise", route: "#/enterprise", region: REGIONS.MAIN, label: "Enterprise", icon: "building" },
  { intentId: "panel.open.health", action: ACTIONS.NAVIGATE, targetId: "panel-health-dashboard", route: "#/health", region: REGIONS.MAIN, label: "Health Dashboard", icon: "heart-pulse" }
];
const KEYBOARD_RULES = [
  { intentId: "keyboard.shortcut.search", action: ACTIONS.SYSTEM, targetId: "search", systemEvent: "search:open", shortcut: "Ctrl+K", label: "Buscar" },
  { intentId: "keyboard.shortcut.help", action: ACTIONS.OPEN_MODAL, targetId: "help", region: REGIONS.MODAL, shortcut: "F1", label: "Ajuda" },
  { intentId: "keyboard.shortcut.home", action: ACTIONS.NAVIGATE, targetId: "home", route: "#/home", region: REGIONS.MAIN, shortcut: "Alt+H", label: "Home" },
  { intentId: "keyboard.shortcut.sidebar", action: ACTIONS.TOGGLE, targetId: "sidebar", shortcut: "Ctrl+B", label: "Toggle Sidebar" }
];
const ALL_RULES = [
  ...NAVRAIL_RULES,
  ...SIDEBAR_RULES,
  ...HEADER_RULES,
  ...FOOTER_RULES,
  ...ADMIN_RULES,
  ...USER_RULES,
  ...SYSTEM_RULES,
  ...PANEL_RULES,
  ...KEYBOARD_RULES
];
const RULES_INDEX = /* @__PURE__ */ new Map();
ALL_RULES.forEach((rule) => {
  RULES_INDEX.set(rule.intentId, rule);
});
const SHORTCUT_INDEX = /* @__PURE__ */ new Map();
KEYBOARD_RULES.forEach((rule) => {
  if (rule.shortcut) SHORTCUT_INDEX.set(rule.shortcut.toLowerCase(), rule);
});
function getRule(intentId) {
  return RULES_INDEX.get(intentId) || null;
}
function hasRule(intentId) {
  return RULES_INDEX.has(intentId);
}
function getAllRules() {
  return [...ALL_RULES];
}
function getRulesBySource(source) {
  const prefix = `${source}.`;
  return ALL_RULES.filter((r) => r.intentId.startsWith(prefix));
}
function getRulesByAction(action) {
  return ALL_RULES.filter((r) => r.action === action);
}
function getRulesByRegion(region) {
  return ALL_RULES.filter((r) => r.region === region);
}
function getProtectedRules() {
  return ALL_RULES.filter((r) => r.requiresPermission || r.minLevel);
}
function getRuleByShortcut(shortcut) {
  return SHORTCUT_INDEX.get(shortcut?.toLowerCase()) || null;
}
function getKeyboardRules() {
  return [...KEYBOARD_RULES];
}
function getAdminRules() {
  return [...ADMIN_RULES];
}
function getUserRules() {
  return [...USER_RULES];
}
function info() {
  return {
    version: VERSION,
    moduleId: MODULE_ID,
    totalRules: ALL_RULES.length,
    bySource: {
      navrail: NAVRAIL_RULES.length,
      sidebar: SIDEBAR_RULES.length,
      header: HEADER_RULES.length,
      footer: FOOTER_RULES.length,
      admin: ADMIN_RULES.length,
      user: USER_RULES.length,
      system: SYSTEM_RULES.length,
      panel: PANEL_RULES.length,
      keyboard: KEYBOARD_RULES.length
    },
    byAction: {
      navigate: ALL_RULES.filter((r) => r.action === ACTIONS.NAVIGATE).length,
      openPanel: ALL_RULES.filter((r) => r.action === ACTIONS.OPEN_PANEL).length,
      openModal: ALL_RULES.filter((r) => r.action === ACTIONS.OPEN_MODAL).length,
      openOverlay: ALL_RULES.filter((r) => r.action === ACTIONS.OPEN_OVERLAY).length,
      toggle: ALL_RULES.filter((r) => r.action === ACTIONS.TOGGLE).length,
      system: ALL_RULES.filter((r) => r.action === ACTIONS.SYSTEM).length
    },
    protectedCount: getProtectedRules().length,
    shortcutCount: SHORTCUT_INDEX.size
  };
}
function healthCheck() {
  const hasRules = ALL_RULES.length > 0;
  const hasIndex = RULES_INDEX.size > 0;
  const indexMatch = RULES_INDEX.size === ALL_RULES.length;
  const hasShortcuts = SHORTCUT_INDEX.size > 0;
  return {
    status: hasRules && hasIndex && indexMatch ? "healthy" : "DEGRADED",
    checks: { hasRules, hasIndex, indexMatch, hasShortcuts },
    version: VERSION,
    moduleId: MODULE_ID
  };
}
var intent_rules_default = {
  getRule,
  hasRule,
  getAllRules,
  getRulesBySource,
  getRulesByAction,
  getRulesByRegion,
  getProtectedRules,
  getRuleByShortcut,
  getKeyboardRules,
  getAdminRules,
  getUserRules,
  info,
  healthCheck,
  ACTIONS,
  REGIONS,
  VERSION,
  MODULE_ID
};
export {
  ACTIONS,
  MODULE_ID,
  REGIONS,
  VERSION,
  intent_rules_default as default,
  getAdminRules,
  getAllRules,
  getKeyboardRules,
  getProtectedRules,
  getRule,
  getRuleByShortcut,
  getRulesByAction,
  getRulesByRegion,
  getRulesBySource,
  getUserRules,
  hasRule,
  healthCheck,
  info
};
