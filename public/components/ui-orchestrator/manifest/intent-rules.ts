
// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.1.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components.ui-orchestrator.manifest.intent-rules
// PURPOSE: IntentRules - Manifest for intent to action mapping
// ───────────────────────────────────────────────────────────────
// @contract MODULE_ID - module constant identifier
// @contract VERSION - module constant version
// @contract GET_RULE - getRule() returns rule by intentId
// @contract HAS_RULE - hasRule() checks if rule exists
// @contract GET_ALL_RULES - getAllRules() returns all rules
// @contract GET_RULES_BY_SOURCE - getRulesBySource() filters by source
// @contract GET_RULES_BY_ACTION - getRulesByAction() filters by action
// @contract GET_RULES_BY_REGION - getRulesByRegion() filters by region
// @contract GET_PROTECTED_RULES - getProtectedRules() returns protected rules
// @contract GET_RULE_BY_SHORTCUT - getRuleByShortcut() returns rule by keyboard shortcut
// @contract HEALTH - healthCheck() returns health status
// @contract INFO - info() returns module information
// ───────────────────────────────────────────────────────────────
// IMPORTS: (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   ACTIONS — exported object with action constants
//   REGIONS — exported object with region constants
//   getRule() — exported function
//   hasRule() — exported function
//   getAllRules() — exported function
//   getRulesBySource() — exported function
//   getRulesByAction() — exported function
//   getRulesByRegion() — exported function
//   getProtectedRules() — exported function
//   getRuleByShortcut() — exported function
//   getKeyboardRules() — exported function
//   getAdminRules() — exported function
//   getUserRules() — exported function
//   info() — exported function
//   healthCheck() — exported function
//
// RECEIVES (via init/options): (none)
// EMITS (eventos): (none)
// LISTENS (eventos): (none)
// WINDOW ACCESS: (none)
// ───────────────────────────────────────────────────────────────
// @changelog v2.1.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v2.0.0-ENTERPRISE: +20 intents (admin, user, system, panels)
// ═══════════════════════════════════════════════════════════════
'use strict';

export const VERSION = '2.1.0-P2-ENTERPRISE';
export const MODULE_ID = 'intent-rules';

// Actions disponíveis
const ACTIONS = {
  NAVIGATE: 'navigate',
  OPEN_PANEL: 'openPanel',
  OPEN_MODAL: 'openModal',
  OPEN_OVERLAY: 'openOverlay',
  TOGGLE: 'toggle',
  SYSTEM: 'system'
};

// Regiões
const REGIONS = {
  MAIN: 'main',
  SIDE: 'side',
  MODAL: 'modal',
  OVERLAY: 'overlay'
};

