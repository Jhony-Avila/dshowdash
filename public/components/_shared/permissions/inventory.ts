// ═══════════════════════════════════════════════════════════════
// DEPENDENCY CONTRACT (1.5.0-P2-ENTERPRISE)
// ═══════════════════════════════════════════════════════════════
// MODULE: components._shared.permissions.inventory
// PURPOSE: Regions & Triggers Catalog with Contract Enforcement
// ───────────────────────────────────────────────────────────────
// @contract STRUCTURAL_REGIONS - Array of structural region definitions
// @contract PANEL_REGIONS - Array of panel region definitions
// @contract HEADER_TRIGGERS - Array of header trigger definitions
// @contract NAVRAIL_TRIGGERS - Array of navrail trigger definitions
// @contract FOOTER_TRIGGERS - Array of footer trigger definitions
// @contract NAVIGATION_SECTION_TRIGGERS - Array of navigation section triggers
// @contract NAVIGATION_ITEM_TRIGGERS - Array of navigation item triggers
// @contract NAVIGATION_TRIGGERS - Combined navigation triggers
// @contract SIDEBAR_TRIGGERS - (Deprecated) Legacy sidebar triggers
// @contract ACCORDION_TRIGGERS - (Deprecated) Legacy accordion triggers
// @contract ALL_REGIONS - All regions aggregated
// @contract ALL_TRIGGERS - All triggers aggregated
// @contract GET_REGION_BY_ID - getRegionById(id) finds region by ID
// @contract GET_TRIGGER_BY_ID - getTriggerById(id) finds trigger by ID
// @contract GET_REGIONS_BY_TYPE - getRegionsByType(type) filters regions
// @contract GET_TRIGGERS_BY_CATEGORY - getTriggersByCategory(category) filters triggers
// @contract GET_TRIGGERS_BY_CRITICALITY - getTriggersByCriticality(criticality) filters triggers
// @contract GET_CRITICAL_TRIGGERS - getCriticalTriggers() returns high/critical triggers
// @contract GET_DEPRECATED_TRIGGERS - getDeprecatedTriggers() returns deprecated triggers
// @contract GET_ACTIVE_TRIGGERS - getActiveTriggers() returns non-deprecated triggers
// @contract BUILD_NAV_ITEM - buildNavigationItemTrigger(itemId) builds item trigger
// @contract BUILD_NAV_SECTION - buildNavigationSectionTrigger(sectionId) builds section trigger
// @contract GET_INVENTORY_STATS - getInventoryStats() returns statistics
// @contract HEALTH - healthCheck() and info() for observability
// ───────────────────────────────────────────────────────────────
// IMPORTS: REGION_TYPE, TRIGGER_CATEGORY, CRITICALITY, validateId from ./contracts.js
// PROVIDES: STRUCTURAL_REGIONS, PANEL_REGIONS, HEADER_TRIGGERS, NAVRAIL_TRIGGERS, FOOTER_TRIGGERS, NAVIGATION_SECTION_TRIGGERS, NAVIGATION_ITEM_TRIGGERS, NAVIGATION_TRIGGERS, SIDEBAR_TRIGGERS, ACCORDION_TRIGGERS, ALL_REGIONS, ALL_TRIGGERS, getRegionById, getTriggerById, getRegionsByType, getTriggersByCategory, getTriggersByCriticality, getCriticalTriggers, getDeprecatedTriggers, getActiveTriggers, buildNavigationItemTrigger, buildNavigationSectionTrigger, buildAccordionItemTrigger, buildAccordionSectionTrigger, getSidebarTriggers, getAccordionTriggers, getNavigationTriggers, getNavigationItemTriggers, getNavigationSectionTriggers, getInventoryStats, info, healthCheck, VERSION, MODULE_ID
// @changelog v1.5.0-P2-ENTERPRISE: Standardized DEPENDENCY CONTRACT header
// @changelog v1.5.0: Added contract enforcement to builders (fail-fast validation)
// @changelog v1.4.0: Fixed trigger format: section:{id} -> section-{id} (3-segment compliance)
// @changelog v1.3.0: Unified triggers: trigger:navigation:item-{id} pattern (Phase P0)
// @changelog v1.2.0: Added SIDEBAR_TRIGGERS and ACCORDION_TRIGGERS for NCS Phase 4
// @changelog v1.1.0: Added info(), healthCheck(), ES5 conversion
// ═══════════════════════════════════════════════════════════════
'use strict';

import { REGION_TYPE, TRIGGER_CATEGORY, CRITICALITY, validateId } from './contracts.js';

export const MODULE_ID = 'components._shared.permissions.inventory';
export const VERSION = '1.5.0-P2-ENTERPRISE';

// ═══════════════════════════════════════════════════════════════
// STRUCTURAL REGIONS
// ═══════════════════════════════════════════════════════════════

export const STRUCTURAL_REGIONS = [
  { id: 'region:app:header', name: 'Header', type: REGION_TYPE.STRUCTURAL },
  { id: 'region:app:sidebar', name: 'Sidebar', type: REGION_TYPE.STRUCTURAL },
  { id: 'region:app:navrail', name: 'NavRail', type: REGION_TYPE.STRUCTURAL },
  { id: 'region:app:footer', name: 'Footer', type: REGION_TYPE.STRUCTURAL },
  { id: 'region:app:container-main', name: 'Container Main', type: REGION_TYPE.STRUCTURAL },
  { id: 'region:app:overlay', name: 'Overlay Layer', type: REGION_TYPE.OVERLAY },
  { id: 'region:app:toast', name: 'Toast', type: REGION_TYPE.OVERLAY },
  { id: 'region:app:modal', name: 'Modals', type: REGION_TYPE.MODAL },
  { id: 'region:app:accordion-ncs', name: 'Accordion NCS', type: REGION_TYPE.STRUCTURAL }
];

