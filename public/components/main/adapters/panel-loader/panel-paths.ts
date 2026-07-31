// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (2.0.0-DATADRIVEN-AAA)
// ═══════════════════════════════════════════════════════════════
// MODULE: panel-paths
// PURPOSE: Panel Paths - Mapas e Resolvers
// ───────────────────────────────────────────────────────────────
// IMPORTS:
//   (none)
//
// PROVIDES:
//   VERSION — module constant
//   MODULE_ID — module constant
//   PANEL_ID_PATHS — exported value
//   ITEM_TO_PANEL — exported value
//   CRITICAL_PANELS — exported value
//   resolvePanelPath() — exported function
//   resolvePanelId() — exported function
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

export const VERSION = '2.0.0-DATADRIVEN';
export const MODULE_ID = 'panel-paths';

export const PANEL_ID_PATHS = Object.freeze({
  // Painéis numéricos (legacy)
  'panel-01': '/components/panels/panel-01/index.js',
  'panel-02': '/components/panels/panel-02/index.js',
  'panel-03': '/components/panels/panel-03/index.js',
  'panel-04': '/components/panels/panel-04/index.js',
  'panel-05': '/components/panels/panel-05/index.js',
  'panel-06': '/components/panels/panel-06/index.js',
  'panel-07': '/components/panels/panel-07/index.js',
  'panel-08': '/components/panels/panel-08/index.js',
  'panel-09': '/components/panels/panel-09/index.js',
  'panel-10': '/components/panels/panel-10/index.js',
  'panel-11': '/components/panels/panel-11/index.js',
  'panel-12': '/components/panels/panel-12/index.js',
  'panel-13': '/components/panels/panel-13/index.js',
  'panel-14': '/components/panels/panel-14/index.js',
  'panel-15': '/components/panels/panel-15/index.js',
  'panel-16': '/components/panels/panel-16/index.js',
  'panel-17': '/components/panels/panel-17/index.js',
  'panel-18': '/components/panels/panel-18/index.js',
  'panel-19': '/components/panels/panel-19/index.js',
  
  // Painéis nomeados - datadriven (from API manifest)
  'panel-dashboard': '/components/panels/panel-dashboard/index.js',
  'panel-cards': '/components/panels/panel-cards/index.js',
  'panel-datahub': '/components/panels/panel-datahub/index.js',
  'panel-files': '/components/panels/panel-files/index.js',
  'panel-users': '/components/panels/panel-user-management/index.js',
  'panel-config': '/components/panels/panel-user-preferences/index.js',
  'panel-analytics': '/components/panels/panel-analytics/index.js',
  
  // Painéis administrativos e de sistema
  'panel-health-dashboard': '/components/panels/panel-health-dashboard/index.js',
  'panel-user-management': '/components/panels/panel-user-management/index.js',
  'panel-permissions-admin': '/components/panels/panel-permissions-admin/index.js',
  'panel-session-admin': '/components/panels/panel-session-admin/index.js',
  'panel-audit-trail': '/components/panels/panel-audit-trail/index.js',
  'panel-nav-admin': '/components/panels/panel-nav-admin/index.js',
  'panel-feature-flags-admin': '/components/panels/panel-feature-flags-admin/index.js',
  'panel-user-preferences': '/components/panels/panel-user-preferences/index.js',
  'panel-orchestrator': '/components/panels/panel-orchestrator/index.js',
  'panel-status': '/components/panels/panel-status/index.js',
  'panel-profile': '/components/panels/panel-user-profile/index.js',
  'panel-preferences': '/components/panels/panel-user-preferences/index.js',
  'panel-security': '/components/panels/panel-account-security/index.js',
  'panel-sessions': '/components/panels/panel-user-sessions/index.js',
  'panel-settings': '/components/panels/panel-footer-settings/index.js',
  'panel-notifications': '/components/panels/panel-user-notifications/index.js',
  'panel-charts': '/components/panels/panel-charts/index.js',
  'panel-code': '/components/panels/panel-code/index.js',
  'panel-navrail-admin': '/components/panels/panel-navrail-admin/index.js',
  'panel-header-admin': '/components/panels/panel-header-admin/index.js',
  'panel-lotties-management': '/components/panels/panel-lotties-management/index.js',
  'panel-account-security': '/components/panels/panel-account-security/index.js',
  'panel-observability': '/components/panels/panel-observability/index.js',
  'panel-user-profile': '/components/panels/panel-user-profile/index.js',
  'panel-user-sessions': '/components/panels/panel-user-sessions/index.js',
  'panel-user-notifications': '/components/panels/panel-user-notifications/index.js',
  'panel-footer-settings': '/components/panels/panel-footer-settings/index.js',
  'panel-home': '/components/panel-home/index.js'
});