// ═══════════════════════════════════════════════════════════════════════════════
// RULES: NAVRAIL (20 intents)
// ═══════════════════════════════════════════════════════════════════════════════
const NAVRAIL_RULES = [
  // === OPERATIONS GROUP ===
  { intentId: 'navrail.open.home', action: ACTIONS.NAVIGATE, targetId: 'home', route: '#/home', region: REGIONS.MAIN, label: 'Home', icon: 'home' },
  { intentId: 'navrail.open.dashboard', action: ACTIONS.NAVIGATE, targetId: 'cards', route: '#/cards', region: REGIONS.MAIN, label: 'Dashboard', icon: 'grid' },
  { intentId: 'navrail.open.financeiro', action: ACTIONS.NAVIGATE, targetId: 'financeiro', route: '#/financeiro', region: REGIONS.MAIN, label: 'Financeiro', icon: 'dollar-sign' },
  { intentId: 'navrail.open.comercial', action: ACTIONS.NAVIGATE, targetId: 'comercial', route: '#/comercial', region: REGIONS.MAIN, label: 'Comercial', icon: 'briefcase' },
  { intentId: 'navrail.open.clientes', action: ACTIONS.NAVIGATE, targetId: 'clientes', route: '#/clientes', region: REGIONS.MAIN, label: 'Clientes', icon: 'users' },

  // === ANALYTICS GROUP ===
  { intentId: 'navrail.open.analytics', action: ACTIONS.NAVIGATE, targetId: '02', route: '#/02', region: REGIONS.MAIN, label: 'Analytics', icon: 'bar-chart-2' },
  { intentId: 'navrail.open.relatorios', action: ACTIONS.NAVIGATE, targetId: 'relatorios', route: '#/relatorios', region: REGIONS.MAIN, label: 'Relatórios', icon: 'file-text' },
  { intentId: 'navrail.open.charts', action: ACTIONS.NAVIGATE, targetId: 'charts', route: '#/charts', region: REGIONS.MAIN, label: 'Gráficos', icon: 'trending-up' },

  // === DATA GROUP ===
  { intentId: 'navrail.open.database', action: ACTIONS.NAVIGATE, targetId: 'database', route: '#/database', region: REGIONS.MAIN, label: 'Banco de Dados', icon: 'database' },
  { intentId: 'navrail.open.folder', action: ACTIONS.NAVIGATE, targetId: 'files', route: '#/files', region: REGIONS.MAIN, label: 'Arquivos', icon: 'folder' },
  { intentId: 'navrail.open.docs', action: ACTIONS.NAVIGATE, targetId: 'docs', route: '#/docs', region: REGIONS.MAIN, label: 'Documentos', icon: 'book-open' },

  // === INTEGRATIONS GROUP ===
  { intentId: 'navrail.open.api', action: ACTIONS.NAVIGATE, targetId: 'api', route: '#/api', region: REGIONS.MAIN, label: 'API', icon: 'zap' },
  { intentId: 'navrail.open.pipedrive', action: ACTIONS.NAVIGATE, targetId: 'pipedrive', route: '#/pipedrive', region: REGIONS.MAIN, label: 'Pipedrive', icon: 'target' },
  { intentId: 'navrail.open.location', action: ACTIONS.NAVIGATE, targetId: 'locations', route: '#/locations', region: REGIONS.MAIN, label: 'Localizações', icon: 'map-pin' },

  // === ADMIN GROUP ===
  { intentId: 'navrail.open.admin-users', action: ACTIONS.NAVIGATE, targetId: 'user-management', route: '#/user-management', region: REGIONS.MAIN, label: 'Usuários', icon: 'user-cog', requiresPermission: 'admin.users.view' },
  { intentId: 'navrail.open.admin-settings', action: ACTIONS.NAVIGATE, targetId: 'settings', route: '#/settings', region: REGIONS.MAIN, label: 'Configurações', icon: 'settings', requiresPermission: 'admin.settings.view' },
  { intentId: 'navrail.open.code', action: ACTIONS.NAVIGATE, targetId: 'code', route: '#/code', region: REGIONS.MAIN, label: 'Código', icon: 'code', requiresPermission: 'admin.code.view' },

  // === SYSTEM GROUP ===
  { intentId: 'navrail.open.bell', action: ACTIONS.OPEN_OVERLAY, targetId: 'notifications', region: REGIONS.OVERLAY, label: 'Notificações', icon: 'bell' },
  { intentId: 'navrail.open.help', action: ACTIONS.OPEN_MODAL, targetId: 'help', region: REGIONS.MODAL, label: 'Ajuda', icon: 'help-circle' },
  { intentId: 'navrail.toggle.sidebar', action: ACTIONS.TOGGLE, targetId: 'sidebar', region: null as string | null, label: 'Sidebar', icon: 'sidebar' }
];

// ═══════════════════════════════════════════════════════════════════════════════
// RULES: SIDEBAR (1 intent)
// ═══════════════════════════════════════════════════════════════════════════════
const SIDEBAR_RULES = [
  { intentId: 'sidebar.navigate', action: ACTIONS.NAVIGATE, targetId: null as string | null, region: REGIONS.MAIN, routeFromMeta: true }
];