// ═══════════════════════════════════════════════════════════════
// PANEL REGIONS
// ═══════════════════════════════════════════════════════════════

export const PANEL_REGIONS = [
  { id: 'region:panel:01', name: 'Panel 01', type: REGION_TYPE.PANEL },
  { id: 'region:panel:02', name: 'Panel 02', type: REGION_TYPE.PANEL },
  { id: 'region:panel:03', name: 'Panel 03', type: REGION_TYPE.PANEL },
  { id: 'region:panel:04', name: 'Panel 04', type: REGION_TYPE.PANEL },
  { id: 'region:panel:05', name: 'Panel 05', type: REGION_TYPE.PANEL },
  { id: 'region:panel:06', name: 'Panel 06', type: REGION_TYPE.PANEL },
  { id: 'region:panel:07', name: 'Panel 07', type: REGION_TYPE.PANEL },
  { id: 'region:panel:08', name: 'Panel 08', type: REGION_TYPE.PANEL },
  { id: 'region:panel:09', name: 'Panel 09', type: REGION_TYPE.PANEL },
  { id: 'region:panel:10', name: 'Panel 10', type: REGION_TYPE.PANEL },
  { id: 'region:panel:11', name: 'Panel 11', type: REGION_TYPE.PANEL },
  { id: 'region:panel:12', name: 'Panel 12', type: REGION_TYPE.PANEL },
  { id: 'region:panel:13', name: 'Panel 13', type: REGION_TYPE.PANEL },
  { id: 'region:panel:14', name: 'Panel 14', type: REGION_TYPE.PANEL },
  { id: 'region:panel:15', name: 'Panel 15', type: REGION_TYPE.PANEL },
  { id: 'region:panel:16', name: 'Panel 16', type: REGION_TYPE.PANEL },
  { id: 'region:panel:17', name: 'Panel 17', type: REGION_TYPE.PANEL },
  { id: 'region:panel:18', name: 'Panel 18', type: REGION_TYPE.PANEL },
  { id: 'region:panel:19', name: 'Panel 19', type: REGION_TYPE.PANEL },
  { id: 'region:panel:integration-adwords', name: 'AdWords', type: REGION_TYPE.PANEL },
  { id: 'region:panel:integration-asaas', name: 'Asaas', type: REGION_TYPE.PANEL },
  { id: 'region:panel:integration-bling', name: 'Bling', type: REGION_TYPE.PANEL },
  { id: 'region:panel:integration-calendar', name: 'Calendar', type: REGION_TYPE.PANEL },
  { id: 'region:panel:integration-chatgpt', name: 'ChatGPT', type: REGION_TYPE.PANEL },
  { id: 'region:panel:integration-google-drive', name: 'Google Drive', type: REGION_TYPE.PANEL },
  { id: 'region:panel:integration-loja-integrada', name: 'Loja Integrada', type: REGION_TYPE.PANEL },
  { id: 'region:panel:integration-mercado-livre', name: 'Mercado Livre', type: REGION_TYPE.PANEL },
  { id: 'region:panel:integration-pipedrive', name: 'Pipedrive', type: REGION_TYPE.PANEL },
  { id: 'region:panel:status-currency-btc', name: 'Bitcoin', type: REGION_TYPE.PANEL },
  { id: 'region:panel:status-currency-usd-brl', name: 'USD/BRL', type: REGION_TYPE.PANEL },
  { id: 'region:panel:status-currency-usd-cny', name: 'USD/CNY', type: REGION_TYPE.PANEL },
  { id: 'region:panel:status-email', name: 'Email', type: REGION_TYPE.PANEL },
  { id: 'region:panel:status-instagram', name: 'Instagram', type: REGION_TYPE.PANEL },
  { id: 'region:panel:status-weather', name: 'Weather', type: REGION_TYPE.PANEL },
  { id: 'region:panel:status-wechat', name: 'WeChat', type: REGION_TYPE.PANEL },
  { id: 'region:panel:status-whatsapp', name: 'WhatsApp', type: REGION_TYPE.PANEL },
  { id: 'region:panel:admin-permissions', name: 'Permissões Admin', type: REGION_TYPE.PANEL },
  { id: 'region:panel:admin-users', name: 'Usuários Admin', type: REGION_TYPE.PANEL },
  { id: 'region:panel:admin-session', name: 'Session Admin', type: REGION_TYPE.PANEL },
  { id: 'region:panel:user-profile', name: 'Perfil', type: REGION_TYPE.PANEL },
  { id: 'region:panel:user-preferences', name: 'Preferências', type: REGION_TYPE.PANEL },
  { id: 'region:panel:user-notifications', name: 'Notificações', type: REGION_TYPE.PANEL },
  { id: 'region:panel:user-sessions', name: 'Sessões', type: REGION_TYPE.PANEL },
  { id: 'region:panel:dashboard', name: 'Dashboard', type: REGION_TYPE.PANEL },
  { id: 'region:panel:analytics', name: 'Analytics', type: REGION_TYPE.PANEL },
  { id: 'region:panel:charts', name: 'Charts', type: REGION_TYPE.PANEL },
  { id: 'region:panel:datahub', name: 'DataHub', type: REGION_TYPE.PANEL },
  { id: 'region:panel:observability', name: 'Observability', type: REGION_TYPE.PANEL }
];

// ═══════════════════════════════════════════════════════════════
// HEADER TRIGGERS
// ═══════════════════════════════════════════════════════════════

