import { createCorePorts as R } from "/core/runtime/ports-profiles.js";
import { AUTH_EVENTS as C, PERMISSIONS_EVENTS as Se } from "/core/runtime/events/catalog/dist/events-catalog.bundle.js";
const Ue = "1.0.0-P2-ENTERPRISE", be = {
  TRIGGER: "trigger",
  REGION: "region"
}, c = {
  STRUCTURAL: "structural",
  CONTENT: "content",
  PANEL: "panel",
  MODAL: "modal",
  OVERLAY: "overlay"
}, n = {
  NAVIGATION: "navigation",
  ACTION: "action",
  TOGGLE: "toggle",
  OPEN_PANEL: "open_panel",
  SYSTEM: "system",
  USER: "user",
  ADMIN: "admin"
}, r = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  CRITICAL: "critical"
}, S = {
  ALLOWED: "allowed",
  DENIED: "denied",
  INHERITED: "inherited",
  UNDEFINED: "undefined"
}, ue = {
  ID_PATTERN: /^(trigger|region):([a-z0-9-]+):([a-z0-9-]+)$/,
  region: {
    properties: {
      type: { enum: Object.values(c) }
    }
  },
  trigger: {
    properties: {
      category: { enum: Object.values(n) },
      criticality: { enum: Object.values(r) }
    }
  },
  permission: {
    properties: {
      state: { enum: Object.values(S) }
    }
  }
};
function A(e) {
  return !e || typeof e != "string" ? { valid: !1, error: "ID must be a non-empty string" } : ue.ID_PATTERN.test(e) ? { valid: !0, parsed: ye(e) } : { valid: !1, error: `Invalid ID format. Expected: tipo:contexto:nome. Got: ${e}` };
}
function ye(e) {
  const t = e.match(ue.ID_PATTERN);
  return t ? { type: t[1], context: t[2], name: t[3], full: e } : null;
}
function we(e, t, i) {
  const a = `${e}:${t}:${i}`, o = A(a);
  if (!o.valid) throw new Error(o.error);
  return a;
}
function j(e) {
  return e == null ? void 0 : e.startsWith("trigger:");
}
function B(e) {
  return e == null ? void 0 : e.startsWith("region:");
}
function _e(e) {
  const { id: t, name: i, type: a, parent: o = null, description: g = "", metadata: l = {} } = e, u = A(t);
  if (!u.valid) throw new Error(`Invalid region ID: ${u.error}`);
  if (!B(t)) throw new Error(`ID must start with region:. Got: ${t}`);
  if (!Object.values(c).includes(a)) throw new Error(`Invalid region type: ${a}`);
  return { id: t, name: i, type: a, parent: o, description: g, metadata: l, createdAt: Date.now() };
}
function $e(e) {
  const { id: t, name: i, category: a, region: o = null, criticality: g = r.MEDIUM, description: l = "", metadata: u = {} } = e, p = A(t);
  if (!p.valid) throw new Error(`Invalid trigger ID: ${p.error}`);
  if (!j(t)) throw new Error(`ID must start with trigger:. Got: ${t}`);
  if (!Object.values(n).includes(a)) throw new Error(`Invalid trigger category: ${a}`);
  return { id: t, name: i, category: a, region: o, criticality: g, description: l, metadata: u, createdAt: Date.now() };
}
function He(e) {
  const { userId: t, entityId: i, state: a = S.ALLOWED, grantedBy: o = null, expiresAt: g = null, reason: l = null } = e;
  if (!t) throw new Error("userId is required");
  if (!i) throw new Error("entityId is required");
  const u = A(i);
  if (!u.valid) throw new Error(`Invalid entity ID: ${u.error}`);
  return { userId: t, entityId: i, state: a, grantedAt: Date.now(), grantedBy: o, expiresAt: g, reason: l };
}
function Ve(e) {
  if (!e || typeof e != "string")
    throw new Error("[trigger-builders] itemId must be a non-empty string");
  const i = `trigger:navigation:item-${e.replace(/^trigger:navigation:item[-:]/, "").replace(/^item[-:]/, "").toLowerCase().replace(/[^a-z0-9-]/g, "-")}`, a = A(i);
  if (!a.valid)
    throw new Error(`[trigger-builders] Generated invalid trigger ID: ${i} - ${a.error}`);
  return i;
}
function ke(e) {
  if (!e || typeof e != "string")
    throw new Error("[trigger-builders] sectionId must be a non-empty string");
  const i = `trigger:navigation:section-${e.replace(/^trigger:navigation:section[-:]/, "").replace(/^section[-:]/, "").replace(/^sec-/, "").toLowerCase().replace(/[^a-z0-9-]/g, "-")}`, a = A(i);
  if (!a.valid)
    throw new Error(`[trigger-builders] Generated invalid trigger ID: ${i} - ${a.error}`);
  return i;
}
function We(e, t) {
  if (!e || typeof e != "string")
    throw new Error("[trigger-builders] context must be a non-empty string");
  if (!t || typeof t != "string")
    throw new Error("[trigger-builders] name must be a non-empty string");
  const i = e.toLowerCase().replace(/[^a-z0-9-]/g, "-"), a = t.toLowerCase().replace(/[^a-z0-9-]/g, "-"), o = `trigger:${i}:${a}`, g = A(o);
  if (!g.valid)
    throw new Error(`[trigger-builders] Generated invalid trigger ID: ${o} - ${g.error}`);
  return o;
}
function ze(e, t) {
  if (!e || typeof e != "string")
    throw new Error("[trigger-builders] context must be a non-empty string");
  if (!t || typeof t != "string")
    throw new Error("[trigger-builders] name must be a non-empty string");
  const i = e.toLowerCase().replace(/[^a-z0-9-]/g, "-"), a = t.toLowerCase().replace(/[^a-z0-9-]/g, "-"), o = `region:${i}:${a}`, g = A(o);
  if (!g.valid)
    throw new Error(`[trigger-builders] Generated invalid region ID: ${o} - ${g.error}`);
  return o;
}
function Ye(e) {
  return A(e);
}
function je(e) {
  return !e || typeof e != "string" ? !1 : /^trigger:[a-z0-9-]+:[a-z0-9-]+:[a-z0-9-]+$/.test(e);
}
const F = "components._shared.permissions.inventory", x = "1.5.0-P2-ENTERPRISE", U = [
  { id: "region:app:header", name: "Header", type: c.STRUCTURAL },
  { id: "region:app:sidebar", name: "Sidebar", type: c.STRUCTURAL },
  { id: "region:app:navrail", name: "NavRail", type: c.STRUCTURAL },
  { id: "region:app:footer", name: "Footer", type: c.STRUCTURAL },
  { id: "region:app:container-main", name: "Container Main", type: c.STRUCTURAL },
  { id: "region:app:overlay", name: "Overlay Layer", type: c.OVERLAY },
  { id: "region:app:toast", name: "Toast", type: c.OVERLAY },
  { id: "region:app:modal", name: "Modals", type: c.MODAL },
  { id: "region:app:accordion-ncs", name: "Accordion NCS", type: c.STRUCTURAL }
], b = [
  { id: "region:panel:01", name: "Panel 01", type: c.PANEL },
  { id: "region:panel:02", name: "Panel 02", type: c.PANEL },
  { id: "region:panel:03", name: "Panel 03", type: c.PANEL },
  { id: "region:panel:04", name: "Panel 04", type: c.PANEL },
  { id: "region:panel:05", name: "Panel 05", type: c.PANEL },
  { id: "region:panel:06", name: "Panel 06", type: c.PANEL },
  { id: "region:panel:07", name: "Panel 07", type: c.PANEL },
  { id: "region:panel:08", name: "Panel 08", type: c.PANEL },
  { id: "region:panel:09", name: "Panel 09", type: c.PANEL },
  { id: "region:panel:10", name: "Panel 10", type: c.PANEL },
  { id: "region:panel:11", name: "Panel 11", type: c.PANEL },
  { id: "region:panel:12", name: "Panel 12", type: c.PANEL },
  { id: "region:panel:13", name: "Panel 13", type: c.PANEL },
  { id: "region:panel:14", name: "Panel 14", type: c.PANEL },
  { id: "region:panel:15", name: "Panel 15", type: c.PANEL },
  { id: "region:panel:16", name: "Panel 16", type: c.PANEL },
  { id: "region:panel:17", name: "Panel 17", type: c.PANEL },
  { id: "region:panel:18", name: "Panel 18", type: c.PANEL },
  { id: "region:panel:19", name: "Panel 19", type: c.PANEL },
  { id: "region:panel:integration-adwords", name: "AdWords", type: c.PANEL },
  { id: "region:panel:integration-asaas", name: "Asaas", type: c.PANEL },
  { id: "region:panel:integration-bling", name: "Bling", type: c.PANEL },
  { id: "region:panel:integration-calendar", name: "Calendar", type: c.PANEL },
  { id: "region:panel:integration-chatgpt", name: "ChatGPT", type: c.PANEL },
  { id: "region:panel:integration-google-drive", name: "Google Drive", type: c.PANEL },
  { id: "region:panel:integration-loja-integrada", name: "Loja Integrada", type: c.PANEL },
  { id: "region:panel:integration-mercado-livre", name: "Mercado Livre", type: c.PANEL },
  { id: "region:panel:integration-pipedrive", name: "Pipedrive", type: c.PANEL },
  { id: "region:panel:status-currency-btc", name: "Bitcoin", type: c.PANEL },
  { id: "region:panel:status-currency-usd-brl", name: "USD/BRL", type: c.PANEL },
  { id: "region:panel:status-currency-usd-cny", name: "USD/CNY", type: c.PANEL },
  { id: "region:panel:status-email", name: "Email", type: c.PANEL },
  { id: "region:panel:status-instagram", name: "Instagram", type: c.PANEL },
  { id: "region:panel:status-weather", name: "Weather", type: c.PANEL },
  { id: "region:panel:status-wechat", name: "WeChat", type: c.PANEL },
  { id: "region:panel:status-whatsapp", name: "WhatsApp", type: c.PANEL },
  { id: "region:panel:admin-permissions", name: "Permissões Admin", type: c.PANEL },
  { id: "region:panel:admin-users", name: "Usuários Admin", type: c.PANEL },
  { id: "region:panel:admin-session", name: "Session Admin", type: c.PANEL },
  { id: "region:panel:user-profile", name: "Perfil", type: c.PANEL },
  { id: "region:panel:user-preferences", name: "Preferências", type: c.PANEL },
  { id: "region:panel:user-notifications", name: "Notificações", type: c.PANEL },
  { id: "region:panel:user-sessions", name: "Sessões", type: c.PANEL },
  { id: "region:panel:dashboard", name: "Dashboard", type: c.PANEL },
  { id: "region:panel:analytics", name: "Analytics", type: c.PANEL },
  { id: "region:panel:charts", name: "Charts", type: c.PANEL },
  { id: "region:panel:datahub", name: "DataHub", type: c.PANEL },
  { id: "region:panel:observability", name: "Observability", type: c.PANEL }
], q = [
  { id: "trigger:header:currency-btc", name: "Bitcoin", category: n.OPEN_PANEL, criticality: r.LOW },
  { id: "trigger:header:currency-usd-brl", name: "USD/BRL", category: n.OPEN_PANEL, criticality: r.LOW },
  { id: "trigger:header:currency-usd-cny", name: "USD/CNY", category: n.OPEN_PANEL, criticality: r.LOW },
  { id: "trigger:header:email-integration", name: "Email", category: n.OPEN_PANEL, criticality: r.MEDIUM },
  { id: "trigger:header:instagram-messenger", name: "Instagram", category: n.OPEN_PANEL, criticality: r.MEDIUM },
  { id: "trigger:header:whatsapp-integration", name: "WhatsApp", category: n.OPEN_PANEL, criticality: r.MEDIUM },
  { id: "trigger:header:wechat-integration", name: "WeChat", category: n.OPEN_PANEL, criticality: r.MEDIUM },
  { id: "trigger:header:errors-status", name: "Errors", category: n.SYSTEM, criticality: r.HIGH },
  { id: "trigger:header:notifications", name: "Notificações", category: n.USER, criticality: r.MEDIUM },
  { id: "trigger:header:real-time-clock", name: "Relógio", category: n.SYSTEM, criticality: r.LOW },
  { id: "trigger:header:weather", name: "Clima", category: n.SYSTEM, criticality: r.LOW },
  { id: "trigger:header:panel-adwords", name: "AdWords", category: n.OPEN_PANEL, criticality: r.MEDIUM },
  { id: "trigger:header:panel-asaas", name: "Asaas", category: n.OPEN_PANEL, criticality: r.MEDIUM },
  { id: "trigger:header:panel-bling", name: "Bling", category: n.OPEN_PANEL, criticality: r.MEDIUM },
  { id: "trigger:header:panel-calendar", name: "Calendar", category: n.OPEN_PANEL, criticality: r.LOW },
  { id: "trigger:header:panel-chatgpt", name: "ChatGPT", category: n.OPEN_PANEL, criticality: r.MEDIUM },
  { id: "trigger:header:panel-google-drive", name: "Drive", category: n.OPEN_PANEL, criticality: r.MEDIUM },
  { id: "trigger:header:panel-loja-integrada", name: "Loja Integrada", category: n.OPEN_PANEL, criticality: r.MEDIUM },
  { id: "trigger:header:panel-maps", name: "Maps", category: n.OPEN_PANEL, criticality: r.LOW },
  { id: "trigger:header:panel-mercado-livre", name: "Mercado Livre", category: n.OPEN_PANEL, criticality: r.MEDIUM },
  { id: "trigger:header:panel-pipedrive", name: "Pipedrive", category: n.OPEN_PANEL, criticality: r.HIGH },
  { id: "trigger:header:user-menu", name: "User Menu", category: n.USER, criticality: r.HIGH }
], J = [
  { id: "trigger:navrail:home", name: "Home", category: n.NAVIGATION, criticality: r.LOW },
  { id: "trigger:navrail:dashboard", name: "Dashboard", category: n.NAVIGATION, criticality: r.LOW },
  { id: "trigger:navrail:analytics", name: "Analytics", category: n.NAVIGATION, criticality: r.MEDIUM },
  { id: "trigger:navrail:charts", name: "Charts", category: n.NAVIGATION, criticality: r.LOW },
  { id: "trigger:navrail:clientes", name: "Clientes", category: n.NAVIGATION, criticality: r.MEDIUM },
  { id: "trigger:navrail:comercial", name: "Comercial", category: n.NAVIGATION, criticality: r.MEDIUM },
  { id: "trigger:navrail:financeiro", name: "Financeiro", category: n.NAVIGATION, criticality: r.HIGH },
  { id: "trigger:navrail:relatorios", name: "Relatórios", category: n.NAVIGATION, criticality: r.MEDIUM },
  { id: "trigger:navrail:database", name: "Database", category: n.NAVIGATION, criticality: r.HIGH },
  { id: "trigger:navrail:api", name: "API", category: n.NAVIGATION, criticality: r.HIGH },
  { id: "trigger:navrail:code", name: "Code", category: n.NAVIGATION, criticality: r.HIGH },
  { id: "trigger:navrail:folder", name: "Files", category: n.NAVIGATION, criticality: r.MEDIUM },
  { id: "trigger:navrail:location", name: "Location", category: n.NAVIGATION, criticality: r.LOW },
  { id: "trigger:navrail:pipedrive", name: "Pipedrive", category: n.NAVIGATION, criticality: r.MEDIUM },
  { id: "trigger:navrail:docs", name: "Docs", category: n.NAVIGATION, criticality: r.LOW },
  { id: "trigger:navrail:help", name: "Help", category: n.NAVIGATION, criticality: r.LOW },
  { id: "trigger:navrail:bell", name: "Notificações", category: n.USER, criticality: r.MEDIUM },
  { id: "trigger:navrail:admin-settings", name: "Admin Settings", category: n.ADMIN, criticality: r.CRITICAL },
  { id: "trigger:navrail:admin-users", name: "Admin Users", category: n.ADMIN, criticality: r.CRITICAL },
  { id: "trigger:navrail:toggle-sidebar", name: "Toggle Sidebar", category: n.TOGGLE, criticality: r.LOW }
], K = [
  { id: "trigger:footer:activity", name: "Activity", category: n.SYSTEM, criticality: r.LOW },
  { id: "trigger:footer:analytics", name: "Analytics", category: n.OPEN_PANEL, criticality: r.MEDIUM },
  { id: "trigger:footer:bell", name: "Bell", category: n.USER, criticality: r.MEDIUM },
  { id: "trigger:footer:bookmark", name: "Bookmark", category: n.USER, criticality: r.LOW },
  { id: "trigger:footer:calendar", name: "Calendar", category: n.OPEN_PANEL, criticality: r.LOW },
  { id: "trigger:footer:clipboard", name: "Clipboard", category: n.ACTION, criticality: r.LOW },
  { id: "trigger:footer:cloud", name: "Cloud", category: n.SYSTEM, criticality: r.MEDIUM },
  { id: "trigger:footer:cpu", name: "CPU", category: n.SYSTEM, criticality: r.LOW },
  { id: "trigger:footer:credit-card", name: "Credit Card", category: n.OPEN_PANEL, criticality: r.HIGH },
  { id: "trigger:footer:dashboard", name: "Dashboard", category: n.NAVIGATION, criticality: r.LOW },
  { id: "trigger:footer:database", name: "Database", category: n.SYSTEM, criticality: r.HIGH },
  { id: "trigger:footer:folder", name: "Folder", category: n.OPEN_PANEL, criticality: r.MEDIUM },
  { id: "trigger:footer:globe", name: "Globe", category: n.SYSTEM, criticality: r.LOW },
  { id: "trigger:footer:hard-drive", name: "Hard Drive", category: n.SYSTEM, criticality: r.LOW },
  { id: "trigger:footer:language", name: "Language", category: n.USER, criticality: r.LOW },
  { id: "trigger:footer:lgpd", name: "LGPD", category: n.SYSTEM, criticality: r.MEDIUM },
  { id: "trigger:footer:link", name: "Link", category: n.ACTION, criticality: r.LOW },
  { id: "trigger:footer:lock", name: "Lock", category: n.ACTION, criticality: r.HIGH },
  { id: "trigger:footer:logout", name: "Logout", category: n.USER, criticality: r.CRITICAL },
  { id: "trigger:footer:mail", name: "Mail", category: n.OPEN_PANEL, criticality: r.MEDIUM },
  { id: "trigger:footer:monitor", name: "Monitor", category: n.SYSTEM, criticality: r.LOW },
  { id: "trigger:footer:pie-chart", name: "Pie Chart", category: n.OPEN_PANEL, criticality: r.LOW },
  { id: "trigger:footer:privacidade", name: "Privacidade", category: n.SYSTEM, criticality: r.MEDIUM },
  { id: "trigger:footer:search", name: "Search", category: n.ACTION, criticality: r.LOW },
  { id: "trigger:footer:security", name: "Security", category: n.ADMIN, criticality: r.HIGH },
  { id: "trigger:footer:server", name: "Server", category: n.SYSTEM, criticality: r.MEDIUM },
  { id: "trigger:footer:settings", name: "Settings", category: n.USER, criticality: r.MEDIUM },
  { id: "trigger:footer:target", name: "Target", category: n.OPEN_PANEL, criticality: r.LOW },
  { id: "trigger:footer:termos", name: "Termos", category: n.SYSTEM, criticality: r.LOW },
  { id: "trigger:footer:trending-up", name: "Trending", category: n.OPEN_PANEL, criticality: r.LOW },
  { id: "trigger:footer:users", name: "Users", category: n.ADMIN, criticality: r.HIGH },
  { id: "trigger:footer:zap", name: "Zap", category: n.ACTION, criticality: r.LOW }
], w = [
  { id: "trigger:navigation:section-principal", name: "Seção Principal", category: n.TOGGLE, criticality: r.LOW },
  { id: "trigger:navigation:section-operacional", name: "Seção Operacional", category: n.TOGGLE, criticality: r.LOW },
  { id: "trigger:navigation:section-admin", name: "Seção Admin", category: n.TOGGLE, criticality: r.MEDIUM },
  { id: "trigger:navigation:section-financeiro", name: "Seção Financeiro", category: n.TOGGLE, criticality: r.HIGH },
  { id: "trigger:navigation:section-integracao", name: "Seção Integração", category: n.TOGGLE, criticality: r.MEDIUM }
], _ = [
  { id: "trigger:navigation:item-home", name: "Home", category: n.NAVIGATION, criticality: r.LOW },
  { id: "trigger:navigation:item-dashboard", name: "Dashboard", category: n.NAVIGATION, criticality: r.LOW },
  { id: "trigger:navigation:item-analytics", name: "Analytics", category: n.NAVIGATION, criticality: r.MEDIUM },
  { id: "trigger:navigation:item-relatorios", name: "Relatórios", category: n.NAVIGATION, criticality: r.MEDIUM },
  { id: "trigger:navigation:item-charts", name: "Charts", category: n.NAVIGATION, criticality: r.LOW },
  { id: "trigger:navigation:item-clientes", name: "Clientes", category: n.NAVIGATION, criticality: r.MEDIUM },
  { id: "trigger:navigation:item-produtos", name: "Produtos", category: n.NAVIGATION, criticality: r.MEDIUM },
  { id: "trigger:navigation:item-pedidos", name: "Pedidos", category: n.NAVIGATION, criticality: r.MEDIUM },
  { id: "trigger:navigation:item-estoque", name: "Estoque", category: n.NAVIGATION, criticality: r.MEDIUM },
  { id: "trigger:navigation:item-comercial", name: "Comercial", category: n.NAVIGATION, criticality: r.MEDIUM },
  { id: "trigger:navigation:item-financeiro", name: "Financeiro", category: n.NAVIGATION, criticality: r.HIGH },
  { id: "trigger:navigation:item-contas-pagar", name: "Contas a Pagar", category: n.NAVIGATION, criticality: r.HIGH },
  { id: "trigger:navigation:item-contas-receber", name: "Contas a Receber", category: n.NAVIGATION, criticality: r.HIGH },
  { id: "trigger:navigation:item-fluxo-caixa", name: "Fluxo de Caixa", category: n.NAVIGATION, criticality: r.HIGH },
  { id: "trigger:navigation:item-usuarios", name: "Usuários", category: n.ADMIN, criticality: r.CRITICAL },
  { id: "trigger:navigation:item-permissoes", name: "Permissões", category: n.ADMIN, criticality: r.CRITICAL },
  { id: "trigger:navigation:item-configuracoes", name: "Configurações", category: n.ADMIN, criticality: r.HIGH },
  { id: "trigger:navigation:item-logs", name: "Logs do Sistema", category: n.ADMIN, criticality: r.HIGH },
  { id: "trigger:navigation:item-automacoes", name: "Automações", category: n.NAVIGATION, criticality: r.MEDIUM },
  { id: "trigger:navigation:item-pipedrive", name: "Pipedrive", category: n.NAVIGATION, criticality: r.MEDIUM },
  { id: "trigger:navigation:item-asaas", name: "Asaas", category: n.NAVIGATION, criticality: r.MEDIUM },
  { id: "trigger:navigation:item-bling", name: "Bling", category: n.NAVIGATION, criticality: r.MEDIUM },
  { id: "trigger:navigation:item-mercado-livre", name: "Mercado Livre", category: n.NAVIGATION, criticality: r.MEDIUM }
], $ = [
  { id: "trigger:sidebar:section-principal", name: "Seção Principal", category: n.TOGGLE, criticality: r.LOW, deprecated: !0 },
  { id: "trigger:sidebar:section-operacional", name: "Seção Operacional", category: n.TOGGLE, criticality: r.LOW, deprecated: !0 },
  { id: "trigger:sidebar:section-admin", name: "Seção Admin", category: n.TOGGLE, criticality: r.MEDIUM, deprecated: !0 },
  { id: "trigger:sidebar:home", name: "Home", category: n.NAVIGATION, criticality: r.LOW, deprecated: !0 },
  { id: "trigger:sidebar:dashboard", name: "Dashboard", category: n.NAVIGATION, criticality: r.LOW, deprecated: !0 },
  { id: "trigger:sidebar:analytics", name: "Analytics", category: n.NAVIGATION, criticality: r.MEDIUM, deprecated: !0 },
  { id: "trigger:sidebar:relatorios", name: "Relatórios", category: n.NAVIGATION, criticality: r.MEDIUM, deprecated: !0 },
  { id: "trigger:sidebar:clientes", name: "Clientes", category: n.NAVIGATION, criticality: r.MEDIUM, deprecated: !0 },
  { id: "trigger:sidebar:produtos", name: "Produtos", category: n.NAVIGATION, criticality: r.MEDIUM, deprecated: !0 },
  { id: "trigger:sidebar:pedidos", name: "Pedidos", category: n.NAVIGATION, criticality: r.MEDIUM, deprecated: !0 },
  { id: "trigger:sidebar:estoque", name: "Estoque", category: n.NAVIGATION, criticality: r.MEDIUM, deprecated: !0 },
  { id: "trigger:sidebar:financeiro", name: "Financeiro", category: n.NAVIGATION, criticality: r.HIGH, deprecated: !0 },
  { id: "trigger:sidebar:usuarios", name: "Usuários", category: n.ADMIN, criticality: r.CRITICAL, deprecated: !0 },
  { id: "trigger:sidebar:permissoes", name: "Permissões", category: n.ADMIN, criticality: r.CRITICAL, deprecated: !0 },
  { id: "trigger:sidebar:configuracoes", name: "Configurações", category: n.ADMIN, criticality: r.HIGH, deprecated: !0 },
  { id: "trigger:sidebar:logs", name: "Logs do Sistema", category: n.ADMIN, criticality: r.HIGH, deprecated: !0 },
  { id: "trigger:sidebar:automacoes", name: "Automações", category: n.NAVIGATION, criticality: r.MEDIUM, deprecated: !0 }
], H = [
  { id: "trigger:accordion:item-home", name: "Home", category: n.NAVIGATION, criticality: r.LOW, deprecated: !0 },
  { id: "trigger:accordion:item-analytics", name: "Analytics", category: n.NAVIGATION, criticality: r.MEDIUM, deprecated: !0 },
  { id: "trigger:accordion:item-relatorios", name: "Relatórios", category: n.NAVIGATION, criticality: r.MEDIUM, deprecated: !0 },
  { id: "trigger:accordion:item-clientes", name: "Clientes", category: n.NAVIGATION, criticality: r.MEDIUM, deprecated: !0 },
  { id: "trigger:accordion:item-produtos", name: "Produtos", category: n.NAVIGATION, criticality: r.MEDIUM, deprecated: !0 },
  { id: "trigger:accordion:item-pedidos", name: "Pedidos", category: n.NAVIGATION, criticality: r.MEDIUM, deprecated: !0 },
  { id: "trigger:accordion:item-estoque", name: "Estoque", category: n.NAVIGATION, criticality: r.MEDIUM, deprecated: !0 },
  { id: "trigger:accordion:item-usuarios", name: "Usuários", category: n.ADMIN, criticality: r.CRITICAL, deprecated: !0 },
  { id: "trigger:accordion:item-permissoes", name: "Permissões", category: n.ADMIN, criticality: r.CRITICAL, deprecated: !0 },
  { id: "trigger:accordion:item-configuracoes", name: "Configurações", category: n.ADMIN, criticality: r.HIGH, deprecated: !0 },
  { id: "trigger:accordion:item-logs", name: "Logs do Sistema", category: n.ADMIN, criticality: r.HIGH, deprecated: !0 }
], E = U.concat(b), v = w.concat(_), f = q.concat(J).concat(K).concat(v).concat($).concat(H);
function Be(e) {
  for (let t = 0; t < E.length; t++)
    if (E[t].id === e) return E[t];
  return null;
}
function Fe(e) {
  for (let t = 0; t < f.length; t++)
    if (f[t].id === e) return f[t];
  return null;
}
function xe(e) {
  return E.filter((t) => t.type === e);
}
function qe(e) {
  return f.filter((t) => t.category === e);
}
function Je(e) {
  return f.filter((t) => t.criticality === e);
}
function me() {
  return f.filter((e) => e.criticality === r.CRITICAL || e.criticality === r.HIGH);
}
function Z() {
  return f.filter((e) => e.deprecated === !0);
}
function Ie() {
  return f.filter((e) => e.deprecated !== !0);
}
function Q(e) {
  if (!e || typeof e != "string")
    throw new Error("[inventory] buildNavigationItemTrigger: itemId must be a non-empty string");
  const i = `trigger:navigation:item-${e.replace(/^trigger:navigation:item[-:]/, "").replace(/^item[-:]/, "").toLowerCase().replace(/[^a-z0-9-]/g, "-")}`, a = A(i);
  if (!a.valid)
    throw new Error(`[inventory] Invalid trigger ID generated: ${i} - ${a.error}`);
  return i;
}
function X(e) {
  if (!e || typeof e != "string")
    throw new Error("[inventory] buildNavigationSectionTrigger: sectionId must be a non-empty string");
  const i = `trigger:navigation:section-${e.replace(/^trigger:navigation:section[-:]/, "").replace(/^section[-:]/, "").replace(/^sec-/, "").toLowerCase().replace(/[^a-z0-9-]/g, "-")}`, a = A(i);
  if (!a.valid)
    throw new Error(`[inventory] Invalid trigger ID generated: ${i} - ${a.error}`);
  return i;
}
function Ke(e) {
  return Q(e);
}
function Ze(e) {
  return X(e);
}
function Qe() {
  return $.slice();
}
function Xe() {
  return H.slice();
}
function pe() {
  return v.slice();
}
function et() {
  return _.slice();
}
function tt() {
  return w.slice();
}
function V() {
  return {
    regions: {
      total: E.length,
      structural: U.length,
      panels: b.length
    },
    triggers: {
      total: f.length,
      header: q.length,
      navrail: J.length,
      footer: K.length,
      navigation: v.length,
      navigationSections: w.length,
      navigationItems: _.length,
      sidebar: $.length,
      accordion: H.length,
      critical: me().length,
      deprecated: Z().length,
      active: Ie().length
    }
  };
}
function it() {
  return {
    moduleId: F,
    version: x,
    regionsCount: E.length,
    triggersCount: f.length,
    navigationTriggersCount: v.length,
    deprecatedTriggersCount: Z().length,
    triggerPattern: "trigger:navigation:item-{id} | trigger:navigation:section-{id}",
    enforcement: "CONTRACT_VALIDATED",
    phase: "P1 - Active Enforcement (3-segment format)",
    timestamp: Date.now()
  };
}
function rt() {
  const e = { item: !1, section: !1 };
  try {
    const t = Q("test");
    e.item = t === "trigger:navigation:item-test";
  } catch {
  }
  try {
    const t = X("test");
    e.section = t === "trigger:navigation:section-test";
  } catch {
  }
  return {
    status: e.item && e.section ? "HEALTHY" : "DEGRADED",
    moduleId: F,
    version: x,
    checks: {
      regionsReady: E.length > 0,
      triggersReady: f.length > 0,
      navigationTriggersReady: v.length > 0,
      itemBuilderEnforced: e.item,
      sectionBuilderEnforced: e.section,
      unifiedPatternActive: !0,
      threeSegmentCompliant: !0,
      contractEnforced: !0
    },
    timestamp: Date.now()
  };
}
const N = {
  MODULE_ID: F,
  VERSION: x,
  STRUCTURAL_REGIONS: U,
  PANEL_REGIONS: b,
  HEADER_TRIGGERS: q,
  NAVRAIL_TRIGGERS: J,
  FOOTER_TRIGGERS: K,
  NAVIGATION_SECTION_TRIGGERS: w,
  NAVIGATION_ITEM_TRIGGERS: _,
  NAVIGATION_TRIGGERS: v,
  SIDEBAR_TRIGGERS: $,
  ACCORDION_TRIGGERS: H,
  ALL_REGIONS: E,
  ALL_TRIGGERS: f,
  getRegionById: Be,
  getTriggerById: Fe,
  getRegionsByType: xe,
  getTriggersByCategory: qe,
  getTriggersByCriticality: Je,
  getCriticalTriggers: me,
  getDeprecatedTriggers: Z,
  getActiveTriggers: Ie,
  getInventoryStats: V,
  buildNavigationItemTrigger: Q,
  buildNavigationSectionTrigger: X,
  buildAccordionItemTrigger: Ke,
  buildAccordionSectionTrigger: Ze,
  getSidebarTriggers: Qe,
  getAccordionTriggers: Xe,
  getNavigationTriggers: pe,
  getNavigationItemTriggers: et,
  getNavigationSectionTriggers: tt,
  info: it,
  healthCheck: rt
}, ee = "2.3.0-P2-ENTERPRISE", D = "components._shared.permissions", L = R({ moduleId: D });
function nt() {
  L.init();
}
function fe(e) {
  return L.get(e);
}
function at(e) {
  return L.inject(e);
}
function ot() {
  return L.snapshot();
}
const te = function(e) {
  const t = Array.prototype.slice.call(arguments, 1), i = fe("logger");
  if (!i) return;
  const a = i[e] || i.info;
  typeof a == "function" && a.apply(i, [`[${D}]`].concat(t));
}, m = { mode: "allow-all", debug: !1, logDenials: !0, fallbackToMinLevel: !0 }, d = { initialized: !1, regions: /* @__PURE__ */ new Map(), triggers: /* @__PURE__ */ new Map(), permissions: /* @__PURE__ */ new Map(), stats: { checks: 0, allowed: 0, denied: 0 } };
function ct(e) {
  const t = _e(e);
  return d.regions.set(t.id, t), h("region:registered", t.id), t;
}
function gt(e) {
  const t = $e(e);
  return d.triggers.set(t.id, t), h("trigger:registered", t.id), t;
}
function st(e) {
  return d.regions.get(e) || null;
}
function lt(e) {
  return d.triggers.get(e) || null;
}
function Ae() {
  return Array.from(d.regions.values());
}
function Ee() {
  return Array.from(d.triggers.values());
}
function Ne(e, t, i, a) {
  a || (a = {});
  const o = He({
    userId: e,
    entityId: t,
    state: i,
    grantedBy: a.grantedBy || null,
    expiresAt: a.expiresAt || null,
    reason: a.reason || null
  }), g = re(e, t);
  return d.permissions.set(g, o), h("permission:set", { userId: e, entityId: t, state: i }), o;
}
function he(e, t) {
  const i = re(e, t);
  return d.permissions.get(i) || null;
}
function dt(e, t) {
  const i = re(e, t), a = d.permissions.delete(i);
  return a && h("permission:removed", { userId: e, entityId: t }), a;
}
function ut(e) {
  const t = [];
  return d.permissions.forEach((i) => {
    i.userId === e && t.push(i);
  }), t;
}
function k(e, t) {
  if (d.stats.checks++, m.mode === "allow-all")
    return d.stats.allowed++, !0;
  const i = he(e, t);
  if (!i)
    return m.fallbackToMinLevel ? (d.stats.allowed++, !0) : (d.stats.denied++, !1);
  const a = i.state === S.ALLOWED;
  return a ? d.stats.allowed++ : (d.stats.denied++, m.logDenials && h("permission:denied", { userId: e, entityId: t })), a;
}
function yt(e, t) {
  return j(t) ? k(e, t) : (te("warn", "Invalid trigger ID:", t), m.mode === "allow-all");
}
function mt(e, t) {
  return B(t) ? k(e, t) : (te("warn", "Invalid region ID:", t), m.mode === "allow-all");
}
function It(e, t) {
  const i = {};
  for (let a = 0; a < t.length; a++)
    i[t[a]] = k(e, t[a]);
  return i;
}
function pt(e, t) {
  const i = [];
  for (let a = 0; a < t.length; a++) {
    const o = t[a];
    i.push(Ne(e, o.entityId, o.state, o));
  }
  return i;
}
function ft(e) {
  if (["allow-all", "explicit", "strict"].indexOf(e) < 0) throw new Error(`Invalid mode: ${e}`);
  m.mode = e, h("config:mode", e);
}
function At() {
  return m.mode;
}
function Et(e) {
  m.debug = e;
}
function Nt() {
  return Object.assign({}, m);
}
function ht(e) {
  if (e || (e = {}), !d.initialized)
    return nt(), e.mode && (m.mode = e.mode), e.debug !== void 0 && (m.debug = e.debug), e.logDenials !== void 0 && (m.logDenials = e.logDenials), d.initialized = !0, h("init", { config: m }), !0;
}
function Te() {
  d.regions.clear(), d.triggers.clear(), d.permissions.clear(), d.stats = { checks: 0, allowed: 0, denied: 0 }, h("reset");
}
function Tt() {
  Te(), d.initialized = !1, h("destroy");
}
function ie() {
  return {
    checks: d.stats.checks,
    allowed: d.stats.allowed,
    denied: d.stats.denied,
    regions: d.regions.size,
    triggers: d.triggers.size,
    permissions: d.permissions.size
  };
}
function Ot() {
  const e = fe("logger");
  return {
    status: L.isInitialized() ? "HEALTHY" : "DEGRADED",
    version: ee,
    moduleId: D,
    contractsVersion: Ue,
    mode: m.mode,
    initialized: d.initialized,
    stats: ie(),
    loggerAvailable: !!e,
    portsInitialized: L.isInitialized(),
    inventoryStats: V(),
    buildersAvailable: !0,
    threeSegmentCompliant: !0,
    timestamp: Date.now()
  };
}
function Lt() {
  return {
    version: ee,
    moduleId: D,
    mode: m.mode,
    initialized: d.initialized,
    portsInitialized: L.isInitialized(),
    regions: Ae(),
    triggers: Ee(),
    stats: ie(),
    inventoryStats: V(),
    triggerPattern: "trigger:navigation:item-{id} | trigger:navigation:section-{id}",
    enforcement: "CONTRACT_VALIDATED",
    timestamp: Date.now()
  };
}
function re(e, t) {
  return `${e}::${t}`;
}
function h(e, t) {
  m.debug && te("info", e, t || "");
}
const y = {
  VERSION: ee,
  MODULE_ID: D,
  // Lifecycle
  init: ht,
  reset: Te,
  destroy: Tt,
  // Permission checks
  can: k,
  canTrigger: yt,
  canAccessRegion: mt,
  checkMultiple: It,
  // Registration
  registerRegion: ct,
  registerTrigger: gt,
  getRegion: st,
  getTrigger: lt,
  getAllRegions: Ae,
  getAllTriggers: Ee,
  // Permissions management
  setPermission: Ne,
  getPermission: he,
  removePermission: dt,
  getUserPermissions: ut,
  setMultiplePermissions: pt,
  // Config
  setMode: ft,
  getMode: At,
  setDebug: Et,
  getConfig: Nt,
  getStats: ie,
  // Health
  healthCheck: Ot,
  info: Lt,
  // Ports
  injectPorts: at,
  getPorts: ot,
  // Contracts
  ENTITY_TYPE: be,
  REGION_TYPE: c,
  TRIGGER_CATEGORY: n,
  CRITICALITY: r,
  PERMISSION_STATE: S,
  validateId: A,
  parseId: ye,
  buildId: we,
  isTriggerId: j,
  isRegionId: B,
  // Canonical Builders (USE THESE)
  buildNavigationItemTrigger: Ve,
  buildNavigationSectionTrigger: ke,
  buildCanonicalTrigger: We,
  buildCanonicalRegion: ze,
  validateTrigger: Ye,
  isLegacyFormat: je,
  // Inventory
  STRUCTURAL_REGIONS: U,
  PANEL_REGIONS: b,
  NAVIGATION_TRIGGERS: v,
  INVENTORY_REGIONS: E,
  INVENTORY_TRIGGERS: f,
  getInventoryStats: V,
  getNavigationTriggers: pe
}, vt = "components._shared.permissions.integration.user-detection", Oe = R({ moduleId: vt });
function Pt() {
  Oe.init();
}
function Mt(e) {
  return Oe.get(e);
}
function Le(e) {
  Pt();
  const t = Mt("globalState");
  if (t && t.getState)
    try {
      const i = t.getState(), a = i && i.auth && i.auth.user && i.auth.user.id || i && i.user && i.user.id || i && i.session && i.session.userId;
      if (a)
        return e && e("user-detected", { userId: String(a), source: "GlobalState" }), Promise.resolve(String(a));
    } catch {
    }
  return fetch("/api/auth/check.php", {
    credentials: "include",
    headers: { Accept: "application/json" }
  }).then((i) => i.ok ? i.json().then((a) => a.ok && a.authenticated && a.user && a.user.id ? (e && e("user-detected", { userId: String(a.user.id), source: "auth-api" }), String(a.user.id)) : null) : null).catch((i) => (e && e("user-detect-api-error", i.message), null)).then((i) => {
    if (i) return i;
    try {
      const a = sessionStorage.getItem("dsd_session");
      if (a) {
        const o = JSON.parse(a);
        if (o.userId)
          return e && e("user-detected", { userId: String(o.userId), source: "sessionStorage" }), String(o.userId);
      }
    } catch {
    }
    return e && e("user-fallback", { userId: "anonymous" }), "anonymous";
  });
}
const Dt = "/api/permissions/uarps.php";
async function ne(e, t, i) {
  if (!(!e || e === "anonymous"))
    try {
      t.stats.apiCalls++;
      const a = await fetch(`${Dt}?action=my-permissions`, {
        credentials: "include",
        headers: { Accept: "application/json" }
      });
      if (!a.ok) {
        t.stats.apiFails++, i && i("api-error", { status: a.status });
        return;
      }
      const o = await a.json();
      if (!o.ok) {
        i && i("api-response-error", o.error);
        return;
      }
      t.userPermissions.triggers = {}, t.userPermissions.regions = {};
      for (let g = 0; g < (o.triggers || []).length; g++) {
        const l = o.triggers[g];
        t.userPermissions.triggers[l.trigger_id] = l.state;
      }
      for (let g = 0; g < (o.regions || []).length; g++) {
        const l = o.regions[g];
        t.userPermissions.regions[l.region_id] = l.state;
      }
      t.apiConnected = !0, i && i("permissions-loaded", {
        triggers: Object.keys(t.userPermissions.triggers).length,
        regions: Object.keys(t.userPermissions.regions).length
      });
    } catch (a) {
      t.stats.apiFails++, i && i("api-fetch-error", a.message);
    }
}
function Gt(e, t, i, a, o) {
  const g = t || i.currentUserId || "anonymous";
  i.stats.triggerChecks++, i.stats.totalChecks++;
  const l = i.userPermissions.triggers[e];
  if (l) {
    const p = l !== "deny";
    return a.getConfig().debug && o && o("trigger-check-cached", { triggerId: e, userId: g, state: l, result: p }), p;
  }
  const u = a.canTrigger(g, e);
  return a.getConfig().debug && o && o("trigger-check", { triggerId: e, userId: g, result: u }), u;
}
function Ct(e, t, i, a, o) {
  const g = t || i.currentUserId || "anonymous";
  i.stats.regionChecks++, i.stats.totalChecks++;
  const l = i.userPermissions.regions[e];
  if (l) {
    const p = l !== "deny";
    return a.getConfig().debug && o && o("region-check-cached", { regionId: e, userId: g, state: l, result: p }), p;
  }
  const u = a.canAccessRegion(g, e);
  return a.getConfig().debug && o && o("region-check", { regionId: e, userId: g, result: u }), u;
}
function Rt(e, t, i, a, o, g) {
  const l = t || i.currentUserId || "anonymous";
  return i.stats.totalChecks++, e.indexOf("trigger:") === 0 ? o(e, l) : e.indexOf("region:") === 0 ? g(e, l) : a.can(l, e);
}
function St(e, t, i, a) {
  const o = t || i.currentUserId || "anonymous";
  i.stats.totalChecks += e.length;
  const g = {};
  for (let l = 0; l < e.length; l++)
    g[e[l]] = a(e[l], o);
  return g;
}
function Ut(e, t, i, a, o, g, l, u, p, O) {
  window.Permissions = {
    can: g.can,
    canTrigger: g.canTrigger,
    canAccessRegion: g.canAccessRegion,
    checkMultiple: g.checkMultiple,
    setCurrentUser: g.setCurrentUser,
    getCurrentUser: g.getCurrentUser,
    syncPermissions: p,
    isApiConnected() {
      return i.apiConnected;
    },
    getUserPermissions() {
      return Object.assign({}, i.userPermissions);
    },
    getRegion: a.getRegion,
    getTrigger: a.getTrigger,
    getAllRegions: a.getAllRegions,
    getAllTriggers: a.getAllTriggers,
    getMode: a.getMode,
    setMode: a.setMode,
    setDebug: a.setDebug,
    healthCheck: l.healthCheck,
    info: l.info,
    getStats() {
      return Object.assign({}, i.stats, a.getStats());
    },
    inventory: {
      getRegionById: o.getRegionById,
      getTriggerById: o.getTriggerById,
      getRegionsByType: o.getRegionsByType,
      getTriggersByCategory: o.getTriggersByCategory,
      getCriticalTriggers: o.getCriticalTriggers,
      getInventoryStats: o.getInventoryStats
    },
    ENTITY_TYPE: a.ENTITY_TYPE,
    REGION_TYPE: a.REGION_TYPE,
    TRIGGER_CATEGORY: a.TRIGGER_CATEGORY,
    CRITICALITY: a.CRITICALITY,
    PERMISSION_STATE: a.PERMISSION_STATE,
    VERSION: e,
    MODULE_ID: t
  }, window.__dev = window.__dev || {}, window.__dev.permissions = {
    engine: a,
    inventory: o,
    integration: {
      state() {
        return Object.assign({}, i);
      },
      init: u,
      healthCheck: l.healthCheck,
      info: l.info,
      syncPermissions: p
    }
  }, O && O("global-exposed");
}
const bt = "components._shared.permissions.integration.diagnostics", ve = R({ moduleId: bt });
function wt(e) {
  return ve.get(e);
}
function _t(e, t, i, a, o) {
  const g = ve.snapshot(), l = a.healthCheck(), u = o.getInventoryStats(), p = {
    initialized: i.initialized,
    engineHealthy: l.status === "HEALTHY",
    apiConnected: i.apiConnected,
    hasUser: !!i.currentUserId && i.currentUserId !== "anonymous",
    portsInitialized: g._initialized
  }, O = Object.values(p).filter(Boolean).length, Y = Object.keys(p).length;
  return {
    status: O === Y ? "HEALTHY" : O >= 2 ? "DEGRADED" : "UNHEALTHY",
    score: O,
    maxScore: Y,
    scoreDisplay: `${O}/${Y}`,
    version: e,
    moduleId: t,
    phase: i.apiConnected ? "api-connected" : "allow-all",
    checks: p,
    currentUser: i.currentUserId,
    engine: l,
    inventory: u,
    integrationStats: Object.assign({}, i.stats),
    cachedPermissions: {
      triggers: Object.keys(i.userPermissions.triggers).length,
      regions: Object.keys(i.userPermissions.regions).length
    },
    eventBusConnected: !!wt("eventBus"),
    globallyExposed: typeof window < "u" && !!window.Permissions,
    readyFlagsUsed: i.readyFlagsUsed,
    portsInitialized: g._initialized,
    timestamp: Date.now()
  };
}
function $t(e, t, i, a, o) {
  return {
    version: e,
    moduleId: t,
    phase: i.apiConnected ? "api-connected (Fase 6)" : "allow-all (Fase 2)",
    initialized: i.initialized,
    registeredAt: i.registeredAt,
    currentUser: i.currentUserId,
    apiConnected: i.apiConnected,
    mode: a.getMode(),
    readyFlagsUsed: i.readyFlagsUsed,
    stats: Object.assign({}, i.stats, a.getStats()),
    cachedPermissions: {
      triggers: Object.keys(i.userPermissions.triggers).length,
      regions: Object.keys(i.userPermissions.regions).length
    },
    regions: a.getAllRegions().length,
    triggers: a.getAllTriggers().length,
    criticalTriggers: o.getCriticalTriggers().length,
    timestamp: Date.now()
  };
}
const G = "3.8.0-P2-ENTERPRISE", P = "components._shared.permissions.integration", Ht = typeof window < "u", W = R({ moduleId: P });
function Vt() {
  W.init();
}
function ae(e) {
  return W.get(e);
}
function kt(e) {
  return W.inject(e);
}
function Wt() {
  return W.snapshot();
}
const Pe = function(e) {
  const t = Array.prototype.slice.call(arguments, 1), i = ae("logger");
  if (!i) return;
  const a = i[e] || i.info;
  typeof a == "function" && a.apply(i, [`[${P}]`].concat(t));
};
let T = [];
const s = {
  initialized: !1,
  registeredAt: null,
  currentUserId: null,
  apiConnected: !1,
  readyFlagsUsed: !1,
  userPermissions: { triggers: {}, regions: {} },
  stats: { regionChecks: 0, triggerChecks: 0, totalChecks: 0, apiCalls: 0, apiFails: 0 }
};
function I(e, t) {
  t === void 0 && (t = null);
  const i = y.getConfig ? y.getConfig() : null;
  i && i.debug && Pe("info", e, t || "");
}
function M(e) {
  return e === void 0 && (e = {}), s.initialized ? (I("already-initialized"), Promise.resolve({ ok: !0, alreadyInitialized: !0 })) : Promise.resolve().then(() => (y.init({ mode: "allow-all", debug: e.debug || !1, logDenials: !0 }), zt(), Yt(), e.userId ? (s.currentUserId = String(e.userId), s.currentUserId) : Le(I))).then((t) => {
    if (s.currentUserId = t, s.currentUserId && s.currentUserId !== "anonymous")
      return ne(s.currentUserId, s, I);
  }).then(() => (Ft(), jt(), s.initialized = !0, s.registeredAt = Date.now(), I("initialized", {
    regions: y.getAllRegions().length,
    triggers: y.getAllTriggers().length,
    userId: s.currentUserId,
    apiConnected: s.apiConnected,
    mode: y.getMode()
  }), { ok: !0, alreadyInitialized: !1 })).catch((t) => (Pe("error", "Init error:", t ? t.message : ""), { ok: !1, error: t.message }));
}
function zt() {
  let e = 0;
  for (let t = 0; t < N.ALL_REGIONS.length; t++) {
    const i = N.ALL_REGIONS[t];
    try {
      y.registerRegion({
        id: i.id,
        name: i.name,
        type: i.type,
        parent: i.parent || null,
        description: i.description || "",
        metadata: i.metadata || {}
      }), e++;
    } catch {
    }
  }
  I("regions-registered", { count: e, total: N.ALL_REGIONS.length });
}
function Yt() {
  let e = 0;
  for (let t = 0; t < N.ALL_TRIGGERS.length; t++) {
    const i = N.ALL_TRIGGERS[t];
    try {
      y.registerTrigger({
        id: i.id,
        name: i.name,
        category: i.category,
        criticality: i.criticality || "medium",
        region: i.region || null,
        description: i.description || "",
        metadata: i.metadata || {}
      }), e++;
    } catch {
    }
  }
  I("triggers-registered", { count: e, total: N.ALL_TRIGGERS.length });
}
function oe(e, t) {
  return Gt(e, t, s, y, I);
}
function ce(e, t) {
  return Ct(e, t, s, y, I);
}
function ge(e, t) {
  return Rt(e, t, s, y, oe, ce);
}
function Me(e, t) {
  return St(e, t, s, ge);
}
function z(e) {
  const t = s.currentUserId;
  s.currentUserId = e, t !== e && (s.userPermissions = { triggers: {}, regions: {} }, s.apiConnected = !1, e && e !== "anonymous" && ne(e, s, I).catch((i) => {
    I("api-load-failed", i.message);
  })), I("user-set", { userId: e });
}
function De() {
  return s.currentUserId;
}
function Ge() {
  return Promise.resolve().then(() => !s.currentUserId || s.currentUserId === "anonymous" ? Le(I) : s.currentUserId).then((e) => (s.currentUserId = e, ne(s.currentUserId, s, I))).then(() => ({
    ok: s.apiConnected,
    triggers: Object.keys(s.userPermissions.triggers).length,
    regions: Object.keys(s.userPermissions.regions).length
  }));
}
function se(e) {
  e && e.userId && z(String(e.userId));
}
function le() {
  z("anonymous");
}
function jt() {
  const e = ae("eventBus");
  if (!e || !e.on) return;
  const t = e.on(C.LOGIN, se);
  typeof t == "function" ? T.push(t) : T.push(() => {
    e.off && e.off(C.LOGIN, se);
  });
  const i = e.on(C.LOGOUT, le);
  typeof i == "function" ? T.push(i) : T.push(() => {
    e.off && e.off(C.LOGOUT, le);
  }), e.emit(Se.READY, {
    version: G,
    mode: y.getMode(),
    regions: y.getAllRegions().length,
    triggers: y.getAllTriggers().length,
    userId: s.currentUserId,
    apiConnected: s.apiConnected
  }), I("eventbus-connected");
}
function Bt() {
  T.forEach((e) => {
    try {
      e();
    } catch {
    }
  }), T = [], s.initialized = !1, I("destroyed");
}
function Ft() {
  Ut(G, P, s, y, N, { can: ge, canTrigger: oe, canAccessRegion: ce, checkMultiple: Me, setCurrentUser: z, getCurrentUser: De }, { healthCheck() {
    return Ce();
  }, info() {
    return Re();
  } }, M, Ge, I);
}
function Ce() {
  const e = _t(G, P, s, y, N);
  return e.p21Compliant = !0, e.cleanups = T.length, e.timestamp = Date.now(), e;
}
function Re() {
  const e = $t(G, P, s, y, N);
  return e.p21Compliant = !0, e.cleanups = T.length, e.timestamp = Date.now(), e;
}
function de() {
  Vt();
  const e = ae("readyFlags");
  return e && e.waitFor ? (s.readyFlagsUsed = !0, e.waitFor("eventbus", 5e3).then((t) => M())) : M();
}
Ht && (document.readyState === "loading" ? document.addEventListener("DOMContentLoaded", () => {
  de();
}) : setTimeout(() => {
  de();
}, 0));
const Jt = {
  VERSION: G,
  MODULE_ID: P,
  init: M,
  destroy: Bt,
  can: ge,
  canTrigger: oe,
  canAccessRegion: ce,
  checkMultiple: Me,
  setCurrentUser: z,
  getCurrentUser: De,
  syncPermissions: Ge,
  healthCheck: Ce,
  info: Re,
  injectPorts: kt,
  getPorts: Wt
};
export {
  P as MODULE_ID,
  G as VERSION,
  ge as can,
  ce as canAccessRegion,
  oe as canTrigger,
  Me as checkMultiple,
  Jt as default,
  Bt as destroy,
  De as getCurrentUser,
  Wt as getPorts,
  Ce as healthCheck,
  Re as info,
  M as init,
  kt as injectPorts,
  z as setCurrentUser,
  Ge as syncPermissions
};