// ═══════════════════════════════════════════════════════════════════════════════
// RULES: HEADER (4 intents)
// ═══════════════════════════════════════════════════════════════════════════════
const HEADER_RULES = [
  { intentId: 'header.open.user-menu', action: ACTIONS.OPEN_OVERLAY, targetId: 'user-menu', region: REGIONS.OVERLAY },
  { intentId: 'header.action.refresh', action: ACTIONS.SYSTEM, targetId: 'refresh', systemEvent: 'app:refresh' },
  { intentId: 'header.action.fullscreen', action: ACTIONS.SYSTEM, targetId: 'fullscreen', systemEvent: 'app:fullscreen-toggle' },
  { intentId: 'header.action.logout', action: ACTIONS.SYSTEM, targetId: 'logout', systemEvent: 'auth:logout' }
];

// ═══════════════════════════════════════════════════════════════════════════════
// RULES: FOOTER (4 intents)
// ═══════════════════════════════════════════════════════════════════════════════
const FOOTER_RULES = [
  { intentId: 'footer.open.termos', action: ACTIONS.OPEN_MODAL, targetId: 'termos', region: REGIONS.MODAL },
  { intentId: 'footer.open.privacidade', action: ACTIONS.OPEN_MODAL, targetId: 'privacidade', region: REGIONS.MODAL },
  { intentId: 'footer.open.lgpd', action: ACTIONS.OPEN_MODAL, targetId: 'lgpd', region: REGIONS.MODAL },
  { intentId: 'footer.action.logout', action: ACTIONS.SYSTEM, targetId: 'logout', systemEvent: 'auth:logout' }
];

// ═══════════════════════════════════════════════════════════════════════════════
// RULES: ADMIN (6 intents) - M2 NEW
// ═══════════════════════════════════════════════════════════════════════════════
const ADMIN_RULES = [
  { intentId: 'admin.open.usuarios', action: ACTIONS.NAVIGATE, targetId: 'panel-user-management', route: '#/admin/usuarios', region: REGIONS.MAIN, label: 'Gestão de Usuários', icon: 'users', requiresPermission: 'admin.users.manage', minLevel: 80 },
  { intentId: 'admin.open.permissoes', action: ACTIONS.NAVIGATE, targetId: 'panel-permissions-admin', route: '#/admin/permissoes', region: REGIONS.MAIN, label: 'Roles e Permissões', icon: 'shield', requiresPermission: 'super_admin', minLevel: 100 },
  { intentId: 'admin.open.sessoes', action: ACTIONS.NAVIGATE, targetId: 'panel-session-admin', route: '#/admin/sessoes', region: REGIONS.MAIN, label: 'Gerenciamento de Sessões', icon: 'activity', requiresPermission: 'admin.sessions.view', minLevel: 60 },
  { intentId: 'admin.open.feature-flags', action: ACTIONS.NAVIGATE, targetId: 'panel-feature-flags-admin', route: '#/admin/feature-flags', region: REGIONS.MAIN, label: 'Feature Flags', icon: 'flag', requiresPermission: 'admin.flags.manage', minLevel: 80 },
  { intentId: 'admin.open.auditoria', action: ACTIONS.NAVIGATE, targetId: 'panel-audit-trail', route: '#/admin/auditoria', region: REGIONS.MAIN, label: 'Auditoria e Logs', icon: 'file-search', requiresPermission: 'admin.audit.view', minLevel: 60 },
  { intentId: 'admin.open.navegacao', action: ACTIONS.NAVIGATE, targetId: 'panel-nav-admin', route: '#/admin/navegacao', region: REGIONS.MAIN, label: 'Administração de Navegação', icon: 'navigation', requiresPermission: 'super_admin', minLevel: 100 }
];

// ═══════════════════════════════════════════════════════════════════════════════
// RULES: USER (5 intents) - M2 NEW
// ═══════════════════════════════════════════════════════════════════════════════
const USER_RULES = [
  { intentId: 'user.open.perfil', action: ACTIONS.NAVIGATE, targetId: 'panel-user-profile', route: '#/meu-perfil', region: REGIONS.MAIN, label: 'Meu Perfil', icon: 'user' },
  { intentId: 'user.open.preferencias', action: ACTIONS.NAVIGATE, targetId: 'panel-user-preferences', route: '#/preferencias', region: REGIONS.MAIN, label: 'Preferências', icon: 'sliders' },
  { intentId: 'user.open.seguranca', action: ACTIONS.NAVIGATE, targetId: 'panel-account-security', route: '#/seguranca-conta', region: REGIONS.MAIN, label: 'Segurança da Conta', icon: 'lock' },
  { intentId: 'user.open.notificacoes', action: ACTIONS.NAVIGATE, targetId: 'panel-user-notifications', route: '#/notificacoes', region: REGIONS.MAIN, label: 'Notificações', icon: 'bell' },
  { intentId: 'user.open.sessoes', action: ACTIONS.NAVIGATE, targetId: 'panel-user-sessions', route: '#/sessoes-ativas', region: REGIONS.MAIN, label: 'Sessões Ativas', icon: 'monitor' }
];