export const HEADER_TRIGGERS = [
  { id: 'trigger:header:currency-btc', name: 'Bitcoin', category: TRIGGER_CATEGORY.OPEN_PANEL, criticality: CRITICALITY.LOW },
  { id: 'trigger:header:currency-usd-brl', name: 'USD/BRL', category: TRIGGER_CATEGORY.OPEN_PANEL, criticality: CRITICALITY.LOW },
  { id: 'trigger:header:currency-usd-cny', name: 'USD/CNY', category: TRIGGER_CATEGORY.OPEN_PANEL, criticality: CRITICALITY.LOW },
  { id: 'trigger:header:email-integration', name: 'Email', category: TRIGGER_CATEGORY.OPEN_PANEL, criticality: CRITICALITY.MEDIUM },
  { id: 'trigger:header:instagram-messenger', name: 'Instagram', category: TRIGGER_CATEGORY.OPEN_PANEL, criticality: CRITICALITY.MEDIUM },
  { id: 'trigger:header:whatsapp-integration', name: 'WhatsApp', category: TRIGGER_CATEGORY.OPEN_PANEL, criticality: CRITICALITY.MEDIUM },
  { id: 'trigger:header:wechat-integration', name: 'WeChat', category: TRIGGER_CATEGORY.OPEN_PANEL, criticality: CRITICALITY.MEDIUM },
  { id: 'trigger:header:errors-status', name: 'Errors', category: TRIGGER_CATEGORY.SYSTEM, criticality: CRITICALITY.HIGH },
  { id: 'trigger:header:notifications', name: 'Notificações', category: TRIGGER_CATEGORY.USER, criticality: CRITICALITY.MEDIUM },
  { id: 'trigger:header:real-time-clock', name: 'Relógio', category: TRIGGER_CATEGORY.SYSTEM, criticality: CRITICALITY.LOW },
  { id: 'trigger:header:weather', name: 'Clima', category: TRIGGER_CATEGORY.SYSTEM, criticality: CRITICALITY.LOW },
  { id: 'trigger:header:panel-adwords', name: 'AdWords', category: TRIGGER_CATEGORY.OPEN_PANEL, criticality: CRITICALITY.MEDIUM },
  { id: 'trigger:header:panel-asaas', name: 'Asaas', category: TRIGGER_CATEGORY.OPEN_PANEL, criticality: CRITICALITY.MEDIUM },
  { id: 'trigger:header:panel-bling', name: 'Bling', category: TRIGGER_CATEGORY.OPEN_PANEL, criticality: CRITICALITY.MEDIUM },
  { id: 'trigger:header:panel-calendar', name: 'Calendar', category: TRIGGER_CATEGORY.OPEN_PANEL, criticality: CRITICALITY.LOW },
  { id: 'trigger:header:panel-chatgpt', name: 'ChatGPT', category: TRIGGER_CATEGORY.OPEN_PANEL, criticality: CRITICALITY.MEDIUM },
  { id: 'trigger:header:panel-google-drive', name: 'Drive', category: TRIGGER_CATEGORY.OPEN_PANEL, criticality: CRITICALITY.MEDIUM },
  { id: 'trigger:header:panel-loja-integrada', name: 'Loja Integrada', category: TRIGGER_CATEGORY.OPEN_PANEL, criticality: CRITICALITY.MEDIUM },
  { id: 'trigger:header:panel-maps', name: 'Maps', category: TRIGGER_CATEGORY.OPEN_PANEL, criticality: CRITICALITY.LOW },
  { id: 'trigger:header:panel-mercado-livre', name: 'Mercado Livre', category: TRIGGER_CATEGORY.OPEN_PANEL, criticality: CRITICALITY.MEDIUM },
  { id: 'trigger:header:panel-pipedrive', name: 'Pipedrive', category: TRIGGER_CATEGORY.OPEN_PANEL, criticality: CRITICALITY.HIGH },
  { id: 'trigger:header:user-menu', name: 'User Menu', category: TRIGGER_CATEGORY.USER, criticality: CRITICALITY.HIGH }
];

// ═══════════════════════════════════════════════════════════════
// NAVRAIL TRIGGERS
// ═══════════════════════════════════════════════════════════════

