import { REGION_TYPE, TRIGGER_CATEGORY, CRITICALITY, validateId } from "./contracts.js";
const MODULE_ID = "components._shared.permissions.inventory";
const VERSION = "1.5.0-P2-ENTERPRISE";
const STRUCTURAL_REGIONS = [
  { id: "region:app:header", name: "Header", type: REGION_TYPE.STRUCTURAL },
  { id: "region:app:sidebar", name: "Sidebar", type: REGION_TYPE.STRUCTURAL },
  { id: "region:app:navrail", name: "NavRail", type: REGION_TYPE.STRUCTURAL },
  { id: "region:app:footer", name: "Footer", type: REGION_TYPE.STRUCTURAL },
  { id: "region:app:container-main", name: "Container Main", type: REGION_TYPE.STRUCTURAL },
  { id: "region:app:overlay", name: "Overlay Layer", type: REGION_TYPE.OVERLAY },
  { id: "region:app:toast", name: "Toast", type: REGION_TYPE.OVERLAY },
  { id: "region:app:modal", name: "Modals", type: REGION_TYPE.MODAL },
  { id: "region:app:accordion-ncs", name: "Accordion NCS", type: REGION_TYPE.STRUCTURAL }
];
const PANEL_REGIONS = [
  { id: "region:panel:01", name: "Panel 01", type: REGION_TYPE.PANEL },
  { id: "region:panel:02", name: "Panel 02", type: REGION_TYPE.PANEL },
  { id: "region:panel:03", name: "Panel 03", type: REGION_TYPE.PANEL },
  { id: "region:panel:04", name: "Panel 04", type: REGION_TYPE.PANEL },
  { id: "region:panel:05", name: "Panel 05", type: REGION_TYPE.PANEL },
  { id: "region:panel:06", name: "Panel 06", type: REGION_TYPE.PANEL },
  { id: "region:panel:07", name: "Panel 07", type: REGION_TYPE.PANEL },
  { id: "region:panel:08", name: "Panel 08", type: REGION_TYPE.PANEL },
  { id: "region:panel:09", name: "Panel 09", type: REGION_TYPE.PANEL },
  { id: "region:panel:10", name: "Panel 10", type: REGION_TYPE.PANEL },
  { id: "region:panel:11", name: "Panel 11", type: REGION_TYPE.PANEL },
  { id: "region:panel:12", name: "Panel 12", type: REGION_TYPE.PANEL },
  { id: "region:panel:13", name: "Panel 13", type: REGION_TYPE.PANEL },
  { id: "region:panel:14", name: "Panel 14", type: REGION_TYPE.PANEL },
  { id: "region:panel:15", name: "Panel 15", type: REGION_TYPE.PANEL },
  { id: "region:panel:16", name: "Panel 16", type: REGION_TYPE.PANEL },
  { id: "region:panel:17", name: "Panel 17", type: REGION_TYPE.PANEL },
  { id: "region:panel:18", name: "Panel 18", type: REGION_TYPE.PANEL },
  { id: "region:panel:19", name: "Panel 19", type: REGION_TYPE.PANEL },
  { id: "region:panel:integration-adwords", name: "AdWords", type: REGION_TYPE.PANEL },
  { id: "region:panel:integration-asaas", name: "Asaas", type: REGION_TYPE.PANEL },
  { id: "region:panel:integration-bling", name: "Bling", type: REGION_TYPE.PANEL },
  { id: "region:panel:integration-calendar", name: "Calendar", type: REGION_TYPE.PANEL },
  { id: "region:panel:integration-chatgpt", name: "ChatGPT", type: REGION_TYPE.PANEL },
  { id: "region:panel:integration-google-drive", name: "Google Drive", type: REGION_TYPE.PANEL },
  { id: "region:panel:integration-loja-integrada", name: "Loja Integrada", type: REGION_TYPE.PANEL },
  { id: "region:panel:integration-mercado-livre", name: "Mercado Livre", type: REGION_TYPE.PANEL },
  { id: "region:panel:integration-pipedrive", name: "Pipedrive", type: REGION_TYPE.PANEL },
  { id: "region:panel:status-currency-btc", name: "Bitcoin", type: REGION_TYPE.PANEL },
  { id: "region:panel:status-currency-usd-brl", name: "USD/BRL", type: REGION_TYPE.PANEL },
  { id: "region:panel:status-currency-usd-cny", name: "USD/CNY", type: REGION_TYPE.PANEL },
  { id: "region:panel:status-email", name: "Email", type: REGION_TYPE.PANEL },
  { id: "region:panel:status-instagram", name: "Instagram", type: REGION_TYPE.PANEL },
  { id: "region:panel:status-weather", name: "Weather", type: REGION_TYPE.PANEL },
  { id: "region:panel:status-wechat", name: "WeChat", type: REGION_TYPE.PANEL },
  { id: "region:panel:status-whatsapp", name: "WhatsApp", type: REGION_TYPE.PANEL },
  { id: "region:panel:admin-permissions", name: "Permiss\xF5es Admin", type: REGION_TYPE.PANEL },
  { id: "region:panel:admin-users", name: "Usu\xE1rios Admin", type: REGION_TYPE.PANEL },
  { id: "region:panel:admin-session", name: "Session Admin", type: REGION_TYPE.PANEL },
  { id: "region:panel:user-profile", name: "Perfil", type: REGION_TYPE.PANEL },
  { id: "region:panel:user-preferences", name: "Prefer\xEAncias", type: REGION_TYPE.PANEL },
  { id: "region:panel:user-notifications", name: "Notifica\xE7\xF5es", type: REGION_TYPE.PANEL },
  { id: "region:panel:user-sessions", name: "Sess\xF5es", type: REGION_TYPE.PANEL },
  { id: "region:panel:dashboard", name: "Dashboard", type: REGION_TYPE.PANEL },
  { id: "region:panel:analytics", name: "Analytics", type: REGION_TYPE.PANEL },
  { id: "region:panel:charts", name: "Charts", type: REGION_TYPE.PANEL },
  { id: "region:panel:datahub", name: "DataHub", type: REGION_TYPE.PANEL },
  { id: "region:panel:observability", name: "Observability", type: REGION_TYPE.PANEL }
];
const HEADER_TRIGGERS = [
  { id: "trigger:header:currency-btc", name: "Bitcoin", category: TRIGGER_CATEGORY.OPEN_PANEL, criticality: CRITICALITY.LOW },
  { id: "trigger:header:currency-usd-brl", name: "USD/BRL", category: TRIGGER_CATEGORY.OPEN_PANEL, criticality: CRITICALITY.LOW },
  { id: "trigger:header:currency-usd-cny", name: "USD/CNY", category: TRIGGER_CATEGORY.OPEN_PANEL, criticality: CRITICALITY.LOW },
  { id: "trigger:header:email-integration", name: "Email", category: TRIGGER_CATEGORY.OPEN_PANEL, criticality: CRITICALITY.MEDIUM },
  { id: "trigger:header:instagram-messenger", name: "Instagram", category: TRIGGER_CATEGORY.OPEN_PANEL, criticality: CRITICALITY.MEDIUM },
  { id: "trigger:header:whatsapp-integration", name: "WhatsApp", category: TRIGGER_CATEGORY.OPEN_PANEL, criticality: CRITICALITY.MEDIUM },
  { id: "trigger:header:wechat-integration", name: "WeChat", category: TRIGGER_CATEGORY.OPEN_PANEL, criticality: CRITICALITY.MEDIUM },
  { id: "trigger:header:errors-status", name: "Errors", category: TRIGGER_CATEGORY.SYSTEM, criticality: CRITICALITY.HIGH },
  { id: "trigger:header:notifications", name: "Notifica\xE7\xF5es", category: TRIGGER_CATEGORY.USER, criticality: CRITICALITY.MEDIUM },
  { id: "trigger:header:real-time-clock", name: "Rel\xF3gio", category: TRIGGER_CATEGORY.SYSTEM, criticality: CRITICALITY.LOW },
  { id: "trigger:header:weather", name: "Clima", category: TRIGGER_CATEGORY.SYSTEM, criticality: CRITICALITY.LOW },
  { id: "trigger:header:panel-adwords", name: "AdWords", category: TRIGGER_CATEGORY.OPEN_PANEL, criticality: CRITICALITY.MEDIUM },
  { id: "trigger:header:panel-asaas", name: "Asaas", category: TRIGGER_CATEGORY.OPEN_PANEL, criticality: CRITICALITY.MEDIUM },
  { id: "trigger:header:panel-bling", name: "Bling", category: TRIGGER_CATEGORY.OPEN_PANEL, criticality: CRITICALITY.MEDIUM },
  { id: "trigger:header:panel-calendar", name: "Calendar", category: TRIGGER_CATEGORY.OPEN_PANEL, criticality: CRITICALITY.LOW },
  { id: "trigger:header:panel-chatgpt", name: "ChatGPT", category: TRIGGER_CATEGORY.OPEN_PANEL, criticality: CRITICALITY.MEDIUM },
  { id: "trigger:header:panel-google-drive", name: "Drive", category: TRIGGER_CATEGORY.OPEN_PANEL, criticality: CRITICALITY.MEDIUM },
  { id: "trigger:header:panel-loja-integrada", name: "Loja Integrada", category: TRIGGER_CATEGORY.OPEN_PANEL, criticality: CRITICALITY.MEDIUM },
  { id: "trigger:header:panel-maps", name: "Maps", category: TRIGGER_CATEGORY.OPEN_PANEL, criticality: CRITICALITY.LOW },
  { id: "trigger:header:panel-mercado-livre", name: "Mercado Livre", category: TRIGGER_CATEGORY.OPEN_PANEL, criticality: CRITICALITY.MEDIUM },
  { id: "trigger:header:panel-pipedrive", name: "Pipedrive", category: TRIGGER_CATEGORY.OPEN_PANEL, criticality: CRITICALITY.HIGH },
  { id: "trigger:header:user-menu", name: "User Menu", category: TRIGGER_CATEGORY.USER, criticality: CRITICALITY.HIGH }
];
const NAVRAIL_TRIGGERS = [
  { id: "trigger:navrail:home", name: "Home", category: TRIGGER_CATEGORY.NAVIGATION, criticality: CRITICALITY.LOW },
  { id: "trigger:navrail:dashboard", name: "Dashboard", category: TRIGGER_CATEGORY.NAVIGATION, criticality: CRITICALITY.LOW },
  { id: "trigger:navrail:analytics", name: "Analytics", category: TRIGGER_CATEGORY.NAVIGATION, criticality: CRITICALITY.MEDIUM },
  { id: "trigger:navrail:charts", name: "Charts", category: TRIGGER_CATEGORY.NAVIGATION, criticality: CRITICALITY.LOW },
  { id: "trigger:navrail:clientes", name: "Clientes", category: TRIGGER_CATEGORY.NAVIGATION, criticality: CRITICALITY.MEDIUM },
  { id: "trigger:navrail:comercial", name: "Comercial", category: TRIGGER_CATEGORY.NAVIGATION, criticality: CRITICALITY.MEDIUM },
  { id: "trigger:navrail:financeiro", name: "Financeiro", category: TRIGGER_CATEGORY.NAVIGATION, criticality: CRITICALITY.HIGH },
  { id: "trigger:navrail:relatorios", name: "Relat\xF3rios", category: TRIGGER_CATEGORY.NAVIGATION, criticality: CRITICALITY.MEDIUM },
  { id: "trigger:navrail:database", name: "Database", category: TRIGGER_CATEGORY.NAVIGATION, criticality: CRITICALITY.HIGH },
  { id: "trigger:navrail:api", name: "API", category: TRIGGER_CATEGORY.NAVIGATION, criticality: CRITICALITY.HIGH },
  { id: "trigger:navrail:code", name: "Code", category: TRIGGER_CATEGORY.NAVIGATION, criticality: CRITICALITY.HIGH },
  { id: "trigger:navrail:folder", name: "Files", category: TRIGGER_CATEGORY.NAVIGATION, criticality: CRITICALITY.MEDIUM },
  { id: "trigger:navrail:location", name: "Location", category: TRIGGER_CATEGORY.NAVIGATION, criticality: CRITICALITY.LOW },
  { id: "trigger:navrail:pipedrive", name: "Pipedrive", category: TRIGGER_CATEGORY.NAVIGATION, criticality: CRITICALITY.MEDIUM },
  { id: "trigger:navrail:docs", name: "Docs", category: TRIGGER_CATEGORY.NAVIGATION, criticality: CRITICALITY.LOW },
  { id: "trigger:navrail:help", name: "Help", category: TRIGGER_CATEGORY.NAVIGATION, criticality: CRITICALITY.LOW },
  { id: "trigger:navrail:bell", name: "Notifica\xE7\xF5es", category: TRIGGER_CATEGORY.USER, criticality: CRITICALITY.MEDIUM },
  { id: "trigger:navrail:admin-settings", name: "Admin Settings", category: TRIGGER_CATEGORY.ADMIN, criticality: CRITICALITY.CRITICAL },
  { id: "trigger:navrail:admin-users", name: "Admin Users", category: TRIGGER_CATEGORY.ADMIN, criticality: CRITICALITY.CRITICAL },
  { id: "trigger:navrail:toggle-sidebar", name: "Toggle Sidebar", category: TRIGGER_CATEGORY.TOGGLE, criticality: CRITICALITY.LOW }
];
const FOOTER_TRIGGERS = [
  { id: "trigger:footer:activity", name: "Activity", category: TRIGGER_CATEGORY.SYSTEM, criticality: CRITICALITY.LOW },
  { id: "trigger:footer:analytics", name: "Analytics", category: TRIGGER_CATEGORY.OPEN_PANEL, criticality: CRITICALITY.MEDIUM },
  { id: "trigger:footer:bell", name: "Bell", category: TRIGGER_CATEGORY.USER, criticality: CRITICALITY.MEDIUM },
  { id: "trigger:footer:bookmark", name: "Bookmark", category: TRIGGER_CATEGORY.USER, criticality: CRITICALITY.LOW },
  { id: "trigger:footer:calendar", name: "Calendar", category: TRIGGER_CATEGORY.OPEN_PANEL, criticality: CRITICALITY.LOW },
  { id: "trigger:footer:clipboard", name: "Clipboard", category: TRIGGER_CATEGORY.ACTION, criticality: CRITICALITY.LOW },
  { id: "trigger:footer:cloud", name: "Cloud", category: TRIGGER_CATEGORY.SYSTEM, criticality: CRITICALITY.MEDIUM },
  { id: "trigger:footer:cpu", name: "CPU", category: TRIGGER_CATEGORY.SYSTEM, criticality: CRITICALITY.LOW },
  { id: "trigger:footer:credit-card", name: "Credit Card", category: TRIGGER_CATEGORY.OPEN_PANEL, criticality: CRITICALITY.HIGH },
  { id: "trigger:footer:dashboard", name: "Dashboard", category: TRIGGER_CATEGORY.NAVIGATION, criticality: CRITICALITY.LOW },
  { id: "trigger:footer:database", name: "Database", category: TRIGGER_CATEGORY.SYSTEM, criticality: CRITICALITY.HIGH },
  { id: "trigger:footer:folder", name: "Folder", category: TRIGGER_CATEGORY.OPEN_PANEL, criticality: CRITICALITY.MEDIUM },
  { id: "trigger:footer:globe", name: "Globe", category: TRIGGER_CATEGORY.SYSTEM, criticality: CRITICALITY.LOW },
  { id: "trigger:footer:hard-drive", name: "Hard Drive", category: TRIGGER_CATEGORY.SYSTEM, criticality: CRITICALITY.LOW },
  { id: "trigger:footer:language", name: "Language", category: TRIGGER_CATEGORY.USER, criticality: CRITICALITY.LOW },
  { id: "trigger:footer:lgpd", name: "LGPD", category: TRIGGER_CATEGORY.SYSTEM, criticality: CRITICALITY.MEDIUM },
  { id: "trigger:footer:link", name: "Link", category: TRIGGER_CATEGORY.ACTION, criticality: CRITICALITY.LOW },
  { id: "trigger:footer:lock", name: "Lock", category: TRIGGER_CATEGORY.ACTION, criticality: CRITICALITY.HIGH },
  { id: "trigger:footer:logout", name: "Logout", category: TRIGGER_CATEGORY.USER, criticality: CRITICALITY.CRITICAL },
  { id: "trigger:footer:mail", name: "Mail", category: TRIGGER_CATEGORY.OPEN_PANEL, criticality: CRITICALITY.MEDIUM },
  { id: "trigger:footer:monitor", name: "Monitor", category: TRIGGER_CATEGORY.SYSTEM, criticality: CRITICALITY.LOW },
  { id: "trigger:footer:pie-chart", name: "Pie Chart", category: TRIGGER_CATEGORY.OPEN_PANEL, criticality: CRITICALITY.LOW },
  { id: "trigger:footer:privacidade", name: "Privacidade", category: TRIGGER_CATEGORY.SYSTEM, criticality: CRITICALITY.MEDIUM },
  { id: "trigger:footer:search", name: "Search", category: TRIGGER_CATEGORY.ACTION, criticality: CRITICALITY.LOW },
  { id: "trigger:footer:security", name: "Security", category: TRIGGER_CATEGORY.ADMIN, criticality: CRITICALITY.HIGH },
  { id: "trigger:footer:server", name: "Server", category: TRIGGER_CATEGORY.SYSTEM, criticality: CRITICALITY.MEDIUM },
  { id: "trigger:footer:settings", name: "Settings", category: TRIGGER_CATEGORY.USER, criticality: CRITICALITY.MEDIUM },
  { id: "trigger:footer:target", name: "Target", category: TRIGGER_CATEGORY.OPEN_PANEL, criticality: CRITICALITY.LOW },
  { id: "trigger:footer:termos", name: "Termos", category: TRIGGER_CATEGORY.SYSTEM, criticality: CRITICALITY.LOW },
  { id: "trigger:footer:trending-up", name: "Trending", category: TRIGGER_CATEGORY.OPEN_PANEL, criticality: CRITICALITY.LOW },
  { id: "trigger:footer:users", name: "Users", category: TRIGGER_CATEGORY.ADMIN, criticality: CRITICALITY.HIGH },
  { id: "trigger:footer:zap", name: "Zap", category: TRIGGER_CATEGORY.ACTION, criticality: CRITICALITY.LOW }
];
const NAVIGATION_SECTION_TRIGGERS = [
  { id: "trigger:navigation:section-principal", name: "Se\xE7\xE3o Principal", category: TRIGGER_CATEGORY.TOGGLE, criticality: CRITICALITY.LOW },
  { id: "trigger:navigation:section-operacional", name: "Se\xE7\xE3o Operacional", category: TRIGGER_CATEGORY.TOGGLE, criticality: CRITICALITY.LOW },
  { id: "trigger:navigation:section-admin", name: "Se\xE7\xE3o Admin", category: TRIGGER_CATEGORY.TOGGLE, criticality: CRITICALITY.MEDIUM },
  { id: "trigger:navigation:section-financeiro", name: "Se\xE7\xE3o Financeiro", category: TRIGGER_CATEGORY.TOGGLE, criticality: CRITICALITY.HIGH },
  { id: "trigger:navigation:section-integracao", name: "Se\xE7\xE3o Integra\xE7\xE3o", category: TRIGGER_CATEGORY.TOGGLE, criticality: CRITICALITY.MEDIUM }
];
const NAVIGATION_ITEM_TRIGGERS = [
  { id: "trigger:navigation:item-home", name: "Home", category: TRIGGER_CATEGORY.NAVIGATION, criticality: CRITICALITY.LOW },
  { id: "trigger:navigation:item-dashboard", name: "Dashboard", category: TRIGGER_CATEGORY.NAVIGATION, criticality: CRITICALITY.LOW },
  { id: "trigger:navigation:item-analytics", name: "Analytics", category: TRIGGER_CATEGORY.NAVIGATION, criticality: CRITICALITY.MEDIUM },
  { id: "trigger:navigation:item-relatorios", name: "Relat\xF3rios", category: TRIGGER_CATEGORY.NAVIGATION, criticality: CRITICALITY.MEDIUM },
  { id: "trigger:navigation:item-charts", name: "Charts", category: TRIGGER_CATEGORY.NAVIGATION, criticality: CRITICALITY.LOW },
  { id: "trigger:navigation:item-clientes", name: "Clientes", category: TRIGGER_CATEGORY.NAVIGATION, criticality: CRITICALITY.MEDIUM },
  { id: "trigger:navigation:item-produtos", name: "Produtos", category: TRIGGER_CATEGORY.NAVIGATION, criticality: CRITICALITY.MEDIUM },
  { id: "trigger:navigation:item-pedidos", name: "Pedidos", category: TRIGGER_CATEGORY.NAVIGATION, criticality: CRITICALITY.MEDIUM },
  { id: "trigger:navigation:item-estoque", name: "Estoque", category: TRIGGER_CATEGORY.NAVIGATION, criticality: CRITICALITY.MEDIUM },
  { id: "trigger:navigation:item-comercial", name: "Comercial", category: TRIGGER_CATEGORY.NAVIGATION, criticality: CRITICALITY.MEDIUM },
  { id: "trigger:navigation:item-financeiro", name: "Financeiro", category: TRIGGER_CATEGORY.NAVIGATION, criticality: CRITICALITY.HIGH },
  { id: "trigger:navigation:item-contas-pagar", name: "Contas a Pagar", category: TRIGGER_CATEGORY.NAVIGATION, criticality: CRITICALITY.HIGH },
  { id: "trigger:navigation:item-contas-receber", name: "Contas a Receber", category: TRIGGER_CATEGORY.NAVIGATION, criticality: CRITICALITY.HIGH },
  { id: "trigger:navigation:item-fluxo-caixa", name: "Fluxo de Caixa", category: TRIGGER_CATEGORY.NAVIGATION, criticality: CRITICALITY.HIGH },
  { id: "trigger:navigation:item-usuarios", name: "Usu\xE1rios", category: TRIGGER_CATEGORY.ADMIN, criticality: CRITICALITY.CRITICAL },
  { id: "trigger:navigation:item-permissoes", name: "Permiss\xF5es", category: TRIGGER_CATEGORY.ADMIN, criticality: CRITICALITY.CRITICAL },
  { id: "trigger:navigation:item-configuracoes", name: "Configura\xE7\xF5es", category: TRIGGER_CATEGORY.ADMIN, criticality: CRITICALITY.HIGH },
  { id: "trigger:navigation:item-logs", name: "Logs do Sistema", category: TRIGGER_CATEGORY.ADMIN, criticality: CRITICALITY.HIGH },
  { id: "trigger:navigation:item-automacoes", name: "Automa\xE7\xF5es", category: TRIGGER_CATEGORY.NAVIGATION, criticality: CRITICALITY.MEDIUM },
  { id: "trigger:navigation:item-pipedrive", name: "Pipedrive", category: TRIGGER_CATEGORY.NAVIGATION, criticality: CRITICALITY.MEDIUM },
  { id: "trigger:navigation:item-asaas", name: "Asaas", category: TRIGGER_CATEGORY.NAVIGATION, criticality: CRITICALITY.MEDIUM },
  { id: "trigger:navigation:item-bling", name: "Bling", category: TRIGGER_CATEGORY.NAVIGATION, criticality: CRITICALITY.MEDIUM },
  { id: "trigger:navigation:item-mercado-livre", name: "Mercado Livre", category: TRIGGER_CATEGORY.NAVIGATION, criticality: CRITICALITY.MEDIUM }
];
const SIDEBAR_TRIGGERS = [
  { id: "trigger:sidebar:section-principal", name: "Se\xE7\xE3o Principal", category: TRIGGER_CATEGORY.TOGGLE, criticality: CRITICALITY.LOW, deprecated: true },
  { id: "trigger:sidebar:section-operacional", name: "Se\xE7\xE3o Operacional", category: TRIGGER_CATEGORY.TOGGLE, criticality: CRITICALITY.LOW, deprecated: true },
  { id: "trigger:sidebar:section-admin", name: "Se\xE7\xE3o Admin", category: TRIGGER_CATEGORY.TOGGLE, criticality: CRITICALITY.MEDIUM, deprecated: true },
  { id: "trigger:sidebar:home", name: "Home", category: TRIGGER_CATEGORY.NAVIGATION, criticality: CRITICALITY.LOW, deprecated: true },
  { id: "trigger:sidebar:dashboard", name: "Dashboard", category: TRIGGER_CATEGORY.NAVIGATION, criticality: CRITICALITY.LOW, deprecated: true },
  { id: "trigger:sidebar:analytics", name: "Analytics", category: TRIGGER_CATEGORY.NAVIGATION, criticality: CRITICALITY.MEDIUM, deprecated: true },
  { id: "trigger:sidebar:relatorios", name: "Relat\xF3rios", category: TRIGGER_CATEGORY.NAVIGATION, criticality: CRITICALITY.MEDIUM, deprecated: true },
  { id: "trigger:sidebar:clientes", name: "Clientes", category: TRIGGER_CATEGORY.NAVIGATION, criticality: CRITICALITY.MEDIUM, deprecated: true },
  { id: "trigger:sidebar:produtos", name: "Produtos", category: TRIGGER_CATEGORY.NAVIGATION, criticality: CRITICALITY.MEDIUM, deprecated: true },
  { id: "trigger:sidebar:pedidos", name: "Pedidos", category: TRIGGER_CATEGORY.NAVIGATION, criticality: CRITICALITY.MEDIUM, deprecated: true },
  { id: "trigger:sidebar:estoque", name: "Estoque", category: TRIGGER_CATEGORY.NAVIGATION, criticality: CRITICALITY.MEDIUM, deprecated: true },
  { id: "trigger:sidebar:financeiro", name: "Financeiro", category: TRIGGER_CATEGORY.NAVIGATION, criticality: CRITICALITY.HIGH, deprecated: true },
  { id: "trigger:sidebar:usuarios", name: "Usu\xE1rios", category: TRIGGER_CATEGORY.ADMIN, criticality: CRITICALITY.CRITICAL, deprecated: true },
  { id: "trigger:sidebar:permissoes", name: "Permiss\xF5es", category: TRIGGER_CATEGORY.ADMIN, criticality: CRITICALITY.CRITICAL, deprecated: true },
  { id: "trigger:sidebar:configuracoes", name: "Configura\xE7\xF5es", category: TRIGGER_CATEGORY.ADMIN, criticality: CRITICALITY.HIGH, deprecated: true },
  { id: "trigger:sidebar:logs", name: "Logs do Sistema", category: TRIGGER_CATEGORY.ADMIN, criticality: CRITICALITY.HIGH, deprecated: true },
  { id: "trigger:sidebar:automacoes", name: "Automa\xE7\xF5es", category: TRIGGER_CATEGORY.NAVIGATION, criticality: CRITICALITY.MEDIUM, deprecated: true }
];
const ACCORDION_TRIGGERS = [
  { id: "trigger:accordion:item-home", name: "Home", category: TRIGGER_CATEGORY.NAVIGATION, criticality: CRITICALITY.LOW, deprecated: true },
  { id: "trigger:accordion:item-analytics", name: "Analytics", category: TRIGGER_CATEGORY.NAVIGATION, criticality: CRITICALITY.MEDIUM, deprecated: true },
  { id: "trigger:accordion:item-relatorios", name: "Relat\xF3rios", category: TRIGGER_CATEGORY.NAVIGATION, criticality: CRITICALITY.MEDIUM, deprecated: true },
  { id: "trigger:accordion:item-clientes", name: "Clientes", category: TRIGGER_CATEGORY.NAVIGATION, criticality: CRITICALITY.MEDIUM, deprecated: true },
  { id: "trigger:accordion:item-produtos", name: "Produtos", category: TRIGGER_CATEGORY.NAVIGATION, criticality: CRITICALITY.MEDIUM, deprecated: true },
  { id: "trigger:accordion:item-pedidos", name: "Pedidos", category: TRIGGER_CATEGORY.NAVIGATION, criticality: CRITICALITY.MEDIUM, deprecated: true },
  { id: "trigger:accordion:item-estoque", name: "Estoque", category: TRIGGER_CATEGORY.NAVIGATION, criticality: CRITICALITY.MEDIUM, deprecated: true },
  { id: "trigger:accordion:item-usuarios", name: "Usu\xE1rios", category: TRIGGER_CATEGORY.ADMIN, criticality: CRITICALITY.CRITICAL, deprecated: true },
  { id: "trigger:accordion:item-permissoes", name: "Permiss\xF5es", category: TRIGGER_CATEGORY.ADMIN, criticality: CRITICALITY.CRITICAL, deprecated: true },
  { id: "trigger:accordion:item-configuracoes", name: "Configura\xE7\xF5es", category: TRIGGER_CATEGORY.ADMIN, criticality: CRITICALITY.HIGH, deprecated: true },
  { id: "trigger:accordion:item-logs", name: "Logs do Sistema", category: TRIGGER_CATEGORY.ADMIN, criticality: CRITICALITY.HIGH, deprecated: true }
];
const ALL_REGIONS = STRUCTURAL_REGIONS.concat(PANEL_REGIONS);
const NAVIGATION_TRIGGERS = NAVIGATION_SECTION_TRIGGERS.concat(NAVIGATION_ITEM_TRIGGERS);
const ALL_TRIGGERS = HEADER_TRIGGERS.concat(NAVRAIL_TRIGGERS).concat(FOOTER_TRIGGERS).concat(NAVIGATION_TRIGGERS).concat(SIDEBAR_TRIGGERS).concat(ACCORDION_TRIGGERS);
function getRegionById(id) {
  for (let i = 0; i < ALL_REGIONS.length; i++) {
    if (ALL_REGIONS[i].id === id) return ALL_REGIONS[i];
  }
  return null;
}
function getTriggerById(id) {
  for (let i = 0; i < ALL_TRIGGERS.length; i++) {
    if (ALL_TRIGGERS[i].id === id) return ALL_TRIGGERS[i];
  }
  return null;
}
function getRegionsByType(type) {
  return ALL_REGIONS.filter((r) => r.type === type);
}
function getTriggersByCategory(category) {
  return ALL_TRIGGERS.filter((t) => t.category === category);
}
function getTriggersByCriticality(criticality) {
  return ALL_TRIGGERS.filter((t) => t.criticality === criticality);
}
function getCriticalTriggers() {
  return ALL_TRIGGERS.filter((t) => t.criticality === CRITICALITY.CRITICAL || t.criticality === CRITICALITY.HIGH);
}
function getDeprecatedTriggers() {
  return ALL_TRIGGERS.filter((t) => t.deprecated === true);
}
function getActiveTriggers() {
  return ALL_TRIGGERS.filter((t) => t.deprecated !== true);
}
function buildNavigationItemTrigger(itemId) {
  if (!itemId || typeof itemId !== "string") {
    throw new Error("[inventory] buildNavigationItemTrigger: itemId must be a non-empty string");
  }
  const cleanId = itemId.replace(/^trigger:navigation:item[-:]/, "").replace(/^item[-:]/, "").toLowerCase().replace(/[^a-z0-9-]/g, "-");
  const triggerId = `trigger:navigation:item-${cleanId}`;
  const validation = validateId(triggerId);
  if (!validation.valid) {
    throw new Error(`[inventory] Invalid trigger ID generated: ${triggerId} - ${validation.error}`);
  }
  return triggerId;
}
function buildNavigationSectionTrigger(sectionId) {
  if (!sectionId || typeof sectionId !== "string") {
    throw new Error("[inventory] buildNavigationSectionTrigger: sectionId must be a non-empty string");
  }
  const cleanId = sectionId.replace(/^trigger:navigation:section[-:]/, "").replace(/^section[-:]/, "").replace(/^sec-/, "").toLowerCase().replace(/[^a-z0-9-]/g, "-");
  const triggerId = `trigger:navigation:section-${cleanId}`;
  const validation = validateId(triggerId);
  if (!validation.valid) {
    throw new Error(`[inventory] Invalid trigger ID generated: ${triggerId} - ${validation.error}`);
  }
  return triggerId;
}
function buildAccordionItemTrigger(itemId) {
  return buildNavigationItemTrigger(itemId);
}
function buildAccordionSectionTrigger(sectionId) {
  return buildNavigationSectionTrigger(sectionId);
}
function getSidebarTriggers() {
  return SIDEBAR_TRIGGERS.slice();
}
function getAccordionTriggers() {
  return ACCORDION_TRIGGERS.slice();
}
function getNavigationTriggers() {
  return NAVIGATION_TRIGGERS.slice();
}
function getNavigationItemTriggers() {
  return NAVIGATION_ITEM_TRIGGERS.slice();
}
function getNavigationSectionTriggers() {
  return NAVIGATION_SECTION_TRIGGERS.slice();
}
function getInventoryStats() {
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
function info() {
  return {
    moduleId: MODULE_ID,
    version: VERSION,
    regionsCount: ALL_REGIONS.length,
    triggersCount: ALL_TRIGGERS.length,
    navigationTriggersCount: NAVIGATION_TRIGGERS.length,
    deprecatedTriggersCount: getDeprecatedTriggers().length,
    triggerPattern: "trigger:navigation:item-{id} | trigger:navigation:section-{id}",
    enforcement: "CONTRACT_VALIDATED",
    phase: "P1 - Active Enforcement (3-segment format)",
    timestamp: Date.now()
  };
}
function healthCheck() {
  const builderTest = { item: false, section: false };
  try {
    const testItem = buildNavigationItemTrigger("test");
    builderTest.item = testItem === "trigger:navigation:item-test";
  } catch (e) {
  }
  try {
    const testSection = buildNavigationSectionTrigger("test");
    builderTest.section = testSection === "trigger:navigation:section-test";
  } catch (e) {
  }
  return {
    status: builderTest.item && builderTest.section ? "HEALTHY" : "DEGRADED",
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
var inventory_default = {
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
export {
  ACCORDION_TRIGGERS,
  ALL_REGIONS,
  ALL_TRIGGERS,
  FOOTER_TRIGGERS,
  HEADER_TRIGGERS,
  MODULE_ID,
  NAVIGATION_ITEM_TRIGGERS,
  NAVIGATION_SECTION_TRIGGERS,
  NAVIGATION_TRIGGERS,
  NAVRAIL_TRIGGERS,
  PANEL_REGIONS,
  SIDEBAR_TRIGGERS,
  STRUCTURAL_REGIONS,
  VERSION,
  buildAccordionItemTrigger,
  buildAccordionSectionTrigger,
  buildNavigationItemTrigger,
  buildNavigationSectionTrigger,
  inventory_default as default,
  getAccordionTriggers,
  getActiveTriggers,
  getCriticalTriggers,
  getDeprecatedTriggers,
  getInventoryStats,
  getNavigationItemTriggers,
  getNavigationSectionTriggers,
  getNavigationTriggers,
  getRegionById,
  getRegionsByType,
  getSidebarTriggers,
  getTriggerById,
  getTriggersByCategory,
  getTriggersByCriticality,
  healthCheck,
  info
};