// ═══════════════════════════════════════════════════════════════════════════════
// RULES: SYSTEM (4 intents) - M2 NEW
// ═══════════════════════════════════════════════════════════════════════════════
const SYSTEM_RULES = [
  { intentId: 'system.action.refresh', action: ACTIONS.SYSTEM, targetId: 'refresh', systemEvent: 'app:refresh', label: 'Atualizar' },
  { intentId: 'system.action.fullscreen', action: ACTIONS.SYSTEM, targetId: 'fullscreen', systemEvent: 'app:fullscreen-toggle', label: 'Tela Cheia' },
  { intentId: 'system.action.logout', action: ACTIONS.SYSTEM, targetId: 'logout', systemEvent: 'auth:logout', label: 'Sair' },
  { intentId: 'system.toggle.theme', action: ACTIONS.SYSTEM, targetId: 'theme', systemEvent: 'theme:toggle', label: 'Alternar Tema' }
];

// ═══════════════════════════════════════════════════════════════════════════════
// RULES: PANELS (5 intents) - M2 NEW
// ═══════════════════════════════════════════════════════════════════════════════
const PANEL_RULES = [
  { intentId: 'panel.open.analytics', action: ACTIONS.NAVIGATE, targetId: 'panel-analytics', route: '#/analytics', region: REGIONS.MAIN, label: 'Analytics Dashboard', icon: 'pie-chart' },
  { intentId: 'panel.open.charts', action: ACTIONS.NAVIGATE, targetId: 'panel-charts', route: '#/charts', region: REGIONS.MAIN, label: 'Charts', icon: 'bar-chart' },
  { intentId: 'panel.open.datahub', action: ACTIONS.NAVIGATE, targetId: 'panel-datahub', route: '#/datahub', region: REGIONS.MAIN, label: 'Data Hub', icon: 'database' },
  { intentId: 'panel.open.enterprise', action: ACTIONS.NAVIGATE, targetId: 'panel-enterprise', route: '#/enterprise', region: REGIONS.MAIN, label: 'Enterprise', icon: 'building' },
  { intentId: 'panel.open.health', action: ACTIONS.NAVIGATE, targetId: 'panel-health-dashboard', route: '#/health', region: REGIONS.MAIN, label: 'Health Dashboard', icon: 'heart-pulse' }
];

// ═══════════════════════════════════════════════════════════════════════════════
// RULES: KEYBOARD (4 intents) - M2 NEW
// ═══════════════════════════════════════════════════════════════════════════════
const KEYBOARD_RULES = [
  { intentId: 'keyboard.shortcut.search', action: ACTIONS.SYSTEM, targetId: 'search', systemEvent: 'search:open', shortcut: 'Ctrl+K', label: 'Buscar' },
  { intentId: 'keyboard.shortcut.help', action: ACTIONS.OPEN_MODAL, targetId: 'help', region: REGIONS.MODAL, shortcut: 'F1', label: 'Ajuda' },
  { intentId: 'keyboard.shortcut.home', action: ACTIONS.NAVIGATE, targetId: 'home', route: '#/home', region: REGIONS.MAIN, shortcut: 'Alt+H', label: 'Home' },
  { intentId: 'keyboard.shortcut.sidebar', action: ACTIONS.TOGGLE, targetId: 'sidebar', shortcut: 'Ctrl+B', label: 'Toggle Sidebar' }
];