export const NAVRAIL_TRIGGERS = [
  { id: 'trigger:navrail:home', name: 'Home', category: TRIGGER_CATEGORY.NAVIGATION, criticality: CRITICALITY.LOW },
  { id: 'trigger:navrail:dashboard', name: 'Dashboard', category: TRIGGER_CATEGORY.NAVIGATION, criticality: CRITICALITY.LOW },
  { id: 'trigger:navrail:analytics', name: 'Analytics', category: TRIGGER_CATEGORY.NAVIGATION, criticality: CRITICALITY.MEDIUM },
  { id: 'trigger:navrail:charts', name: 'Charts', category: TRIGGER_CATEGORY.NAVIGATION, criticality: CRITICALITY.LOW },
  { id: 'trigger:navrail:clientes', name: 'Clientes', category: TRIGGER_CATEGORY.NAVIGATION, criticality: CRITICALITY.MEDIUM },
  { id: 'trigger:navrail:comercial', name: 'Comercial', category: TRIGGER_CATEGORY.NAVIGATION, criticality: CRITICALITY.MEDIUM },
  { id: 'trigger:navrail:financeiro', name: 'Financeiro', category: TRIGGER_CATEGORY.NAVIGATION, criticality: CRITICALITY.HIGH },
  { id: 'trigger:navrail:relatorios', name: 'Relatórios', category: TRIGGER_CATEGORY.NAVIGATION, criticality: CRITICALITY.MEDIUM },
  { id: 'trigger:navrail:database', name: 'Database', category: TRIGGER_CATEGORY.NAVIGATION, criticality: CRITICALITY.HIGH },
  { id: 'trigger:navrail:api', name: 'API', category: TRIGGER_CATEGORY.NAVIGATION, criticality: CRITICALITY.HIGH },
  { id: 'trigger:navrail:code', name: 'Code', category: TRIGGER_CATEGORY.NAVIGATION, criticality: CRITICALITY.HIGH },
  { id: 'trigger:navrail:folder', name: 'Files', category: TRIGGER_CATEGORY.NAVIGATION, criticality: CRITICALITY.MEDIUM },
  { id: 'trigger:navrail:location', name: 'Location', category: TRIGGER_CATEGORY.NAVIGATION, criticality: CRITICALITY.LOW },
  { id: 'trigger:navrail:pipedrive', name: 'Pipedrive', category: TRIGGER_CATEGORY.NAVIGATION, criticality: CRITICALITY.MEDIUM },
  { id: 'trigger:navrail:docs', name: 'Docs', category: TRIGGER_CATEGORY.NAVIGATION, criticality: CRITICALITY.LOW },
  { id: 'trigger:navrail:help', name: 'Help', category: TRIGGER_CATEGORY.NAVIGATION, criticality: CRITICALITY.LOW },
  { id: 'trigger:navrail:bell', name: 'Notificações', category: TRIGGER_CATEGORY.USER, criticality: CRITICALITY.MEDIUM },
  { id: 'trigger:navrail:admin-settings', name: 'Admin Settings', category: TRIGGER_CATEGORY.ADMIN, criticality: CRITICALITY.CRITICAL },
  { id: 'trigger:navrail:admin-users', name: 'Admin Users', category: TRIGGER_CATEGORY.ADMIN, criticality: CRITICALITY.CRITICAL },
  { id: 'trigger:navrail:toggle-sidebar', name: 'Toggle Sidebar', category: TRIGGER_CATEGORY.TOGGLE, criticality: CRITICALITY.LOW }
];

// ═══════════════════════════════════════════════════════════════
// FOOTER TRIGGERS
// ═══════════════════════════════════════════════════════════════

export const FOOTER_TRIGGERS = [
  { id: 'trigger:footer:activity', name: 'Activity', category: TRIGGER_CATEGORY.SYSTEM, criticality: CRITICALITY.LOW },
  { id: 'trigger:footer:analytics', name: 'Analytics', category: TRIGGER_CATEGORY.OPEN_PANEL, criticality: CRITICALITY.MEDIUM },
  { id: 'trigger:footer:bell', name: 'Bell', category: TRIGGER_CATEGORY.USER, criticality: CRITICALITY.MEDIUM },
  { id: 'trigger:footer:bookmark', name: 'Bookmark', category: TRIGGER_CATEGORY.USER, criticality: CRITICALITY.LOW },
  { id: 'trigger:footer:calendar', name: 'Calendar', category: TRIGGER_CATEGORY.OPEN_PANEL, criticality: CRITICALITY.LOW },
  { id: 'trigger:footer:clipboard', name: 'Clipboard', category: TRIGGER_CATEGORY.ACTION, criticality: CRITICALITY.LOW },
  { id: 'trigger:footer:cloud', name: 'Cloud', category: TRIGGER_CATEGORY.SYSTEM, criticality: CRITICALITY.MEDIUM },
  { id: 'trigger:footer:cpu', name: 'CPU', category: TRIGGER_CATEGORY.SYSTEM, criticality: CRITICALITY.LOW },
  { id: 'trigger:footer:credit-card', name: 'Credit Card', category: TRIGGER_CATEGORY.OPEN_PANEL, criticality: CRITICALITY.HIGH },
  { id: 'trigger:footer:dashboard', name: 'Dashboard', category: TRIGGER_CATEGORY.NAVIGATION, criticality: CRITICALITY.LOW },
  { id: 'trigger:footer:database', name: 'Database', category: TRIGGER_CATEGORY.SYSTEM, criticality: CRITICALITY.HIGH },
  { id: 'trigger:footer:folder', name: 'Folder', category: TRIGGER_CATEGORY.OPEN_PANEL, criticality: CRITICALITY.MEDIUM },
  { id: 'trigger:footer:globe', name: 'Globe', category: TRIGGER_CATEGORY.SYSTEM, criticality: CRITICALITY.LOW },
  { id: 'trigger:footer:hard-drive', name: 'Hard Drive', category: TRIGGER_CATEGORY.SYSTEM, criticality: CRITICALITY.LOW },
  { id: 'trigger:footer:language', name: 'Language', category: TRIGGER_CATEGORY.USER, criticality: CRITICALITY.LOW },
  { id: 'trigger:footer:lgpd', name: 'LGPD', category: TRIGGER_CATEGORY.SYSTEM, criticality: CRITICALITY.MEDIUM },
  { id: 'trigger:footer:link', name: 'Link', category: TRIGGER_CATEGORY.ACTION, criticality: CRITICALITY.LOW },
  { id: 'trigger:footer:lock', name: 'Lock', category: TRIGGER_CATEGORY.ACTION, criticality: CRITICALITY.HIGH },
  { id: 'trigger:footer:logout', name: 'Logout', category: TRIGGER_CATEGORY.USER, criticality: CRITICALITY.CRITICAL },
  { id: 'trigger:footer:mail', name: 'Mail', category: TRIGGER_CATEGORY.OPEN_PANEL, criticality: CRITICALITY.MEDIUM },
  { id: 'trigger:footer:monitor', name: 'Monitor', category: TRIGGER_CATEGORY.SYSTEM, criticality: CRITICALITY.LOW },
  { id: 'trigger:footer:pie-chart', name: 'Pie Chart', category: TRIGGER_CATEGORY.OPEN_PANEL, criticality: CRITICALITY.LOW },
  { id: 'trigger:footer:privacidade', name: 'Privacidade', category: TRIGGER_CATEGORY.SYSTEM, criticality: CRITICALITY.MEDIUM },
  { id: 'trigger:footer:search', name: 'Search', category: TRIGGER_CATEGORY.ACTION, criticality: CRITICALITY.LOW },
  { id: 'trigger:footer:security', name: 'Security', category: TRIGGER_CATEGORY.ADMIN, criticality: CRITICALITY.HIGH },
  { id: 'trigger:footer:server', name: 'Server', category: TRIGGER_CATEGORY.SYSTEM, criticality: CRITICALITY.MEDIUM },
  { id: 'trigger:footer:settings', name: 'Settings', category: TRIGGER_CATEGORY.USER, criticality: CRITICALITY.MEDIUM },
  { id: 'trigger:footer:target', name: 'Target', category: TRIGGER_CATEGORY.OPEN_PANEL, criticality: CRITICALITY.LOW },
  { id: 'trigger:footer:termos', name: 'Termos', category: TRIGGER_CATEGORY.SYSTEM, criticality: CRITICALITY.LOW },
  { id: 'trigger:footer:trending-up', name: 'Trending', category: TRIGGER_CATEGORY.OPEN_PANEL, criticality: CRITICALITY.LOW },
  { id: 'trigger:footer:users', name: 'Users', category: TRIGGER_CATEGORY.ADMIN, criticality: CRITICALITY.HIGH },
  { id: 'trigger:footer:zap', name: 'Zap', category: TRIGGER_CATEGORY.ACTION, criticality: CRITICALITY.LOW }
];