// Mapa de aliases - usado como fallback quando a rota nao tem panelId
export const ITEM_TO_PANEL = Object.freeze({
  'principal': 'panel-01',
  'geral': 'panel-02',
  'automacoes': 'panel-03',
  'bling': 'panel-bling',        // @2026-07-30: era 'panel-04' (stub 'Produtos/Bling')
  'clientes': 'panel-03',
  'colaboradores': 'panel-06',
  'rh-pessoas': 'panel-06',
  'comercial': 'panel-04',
  'procedures': 'panel-07',
  'procedures-execucao': 'panel-07',
  'compras': 'panel-08',
  'contratos': 'panel-09',
  'financeiro': 'panel-09',
  'fornecedores': 'panel-11',
  'google-ads': 'panel-12',
  'google-drive': 'panel-13',
  'importacao': 'panel-14',
  'instagram': 'panel-15',
  'operacional': 'panel-16',
  'operacional-menu': 'panel-16',
  'logistica': 'panel-16',
  'orcamento-clientes': 'panel-17',
  'pipedrive': 'panel-18',
  'produtos': 'panel-19',
  'producao': 'panel-19',
  'whatsapp': 'panel-19',
  'servidores': 'panel-health-dashboard',
  'status': 'panel-status',
  'meu-perfil': 'panel-profile',
  'preferencias': 'panel-preferences',
  'seguranca': 'panel-security',
  'sessoes': 'panel-sessions',
  'folder': 'panel-files',
  'panel-home': 'panel-home',
  'panel-financeiro': 'panel-09',
  'panel-comercial': 'panel-04',
  'panel-clientes': 'panel-03',
  'panel-pipedrive': 'panel-18',
  'dashboard': 'panel-cards',
  'home': 'panel-dashboard',
  'panel-relatorios': 'panel-19',
  'panel-database': 'panel-datahub',
  'panel-locations': 'panel-16',
  'panel-docs': 'panel-dashboard',
  'panel-api': 'panel-observability',
  'panel-help': 'panel-dashboard',
  'panel-admin-users': 'panel-user-management',
  'panel-admin-settings': 'panel-footer-settings',
  'header-admin': 'panel-header-admin',
  'lotties': 'panel-lotties-management',
  'animacoes': 'panel-lotties-management',
  'analytics': 'panel-02',
  'relatorios': 'panel-19',
  'database': 'panel-datahub',
  'arquivos': 'panel-files',
  'usuarios': 'panel-users',
  'config': 'panel-config'
});

export const CRITICAL_PANELS = Object.freeze(['panel-01', 'panel-cards', 'panel-dashboard', 'panel-09']);

export function resolvePanelPath(panelId: string) {
  // Priority 1: Direct match in PANEL_ID_PATHS
  if ((PANEL_ID_PATHS as Record<string, string>)[panelId]) {
    return (PANEL_ID_PATHS as Record<string, string>)[panelId];
  }
  
  // Priority 2: Check ITEM_TO_PANEL mapping
  const mappedPanelId = (ITEM_TO_PANEL as Record<string, string>)[panelId];
  if (mappedPanelId && (PANEL_ID_PATHS as Record<string, string>)[mappedPanelId]) {
    return (PANEL_ID_PATHS as Record<string, string>)[mappedPanelId];
  }
  
  // Priority 3: Status panels
  if (panelId.startsWith('status-')) {
    return (PANEL_ID_PATHS as Record<string, string>)['panel-status'];
  }
  
  // Priority 4: Numeric panel pattern (panel-XX)
  const panelMatch = panelId.match(/panel-(\d+)/i);
  if (panelMatch) {
    const num = panelMatch[1].padStart(2, '0');
    return `/components/panels/panel-${num}/index.js`;
  }
  
  // Priority 5: Named panel pattern (panel-name) - dynamic resolution
  const panelNameMatch = panelId.match(/^panel-(.+)$/i);
  if (panelNameMatch) {
    return `/components/panels/${panelId}/index.js`;
  }
  
  // Fallback: Try to load from components/panels/{panelId}
  return `/components/panels/${panelId}/index.js`;
}

export function resolvePanelId(rawId: string) {
  // If already a valid panel ID, return as-is
  if ((PANEL_ID_PATHS as Record<string, string>)[rawId]) {
    return rawId;
  }
  
  // Check if there's a mapping
  if ((ITEM_TO_PANEL as Record<string, string>)[rawId]) {
    return (ITEM_TO_PANEL as Record<string, string>)[rawId];
  }
  
  // Return as-is (datadriven panelId from API)
  return rawId;
}

export function info() {
  return {
    version: VERSION,
    moduleId: MODULE_ID,
    registeredPanels: Object.keys(PANEL_ID_PATHS).length,
    aliases: Object.keys(ITEM_TO_PANEL).length,
    criticalPanels: CRITICAL_PANELS.length
  };
}

export function healthCheck() {
  return {
    status: 'HEALTHY',
    version: VERSION,
    moduleId: MODULE_ID,
    checks: {
      pathsLoaded: Object.keys(PANEL_ID_PATHS).length > 0
    }
  };
}

export default {
  VERSION,
  MODULE_ID,
  PANEL_ID_PATHS,
  ITEM_TO_PANEL,
  CRITICAL_PANELS,
  resolvePanelPath,
  resolvePanelId,
  info,
  healthCheck
};