// ═══════════════════════════════════════════════════════════════════════════════
// CONSOLIDAÇÃO
// ═══════════════════════════════════════════════════════════════════════════════
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

// Index por intentId para busca O(1)
const RULES_INDEX = new Map<string, Record<string, unknown>>();
ALL_RULES.forEach((rule: Record<string, unknown>) => {
  RULES_INDEX.set(rule.intentId as string, rule);
});

// Index por shortcut para keyboard
const SHORTCUT_INDEX = new Map<string, Record<string, unknown>>();
KEYBOARD_RULES.forEach((rule: Record<string, unknown>) => {
  if (rule.shortcut) SHORTCUT_INDEX.set((rule.shortcut as string).toLowerCase(), rule);
});

// ═══════════════════════════════════════════════════════════════════════════════
// API PÚBLICA
// ═══════════════════════════════════════════════════════════════════════════════

export function getRule(intentId: string): Record<string, unknown> | null {
  return RULES_INDEX.get(intentId) || null;
}

export function hasRule(intentId: string): boolean {
  return RULES_INDEX.has(intentId);
}

export function getAllRules(): Record<string, unknown>[] {
  return [...ALL_RULES];
}

export function getRulesBySource(source: string): Record<string, unknown>[] {
  const prefix = `${source}.`;
  return ALL_RULES.filter((r: Record<string, unknown>) => (r.intentId as string).startsWith(prefix));
}

export function getRulesByAction(action: string): Record<string, unknown>[] {
  return ALL_RULES.filter((r: Record<string, unknown>) => r.action === action);
}

export function getRulesByRegion(region: string): Record<string, unknown>[] {
  return ALL_RULES.filter((r: Record<string, unknown>) => r.region === region);
}

export function getProtectedRules(): Record<string, unknown>[] {
  return ALL_RULES.filter((r: Record<string, unknown>) => r.requiresPermission || r.minLevel);
}

// M2 NEW: Get rule by keyboard shortcut
export function getRuleByShortcut(shortcut: string): Record<string, unknown> | null {
  return SHORTCUT_INDEX.get(shortcut?.toLowerCase()) || null;
}

// M2 NEW: Get all keyboard shortcuts
export function getKeyboardRules(): Record<string, unknown>[] {
  return [...KEYBOARD_RULES];
}

// M2 NEW: Get admin rules
export function getAdminRules(): Record<string, unknown>[] {
  return [...ADMIN_RULES];
}

// M2 NEW: Get user rules
export function getUserRules(): Record<string, unknown>[] {
  return [...USER_RULES];
}

export function info(): Record<string, unknown> {
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
      navigate: ALL_RULES.filter((r: Record<string, unknown>) => r.action === ACTIONS.NAVIGATE).length,
      openPanel: ALL_RULES.filter((r: Record<string, unknown>) => r.action === ACTIONS.OPEN_PANEL).length,
      openModal: ALL_RULES.filter((r: Record<string, unknown>) => r.action === ACTIONS.OPEN_MODAL).length,
      openOverlay: ALL_RULES.filter((r: Record<string, unknown>) => r.action === ACTIONS.OPEN_OVERLAY).length,
      toggle: ALL_RULES.filter((r: Record<string, unknown>) => r.action === ACTIONS.TOGGLE).length,
      system: ALL_RULES.filter((r: Record<string, unknown>) => r.action === ACTIONS.SYSTEM).length
    },
    protectedCount: getProtectedRules().length,
    shortcutCount: SHORTCUT_INDEX.size
  };
}

export function healthCheck(): { status: string; checks: Record<string, boolean>; version: string; moduleId: string } {
  const hasRules = ALL_RULES.length > 0;
  const hasIndex = RULES_INDEX.size > 0;
  const indexMatch = RULES_INDEX.size === ALL_RULES.length;
  const hasShortcuts = SHORTCUT_INDEX.size > 0;

  return {
    status: hasRules && hasIndex && indexMatch ? 'healthy' : 'DEGRADED',
    checks: { hasRules, hasIndex, indexMatch, hasShortcuts },
    version: VERSION,
    moduleId: MODULE_ID
  };
}

export { ACTIONS, REGIONS };

export default {
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