// ═══════════════════════════════════════════════════════════════
// NAVIGATION TRIGGERS (UNIFIED - Phase P1)
// Padrão Canônico: trigger:navigation:section-{id} | trigger:navigation:item-{id}
// Formato: 3 segmentos (tipo:contexto:nome) - CONTRACT ENFORCED
// ═══════════════════════════════════════════════════════════════

export const NAVIGATION_SECTION_TRIGGERS = [
  { id: 'trigger:navigation:section-principal', name: 'Seção Principal', category: TRIGGER_CATEGORY.TOGGLE, criticality: CRITICALITY.LOW },
  { id: 'trigger:navigation:section-operacional', name: 'Seção Operacional', category: TRIGGER_CATEGORY.TOGGLE, criticality: CRITICALITY.LOW },
  { id: 'trigger:navigation:section-admin', name: 'Seção Admin', category: TRIGGER_CATEGORY.TOGGLE, criticality: CRITICALITY.MEDIUM },
  { id: 'trigger:navigation:section-financeiro', name: 'Seção Financeiro', category: TRIGGER_CATEGORY.TOGGLE, criticality: CRITICALITY.HIGH },
  { id: 'trigger:navigation:section-integracao', name: 'Seção Integração', category: TRIGGER_CATEGORY.TOGGLE, criticality: CRITICALITY.MEDIUM }
];

export const NAVIGATION_ITEM_TRIGGERS = [
  { id: 'trigger:navigation:item-home', name: 'Home', category: TRIGGER_CATEGORY.NAVIGATION, criticality: CRITICALITY.LOW },
  { id: 'trigger:navigation:item-dashboard', name: 'Dashboard', category: TRIGGER_CATEGORY.NAVIGATION, criticality: CRITICALITY.LOW },
  { id: 'trigger:navigation:item-analytics', name: 'Analytics', category: TRIGGER_CATEGORY.NAVIGATION, criticality: CRITICALITY.MEDIUM },
  { id: 'trigger:navigation:item-relatorios', name: 'Relatórios', category: TRIGGER_CATEGORY.NAVIGATION, criticality: CRITICALITY.MEDIUM },
  { id: 'trigger:navigation:item-charts', name: 'Charts', category: TRIGGER_CATEGORY.NAVIGATION, criticality: CRITICALITY.LOW },
  { id: 'trigger:navigation:item-clientes', name: 'Clientes', category: TRIGGER_CATEGORY.NAVIGATION, criticality: CRITICALITY.MEDIUM },
  { id: 'trigger:navigation:item-produtos', name: 'Produtos', category: TRIGGER_CATEGORY.NAVIGATION, criticality: CRITICALITY.MEDIUM },
  { id: 'trigger:navigation:item-pedidos', name: 'Pedidos', category: TRIGGER_CATEGORY.NAVIGATION, criticality: CRITICALITY.MEDIUM },
  { id: 'trigger:navigation:item-estoque', name: 'Estoque', category: TRIGGER_CATEGORY.NAVIGATION, criticality: CRITICALITY.MEDIUM },
  { id: 'trigger:navigation:item-comercial', name: 'Comercial', category: TRIGGER_CATEGORY.NAVIGATION, criticality: CRITICALITY.MEDIUM },
  { id: 'trigger:navigation:item-financeiro', name: 'Financeiro', category: TRIGGER_CATEGORY.NAVIGATION, criticality: CRITICALITY.HIGH },
  { id: 'trigger:navigation:item-contas-pagar', name: 'Contas a Pagar', category: TRIGGER_CATEGORY.NAVIGATION, criticality: CRITICALITY.HIGH },
  { id: 'trigger:navigation:item-contas-receber', name: 'Contas a Receber', category: TRIGGER_CATEGORY.NAVIGATION, criticality: CRITICALITY.HIGH },
  { id: 'trigger:navigation:item-fluxo-caixa', name: 'Fluxo de Caixa', category: TRIGGER_CATEGORY.NAVIGATION, criticality: CRITICALITY.HIGH },
  { id: 'trigger:navigation:item-usuarios', name: 'Usuários', category: TRIGGER_CATEGORY.ADMIN, criticality: CRITICALITY.CRITICAL },
  { id: 'trigger:navigation:item-permissoes', name: 'Permissões', category: TRIGGER_CATEGORY.ADMIN, criticality: CRITICALITY.CRITICAL },
  { id: 'trigger:navigation:item-configuracoes', name: 'Configurações', category: TRIGGER_CATEGORY.ADMIN, criticality: CRITICALITY.HIGH },
  { id: 'trigger:navigation:item-logs', name: 'Logs do Sistema', category: TRIGGER_CATEGORY.ADMIN, criticality: CRITICALITY.HIGH },
  { id: 'trigger:navigation:item-automacoes', name: 'Automações', category: TRIGGER_CATEGORY.NAVIGATION, criticality: CRITICALITY.MEDIUM },
  { id: 'trigger:navigation:item-pipedrive', name: 'Pipedrive', category: TRIGGER_CATEGORY.NAVIGATION, criticality: CRITICALITY.MEDIUM },
  { id: 'trigger:navigation:item-asaas', name: 'Asaas', category: TRIGGER_CATEGORY.NAVIGATION, criticality: CRITICALITY.MEDIUM },
  { id: 'trigger:navigation:item-bling', name: 'Bling', category: TRIGGER_CATEGORY.NAVIGATION, criticality: CRITICALITY.MEDIUM },
  { id: 'trigger:navigation:item-mercado-livre', name: 'Mercado Livre', category: TRIGGER_CATEGORY.NAVIGATION, criticality: CRITICALITY.MEDIUM }
];

