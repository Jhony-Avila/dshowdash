const MODULE_ID = "router.registry.definitions.routes-dashboard";
const VERSION = "8.2.0-P17WI";
import { DOMAINS, LAYOUTS, GUARD_POLICIES } from "./constants.js";
const createPanelRoute = (id, title, options = {}) => ({ id, name: title, page: id, title, public: false, requiresAuth: true, guardPolicy: GUARD_POLICIES.PERMISSIONS, permissions: options.permissions || [], featureFlags: options.featureFlags || [], layout: LAYOUTS.DEFAULT, defaultView: options.panel || id, defaultHash: `#/${id}`, mountMain: true, domain: options.domain || DOMAINS.DASHBOARD, virtualDefaults: { view: options.panel || id, tab: null, section: null, entity: null, mode: "view" }, seo: { title: `DshowDash - ${title}`, description: options.description || title }, aliases: options.aliases || [], tags: ["dashboard", "panel", ...options.tags || []] });
const createFooterRoute = (id, title, panel, options = {}) => ({ id: `footer-${id}`, name: title.replace(/\s+/g, ""), page: `footer-${id}`, title, public: false, requiresAuth: true, guardPolicy: GUARD_POLICIES.PERMISSIONS, permissions: options.permissions || [], featureFlags: [], layout: LAYOUTS.DEFAULT, defaultView: panel, defaultHash: `#/footer/${id}`, mountMain: true, domain: options.domain || DOMAINS.DASHBOARD, virtualDefaults: { view: panel, tab: "overview", section: null, entity: null, mode: "view" }, seo: { title: `DshowDash - ${title}`, description: options.description || title }, aliases: options.aliases || [], tags: ["footer", id, ...options.tags || []] });
const createNavRoute = (id, title, panel, options = {}) => ({ id, name: title.replace(/\s+/g, ""), page: id, title, public: false, requiresAuth: true, guardPolicy: GUARD_POLICIES.PERMISSIONS, permissions: options.permissions || [], featureFlags: [], layout: LAYOUTS.DEFAULT, defaultView: panel, defaultHash: `#/${id}`, mountMain: true, domain: options.domain || DOMAINS.DASHBOARD, virtualDefaults: { view: panel, tab: "overview", section: null, entity: null, mode: "view" }, seo: { title: `DshowDash - ${title}`, description: options.description || title }, aliases: options.aliases || [], tags: [id, ...options.tags || []] });
const createStatusRoute = (id, title, options = {}) => ({ id: `status-${id}`, name: title.replace(/\s+/g, ""), page: `status-${id}`, title, public: false, requiresAuth: true, guardPolicy: GUARD_POLICIES.PERMISSIONS, permissions: options.permissions || [], featureFlags: [], layout: LAYOUTS.DEFAULT, defaultView: "panel-status", defaultHash: `#/status-${id}`, mountMain: true, domain: options.domain || DOMAINS.OPERACIONAL, virtualDefaults: { view: "panel-status", tab: "overview", section: null, entity: null, mode: "view" }, seo: { title: `DshowDash - ${title}`, description: options.description || title }, aliases: [`#/status-${id}`], tags: ["status", "footer", id, ...options.tags || []] });
const dashboardRoutes = Object.freeze({
  "/": { id: "home", name: "Home", page: "geral", title: "DshowDash - Vis\xE3o Geral", public: false, requiresAuth: true, guardPolicy: GUARD_POLICIES.PERMISSIONS, permissions: [], featureFlags: [], layout: LAYOUTS.DEFAULT, defaultView: "panel-cards", defaultHash: "#/panel-cards", mountMain: true, domain: DOMAINS.DASHBOARD, virtualDefaults: { view: "panel-cards", tab: "overview", section: "summary", entity: null, mode: "view" }, seo: { title: "DshowDash - Pain\xE9is de Monitoramento", description: "Vis\xE3o consolidada de jobs, servidores, integra\xE7\xF5es e KPIs." }, aliases: ["/home", "/dashboard", "#/", "#/home", "#/dashboard"], tags: ["dashboard", "default", "home"] },
  "/geral": { id: "geral", name: "Geral", page: "geral", title: "Dashboard Geral", public: false, requiresAuth: true, guardPolicy: GUARD_POLICIES.PERMISSIONS, permissions: [], featureFlags: [], layout: LAYOUTS.DEFAULT, defaultView: "panel-cards", defaultHash: "#/panel-cards", mountMain: true, domain: DOMAINS.DASHBOARD, virtualDefaults: { view: "panel-cards", tab: "overview", section: null, entity: null, mode: "view" }, seo: { title: "Dashboard Geral", description: "Vis\xE3o geral do sistema" }, aliases: [], tags: ["dashboard"] },
  "/panel-cards": createPanelRoute("panel-cards", "Dashboard Principal", { aliases: ["/painel-cards", "#/panel-cards", "#/painel-cards"], tags: ["main", "default"], description: "Dashboard principal com cards de monitoramento" }),
  "/panel-01": createPanelRoute("panel-01", "Painel 01", { aliases: ["#/panel-01"] }),
  "/panel-02": createPanelRoute("panel-02", "Painel 02", { aliases: ["#/panel-02"] }),
  "/panel-03": createPanelRoute("panel-03", "Painel 03", { aliases: ["#/panel-03"] }),
  "/panel-04": createPanelRoute("panel-04", "Painel 04", { aliases: ["#/panel-04"] }),
  "/panel-05": createPanelRoute("panel-05", "Relat\xF3rios", { aliases: ["#/panel-05"], tags: ["reports"] }),
  "/panel-06": createPanelRoute("panel-06", "Painel 06", { aliases: ["#/panel-06"] }),
  "/panel-07": createPanelRoute("panel-07", "Painel 07", { aliases: ["#/panel-07"] }),
  "/panel-08": createPanelRoute("panel-08", "Painel 08", { aliases: ["#/panel-08"] }),
  // panel-datatables: registrado para o extractPanelId resolver a URL em SEGMENTOS
  // da Fase 3 (#/panel-datatables/<grupo>/<tela>) pelo primeiro segmento. O painel
  // em si e DB-driven (ui_nav_items); esta entrada existe so para o roteamento.
  "/panel-datatables": createPanelRoute("panel-datatables", "DataTables", { aliases: ["#/panel-datatables"], tags: ["datatables", "infra"], description: "Catalogo e monitoramento da infraestrutura de dados" }),
  // panel-outlook: registrado para o extractPanelId resolver a URL em SEGMENTOS
  // (#/panel-outlook/<aba>) pelo primeiro segmento. Modulo de e-mails (Integracao Outlook).
  "/panel-outlook": createPanelRoute("panel-outlook", "E-mails", { aliases: ["#/panel-outlook", "#/outlook"], tags: ["outlook", "email"], description: "Central de e-mails integrada ao Outlook / Microsoft 365" }),
  // panel-pipedrive: registrado para o extractPanelId resolver a URL em SEGMENTOS
  // (#/panel-pipedrive/<tela>) pelo primeiro segmento. Restrito (§7.3): level>=50.
  "/panel-pipedrive": createPanelRoute("panel-pipedrive", "Pipedrive Analytics", { aliases: ["#/panel-pipedrive", "#/pipedrive", "#/integrations/pipedrive"], tags: ["pipedrive", "crm"], permissions: ["level:50"], description: "Visualizacao e analise gerencial do Pipedrive CRM" }),
  // panel-ads: registrado para o extractPanelId resolver a URL em SEGMENTOS
  // (#/panel-ads/<area>) pelo primeiro segmento. Modulo Google Ads (Ads Intelligence).
  "/panel-ads": createPanelRoute("panel-ads", "Ads Intelligence", { aliases: ["#/panel-ads", "#/ads", "#/google-ads", "#/adwords"], tags: ["ads", "google-ads", "marketing"], description: "Gestao, analise e otimizacao de midia paga (Google Ads)" }),
  // panel-anuncios: Consultor de Google Ads (Decision Engine — metodologia Dshow).
  // Painel de perguntas/respostas; backend via proxy /api/anuncios/ask.php.
  "/panel-anuncios": createPanelRoute("panel-anuncios", "An\xFAncios — Consultor", { aliases: ["#/panel-anuncios", "#/anuncios"], tags: ["anuncios", "google-ads", "ia", "decision-engine"], description: "Consultor de Google Ads fundamentado na metodologia Dshow (Decision Engine)" }),
  // panel-mercadolivre: modulo Mercado Livre (Fase 1 — dados simulados).
  // Navegacao interna por hash (#/panel-mercadolivre/<secao>).
  "/panel-mercadolivre": createPanelRoute("panel-mercadolivre", "Mercado Livre", { aliases: ["#/panel-mercadolivre", "#/mercadolivre", "#/mercado-livre"], tags: ["mercadolivre", "marketplace", "canais-venda"], description: "Central de gestao do Mercado Livre (Fase 1 — dados simulados)" }),
  "/panel-metaads": createPanelRoute("panel-metaads", "Meta Ads", { aliases: ["#/panel-metaads", "#/metaads", "#/meta-ads"], tags: ["metaads", "meta", "facebook", "instagram", "marketing"], description: "Central de gestao do Meta Ads (Fase 1 — dados simulados)" }), "/panel-avatar-studio": createPanelRoute("panel-avatar-studio", "Avatar Studio", { aliases: ["#/panel-avatar-studio", "#/avatar-studio", "#/avatar"], tags: ["avatar", "perfil", "personalizacao"], description: "Estudio de criacao de avatares em camadas (Sistema Gamer AAA)" }), "/panel-09": createPanelRoute("panel-09", "Painel 09", { aliases: ["#/panel-09"] }),
  "/panel-10": createPanelRoute("panel-10", "Painel 10", { aliases: ["#/panel-10"] }),
  "/panel-11": createPanelRoute("panel-11", "Painel 11", { aliases: ["#/panel-11"] }),
  "/panel-12": createPanelRoute("panel-12", "Monitoramento de Jobs", { aliases: ["#/panel-12"], tags: ["monitoring"] }),
  "/panel-13": createPanelRoute("panel-13", "Painel 13", { aliases: ["#/panel-13"] }),
  "/panel-14": createPanelRoute("panel-14", "Painel 14", { aliases: ["#/panel-14"] }),
  "/panel-15": createPanelRoute("panel-15", "Painel 15", { aliases: ["#/panel-15"], permissions: ["level:60"] }),
  "/panel-16": createPanelRoute("panel-16", "Painel 16", { aliases: ["#/panel-16"], permissions: ["level:60"] }),
  "/panel-17": createPanelRoute("panel-17", "Painel 17", { aliases: ["#/panel-17"], permissions: ["level:80"] }),
  "/panel-18": createPanelRoute("panel-18", "Painel 18", { aliases: ["#/panel-18"], permissions: ["level:80"] }),
  "/panel-19": createPanelRoute("panel-19", "Painel 19", { aliases: ["#/panel-19"], permissions: ["level:100"] }),
  "/panel-dashboard": createPanelRoute("panel-dashboard", "Visão Geral", { aliases: ["#/panel-dashboard"], tags: ["geral", "executivo"], description: "Resumo consolidado dos principais indicadores, operacoes e integracoes do Dshow Dash" }),
  "/panel-health-dashboard": createPanelRoute("panel-health-dashboard", "System Health", { aliases: ["#/panel-health-dashboard"], tags: ["admin", "health"], permissions: ["level:80"] }),
  "/panel-orchestrator": createPanelRoute("panel-orchestrator", "Core Orchestrator", { aliases: ["#/panel-orchestrator"], tags: ["system", "admin"], permissions: ["level:100"] }),
  "/panel-enterprise": createPanelRoute("panel-enterprise", "Enterprise Panel", { aliases: ["#/panel-enterprise"], tags: ["system"], permissions: ["level:100"] }),
  "/analytics": createNavRoute("analytics", "Analytics", "panel-analytics", { tags: ["analytics", "charts"] }),
  "/charts": createNavRoute("charts", "Charts", "panel-charts", { tags: ["charts", "visualization"] }),
  "/code": createNavRoute("code", "Code Editor", "panel-code", { domain: DOMAINS.OPERACIONAL, tags: ["code", "developer"] }),
  "/folder": createNavRoute("folder", "Arquivos", "panel-files", { tags: ["folder", "files"] }),
  "/location": createNavRoute("location", "Localiza\xE7\xE3o", "panel-location", { tags: ["location", "map"] }),
  "/database": createNavRoute("database", "DataHub", "panel-datahub", { domain: DOMAINS.OPERACIONAL, tags: ["database", "data"] }),
  "/relatorios": createNavRoute("relatorios", "Relat\xF3rios", "panel-05", { tags: ["relatorios", "reports"] }),
  "/api": createNavRoute("api", "API Status", "panel-footer-api", { domain: DOMAINS.INTEGRACOES, tags: ["api", "status"] }),
  "/docs": createNavRoute("docs", "Documenta\xE7\xE3o", "panel-footer-docs", { tags: ["docs", "documentation"] }),
  "/footer/activity": createFooterRoute("activity", "Atividades", "panel-footer-activity", { tags: ["activity", "monitoring"] }),
  "/footer/status": createFooterRoute("status", "Status do Sistema", "panel-footer-status", { tags: ["status", "monitoring"] }),
  "/footer/file": createFooterRoute("file", "Arquivos", "panel-footer-file", { tags: ["file", "files"] }),
  "/footer/registry": createFooterRoute("registry", "Registro", "panel-footer-registry", { tags: ["registry", "clipboard"] }),
  "/footer/cpu": createFooterRoute("cpu", "CPU Monitor", "panel-footer-cpu", { domain: DOMAINS.OPERACIONAL, tags: ["cpu", "monitoring", "server"] }),
  "/footer/financial": createFooterRoute("financial", "Financeiro", "panel-footer-financial", { domain: DOMAINS.FINANCEIRO, tags: ["financial", "money"] }),
  "/footer/database": createFooterRoute("database", "Database", "panel-footer-database", { domain: DOMAINS.OPERACIONAL, tags: ["database", "data"] }),
  "/footer/disk": createFooterRoute("disk", "Disk Monitor", "panel-footer-disk", { domain: DOMAINS.OPERACIONAL, tags: ["disk", "monitoring", "storage"] }),
  "/footer/globe": createFooterRoute("globe", "Global", "panel-footer-globe", { tags: ["globe", "global"] }),
  "/footer/api": createFooterRoute("api", "API Status", "panel-footer-api", { domain: DOMAINS.INTEGRACOES, tags: ["api", "status"] }),
  "/footer/shield": createFooterRoute("shield", "Seguran\xE7a", "panel-footer-shield", { domain: DOMAINS.ADMIN, tags: ["shield", "security"] }),
  "/footer/memory": createFooterRoute("memory", "Memory Monitor", "panel-footer-memory", { domain: DOMAINS.OPERACIONAL, tags: ["memory", "monitoring", "ram"] }),
  "/footer/server": createFooterRoute("server", "Server Status", "panel-footer-server", { domain: DOMAINS.OPERACIONAL, tags: ["server", "monitoring"] }),
  "/footer/docs": createFooterRoute("docs", "Documenta\xE7\xE3o", "panel-footer-docs", { tags: ["docs", "documentation"] }),
  "/footer/settings": createFooterRoute("settings", "Configura\xE7\xF5es", "panel-footer-settings", { domain: DOMAINS.ADMIN, tags: ["settings", "config"] }),
  "/footer/support": createFooterRoute("support", "Suporte", "panel-footer-support", { tags: ["support", "help"] }),
  "/footer/wifi": createFooterRoute("wifi", "WiFi Status", "panel-footer-wifi", { domain: DOMAINS.OPERACIONAL, tags: ["wifi", "monitoring", "network"] }),
  "/status-activity": createStatusRoute("activity", "Atividade do Sistema", { tags: ["activity", "monitoring"] }),
  "/status-bookmark": createStatusRoute("bookmark", "Favoritos", { tags: ["bookmark", "favorites"] }),
  "/status-calendar": createStatusRoute("calendar", "Agenda", { tags: ["calendar", "schedule"] }),
  "/status-clipboard": createStatusRoute("clipboard", "Logs do Sistema", { tags: ["clipboard", "logs"] }),
  "/status-cloud": createStatusRoute("cloud", "Status Cloud", { tags: ["cloud", "storage"] }),
  "/status-cpu": createStatusRoute("cpu", "CPU Monitor", { domain: DOMAINS.OPERACIONAL, tags: ["cpu", "monitoring"] }),
  "/status-credit-card": createStatusRoute("credit-card", "Pagamentos", { domain: DOMAINS.FINANCEIRO, tags: ["credit-card", "payments"] }),
  "/status-database": createStatusRoute("database", "Status Database", { domain: DOMAINS.OPERACIONAL, tags: ["database", "data"] }),
  "/status-disk": createStatusRoute("disk", "Disco", { domain: DOMAINS.OPERACIONAL, tags: ["disk", "storage"] }),
  "/status-folder": createStatusRoute("folder", "Arquivos", { tags: ["folder", "files"] }),
  "/status-globe": createStatusRoute("globe", "Status Web", { tags: ["globe", "web"] }),
  "/status-hard-drive": createStatusRoute("hard-drive", "Storage", { domain: DOMAINS.OPERACIONAL, tags: ["hard-drive", "storage"] }),
  "/status-language": createStatusRoute("language", "Idioma", { tags: ["language", "i18n"] }),
  "/status-link": createStatusRoute("link", "Links", { tags: ["link", "connections"] }),
  "/status-mail": createStatusRoute("mail", "E-mail", { tags: ["mail", "email"] }),
  "/status-memory": createStatusRoute("memory", "Mem\xF3ria", { domain: DOMAINS.OPERACIONAL, tags: ["memory", "ram"] }),
  "/status-monitor": createStatusRoute("monitor", "Monitor", { tags: ["monitor", "display"] }),
  "/status-pie-chart": createStatusRoute("pie-chart", "M\xE9tricas", { tags: ["pie-chart", "metrics"] }),
  "/status-server": createStatusRoute("server", "Status Servidor", { domain: DOMAINS.OPERACIONAL, tags: ["server", "monitoring"] }),
  "/status-target": createStatusRoute("target", "Metas", { tags: ["target", "goals"] }),
  "/status-trending": createStatusRoute("trending", "Performance", { tags: ["trending", "performance"] }),
  "/status-wifi": createStatusRoute("wifi", "Rede", { domain: DOMAINS.OPERACIONAL, tags: ["wifi", "network"] }),
  "/status-zap": createStatusRoute("zap", "Integra\xE7\xF5es", { domain: DOMAINS.INTEGRACOES, tags: ["zap", "integrations"] }),
  "/meu-perfil": createNavRoute("meu-perfil", "Meu Perfil", "panel-profile", { tags: ["profile", "user"], aliases: ["#/meu-perfil"] }),
  "/preferencias": createNavRoute("preferencias", "Prefer\xEAncias", "panel-preferences", { tags: ["preferences", "settings"], aliases: ["#/preferencias"] }),
  "/seguranca": createNavRoute("seguranca", "Seguran\xE7a", "panel-security", { tags: ["security", "user"], aliases: ["#/seguranca"] }),
  "/sessoes": createNavRoute("sessoes", "Sess\xF5es", "panel-sessions", { tags: ["sessions", "user"], aliases: ["#/sessoes"] }),
  "/termos": { id: "termos", name: "Termos", page: "termos", title: "Termos de Uso", public: true, requiresAuth: false, guardPolicy: GUARD_POLICIES.PUBLIC, permissions: [], featureFlags: [], layout: LAYOUTS.DEFAULT, defaultView: "panel-termos", defaultHash: "#/termos", mountMain: true, domain: DOMAINS.SYSTEM, virtualDefaults: { view: "panel-termos", tab: null, section: null, entity: null, mode: "view" }, seo: { title: "DshowDash - Termos de Uso", description: "Termos de uso da plataforma DshowDash" }, aliases: ["#/termos"], tags: ["termos", "legal", "public"] }
});
var routes_dashboard_default = dashboardRoutes;
export {
  MODULE_ID,
  VERSION,
  dashboardRoutes,
  routes_dashboard_default as default
};