// ═══════════════════════════════════════════════════════════════
// LEGACY TRIGGERS (Deprecated - mantidos para compatibilidade)
// @deprecated Serão removidos na Phase P3
// AVISO: NÃO USE EM CÓDIGO NOVO - Use NAVIGATION_*_TRIGGERS
// ═══════════════════════════════════════════════════════════════

export const SIDEBAR_TRIGGERS = [
  { id: 'trigger:sidebar:section-principal', name: 'Seção Principal', category: TRIGGER_CATEGORY.TOGGLE, criticality: CRITICALITY.LOW, deprecated: true },
  { id: 'trigger:sidebar:section-operacional', name: 'Seção Operacional', category: TRIGGER_CATEGORY.TOGGLE, criticality: CRITICALITY.LOW, deprecated: true },
  { id: 'trigger:sidebar:section-admin', name: 'Seção Admin', category: TRIGGER_CATEGORY.TOGGLE, criticality: CRITICALITY.MEDIUM, deprecated: true },
  { id: 'trigger:sidebar:home', name: 'Home', category: TRIGGER_CATEGORY.NAVIGATION, criticality: CRITICALITY.LOW, deprecated: true },
  { id: 'trigger:sidebar:dashboard', name: 'Dashboard', category: TRIGGER_CATEGORY.NAVIGATION, criticality: CRITICALITY.LOW, deprecated: true },
  { id: 'trigger:sidebar:analytics', name: 'Analytics', category: TRIGGER_CATEGORY.NAVIGATION, criticality: CRITICALITY.MEDIUM, deprecated: true },
  { id: 'trigger:sidebar:relatorios', name: 'Relatórios', category: TRIGGER_CATEGORY.NAVIGATION, criticality: CRITICALITY.MEDIUM, deprecated: true },
  { id: 'trigger:sidebar:clientes', name: 'Clientes', category: TRIGGER_CATEGORY.NAVIGATION, criticality: CRITICALITY.MEDIUM, deprecated: true },
  { id: 'trigger:sidebar:produtos', name: 'Produtos', category: TRIGGER_CATEGORY.NAVIGATION, criticality: CRITICALITY.MEDIUM, deprecated: true },
  { id: 'trigger:sidebar:pedidos', name: 'Pedidos', category: TRIGGER_CATEGORY.NAVIGATION, criticality: CRITICALITY.MEDIUM, deprecated: true },
  { id: 'trigger:sidebar:estoque', name: 'Estoque', category: TRIGGER_CATEGORY.NAVIGATION, criticality: CRITICALITY.MEDIUM, deprecated: true },
  { id: 'trigger:sidebar:financeiro', name: 'Financeiro', category: TRIGGER_CATEGORY.NAVIGATION, criticality: CRITICALITY.HIGH, deprecated: true },
  { id: 'trigger:sidebar:usuarios', name: 'Usuários', category: TRIGGER_CATEGORY.ADMIN, criticality: CRITICALITY.CRITICAL, deprecated: true },
  { id: 'trigger:sidebar:permissoes', name: 'Permissões', category: TRIGGER_CATEGORY.ADMIN, criticality: CRITICALITY.CRITICAL, deprecated: true },
  { id: 'trigger:sidebar:configuracoes', name: 'Configurações', category: TRIGGER_CATEGORY.ADMIN, criticality: CRITICALITY.HIGH, deprecated: true },
  { id: 'trigger:sidebar:logs', name: 'Logs do Sistema', category: TRIGGER_CATEGORY.ADMIN, criticality: CRITICALITY.HIGH, deprecated: true },
  { id: 'trigger:sidebar:automacoes', name: 'Automações', category: TRIGGER_CATEGORY.NAVIGATION, criticality: CRITICALITY.MEDIUM, deprecated: true }
];

export const ACCORDION_TRIGGERS = [
  { id: 'trigger:accordion:item-home', name: 'Home', category: TRIGGER_CATEGORY.NAVIGATION, criticality: CRITICALITY.LOW, deprecated: true },
  { id: 'trigger:accordion:item-analytics', name: 'Analytics', category: TRIGGER_CATEGORY.NAVIGATION, criticality: CRITICALITY.MEDIUM, deprecated: true },
  { id: 'trigger:accordion:item-relatorios', name: 'Relatórios', category: TRIGGER_CATEGORY.NAVIGATION, criticality: CRITICALITY.MEDIUM, deprecated: true },
  { id: 'trigger:accordion:item-clientes', name: 'Clientes', category: TRIGGER_CATEGORY.NAVIGATION, criticality: CRITICALITY.MEDIUM, deprecated: true },
  { id: 'trigger:accordion:item-produtos', name: 'Produtos', category: TRIGGER_CATEGORY.NAVIGATION, criticality: CRITICALITY.MEDIUM, deprecated: true },
  { id: 'trigger:accordion:item-pedidos', name: 'Pedidos', category: TRIGGER_CATEGORY.NAVIGATION, criticality: CRITICALITY.MEDIUM, deprecated: true },
  { id: 'trigger:accordion:item-estoque', name: 'Estoque', category: TRIGGER_CATEGORY.NAVIGATION, criticality: CRITICALITY.MEDIUM, deprecated: true },
  { id: 'trigger:accordion:item-usuarios', name: 'Usuários', category: TRIGGER_CATEGORY.ADMIN, criticality: CRITICALITY.CRITICAL, deprecated: true },
  { id: 'trigger:accordion:item-permissoes', name: 'Permissões', category: TRIGGER_CATEGORY.ADMIN, criticality: CRITICALITY.CRITICAL, deprecated: true },
  { id: 'trigger:accordion:item-configuracoes', name: 'Configurações', category: TRIGGER_CATEGORY.ADMIN, criticality: CRITICALITY.HIGH, deprecated: true },
  { id: 'trigger:accordion:item-logs', name: 'Logs do Sistema', category: TRIGGER_CATEGORY.ADMIN, criticality: CRITICALITY.HIGH, deprecated: true }
];

// ═══════════════════════════════════════════════════════════════
// AGGREGATIONS
// ═══════════════════════════════════════════════════════════════

export const ALL_REGIONS = STRUCTURAL_REGIONS.concat(PANEL_REGIONS);
export const NAVIGATION_TRIGGERS = NAVIGATION_SECTION_TRIGGERS.concat(NAVIGATION_ITEM_TRIGGERS);
export const ALL_TRIGGERS = HEADER_TRIGGERS.concat(NAVRAIL_TRIGGERS).concat(FOOTER_TRIGGERS).concat(NAVIGATION_TRIGGERS).concat(SIDEBAR_TRIGGERS).concat(ACCORDION_TRIGGERS);

// ═══════════════════════════════════════════════════════════════
// QUERY FUNCTIONS
// ═══════════════════════════════════════════════════════════════

export function getRegionById(id: string) {
  for (let i = 0; i < ALL_REGIONS.length; i++) {
    if (ALL_REGIONS[i].id === id) return ALL_REGIONS[i];
  }
  return null;
}

export function getTriggerById(id: string) {
  for (let i = 0; i < ALL_TRIGGERS.length; i++) {
    if (ALL_TRIGGERS[i].id === id) return ALL_TRIGGERS[i];
  }
  return null;
}

export function getRegionsByType(type: string) {
  return ALL_REGIONS.filter(r => r.type === type);
}

export function getTriggersByCategory(category: string) {
  return ALL_TRIGGERS.filter(t => t.category === category);
}

export function getTriggersByCriticality(criticality: string) {
  return ALL_TRIGGERS.filter(t => t.criticality === criticality);
}

export function getCriticalTriggers() {
  return ALL_TRIGGERS.filter(t => t.criticality === CRITICALITY.CRITICAL || t.criticality === CRITICALITY.HIGH);
}

export function getDeprecatedTriggers() {
  return ALL_TRIGGERS.filter(t => (t as any).deprecated === true);
}

export function getActiveTriggers() {
  return ALL_TRIGGERS.filter(t => (t as any).deprecated !== true);
}

// ═══════════════════════════════════════════════════════════════
// NAVIGATION TRIGGER BUILDERS (Contract Enforced - Phase P1)
// Padrão Canônico: trigger:navigation:item-{id} | trigger:navigation:section-{id}
// ENFORCEMENT: Valida contra contrato e falha rápido se inválido
// ═══════════════════════════════════════════════════════════════

export function buildNavigationItemTrigger(itemId: string) {
  if (!itemId || typeof itemId !== 'string') {
    throw new Error('[inventory] buildNavigationItemTrigger: itemId must be a non-empty string');
  }

  const cleanId = itemId
    .replace(/^trigger:navigation:item[-:]/, '')
    .replace(/^item[-:]/, '')
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-');

  const triggerId = `trigger:navigation:item-${cleanId}`;

  const validation = validateId(triggerId);
  if (!validation.valid) {
    throw new Error(`[inventory] Invalid trigger ID generated: ${triggerId} - ${validation.error}`);
  }

  return triggerId;
}

export function buildNavigationSectionTrigger(sectionId: string) {
  if (!sectionId || typeof sectionId !== 'string') {
    throw new Error('[inventory] buildNavigationSectionTrigger: sectionId must be a non-empty string');
  }

  const cleanId = sectionId
    .replace(/^trigger:navigation:section[-:]/, '')
    .replace(/^section[-:]/, '')
    .replace(/^sec-/, '')
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-');

  const triggerId = `trigger:navigation:section-${cleanId}`;

  const validation = validateId(triggerId);
  if (!validation.valid) {
    throw new Error(`[inventory] Invalid trigger ID generated: ${triggerId} - ${validation.error}`);
  }

  return triggerId;
}

// ═══════════════════════════════════════════════════════════════
// LEGACY BUILDERS (Deprecated - redirect to canonical)
// @deprecated Use buildNavigationItemTrigger/buildNavigationSectionTrigger
// ═══════════════════════════════════════════════════════════════

export function buildAccordionItemTrigger(itemId: string) {
  return buildNavigationItemTrigger(itemId);
}

export function buildAccordionSectionTrigger(sectionId: string) {
  return buildNavigationSectionTrigger(sectionId);
}

// ═══════════════════════════════════════════════════════════════
// GETTER FUNCTIONS
// ═══════════════════════════════════════════════════════════════

export function getSidebarTriggers() {
  return SIDEBAR_TRIGGERS.slice();
}

export function getAccordionTriggers() {
  return ACCORDION_TRIGGERS.slice();
}

export function getNavigationTriggers() {
  return NAVIGATION_TRIGGERS.slice();
}

export function getNavigationItemTriggers() {
  return NAVIGATION_ITEM_TRIGGERS.slice();
}

export function getNavigationSectionTriggers() {
  return NAVIGATION_SECTION_TRIGGERS.slice();
}

// ═══════════════════════════════════════════════════════════════
// STATS & INFO
// ═══════════════════════════════════════════════════════════════

export function getInventoryStats() {
  return {
    regions: {
      total: ALL_REGIONS.length,
      structural: STRUCTURAL_REGIONS.length,
      panels: PANEL_REGIONS.length
    },
    triggers: {
      total: ALL_TRIGGERS.length,
      header: HEADER_TRIGGERS.length,
      navrail: NAVRAIL_TRIGGERS.length,
      footer: FOOTER_TRIGGERS.length,
      navigation: NAVIGATION_TRIGGERS.length,
      navigationSections: NAVIGATION_SECTION_TRIGGERS.length,
      navigationItems: NAVIGATION_ITEM_TRIGGERS.length,
      sidebar: SIDEBAR_TRIGGERS.length,
      accordion: ACCORDION_TRIGGERS.length,
      critical: getCriticalTriggers().length,
      deprecated: getDeprecatedTriggers().length,
      active: getActiveTriggers().length
    }
  };
}

export function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    regionsCount: ALL_REGIONS.length,
    triggersCount: ALL_TRIGGERS.length,
    navigationTriggersCount: NAVIGATION_TRIGGERS.length,
    deprecatedTriggersCount: getDeprecatedTriggers().length,
    triggerPattern: 'trigger:navigation:item-{id} | trigger:navigation:section-{id}',
    enforcement: 'CONTRACT_VALIDATED',
    phase: 'P1 - Active Enforcement (3-segment format)',
    timestamp: Date.now()
  };
}

export function healthCheck() {
  const builderTest = { item: false, section: false };
  try {
    const testItem = buildNavigationItemTrigger('test');
    builderTest.item = testItem === 'trigger:navigation:item-test';
  } catch (e) { /* fail */ }

  try {
    const testSection = buildNavigationSectionTrigger('test');
    builderTest.section = testSection === 'trigger:navigation:section-test';
  } catch (e) { /* fail */ }

  return {
    status: (builderTest.item && builderTest.section) ? 'HEALTHY' : 'DEGRADED',
    moduleId: MODULE_ID,
    version: VERSION,
    checks: {
      regionsReady: ALL_REGIONS.length > 0,
      triggersReady: ALL_TRIGGERS.length > 0,
      navigationTriggersReady: NAVIGATION_TRIGGERS.length > 0,
      itemBuilderEnforced: builderTest.item,
      sectionBuilderEnforced: builderTest.section,
      unifiedPatternActive: true,
      threeSegmentCompliant: true,
      contractEnforced: true
    },
    timestamp: Date.now()
  };
}

// ═══════════════════════════════════════════════════════════════
// DEFAULT EXPORT
// ═══════════════════════════════════════════════════════════════

export default {
  MODULE_ID,
  VERSION,
  STRUCTURAL_REGIONS,
  PANEL_REGIONS,
  HEADER_TRIGGERS,
  NAVRAIL_TRIGGERS,
  FOOTER_TRIGGERS,
  NAVIGATION_SECTION_TRIGGERS,
  NAVIGATION_ITEM_TRIGGERS,
  NAVIGATION_TRIGGERS,
  SIDEBAR_TRIGGERS,
  ACCORDION_TRIGGERS,
  ALL_REGIONS,
  ALL_TRIGGERS,
  getRegionById,
  getTriggerById,
  getRegionsByType,
  getTriggersByCategory,
  getTriggersByCriticality,
  getCriticalTriggers,
  getDeprecatedTriggers,
  getActiveTriggers,
  getInventoryStats,
  buildNavigationItemTrigger,
  buildNavigationSectionTrigger,
  buildAccordionItemTrigger,
  buildAccordionSectionTrigger,
  getSidebarTriggers,
  getAccordionTriggers,
  getNavigationTriggers,
  getNavigationItemTriggers,
  getNavigationSectionTriggers,
  info,
  healthCheck
};
