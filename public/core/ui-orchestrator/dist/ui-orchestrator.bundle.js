import { createCorePorts as T } from "/core/runtime/ports-profiles.js";
const f = Object.freeze({
  MAIN: "main",
  SIDE: "side",
  MODAL: "modal",
  OVERLAY: "overlay",
  DRAWER: "drawer",
  TOAST: "toast"
}), x = Object.freeze({
  NAVIGATE: "navigate",
  PANEL: "panel",
  EXTERNAL: "external",
  ACTION: "action",
  NOOP: "noop"
}), q = Object.freeze({
  CRITICAL: 100,
  HIGH: 75,
  NORMAL: 50,
  LOW: 25,
  FALLBACK: 0
}), P = "2.0.0-P2-ENTERPRISE", y = "core.ui-orchestrator.core.manifest-state", b = T({ moduleId: y }), K = () => {
  b.init();
}, J = (e) => b.get(e), X = (e) => b.inject(e), Q = () => b.snapshot(), i = {
  intents: {},
  panels: {},
  routes: {},
  rules: [],
  triggers: {},
  hash: null,
  generatedAt: null,
  source: "static",
  loadedAt: null
};
let j = !1;
const p = (e, a, n) => {
  const t = J("logger")?.[e];
  typeof t == "function" && t(`[${y}] ${a}`, n || {});
};
function ee(e) {
  if (j) return { success: !0, alreadyInitialized: !0 };
  K();
  try {
    return e && (i.intents = Object.assign({}, e.INTENT_REGISTRY || {}), i.panels = Object.assign({}, e.PANELS || {}), i.routes = Object.assign({}, e.ROUTES || {}), i.rules = Array.isArray(e.RULES) ? e.RULES.slice() : [], i.triggers = Object.assign({}, e.TRIGGERS || {}), i.hash = e.MANIFEST_HASH || null, i.generatedAt = e.GENERATED_AT || null, i.source = "static"), i.loadedAt = (/* @__PURE__ */ new Date()).toISOString(), j = !0, p("info", "ManifestState initialized", {
      intents: Object.keys(i.intents).length,
      panels: Object.keys(i.panels).length,
      routes: Object.keys(i.routes).length,
      rules: i.rules.length,
      triggers: Object.keys(i.triggers).length,
      hash: i.hash
    }), { success: !0 };
  } catch (a) {
    return p("error", "Init failed", { error: a.message }), { success: !1, error: a.message };
  }
}
function ae() {
  return Object.assign({}, i.intents);
}
function ie() {
  return Object.assign({}, i.panels);
}
function ne() {
  return Object.assign({}, i.routes);
}
function re() {
  return i.rules.slice();
}
function oe() {
  return Object.assign({}, i.triggers);
}
function te() {
  return i.hash;
}
function se(e) {
  return i.intents[e] || null;
}
function le(e) {
  return i.panels[e] || null;
}
function de(e) {
  return i.routes[e] || null;
}
function ce(e) {
  return i.triggers[e] || null;
}
function pe(e) {
  for (let a = 0; a < i.rules.length; a++)
    if (i.rules[a].intent === e) return i.rules[a];
  return null;
}
function me(e) {
  const a = Object.keys(i.routes);
  for (let n = 0; n < a.length; n++) {
    const r = i.routes[a[n]];
    if (r.path === e) return r;
  }
  return null;
}
function ue(e) {
  const a = [], n = Object.keys(i.panels);
  for (let r = 0; r < n.length; r++) {
    const t = i.panels[n[r]];
    t.regions && t.regions.indexOf(e) >= 0 && a.push(t);
  }
  return a;
}
function ge(e) {
  Object.assign(i.intents, e), i.source = "runtime", p("debug", "Intents updated", { count: Object.keys(e).length });
}
function be(e) {
  Object.assign(i.panels, e), i.source = "runtime", p("debug", "Panels updated", { count: Object.keys(e).length });
}
function he(e) {
  Object.assign(i.routes, e), i.source = "runtime", p("debug", "Routes updated", { count: Object.keys(e).length });
}
function ve(e) {
  Array.isArray(e) && e.forEach((a) => {
    let n = !1;
    for (let r = 0; r < i.rules.length; r++)
      if (i.rules[r].id === a.id || i.rules[r].intent === a.intent) {
        i.rules[r] = a, n = !0;
        break;
      }
    n || i.rules.push(a);
  }), i.source = "runtime", p("debug", "Rules updated", { count: e.length });
}
function fe(e) {
  Object.assign(i.triggers, e), i.source = "runtime", p("debug", "Triggers updated", { count: Object.keys(e).length });
}
function ye(e) {
  if (!e) return;
  const a = { routes: 0, panels: 0, rules: 0, triggers: 0 };
  if (e.routes) {
    const n = e.routes;
    Object.keys(n).forEach((r) => {
      const t = n[r];
      t.action === "delete" || !t.active ? delete i.routes[r] : i.routes[r] = t, a.routes++;
    });
  }
  if (e.panels) {
    const n = e.panels;
    Object.keys(n).forEach((r) => {
      const t = n[r];
      t.action === "delete" || !t.active ? delete i.panels[r] : i.panels[r] = t, a.panels++;
    });
  }
  if (e.rules && Array.isArray(e.rules) && e.rules.forEach((n) => {
    if (n.diffAction === "delete" || !n.active)
      i.rules = i.rules.filter((r) => r.id !== n.id);
    else {
      let r = !1;
      for (let t = 0; t < i.rules.length; t++)
        if (i.rules[t].id === n.id) {
          i.rules[t] = n, r = !0;
          break;
        }
      r || i.rules.push(n);
    }
    a.rules++;
  }), e.triggers) {
    const n = e.triggers;
    Object.keys(n).forEach((r) => {
      const t = n[r];
      t.action === "delete" || !t.active ? delete i.triggers[r] : i.triggers[r] = t.intentId || t, a.triggers++;
    });
  }
  return i.source = "diff", p("info", "Diff applied", a), a;
}
function Le(e) {
  e && (e.intents && (i.intents = Object.assign({}, e.intents)), e.panels && (i.panels = Object.assign({}, e.panels)), e.routes && (i.routes = Object.assign({}, e.routes)), e.rules && (i.rules = Array.isArray(e.rules) ? e.rules.slice() : []), e.triggers && (i.triggers = Object.assign({}, e.triggers)), i.hash = e.hash || null, i.source = "api", i.loadedAt = (/* @__PURE__ */ new Date()).toISOString(), p("info", "Full replace completed", {
    intents: Object.keys(i.intents).length,
    panels: Object.keys(i.panels).length,
    routes: Object.keys(i.routes).length,
    rules: i.rules.length,
    triggers: Object.keys(i.triggers).length
  }));
}
function Ae() {
  return {
    version: P,
    moduleId: y,
    initialized: j,
    hash: i.hash,
    generatedAt: i.generatedAt,
    source: i.source,
    loadedAt: i.loadedAt,
    counts: {
      intents: Object.keys(i.intents).length,
      panels: Object.keys(i.panels).length,
      routes: Object.keys(i.routes).length,
      rules: i.rules.length,
      triggers: Object.keys(i.triggers).length
    },
    portsInitialized: b.isInitialized()
  };
}
function ke() {
  return {
    status: j ? "HEALTHY" : "NOT_INITIALIZED",
    moduleId: y,
    version: P,
    hash: i.hash,
    source: i.source,
    checks: {
      intentsReady: Object.keys(i.intents).length > 0,
      panelsReady: Object.keys(i.panels).length > 0,
      routesReady: Object.keys(i.routes).length > 0,
      rulesReady: i.rules.length > 0,
      triggersReady: Object.keys(i.triggers).length > 0
    },
    portsInitialized: b.isInitialized()
  };
}
var l = Object.freeze({
  VERSION: P,
  MODULE_ID: y,
  init: ee,
  getIntents: ae,
  getPanels: ie,
  getRoutes: ne,
  getRules: re,
  getTriggers: oe,
  getHash: te,
  getIntent: se,
  getPanel: le,
  getRoute: de,
  getTriggerIntent: ce,
  getRuleByIntent: pe,
  getRouteByPath: me,
  getPanelsByRegion: ue,
  updateIntents: ge,
  updatePanels: be,
  updateRoutes: he,
  updateRules: ve,
  updateTriggers: fe,
  applyDiff: ye,
  replaceAll: Le,
  info: Ae,
  healthCheck: ke,
  injectPorts: X,
  getPorts: Q
});
const R = "1.1.0-GENERATED-COMPACT", I = "ui-orchestrator-manifest-generated", w = "2026-07-30T07:15:02-03:00", O = "3959f95406e87a03", L = Object.freeze({
  "sidebar.principal": { label: "Geral", icon: "dashboard" },
  "sidebar.geral": { label: "Geral", icon: "grid" },
  "sidebar.automacoes": { label: "Automações", icon: "automation" },
  "sidebar.bling": { label: "Bling", icon: "box" },
  "sidebar.clientes": { label: "Clientes", icon: "users" },
  "sidebar.colaboradores": { label: "Colaboradores", icon: "team" },
  "sidebar.comercial": { label: "Comercial", icon: "chart" },
  "sidebar.compras": { label: "Compras", icon: "cart" },
  "sidebar.contratos": { label: "Contratos", icon: "document" },
  "sidebar.financeiro": { label: "Financeiro", icon: "money" },
  "sidebar.fornecedores": { label: "Fornecedores", icon: "supplier" },
  "sidebar.google-ads": { label: "Google Ads", icon: "ads" },
  "sidebar.google-drive": { label: "Google Drive", icon: "drive" },
  "sidebar.importacao": { label: "Importação", icon: "globe" },
  "sidebar.instagram": { label: "Instagram", icon: "instagram" },
  "sidebar.operacional-menu": { label: "Operacional", icon: "cog" },
  "sidebar.orcamento-clientes": { label: "Orcamentos", icon: "calculator" },
  "sidebar.pipedrive": { label: "Pipedrive", icon: "pipeline" },
  "sidebar.produtos": { label: "Produtos", icon: "package" },
  "sidebar.rh-pessoas": { label: "RH Pessoas", icon: "people" },
  "sidebar.servidores": { label: "Dash Servidores", icon: "server" },
  "sidebar.user-management": { label: "Gestao Usuarios", icon: "users" },
  "sidebar.permissions-admin": { label: "Gestao Permissoes", icon: "shield" },
  "sidebar.session-admin": { label: "Gestao Sessoes", icon: "medal" },
  "sidebar.audit-trail": { label: "Auditoria", icon: "clipboard" },
  "sidebar.nav-admin": { label: "Navegacao", icon: "nav" },
  "sidebar.user-preferences": { label: "Minhas Preferencias", icon: "settings" },
  "nav.admin.orchestrator-manager": { label: "UI Orchestrator", icon: "layers" },
  "sidebar.comercial.leads": { label: "Leads", icon: "target" },
  "sidebar.comercial.oportunidades": { label: "Oportunidades", icon: "trending-up" },
  "sidebar.comercial.comissoes": { label: "Comissoes", icon: "percent" },
  "sidebar.comercial.metas": { label: "Metas Comerciais", icon: "flag" },
  "sidebar.comercial.performance": { label: "Performance Vendas", icon: "bar-chart" },
  "sidebar.compras.visao-geral": { label: "Geral Compras", icon: "eye" },
  "sidebar.compras.requisicoes": { label: "Requisicoes Compra", icon: "clipboard" },
  "sidebar.compras.cotacoes": { label: "Cotacoes", icon: "file-text" },
  "sidebar.compras.controle-custos": { label: "Controle de Custos", icon: "dollar" },
  "sidebar.compras.historico": { label: "Historico de Compras", icon: "clock" },
  "sidebar.recebimento.principal": { label: "Recebimento Mercadorias", icon: "download" },
  "sidebar.recebimento.conferencia": { label: "Conferencia Itens", icon: "check-square" },
  "sidebar.recebimento.entrada": { label: "Entrada Estoque", icon: "log-in" },
  "sidebar.recebimento.aprovacao": { label: "Aprovacao Recebimento", icon: "thumbs-up" },
  "sidebar.recebimento.historico": { label: "Historico Recebimentos", icon: "clock" },
  "sidebar.recebimento.indicadores": { label: "Indicadores Recebimento", icon: "activity" },
  "sidebar.contratos.visao-geral": { label: "Geral Contratos", icon: "eye" },
  "sidebar.contratos.relacao": { label: "Relacao de Contratos", icon: "list" },
  "sidebar.contratos.tipos": { label: "Tipos Contratos", icon: "tag" },
  "sidebar.contratos.partes": { label: "Partes Envolvidas", icon: "users" },
  "sidebar.contratos.vigencia": { label: "Vigencia e Renovacoes", icon: "calendar" },
  "sidebar.contratos.anexos": { label: "Anexos e Documentos", icon: "paperclip" },
  "sidebar.contratos.status": { label: "Status Contratos", icon: "info" },
  "sidebar.clientes.visao-geral": { label: "Geral Clientes", icon: "eye" },
  "sidebar.clientes.cadastro": { label: "Cadastro Clientes", icon: "user-plus" },
  "sidebar.clientes.historico": { label: "Historico Comercial", icon: "clock" },
  "sidebar.clientes.contratos": { label: "Contratos com Clientes", icon: "document" },
  "sidebar.clientes.faturamento": { label: "Faturamento Cliente", icon: "drag" },
  "sidebar.clientes.ativos-inativos": { label: "Clientes Ativos / Inativos", icon: "toggle" },
  "sidebar.empresas.cadastro": { label: "Cadastro de Nossas Empresas", icon: "briefcase" },
  "sidebar.fornecedores.visao-geral": { label: "Geral Fornecedores", icon: "eye" },
  "sidebar.fornecedores.cadastro": { label: "Cadastro Fornecedores", icon: "user-plus" },
  "sidebar.fornecedores.classificacao": { label: "Classificacao Fornecedores", icon: "star" },
  "sidebar.fornecedores.contratos": { label: "Contratos Fornecedores", icon: "document" },
  "sidebar.fornecedores.hist-compras": { label: "Historico Compras", icon: "clock" },
  "sidebar.fornecedores.avaliacao": { label: "Avaliação Fornecedores", icon: "thumbs-up" },
  "sidebar.fornecedores.documentacao": { label: "Documentação Fornecedor", icon: "file-text" },
  "sidebar.fornecedores.ativos-inativos": { label: "Fornec. Ativos / Inativos", icon: "toggle" },
  "sidebar.colaboradores.visao-geral": { label: "Geral Colaboradores", icon: "eye" },
  "sidebar.colaboradores.cadastro": { label: "Cadastro Colaboradores", icon: "user-plus" },
  "sidebar.colaboradores.cargos": { label: "Cargos e Funcoes", icon: "tag" },
  "sidebar.colaboradores.departamentos": { label: "Departamentos", icon: "grid" },
  "sidebar.colaboradores.salarios": { label: "Salarios", icon: "dollar" },
  "sidebar.colaboradores.jornada": { label: "Jornada e Escalas", icon: "clock" },
  "sidebar.colaboradores.apontamento": { label: "Apontamento Horas", icon: "watch" },
  "sidebar.colaboradores.ferias": { label: "Ferias e Afastamentos", icon: "calendar" },
  "sidebar.colaboradores.beneficios": { label: "Beneficios", icon: "gift" },
  "sidebar.colaboradores.avaliacoes": { label: "Avaliacoes e Desempenho", icon: "star" },
  "sidebar.colaboradores.documentos": { label: "Documentos Colaboradores", icon: "file-text" },
  "sidebar.contabil.visao-geral": { label: "Geral Contabil", icon: "eye" },
  "sidebar.contabil.impostos": { label: "Impostos", icon: "percent" },
  "sidebar.contabil.plano-contas": { label: "Plano de Contas", icon: "list" },
  "sidebar.contabil.conciliacao": { label: "Conciliacao Contabil", icon: "check-square" },
  "sidebar.contabil.demonstrativos": { label: "Demonstrativos Contabeis", icon: "file-text" },
  "sidebar.contabil.fechamento": { label: "Fechamento Contabil", icon: "lock" },
  "sidebar.financeiro.visao-geral": { label: "Geral Financeira", icon: "eye" },
  "sidebar.financeiro.requisicoes": { label: "Requisicoes", icon: "clipboard" },
  "sidebar.financeiro.ordens-compra": { label: "Ordens de Compra", icon: "shopping-bag" },
  "sidebar.financeiro.contas-pagar": { label: "Contas a Pagar", icon: "arrow-down" },
  "sidebar.financeiro.contas-receber": { label: "Contas a Receber", icon: "arrow-up" },
  "sidebar.financeiro.fluxo-caixa": { label: "Fluxo de Caixa", icon: "trending-up" },
  "sidebar.financeiro.saldo-contas": { label: "Saldo Contas", icon: "credit-card" },
  "sidebar.financeiro.conciliacao": { label: "Conciliacao Bancaria", icon: "check-square" },
  "sidebar.centros-custo.visao-geral": { label: "Geral Centros  Custo", icon: "eye" },
  "sidebar.centros-custo.cadastro": { label: "Cadastro Centro de Custo", icon: "plus" },
  "sidebar.centros-custo.contas": { label: "Contas e Projetos", icon: "folder" },
  "sidebar.centros-custo.indicadores": { label: "Indicadores Centro de Custo", icon: "activity" },
  "sidebar.importacao.visao-geral": { label: "Geral Importacoes", icon: "eye" },
  "sidebar.importacao.cadastro": { label: "Cadastro Importacao", icon: "plus" },
  "sidebar.importacao.fornecedores": { label: "Fornecedores Internacionais", icon: "globe" },
  "sidebar.importacao.documentacao": { label: "Documentacao Importacao", icon: "file-text" },
  "sidebar.importacao.remessas": { label: "Envio Remessas", icon: "send" },
  "sidebar.importacao.custos": { label: "Custos de Importacao", icon: "dollar" },
  "sidebar.importacao.impostos": { label: "Impostos e Taxas", icon: "percent" },
  "sidebar.importacao.cambio": { label: "Cambio e Fechamento", icon: "refresh" },
  "sidebar.importacao.status": { label: "Status e Acompanhamento", icon: "activity" },
  "sidebar.importacao.desembaraco": { label: "Desembaraco Aduaneiro", icon: "shield" },
  "sidebar.logistica.estoque": { label: "Estoque", icon: "box" },
  "sidebar.logistica.movimentacoes": { label: "Movimentacoes Estoque", icon: "refresh" },
  "sidebar.logistica.ativos-inativos": { label: "Produtos Ativos / Inativos", icon: "toggle" },
  "sidebar.locacoes.andamento": { label: "Locacoes em andamento", icon: "key" },
  "sidebar.operacional.visao-geral": { label: "Geral Operacional", icon: "eye" },
  "sidebar.operacional.ordens": { label: "Ordens de Servico", icon: "clipboard" },
  "sidebar.operacional.execucao": { label: "Execucao Servicos", icon: "play" },
  "sidebar.operacional.agenda": { label: "Agenda Operacional", icon: "calendar" },
  "sidebar.operacional.status": { label: "Status e Acompanhamento", icon: "activity" },
  "sidebar.operacional.encerramento": { label: "Encerramento de Servicos", icon: "check-circle" },
  "sidebar.produtos.visao-geral": { label: "Geral Produtos", icon: "eye" },
  "sidebar.produtos.cadastro": { label: "Cadastro Produtos", icon: "plus" },
  "sidebar.produtos.categorias": { label: "Categorias Produtos", icon: "tag" },
  "sidebar.produtos.precificacao": { label: "Precificacao", icon: "dollar" },
  "sidebar.produtos.custos": { label: "Custos e Margens", icon: "percent" },
  "sidebar.suporte.visao-geral": { label: "Geral Suporte", icon: "eye" },
  "sidebar.suporte.atendimentos": { label: "Atendimentos", icon: "phone" },
  "sidebar.suporte.chamados": { label: "Chamados / Tickets", icon: "inbox" },
  "sidebar.suporte.classificacao": { label: "Classificacao Incidentes", icon: "alert-triangle" },
  "sidebar.suporte.historico": { label: "Historico Atendimentos", icon: "clock" },
  "sidebar.suporte.comunicacao": { label: "Comunicacao com  Cliente", icon: "message-circle" },
  "sidebar.suporte.avaliacao": { label: "Avaliacao Atendimento", icon: "star" },
  "sidebar.automacoes.asaas": { label: "Asaas", icon: "credit-card" },
  "sidebar.automacoes.mercado-livre": { label: "Mercado Livre", icon: "shopping-bag" },
  "sidebar.dash.visao-geral": { label: "Dash Visao Geral", icon: "eye" },
  "sidebar.dash.financeiro": { label: "Dash Financeiro", icon: "money" },
  "sidebar.dash.contas-pagar": { label: "Dash Contas a Pagar", icon: "arrow-down" },
  "sidebar.dash.contas-receber": { label: "Dash Contas a Receber", icon: "arrow-up" },
  "sidebar.dash.saldo-contas": { label: "Dash Saldo Contas", icon: "credit-card" },
  "sidebar.dash.fluxo-caixa": { label: "Dash Fluxo de Caixa", icon: "trending-up" },
  "sidebar.dash.orcamentos": { label: "Dash Orcamentos", icon: "calculator" },
  "sidebar.dash.comercial": { label: "Dash Comercial", icon: "chart" },
  "sidebar.dash.vendas": { label: "Dash Vendas", icon: "shopping-cart" },
  "sidebar.dash.pipedrive": { label: "Dash Pipedrive", icon: "pipeline" },
  "sidebar.dash.clientes": { label: "Dash Clientes", icon: "users" },
  "sidebar.dash.produtos": { label: "Dash Produtos", icon: "package" },
  "sidebar.dash.compras": { label: "Dash Compras", icon: "cart" },
  "sidebar.dash.ordens-compra": { label: "Dash Ordens Compra", icon: "shopping-bag" },
  "sidebar.dash.requisicoes": { label: "Dash Requisicoes", icon: "clipboard" },
  "sidebar.dash.fornecedores": { label: "Dash Fornecedores", icon: "supplier" },
  "sidebar.dash.logistica": { label: "Dash Logistica / Entregas", icon: "truck" },
  "sidebar.dash.servicos": { label: "Dash Servicos Executados", icon: "check-circle" },
  "sidebar.dash.colaboradores": { label: "Dash Colaboradores", icon: "team" },
  "sidebar.dash.indicadores-rh": { label: "Dash Indicadores de RH", icon: "activity" },
  "sidebar.dash.asaas": { label: "Dash Asaas", icon: "credit-card" },
  "sidebar.dash.bling": { label: "Dash Bling", icon: "box" },
  "sidebar.dash.google-ads": { label: "Dash Google Ads", icon: "ads" },
  "sidebar.dash.instagram": { label: "Dash Instagram", icon: "instagram" },
  "sidebar.dash.mercado-livre": { label: "Dash Mercado Livre", icon: "shopping-bag" },
  "sidebar.dash.google-drive": { label: "Dash Google Drive", icon: "drive" },
  "sidebar.dash.indicadores-op": { label: "Indicadores Operacionais", icon: "bar-chart" },
  "sidebar.admin.politicas-seguranca": { label: "Politicas Seguranca", icon: "external-link" },
  "sidebar.admin.eventos-seguranca": { label: "Eventos Seguranca", icon: "alert-triangle" },
  "sidebar.admin.config-globais": { label: "Config. Globais Sistema", icon: "settings" },
  "sidebar.admin.feature-flags": { label: "Feature Flags", icon: "eye" },
  "sidebar.admin.config-visuais": { label: "Config. Visuais", icon: "palette" },
  "sidebar.admin.criacao-botoes": { label: "Criacao Botões", icon: "sliders" },
  "sidebar.admin.layouts-presets": { label: "Layouts e Presets UI", icon: "layout" },
  "sidebar.admin.gestao-paineis": { label: "Gestao Paineis", icon: "grid" },
  "sidebar.admin.performance": { label: "Perform. e Telemetria", icon: "activity" },
  "sidebar.admin.logs": { label: "Logs Sistema", icon: "file-text" },
  "sidebar.admin.diagnostico": { label: "Diagnostico / Modo Degradado", icon: "alert-circle" },
  "sidebar.admin.debug": { label: "Debug", icon: "terminal" },
  "sidebar.admin.uarps": { label: "UARPS", icon: "shield-check" },
  "sidebar.koala-docs": { label: "Koala Docs", icon: "file-text" },
  "sidebar.transito": { label: "Transito", icon: "map" },
  "sidebar.datatables": { label: "DataTables", icon: "database" },
  "sidebar.outlook": { label: "Outlook", icon: "mail" },
  "sidebar.ads": { label: "Ads", icon: "ads" },
  "sidebar.anuncios": { label: "Anuncios", icon: "ads" },
  "sidebar.grp-canais-venda": { label: "Canais de Venda", icon: "store" },
  "sidebar.mercadolivre": { label: "Mercado Livre", icon: "store" },
  "sidebar.metaads": { label: "Meta Ads", icon: "facebook" },
  "sidebar.avatar-studio": { label: "Avatar Studio", icon: "user" },
  "sidebar.google-calendar": { label: "Google Calendar", icon: "calendar" },
  "sidebar.google-analytics": { label: "Google Analytics", icon: "bar-chart" },
  "header.notifications": { label: "Notificações", icon: "bell" },
  "header.profile": { label: "Meu Perfil", icon: "user" },
  "header.settings": { label: "Configurações", icon: "cog" },
  "header.logout": { label: "Sair", icon: "logout" },
  "header.search": { label: "Buscar", icon: "search" },
  "global.shortcuts": { label: "Atalhos", icon: "keyboard" },
  "nav.user.management": { label: "Gestão de Usuários", icon: "users-cog" },
  "nav.automacoes": { label: "Automações", icon: "automation" },
  "nav.principal": { label: "Principal", icon: "dashboard" },
  "nav.geral": { label: "Geral", icon: "grid" },
  "nav.permissions.admin": { label: "Permissões", icon: "shield" },
  "nav.bling": { label: "Bling", icon: "box" },
  "nav.clientes": { label: "Clientes", icon: "users" },
  "nav.session.admin": { label: "Sessões", icon: "key" },
  "nav.colaboradores": { label: "Colaboradores", icon: "team" },
  "nav.audit.trail": { label: "Auditoria", icon: "clipboard" },
  "nav.comercial": { label: "Comercial", icon: "chart" },
  "nav.nav.admin": { label: "Navegação", icon: "nav" },
  "nav.compras": { label: "Compras", icon: "cart" },
  "nav.user.preferences": { label: "Minhas Preferências", icon: "settings" },
  "nav.contratos": { label: "Contratos", icon: "document" },
  "nav.financeiro": { label: "Financeiro", icon: "money" },
  "nav.fornecedores": { label: "Fornecedores", icon: "supplier" },
  "nav.google.ads": { label: "Google Ads", icon: "ads" },
  "nav.google.drive": { label: "Google Drive", icon: "drive" },
  "nav.importacao": { label: "Importação", icon: "globe" },
  "nav.instagram": { label: "Instagram", icon: "instagram" },
  "nav.operacional.menu": { label: "Operacional", icon: "cog" },
  "nav.orcamento.clientes": { label: "Orçamento Clientes", icon: "calculator" },
  "nav.pipedrive": { label: "Pipedrive", icon: "pipeline" },
  "nav.produtos": { label: "Produtos", icon: "package" },
  "nav.rh.pessoas": { label: "RH Pessoas", icon: "people" },
  "nav.servidores": { label: "Servidores", icon: "server" },
  "navrail.home": { label: "Home", icon: "circle" },
  "navrail.dashboard": { label: "Dashboard", icon: "circle" },
  "navrail.financeiro": { label: "Financeiro", icon: "circle" },
  "navrail.comercial": { label: "Comercial", icon: "circle" },
  "navrail.clientes": { label: "Clientes", icon: "circle" },
  "navrail.analytics": { label: "Analytics", icon: "circle" },
  "navrail.relatorios": { label: "Relatorios", icon: "circle" },
  "navrail.charts": { label: "Charts", icon: "circle" },
  "navrail.database": { label: "Database", icon: "circle" },
  "navrail.folder": { label: "Folder", icon: "circle" },
  "navrail.docs": { label: "Docs", icon: "circle" },
  "navrail.api": { label: "Api", icon: "circle" },
  "navrail.pipedrive": { label: "Pipedrive", icon: "circle" },
  "navrail.location": { label: "Location", icon: "circle" },
  "navrail.admin.users": { label: "Admin Users", icon: "circle" },
  "navrail.admin.settings": { label: "Admin Settings", icon: "circle" },
  "navrail.code": { label: "Code", icon: "circle" },
  "navrail.bell": { label: "Bell", icon: "circle" },
  "navrail.help": { label: "Help", icon: "circle" },
  "navrail.toggle.sidebar": { label: "Toggle Sidebar", icon: "circle" },
  "header.refresh.action": { label: "Refresh Action", icon: "circle" },
  "header.fullscreen.action": { label: "Fullscreen Action", icon: "circle" },
  "header.logo": { label: "Logo", icon: "circle" },
  "header.user.menu.open": { label: "Open", icon: "circle" },
  "header.user.menu.close": { label: "Close", icon: "circle" },
  "header.user.menu.profile": { label: "Profile", icon: "circle" },
  "header.user.menu.preferences": { label: "Preferences", icon: "circle" },
  "header.user.menu.security": { label: "Security", icon: "circle" },
  "header.user.menu.notifications": { label: "Notifications", icon: "circle" },
  "header.user.menu.sessions": { label: "Sessions", icon: "circle" },
  "header.user.menu.logout": { label: "Logout", icon: "circle" },
  "header.adwords.link": { label: "Adwords Link", icon: "circle" },
  "header.alfinete.link": { label: "Alfinete Link", icon: "circle" },
  "header.asaas.link": { label: "Asaas Link", icon: "circle" },
  "header.bling.link": { label: "Bling Link", icon: "circle" },
  "header.calendar.link": { label: "Calendar Link", icon: "circle" },
  "header.chatgpt.link": { label: "Chatgpt Link", icon: "circle" },
  "header.google.drive.link": { label: "Google Drive Link", icon: "circle" },
  "header.loja.integrada.link": { label: "Loja Integrada Link", icon: "circle" },
  "header.mercado.livre.link": { label: "Mercado Livre Link", icon: "circle" },
  "header.pipedrive.link": { label: "Pipedrive Link", icon: "circle" },
  "header.currency.btc": { label: "Currency Btc", icon: "circle" },
  "header.currency.usd.brl": { label: "Currency Usd Brl", icon: "circle" },
  "header.currency.usd.cny": { label: "Currency Usd Cny", icon: "circle" },
  "header.email.integration": { label: "Email Integration", icon: "circle" },
  "header.instagram.messenger.integration": { label: "Instagram Messenger Integration", icon: "circle" },
  "header.weather.sp": { label: "Weather Sp", icon: "circle" },
  "header.wechat.integration": { label: "Wechat Integration", icon: "circle" },
  "header.whatsapp.integration": { label: "Whatsapp Integration", icon: "circle" },
  "header.app.status": { label: "App Status", icon: "circle" },
  "header.errors.status": { label: "Errors Status", icon: "circle" },
  "footer.language": { label: "Language", icon: "circle" },
  "footer.logout": { label: "Logout", icon: "circle" },
  "footer.termos": { label: "Termos", icon: "circle" },
  "footer.privacidade": { label: "Privacidade", icon: "circle" },
  "footer.lgpd": { label: "Lgpd", icon: "circle" },
  "footer.activity": { label: "Activity", icon: "circle" },
  "footer.analytics": { label: "Analytics", icon: "circle" },
  "footer.bell": { label: "Bell", icon: "circle" },
  "footer.bookmark": { label: "Bookmark", icon: "circle" },
  "footer.calendar": { label: "Calendar", icon: "circle" },
  "footer.clipboard": { label: "Clipboard", icon: "circle" },
  "footer.cloud": { label: "Cloud", icon: "circle" },
  "footer.cpu": { label: "Cpu", icon: "circle" },
  "footer.credit.card": { label: "Credit Card", icon: "circle" },
  "footer.dashboard": { label: "Dashboard", icon: "circle" },
  "footer.database": { label: "Database", icon: "circle" },
  "footer.folder": { label: "Folder", icon: "circle" },
  "footer.globe": { label: "Globe", icon: "circle" },
  "footer.hard.drive": { label: "Hard Drive", icon: "circle" },
  "footer.link": { label: "Link", icon: "circle" },
  "footer.lock": { label: "Lock", icon: "circle" },
  "footer.mail": { label: "Mail", icon: "circle" },
  "footer.monitor": { label: "Monitor", icon: "circle" },
  "footer.pie.chart": { label: "Pie Chart", icon: "circle" },
  "footer.search": { label: "Search", icon: "circle" },
  "footer.security": { label: "Security", icon: "circle" },
  "footer.server": { label: "Server", icon: "circle" },
  "footer.settings": { label: "Settings", icon: "circle" },
  "footer.target": { label: "Target", icon: "circle" },
  "footer.trending.up": { label: "Trending Up", icon: "circle" },
  "footer.users": { label: "Users", icon: "circle" },
  "footer.zap": { label: "Zap", icon: "circle" },
  "footer.wifi": { label: "Wifi", icon: "circle" },
  "footer.memory": { label: "Memory", icon: "circle" },
  "footer.disk": { label: "Disk", icon: "circle" },
  "nav.home": { label: "Ir para Home", icon: "keyboard" },
  "global.fullscreen": { label: "Tela Cheia", icon: "keyboard" },
  "global.refresh": { label: "Atualizar", icon: "keyboard" },
  "global.close.modal": { label: "Fechar Modal", icon: "keyboard" },
  "header.panel.asaas": { label: "Asaas", icon: "circle" },
  "header.panel.chatgpt": { label: "ChatGPT", icon: "circle" },
  "header.panel.google-drive": { label: "Google Drive", icon: "circle" },
  "header.panel.loja-integrada": { label: "Loja Integrada", icon: "circle" },
  "header.panel.pipedrive": { label: "Pipedrive", icon: "circle" },
  "header.panel.adwords": { label: "Google Ads", icon: "circle" },
  "header.panel.calendar": { label: "Agenda", icon: "circle" },
  "header.panel.bling": { label: "Bling", icon: "circle" },
  "header.panel.mercado-livre": { label: "Mercado Livre", icon: "circle" },
  "header.panel.maps": { label: "Geolocalização", icon: "circle" },
  "api.uarps.status": { label: "UARPS Status", icon: "shield" },
  "api.feature-flags.admin": { label: "Feature Flags Admin", icon: "flag" },
  "api.feature-flags.read": { label: "Feature Flags Read", icon: "flag" },
  "api.permission-audit.view": { label: "Permission Audit View", icon: "eye" },
  "api.permission-audit.admin": { label: "Permission Audit Admin", icon: "shield" },
  "api.notification-rules.admin": { label: "Notification Rules Admin", icon: "bell" },
  "api.permissions.admin": { label: "Permissions Admin", icon: "lock" },
  "api.permissions.super-admin": { label: "Permissions Super Admin", icon: "key" },
  "api.settings.admin": { label: "Settings Admin", icon: "settings" },
  "api.orchestrator.admin": { label: "Orchestrator Admin", icon: "cpu" },
  "api.users.admin": { label: "Users Admin", icon: "users" },
  "gate.admin": { label: "Acesso Admin Gate", icon: "shield" },
  "gate.diagnostics": { label: "Acesso Diagnósticos", icon: "activity" },
  "navrail.admin": { label: "Admin NavRail", icon: "menu" },
  "header.admin": { label: "Admin Header", icon: "layout" },
  "navigation.admin": { label: "Admin Navigation", icon: "navigation" },
  "sidebar.uarps-monitor": { label: "UARPS", icon: "shield-check" }
}), c = Object.freeze({
  "panel-01": { id: "panel-01", path: "/components/panels/panel-01/index.js", regions: ["main"], requiresAuth: !0, minLevel: 0, preload: !1 },
  "panel-02": { id: "panel-02", path: "/components/panels/panel-02/index.js", regions: ["main"], requiresAuth: !0, minLevel: 0, preload: !1 },
  "panel-03": { id: "panel-03", path: "/components/panels/panel-03/index.js", regions: ["main"], requiresAuth: !0, minLevel: 0, preload: !1 },
  "panel-04": { id: "panel-04", path: "/components/panels/panel-04/index.js", regions: ["main"], requiresAuth: !0, minLevel: 0, preload: !1 },
  "panel-05": { id: "panel-05", path: "/components/panels/panel-05/index.js", regions: ["main"], requiresAuth: !0, minLevel: 0, preload: !1 },
  "panel-06": { id: "panel-06", path: "/components/panels/panel-06/index.js", regions: ["main"], requiresAuth: !0, minLevel: 0, preload: !1 },
  "panel-07": { id: "panel-07", path: "/components/panels/panel-07/index.js", regions: ["main"], requiresAuth: !0, minLevel: 0, preload: !1 },
  "panel-08": { id: "panel-08", path: "/components/panels/panel-08/index.js", regions: ["main"], requiresAuth: !0, minLevel: 0, preload: !1 },
  "panel-09": { id: "panel-09", path: "/components/panels/panel-09/index.js", regions: ["main"], requiresAuth: !0, minLevel: 0, preload: !1 },
  "panel-10": { id: "panel-10", path: "/components/panels/panel-10/index.js", regions: ["main"], requiresAuth: !0, minLevel: 0, preload: !1 },
  "panel-11": { id: "panel-11", path: "/components/panels/panel-11/index.js", regions: ["main"], requiresAuth: !0, minLevel: 0, preload: !1 },
  "panel-12": { id: "panel-12", path: "/components/panels/panel-12/index.js", regions: ["main"], requiresAuth: !0, minLevel: 0, preload: !1 },
  "panel-13": { id: "panel-13", path: "/components/panels/panel-13/index.js", regions: ["main"], requiresAuth: !0, minLevel: 0, preload: !1 },
  "panel-14": { id: "panel-14", path: "/components/panels/panel-14/index.js", regions: ["main"], requiresAuth: !0, minLevel: 0, preload: !1 },
  "panel-15": { id: "panel-15", path: "/components/panels/panel-15/index.js", regions: ["main"], requiresAuth: !0, minLevel: 0, preload: !1 },
  "panel-16": { id: "panel-16", path: "/components/panels/panel-16/index.js", regions: ["main"], requiresAuth: !0, minLevel: 0, preload: !1 },
  "panel-17": { id: "panel-17", path: "/components/panels/panel-17/index.js", regions: ["main"], requiresAuth: !0, minLevel: 0, preload: !1 },
  "panel-18": { id: "panel-18", path: "/components/panels/panel-18/index.js", regions: ["main"], requiresAuth: !0, minLevel: 0, preload: !1 },
  "panel-19": { id: "panel-19", path: "/components/panels/panel-19/index.js", regions: ["main"], requiresAuth: !0, minLevel: 0, preload: !1 },
  "panel-uarps-monitor": { id: "panel-uarps-monitor", path: "/components/panels/panel-uarps-monitor/index.js", regions: ["main"], requiresAuth: !0, minLevel: 0, preload: !1 },
  "koala-docs": { id: "koala-docs", path: "/components/panels/koala-docs/index.js", regions: ["main"], requiresAuth: !0, minLevel: 0, preload: !1 },
  "panel-dashboard": { id: "panel-dashboard", path: "/components/panels/panel-dashboard/index.js", regions: ["main"], requiresAuth: !0, minLevel: 0, preload: !1 },
  "panel-cards": { id: "panel-cards", path: "/components/panels/panel-cards/index.js", regions: ["main"], requiresAuth: !0, minLevel: 0, preload: !1 },
  "panel-user-management": { id: "panel-user-management", path: "/components/panels/panel-user-management/index.js", regions: ["main"], requiresAuth: !0, minLevel: 0, preload: !1 },
  "panel-session-admin": { id: "panel-session-admin", path: "/components/panels/panel-session-admin/index.js", regions: ["main"], requiresAuth: !0, minLevel: 0, preload: !1 },
  "panel-audit-trail": { id: "panel-audit-trail", path: "/components/panels/panel-audit-trail/index.js", regions: ["main"], requiresAuth: !0, minLevel: 0, preload: !1 },
  "panel-nav-admin": { id: "panel-nav-admin", path: "/components/panels/panel-nav-admin/index.js", regions: ["main"], requiresAuth: !0, minLevel: 0, preload: !1 },
  "panel-feature-flags-admin": { id: "panel-feature-flags-admin", path: "/components/panels/panel-feature-flags-admin/index.js", regions: ["main"], requiresAuth: !0, minLevel: 0, preload: !1 },
  "panel-header-admin": { id: "panel-header-admin", path: "/components/panels/panel-header-admin/index.js", regions: ["main"], requiresAuth: !0, minLevel: 0, preload: !1 },
  "panel-health-dashboard": { id: "panel-health-dashboard", path: "/components/panels/panel-health-dashboard/index.js", regions: ["main"], requiresAuth: !0, minLevel: 0, preload: !1 },
  "panel-orchestrator": { id: "panel-orchestrator", path: "/components/panels/panel-orchestrator/index.js", regions: ["main"], requiresAuth: !0, minLevel: 0, preload: !1 },
  "panel-orchestrator-manager": { id: "panel-orchestrator-manager", path: "/components/panels/panel-orchestrator-manager/index.js", regions: ["main"], requiresAuth: !0, minLevel: 0, preload: !1 },
  "panel-navrail-admin": { id: "panel-navrail-admin", path: "/components/panels/panel-navrail-admin/index.js", regions: ["main"], requiresAuth: !0, minLevel: 0, preload: !1 },
  "panel-user-profile": { id: "panel-user-profile", path: "/components/panels/panel-user-profile/index.js", regions: ["main"], requiresAuth: !0, minLevel: 0, preload: !1 },
  "panel-user-preferences": { id: "panel-user-preferences", path: "/components/panels/panel-user-preferences/index.js", regions: ["main"], requiresAuth: !0, minLevel: 0, preload: !1 },
  "panel-gestao-paineis": { id: "panel-gestao-paineis", path: "/components/panels/panel-gestao-paineis/index.js", regions: ["main"], requiresAuth: !0, minLevel: 0, preload: !1 },
  "panel-integration-bling": { id: "panel-integration-bling", path: "/components/panels/panel-integration-bling/index.js", regions: ["main"], requiresAuth: !0, minLevel: 0, preload: !1 },
  "panel-integration-pipedrive": { id: "panel-integration-pipedrive", path: "/components/panels/panel-integration-pipedrive/index.js", regions: ["main"], requiresAuth: !0, minLevel: 0, preload: !1 },
  "panel-integration-google-drive": { id: "panel-integration-google-drive", path: "/components/panels/panel-integration-google-drive/index.js", regions: ["main"], requiresAuth: !0, minLevel: 0, preload: !1 },
  "panel-integration-adwords": { id: "panel-integration-adwords", path: "/components/panels/panel-integration-adwords/index.js", regions: ["main"], requiresAuth: !0, minLevel: 0, preload: !1 },
  "panel-integration-asaas": { id: "panel-integration-asaas", path: "/components/panels/panel-integration-asaas/index.js", regions: ["main"], requiresAuth: !0, minLevel: 0, preload: !1 },
  "panel-integration-mercado-livre": { id: "panel-integration-mercado-livre", path: "/components/panels/panel-integration-mercado-livre/index.js", regions: ["main"], requiresAuth: !0, minLevel: 0, preload: !1 },
  "panel-integration-loja-integrada": { id: "panel-integration-loja-integrada", path: "/components/panels/panel-integration-loja-integrada/index.js", regions: ["main"], requiresAuth: !0, minLevel: 0, preload: !1 },
  "panel-integration-chatgpt": { id: "panel-integration-chatgpt", path: "/components/panels/panel-integration-chatgpt/index.js", regions: ["main"], requiresAuth: !0, minLevel: 0, preload: !1 },
  "panel-integration-calendar": { id: "panel-integration-calendar", path: "/components/panels/panel-integration-calendar/index.js", regions: ["main"], requiresAuth: !0, minLevel: 0, preload: !1 },
  "panel-integration-alfinete": { id: "panel-integration-alfinete", path: "/components/panels/panel-integration-alfinete/index.js", regions: ["main"], requiresAuth: !0, minLevel: 0, preload: !1 },
  "panel-analytics": { id: "panel-analytics", path: "/components/panels/panel-analytics/index.js", regions: ["main"], requiresAuth: !0, minLevel: 0, preload: !1 },
  "panel-charts": { id: "panel-charts", path: "/components/panels/panel-charts/index.js", regions: ["main"], requiresAuth: !0, minLevel: 0, preload: !1 },
  "panel-code": { id: "panel-code", path: "/components/panels/panel-code/index.js", regions: ["main"], requiresAuth: !0, minLevel: 0, preload: !1 },
  "panel-datahub": { id: "panel-datahub", path: "/components/panels/panel-datahub/index.js", regions: ["main"], requiresAuth: !0, minLevel: 0, preload: !1 },
  "panel-enterprise": { id: "panel-enterprise", path: "/components/panels/panel-enterprise/index.js", regions: ["main"], requiresAuth: !0, minLevel: 0, preload: !1 },
  "panel-files": { id: "panel-files", path: "/components/panels/panel-files/index.js", regions: ["main"], requiresAuth: !0, minLevel: 0, preload: !1 },
  "panel-location": { id: "panel-location", path: "/components/panels/panel-location/index.js", regions: ["main"], requiresAuth: !0, minLevel: 0, preload: !1 },
  "panel-observability": { id: "panel-observability", path: "/components/panels/panel-observability/index.js", regions: ["main"], requiresAuth: !0, minLevel: 0, preload: !1 },
  "panel-status": { id: "panel-status", path: "/components/panels/panel-status/index.js", regions: ["main"], requiresAuth: !0, minLevel: 0, preload: !1 },
  "panel-account-security": { id: "panel-account-security", path: "/components/panels/panel-account-security/index.js", regions: ["main"], requiresAuth: !0, minLevel: 0, preload: !1 },
  "panel-user-notifications": { id: "panel-user-notifications", path: "/components/panels/panel-user-notifications/index.js", regions: ["main"], requiresAuth: !0, minLevel: 0, preload: !1 },
  "panel-user-sessions": { id: "panel-user-sessions", path: "/components/panels/panel-user-sessions/index.js", regions: ["main"], requiresAuth: !0, minLevel: 0, preload: !1 },
  "panel-lotties-management": { id: "panel-lotties-management", path: "/components/panels/panel-lotties-management/index.js", regions: ["main"], requiresAuth: !0, minLevel: 0, preload: !1 },
  "panel-footer-activity": { id: "panel-footer-activity", path: "/components/panels/panel-footer-activity/index.js", regions: ["main"], requiresAuth: !0, minLevel: 0, preload: !1 },
  "panel-footer-api": { id: "panel-footer-api", path: "/components/panels/panel-footer-api/index.js", regions: ["main"], requiresAuth: !0, minLevel: 0, preload: !1 },
  "panel-footer-cpu": { id: "panel-footer-cpu", path: "/components/panels/panel-footer-cpu/index.js", regions: ["main"], requiresAuth: !0, minLevel: 0, preload: !1 },
  "panel-footer-database": { id: "panel-footer-database", path: "/components/panels/panel-footer-database/index.js", regions: ["main"], requiresAuth: !0, minLevel: 0, preload: !1 },
  "panel-footer-disk": { id: "panel-footer-disk", path: "/components/panels/panel-footer-disk/index.js", regions: ["main"], requiresAuth: !0, minLevel: 0, preload: !1 },
  "panel-footer-docs": { id: "panel-footer-docs", path: "/components/panels/panel-footer-docs/index.js", regions: ["main"], requiresAuth: !0, minLevel: 0, preload: !1 },
  "panel-footer-file": { id: "panel-footer-file", path: "/components/panels/panel-footer-file/index.js", regions: ["main"], requiresAuth: !0, minLevel: 0, preload: !1 },
  "panel-footer-financial": { id: "panel-footer-financial", path: "/components/panels/panel-footer-financial/index.js", regions: ["main"], requiresAuth: !0, minLevel: 0, preload: !1 },
  "panel-footer-globe": { id: "panel-footer-globe", path: "/components/panels/panel-footer-globe/index.js", regions: ["main"], requiresAuth: !0, minLevel: 0, preload: !1 },
  "panel-footer-memory": { id: "panel-footer-memory", path: "/components/panels/panel-footer-memory/index.js", regions: ["main"], requiresAuth: !0, minLevel: 0, preload: !1 },
  "panel-footer-registry": { id: "panel-footer-registry", path: "/components/panels/panel-footer-registry/index.js", regions: ["main"], requiresAuth: !0, minLevel: 0, preload: !1 },
  "panel-footer-server": { id: "panel-footer-server", path: "/components/panels/panel-footer-server/index.js", regions: ["main"], requiresAuth: !0, minLevel: 0, preload: !1 },
  "panel-footer-settings": { id: "panel-footer-settings", path: "/components/panels/panel-footer-settings/index.js", regions: ["main"], requiresAuth: !0, minLevel: 0, preload: !1 },
  "panel-footer-shield": { id: "panel-footer-shield", path: "/components/panels/panel-footer-shield/index.js", regions: ["main"], requiresAuth: !0, minLevel: 0, preload: !1 },
  "panel-footer-status": { id: "panel-footer-status", path: "/components/panels/panel-footer-status/index.js", regions: ["main"], requiresAuth: !0, minLevel: 0, preload: !1 },
  "panel-footer-support": { id: "panel-footer-support", path: "/components/panels/panel-footer-support/index.js", regions: ["main"], requiresAuth: !0, minLevel: 0, preload: !1 },
  "panel-footer-wifi": { id: "panel-footer-wifi", path: "/components/panels/panel-footer-wifi/index.js", regions: ["main"], requiresAuth: !0, minLevel: 0, preload: !1 },
  "panel-status-currency-btc": { id: "panel-status-currency-btc", path: "/components/panels/panel-status-currency-btc/index.js", regions: ["main"], requiresAuth: !0, minLevel: 0, preload: !1 },
  "panel-status-currency-usd-brl": { id: "panel-status-currency-usd-brl", path: "/components/panels/panel-status-currency-usd-brl/index.js", regions: ["main"], requiresAuth: !0, minLevel: 0, preload: !1 },
  "panel-status-currency-usd-cny": { id: "panel-status-currency-usd-cny", path: "/components/panels/panel-status-currency-usd-cny/index.js", regions: ["main"], requiresAuth: !0, minLevel: 0, preload: !1 },
  "panel-status-email-integration": { id: "panel-status-email-integration", path: "/components/panels/panel-status-email-integration/index.js", regions: ["main"], requiresAuth: !0, minLevel: 0, preload: !1 },
  "panel-status-instagram-messenger": { id: "panel-status-instagram-messenger", path: "/components/panels/panel-status-instagram-messenger/index.js", regions: ["main"], requiresAuth: !0, minLevel: 0, preload: !1 },
  "panel-status-weather-sp": { id: "panel-status-weather-sp", path: "/components/panels/panel-status-weather-sp/index.js", regions: ["main"], requiresAuth: !0, minLevel: 0, preload: !1 },
  "panel-status-wechat-integration": { id: "panel-status-wechat-integration", path: "/components/panels/panel-status-wechat-integration/index.js", regions: ["main"], requiresAuth: !0, minLevel: 0, preload: !1 },
  "panel-status-whatsapp-integration": { id: "panel-status-whatsapp-integration", path: "/components/panels/panel-status-whatsapp-integration/index.js", regions: ["main"], requiresAuth: !0, minLevel: 0, preload: !1 }
}), m = Object.freeze({
  home: { id: "home", path: "#//", panel: "panel-01", region: "main", minLevel: 0, addressable: !0 },
  principal: { id: "principal", path: "#/principal", panel: "panel-01", region: "main", minLevel: 0, addressable: !0 },
  dashboard: { id: "dashboard", path: "#/dashboard", panel: "panel-cards", region: "main", minLevel: 0, addressable: !0 },
  geral: { id: "geral", path: "#/geral", panel: "panel-02", region: "main", minLevel: 0, addressable: !0 },
  automacoes: { id: "automacoes", path: "#/automacoes", panel: "panel-03", region: "main", minLevel: 0, addressable: !0 },
  bling: { id: "bling", path: "#/bling", panel: "panel-04", region: "main", minLevel: 0, addressable: !0 },
  clientes: { id: "clientes", path: "#/clientes", panel: "panel-05", region: "main", minLevel: 0, addressable: !0 },
  colaboradores: { id: "colaboradores", path: "#/colaboradores", panel: "panel-06", region: "main", minLevel: 0, addressable: !0 },
  comercial: { id: "comercial", path: "#/comercial", panel: "panel-07", region: "main", minLevel: 0, addressable: !0 },
  compras: { id: "compras", path: "#/compras", panel: "panel-08", region: "main", minLevel: 0, addressable: !0 },
  contratos: { id: "contratos", path: "#/contratos", panel: "panel-09", region: "main", minLevel: 0, addressable: !0 },
  financeiro: { id: "financeiro", path: "#/financeiro", panel: "panel-10", region: "main", minLevel: 0, addressable: !0 },
  fornecedores: { id: "fornecedores", path: "#/fornecedores", panel: "panel-11", region: "main", minLevel: 0, addressable: !0 },
  "google-ads": { id: "google-ads", path: "#/google-ads", panel: "panel-12", region: "main", minLevel: 0, addressable: !0 },
  "google-drive": { id: "google-drive", path: "#/google-drive", panel: "panel-13", region: "main", minLevel: 0, addressable: !0 },
  importacao: { id: "importacao", path: "#/importacao", panel: "panel-14", region: "main", minLevel: 0, addressable: !0 },
  instagram: { id: "instagram", path: "#/instagram", panel: "panel-15", region: "main", minLevel: 0, addressable: !0 },
  operacional: { id: "operacional", path: "#/operacional", panel: "panel-16", region: "main", minLevel: 0, addressable: !0 },
  "orcamento-clientes": { id: "orcamento-clientes", path: "#/orcamento-clientes", panel: "panel-17", region: "main", minLevel: 0, addressable: !0 },
  pipedrive: { id: "pipedrive", path: "#/pipedrive", panel: "panel-18", region: "main", minLevel: 0, addressable: !0 },
  produtos: { id: "produtos", path: "#/produtos", panel: "panel-19", region: "main", minLevel: 0, addressable: !0 },
  "rh-pessoas": { id: "rh-pessoas", path: "#/rh-pessoas", panel: "panel-06", region: "main", minLevel: 0, addressable: !0 },
  servidores: { id: "servidores", path: "#/servidores", panel: "panel-health-dashboard", region: "main", minLevel: 0, addressable: !0 },
  "admin-usuarios": { id: "admin-usuarios", path: "#/admin/usuarios", panel: "panel-user-management", region: "main", minLevel: 0, addressable: !0 },
  "admin-permissoes": { id: "admin-permissoes", path: "#/admin/permissoes", panel: "panel-permissions-admin", region: "main", minLevel: 0, addressable: !0 },
  "admin-sessoes": { id: "admin-sessoes", path: "#/admin/sessoes", panel: "panel-session-admin", region: "main", minLevel: 0, addressable: !0 },
  "admin-auditoria": { id: "admin-auditoria", path: "#/admin/auditoria", panel: "panel-audit-trail", region: "main", minLevel: 0, addressable: !0 },
  "admin-navegacao": { id: "admin-navegacao", path: "#/admin/navegacao", panel: "panel-nav-admin", region: "main", minLevel: 0, addressable: !0 },
  "admin-feature-flags": { id: "admin-feature-flags", path: "#/admin/feature-flags", panel: "panel-feature-flags-admin", region: "main", minLevel: 0, addressable: !0 },
  "admin-health": { id: "admin-health", path: "#/admin/health", panel: "panel-health-dashboard", region: "main", minLevel: 0, addressable: !0 },
  preferencias: { id: "preferencias", path: "#/preferencias", panel: "panel-user-preferences", region: "main", minLevel: 0, addressable: !0 },
  "minhas-preferencias": { id: "minhas-preferencias", path: "#/minhas-preferencias", panel: "panel-user-preferences", region: "main", minLevel: 0, addressable: !0 },
  "admin-users": { id: "admin-users", path: "#/admin-users", panel: "panel-user-management", region: "main", minLevel: 0, addressable: !0 },
  "admin-settings": { id: "admin-settings", path: "#/admin-settings", panel: "panel-nav-admin", region: "main", minLevel: 0, addressable: !0 },
  settings: { id: "settings", path: "#/settings", panel: "panel-user-preferences", region: "main", minLevel: 0, addressable: !0 },
  profile: { id: "profile", path: "#/profile", panel: "panel-user-preferences", region: "main", minLevel: 0, addressable: !0 },
  docs: { id: "docs", path: "#/docs", panel: "panel-dashboard", region: "main", minLevel: 0, addressable: !0 },
  relatorios: { id: "relatorios", path: "#/relatorios", panel: "panel-dashboard", region: "main", minLevel: 0, addressable: !0 },
  api: { id: "api", path: "#/api", panel: "panel-dashboard", region: "main", minLevel: 0, addressable: !0 },
  analytics: { id: "analytics", path: "#/analytics", panel: "panel-analytics", region: "main", minLevel: 0, addressable: !0 },
  charts: { id: "charts", path: "#/charts", panel: "panel-charts", region: "main", minLevel: 0, addressable: !0 },
  database: { id: "database", path: "#/database", panel: "panel-footer-database", region: "main", minLevel: 0, addressable: !0 },
  folder: { id: "folder", path: "#/folder", panel: "panel-files", region: "main", minLevel: 0, addressable: !0 },
  code: { id: "code", path: "#/code", panel: "panel-code", region: "main", minLevel: 0, addressable: !0 },
  location: { id: "location", path: "#/location", panel: "panel-location", region: "main", minLevel: 0, addressable: !0 },
  "admin-orchestrator": { id: "admin-orchestrator", path: "#/admin/orchestrator", panel: "panel-orchestrator", region: "main", minLevel: 100, addressable: !0 },
  "admin-header-admin": { id: "admin-header-admin", path: "#/admin/header-admin", panel: "panel-header-admin", region: "main", minLevel: 100, addressable: !0 },
  "admin-orchestrator-manager": { id: "admin-orchestrator-manager", path: "#/admin/orchestrator-manager", panel: "panel-orchestrator-manager", region: "main", minLevel: 0, addressable: !0 },
  "admin-uarps": { id: "admin-uarps", path: "#/admin/uarps", panel: "panel-uarps-monitor", region: "main", minLevel: 0, addressable: !0 },
  "comercial-leads": { id: "comercial-leads", path: "#/comercial/leads", panel: "panel-07", region: "main", minLevel: 0, addressable: !0 },
  "comercial-oportunidades": { id: "comercial-oportunidades", path: "#/comercial/oportunidades", panel: "panel-07", region: "main", minLevel: 0, addressable: !0 },
  "comercial-metas": { id: "comercial-metas", path: "#/comercial/metas", panel: "panel-07", region: "main", minLevel: 0, addressable: !0 },
  "comercial-performance": { id: "comercial-performance", path: "#/comercial/performance", panel: "panel-07", region: "main", minLevel: 0, addressable: !0 },
  "comercial-comissoes": { id: "comercial-comissoes", path: "#/comercial/comissoes", panel: "panel-07", region: "main", minLevel: 0, addressable: !0 },
  "compras-visao-geral": { id: "compras-visao-geral", path: "#/compras/visao-geral", panel: "panel-08", region: "main", minLevel: 0, addressable: !0 },
  "compras-historico": { id: "compras-historico", path: "#/compras/historico", panel: "panel-08", region: "main", minLevel: 0, addressable: !0 },
  "compras-cotacoes": { id: "compras-cotacoes", path: "#/compras/cotacoes", panel: "panel-08", region: "main", minLevel: 0, addressable: !0 },
  "compras-requisicoes": { id: "compras-requisicoes", path: "#/compras/requisicoes", panel: "panel-08", region: "main", minLevel: 0, addressable: !0 },
  "compras-controle-custos": { id: "compras-controle-custos", path: "#/compras/controle-custos", panel: "panel-08", region: "main", minLevel: 0, addressable: !0 },
  "recebimento-entrada": { id: "recebimento-entrada", path: "#/recebimento/entrada", panel: "panel-dashboard", region: "main", minLevel: 0, addressable: !0 },
  "recebimento-aprovacao": { id: "recebimento-aprovacao", path: "#/recebimento/aprovacao", panel: "panel-dashboard", region: "main", minLevel: 0, addressable: !0 },
  "recebimento-conferencia": { id: "recebimento-conferencia", path: "#/recebimento/conferencia", panel: "panel-dashboard", region: "main", minLevel: 0, addressable: !0 },
  "recebimento-historico": { id: "recebimento-historico", path: "#/recebimento/historico", panel: "panel-dashboard", region: "main", minLevel: 0, addressable: !0 },
  "recebimento-indicadores": { id: "recebimento-indicadores", path: "#/recebimento/indicadores", panel: "panel-dashboard", region: "main", minLevel: 0, addressable: !0 },
  "clientes-visao-geral": { id: "clientes-visao-geral", path: "#/clientes/visao-geral", panel: "panel-05", region: "main", minLevel: 0, addressable: !0 },
  "clientes-cadastro": { id: "clientes-cadastro", path: "#/clientes/cadastro", panel: "panel-05", region: "main", minLevel: 0, addressable: !0 },
  "clientes-historico": { id: "clientes-historico", path: "#/clientes/historico", panel: "panel-05", region: "main", minLevel: 0, addressable: !0 },
  "clientes-faturamento": { id: "clientes-faturamento", path: "#/clientes/faturamento", panel: "panel-05", region: "main", minLevel: 0, addressable: !0 },
  "clientes-contratos": { id: "clientes-contratos", path: "#/clientes/contratos", panel: "panel-05", region: "main", minLevel: 0, addressable: !0 },
  "clientes-ativos-inativos": { id: "clientes-ativos-inativos", path: "#/clientes/ativos-inativos", panel: "panel-05", region: "main", minLevel: 0, addressable: !0 },
  "financeiro-visao-geral": { id: "financeiro-visao-geral", path: "#/financeiro/visao-geral", panel: "panel-10", region: "main", minLevel: 0, addressable: !0 },
  "financeiro-contas-pagar": { id: "financeiro-contas-pagar", path: "#/financeiro/contas-pagar", panel: "panel-10", region: "main", minLevel: 0, addressable: !0 },
  "financeiro-contas-receber": { id: "financeiro-contas-receber", path: "#/financeiro/contas-receber", panel: "panel-10", region: "main", minLevel: 0, addressable: !0 },
  "financeiro-fluxo-caixa": { id: "financeiro-fluxo-caixa", path: "#/financeiro/fluxo-caixa", panel: "panel-10", region: "main", minLevel: 0, addressable: !0 },
  "financeiro-saldo-contas": { id: "financeiro-saldo-contas", path: "#/financeiro/saldo-contas", panel: "panel-10", region: "main", minLevel: 0, addressable: !0 },
  "financeiro-conciliacao": { id: "financeiro-conciliacao", path: "#/financeiro/conciliacao", panel: "panel-10", region: "main", minLevel: 0, addressable: !0 },
  "financeiro-ordens-compra": { id: "financeiro-ordens-compra", path: "#/financeiro/ordens-compra", panel: "panel-10", region: "main", minLevel: 0, addressable: !0 },
  "financeiro-requisicoes": { id: "financeiro-requisicoes", path: "#/financeiro/requisicoes", panel: "panel-10", region: "main", minLevel: 0, addressable: !0 },
  "fornecedores-visao-geral": { id: "fornecedores-visao-geral", path: "#/fornecedores/visao-geral", panel: "panel-11", region: "main", minLevel: 0, addressable: !0 },
  "fornecedores-cadastro": { id: "fornecedores-cadastro", path: "#/fornecedores/cadastro", panel: "panel-11", region: "main", minLevel: 0, addressable: !0 },
  "fornecedores-historico": { id: "fornecedores-historico", path: "#/fornecedores/historico", panel: "panel-11", region: "main", minLevel: 0, addressable: !0 },
  "fornecedores-avaliacao": { id: "fornecedores-avaliacao", path: "#/fornecedores/avaliacao", panel: "panel-11", region: "main", minLevel: 0, addressable: !0 },
  "fornecedores-contratos": { id: "fornecedores-contratos", path: "#/fornecedores/contratos", panel: "panel-11", region: "main", minLevel: 0, addressable: !0 },
  "fornecedores-documentacao": { id: "fornecedores-documentacao", path: "#/fornecedores/documentacao", panel: "panel-11", region: "main", minLevel: 0, addressable: !0 },
  "fornecedores-ativos-inativos": { id: "fornecedores-ativos-inativos", path: "#/fornecedores/ativos-inativos", panel: "panel-11", region: "main", minLevel: 0, addressable: !0 },
  "fornecedores-classificacao": { id: "fornecedores-classificacao", path: "#/fornecedores/classificacao", panel: "panel-11", region: "main", minLevel: 0, addressable: !0 },
  "fornecedores-hist-compras": { id: "fornecedores-hist-compras", path: "#/fornecedores/hist-compras", panel: "panel-11", region: "main", minLevel: 0, addressable: !0 },
  "colaboradores-visao-geral": { id: "colaboradores-visao-geral", path: "#/colaboradores/visao-geral", panel: "panel-06", region: "main", minLevel: 0, addressable: !0 },
  "colaboradores-cadastro": { id: "colaboradores-cadastro", path: "#/colaboradores/cadastro", panel: "panel-06", region: "main", minLevel: 0, addressable: !0 },
  "colaboradores-cargos": { id: "colaboradores-cargos", path: "#/colaboradores/cargos", panel: "panel-06", region: "main", minLevel: 0, addressable: !0 },
  "colaboradores-departamentos": { id: "colaboradores-departamentos", path: "#/colaboradores/departamentos", panel: "panel-06", region: "main", minLevel: 0, addressable: !0 },
  "colaboradores-salarios": { id: "colaboradores-salarios", path: "#/colaboradores/salarios", panel: "panel-06", region: "main", minLevel: 0, addressable: !0 },
  "colaboradores-beneficios": { id: "colaboradores-beneficios", path: "#/colaboradores/beneficios", panel: "panel-06", region: "main", minLevel: 0, addressable: !0 },
  "colaboradores-ferias": { id: "colaboradores-ferias", path: "#/colaboradores/ferias", panel: "panel-06", region: "main", minLevel: 0, addressable: !0 },
  "colaboradores-jornada": { id: "colaboradores-jornada", path: "#/colaboradores/jornada", panel: "panel-06", region: "main", minLevel: 0, addressable: !0 },
  "colaboradores-avaliacoes": { id: "colaboradores-avaliacoes", path: "#/colaboradores/avaliacoes", panel: "panel-06", region: "main", minLevel: 0, addressable: !0 },
  "colaboradores-apontamento": { id: "colaboradores-apontamento", path: "#/colaboradores/apontamento", panel: "panel-06", region: "main", minLevel: 0, addressable: !0 },
  "colaboradores-documentos": { id: "colaboradores-documentos", path: "#/colaboradores/documentos", panel: "panel-06", region: "main", minLevel: 0, addressable: !0 },
  "contratos-visao-geral": { id: "contratos-visao-geral", path: "#/contratos/visao-geral", panel: "panel-09", region: "main", minLevel: 0, addressable: !0 },
  "contratos-relacao": { id: "contratos-relacao", path: "#/contratos/relacao", panel: "panel-09", region: "main", minLevel: 0, addressable: !0 },
  "contratos-status": { id: "contratos-status", path: "#/contratos/status", panel: "panel-09", region: "main", minLevel: 0, addressable: !0 },
  "contratos-vigencia": { id: "contratos-vigencia", path: "#/contratos/vigencia", panel: "panel-09", region: "main", minLevel: 0, addressable: !0 },
  "contratos-partes": { id: "contratos-partes", path: "#/contratos/partes", panel: "panel-09", region: "main", minLevel: 0, addressable: !0 },
  "contratos-tipos": { id: "contratos-tipos", path: "#/contratos/tipos", panel: "panel-09", region: "main", minLevel: 0, addressable: !0 },
  "contratos-anexos": { id: "contratos-anexos", path: "#/contratos/anexos", panel: "panel-09", region: "main", minLevel: 0, addressable: !0 },
  "operacional-visao-geral": { id: "operacional-visao-geral", path: "#/operacional/visao-geral", panel: "panel-16", region: "main", minLevel: 0, addressable: !0 },
  "operacional-ordens": { id: "operacional-ordens", path: "#/operacional/ordens", panel: "panel-16", region: "main", minLevel: 0, addressable: !0 },
  "operacional-execucao": { id: "operacional-execucao", path: "#/operacional/execucao", panel: "panel-16", region: "main", minLevel: 0, addressable: !0 },
  "operacional-status": { id: "operacional-status", path: "#/operacional/status", panel: "panel-16", region: "main", minLevel: 0, addressable: !0 },
  "operacional-agenda": { id: "operacional-agenda", path: "#/operacional/agenda", panel: "panel-16", region: "main", minLevel: 0, addressable: !0 },
  "operacional-encerramento": { id: "operacional-encerramento", path: "#/operacional/encerramento", panel: "panel-16", region: "main", minLevel: 0, addressable: !0 },
  "produtos-visao-geral": { id: "produtos-visao-geral", path: "#/produtos/visao-geral", panel: "panel-19", region: "main", minLevel: 0, addressable: !0 },
  "produtos-cadastro": { id: "produtos-cadastro", path: "#/produtos/cadastro", panel: "panel-19", region: "main", minLevel: 0, addressable: !0 },
  "produtos-categorias": { id: "produtos-categorias", path: "#/produtos/categorias", panel: "panel-19", region: "main", minLevel: 0, addressable: !0 },
  "produtos-precificacao": { id: "produtos-precificacao", path: "#/produtos/precificacao", panel: "panel-19", region: "main", minLevel: 0, addressable: !0 },
  "produtos-custos": { id: "produtos-custos", path: "#/produtos/custos", panel: "panel-19", region: "main", minLevel: 0, addressable: !0 },
  "importacao-visao-geral": { id: "importacao-visao-geral", path: "#/importacao/visao-geral", panel: "panel-14", region: "main", minLevel: 0, addressable: !0 },
  "importacao-status": { id: "importacao-status", path: "#/importacao/status", panel: "panel-14", region: "main", minLevel: 0, addressable: !0 },
  "importacao-documentacao": { id: "importacao-documentacao", path: "#/importacao/documentacao", panel: "panel-14", region: "main", minLevel: 0, addressable: !0 },
  "importacao-fornecedores": { id: "importacao-fornecedores", path: "#/importacao/fornecedores", panel: "panel-14", region: "main", minLevel: 0, addressable: !0 },
  "importacao-custos": { id: "importacao-custos", path: "#/importacao/custos", panel: "panel-14", region: "main", minLevel: 0, addressable: !0 },
  "importacao-impostos": { id: "importacao-impostos", path: "#/importacao/impostos", panel: "panel-14", region: "main", minLevel: 0, addressable: !0 },
  "importacao-cambio": { id: "importacao-cambio", path: "#/importacao/cambio", panel: "panel-14", region: "main", minLevel: 0, addressable: !0 },
  "importacao-desembaraco": { id: "importacao-desembaraco", path: "#/importacao/desembaraco", panel: "panel-14", region: "main", minLevel: 0, addressable: !0 },
  "importacao-cadastro": { id: "importacao-cadastro", path: "#/importacao/cadastro", panel: "panel-14", region: "main", minLevel: 0, addressable: !0 },
  "importacao-remessas": { id: "importacao-remessas", path: "#/importacao/remessas", panel: "panel-14", region: "main", minLevel: 0, addressable: !0 },
  "logistica-estoque": { id: "logistica-estoque", path: "#/logistica/estoque", panel: "panel-dashboard", region: "main", minLevel: 0, addressable: !0 },
  "logistica-movimentacoes": { id: "logistica-movimentacoes", path: "#/logistica/movimentacoes", panel: "panel-dashboard", region: "main", minLevel: 0, addressable: !0 },
  "logistica-ativos-inativos": { id: "logistica-ativos-inativos", path: "#/logistica/ativos-inativos", panel: "panel-dashboard", region: "main", minLevel: 0, addressable: !0 },
  "empresas-cadastro": { id: "empresas-cadastro", path: "#/empresas/cadastro", panel: "panel-dashboard", region: "main", minLevel: 0, addressable: !0 },
  "automacoes-asaas": { id: "automacoes-asaas", path: "#/automacoes/asaas", panel: "panel-03", region: "main", minLevel: 0, addressable: !0 },
  "automacoes-mercado-livre": { id: "automacoes-mercado-livre", path: "#/automacoes/mercado-livre", panel: "panel-03", region: "main", minLevel: 0, addressable: !0 },
  "admin-debug": { id: "admin-debug", path: "#/admin/debug", panel: "panel-health-dashboard", region: "main", minLevel: 0, addressable: !0 },
  "admin-logs": { id: "admin-logs", path: "#/admin/logs", panel: "panel-health-dashboard", region: "main", minLevel: 0, addressable: !0 },
  "admin-performance": { id: "admin-performance", path: "#/admin/performance", panel: "panel-health-dashboard", region: "main", minLevel: 0, addressable: !0 },
  "admin-config-globais": { id: "admin-config-globais", path: "#/admin/config-globais", panel: "panel-nav-admin", region: "main", minLevel: 0, addressable: !0 },
  "admin-config-visuais": { id: "admin-config-visuais", path: "#/admin/config-visuais", panel: "panel-nav-admin", region: "main", minLevel: 0, addressable: !0 },
  "admin-criacao-botoes": { id: "admin-criacao-botoes", path: "#/admin/criacao-botoes", panel: "panel-nav-admin", region: "main", minLevel: 0, addressable: !0 },
  "admin-layouts-presets": { id: "admin-layouts-presets", path: "#/admin/layouts-presets", panel: "panel-nav-admin", region: "main", minLevel: 0, addressable: !0 },
  "admin-gestao-paineis": { id: "admin-gestao-paineis", path: "#/admin/gestao-paineis", panel: "panel-nav-admin", region: "main", minLevel: 0, addressable: !0 },
  "admin-politicas-seguranca": { id: "admin-politicas-seguranca", path: "#/admin/politicas-seguranca", panel: "panel-health-dashboard", region: "main", minLevel: 0, addressable: !0 },
  "admin-eventos-seguranca": { id: "admin-eventos-seguranca", path: "#/admin/eventos-seguranca", panel: "panel-health-dashboard", region: "main", minLevel: 0, addressable: !0 },
  "admin-diagnostico": { id: "admin-diagnostico", path: "#/admin/diagnostico", panel: "panel-health-dashboard", region: "main", minLevel: 0, addressable: !0 },
  "suporte-visao-geral": { id: "suporte-visao-geral", path: "#/suporte/visao-geral", panel: "panel-dashboard", region: "main", minLevel: 0, addressable: !0 },
  "suporte-chamados": { id: "suporte-chamados", path: "#/suporte/chamados", panel: "panel-dashboard", region: "main", minLevel: 0, addressable: !0 },
  "suporte-atendimentos": { id: "suporte-atendimentos", path: "#/suporte/atendimentos", panel: "panel-dashboard", region: "main", minLevel: 0, addressable: !0 },
  "suporte-historico": { id: "suporte-historico", path: "#/suporte/historico", panel: "panel-dashboard", region: "main", minLevel: 0, addressable: !0 },
  "suporte-avaliacao": { id: "suporte-avaliacao", path: "#/suporte/avaliacao", panel: "panel-dashboard", region: "main", minLevel: 0, addressable: !0 },
  "suporte-classificacao": { id: "suporte-classificacao", path: "#/suporte/classificacao", panel: "panel-dashboard", region: "main", minLevel: 0, addressable: !0 },
  "suporte-comunicacao": { id: "suporte-comunicacao", path: "#/suporte/comunicacao", panel: "panel-dashboard", region: "main", minLevel: 0, addressable: !0 },
  "centros-custo-visao-geral": { id: "centros-custo-visao-geral", path: "#/centros-custo/visao-geral", panel: "panel-10", region: "main", minLevel: 0, addressable: !0 },
  "centros-custo-cadastro": { id: "centros-custo-cadastro", path: "#/centros-custo/cadastro", panel: "panel-10", region: "main", minLevel: 0, addressable: !0 },
  "centros-custo-contas": { id: "centros-custo-contas", path: "#/centros-custo/contas", panel: "panel-10", region: "main", minLevel: 0, addressable: !0 },
  "centros-custo-indicadores": { id: "centros-custo-indicadores", path: "#/centros-custo/indicadores", panel: "panel-10", region: "main", minLevel: 0, addressable: !0 },
  "contabil-visao-geral": { id: "contabil-visao-geral", path: "#/contabil/visao-geral", panel: "panel-10", region: "main", minLevel: 0, addressable: !0 },
  "contabil-plano-contas": { id: "contabil-plano-contas", path: "#/contabil/plano-contas", panel: "panel-10", region: "main", minLevel: 0, addressable: !0 },
  "contabil-demonstrativos": { id: "contabil-demonstrativos", path: "#/contabil/demonstrativos", panel: "panel-10", region: "main", minLevel: 0, addressable: !0 },
  "contabil-fechamento": { id: "contabil-fechamento", path: "#/contabil/fechamento", panel: "panel-10", region: "main", minLevel: 0, addressable: !0 },
  "contabil-impostos": { id: "contabil-impostos", path: "#/contabil/impostos", panel: "panel-10", region: "main", minLevel: 0, addressable: !0 },
  "contabil-conciliacao": { id: "contabil-conciliacao", path: "#/contabil/conciliacao", panel: "panel-10", region: "main", minLevel: 0, addressable: !0 },
  "dash-visao-geral": { id: "dash-visao-geral", path: "#/dash/visao-geral", panel: "panel-cards", region: "main", minLevel: 0, addressable: !0 },
  "dash-comercial": { id: "dash-comercial", path: "#/dash/comercial", panel: "panel-cards", region: "main", minLevel: 0, addressable: !0 },
  "dash-financeiro": { id: "dash-financeiro", path: "#/dash/financeiro", panel: "panel-cards", region: "main", minLevel: 0, addressable: !0 },
  "dash-vendas": { id: "dash-vendas", path: "#/dash/vendas", panel: "panel-cards", region: "main", minLevel: 0, addressable: !0 },
  "dash-compras": { id: "dash-compras", path: "#/dash/compras", panel: "panel-cards", region: "main", minLevel: 0, addressable: !0 },
  "dash-fornecedores": { id: "dash-fornecedores", path: "#/dash/fornecedores", panel: "panel-cards", region: "main", minLevel: 0, addressable: !0 },
  "dash-clientes": { id: "dash-clientes", path: "#/dash/clientes", panel: "panel-cards", region: "main", minLevel: 0, addressable: !0 },
  "dash-colaboradores": { id: "dash-colaboradores", path: "#/dash/colaboradores", panel: "panel-cards", region: "main", minLevel: 0, addressable: !0 },
  "dash-orcamentos": { id: "dash-orcamentos", path: "#/dash/orcamentos", panel: "panel-cards", region: "main", minLevel: 0, addressable: !0 },
  "dash-requisicoes": { id: "dash-requisicoes", path: "#/dash/requisicoes", panel: "panel-cards", region: "main", minLevel: 0, addressable: !0 },
  "dash-ordens-compra": { id: "dash-ordens-compra", path: "#/dash/ordens-compra", panel: "panel-cards", region: "main", minLevel: 0, addressable: !0 },
  "dash-indicadores-op": { id: "dash-indicadores-op", path: "#/dash/indicadores-op", panel: "panel-cards", region: "main", minLevel: 0, addressable: !0 },
  "dash-logistica": { id: "dash-logistica", path: "#/dash/logistica", panel: "panel-cards", region: "main", minLevel: 0, addressable: !0 },
  "dash-servicos": { id: "dash-servicos", path: "#/dash/servicos", panel: "panel-cards", region: "main", minLevel: 0, addressable: !0 },
  "dash-saldo-contas": { id: "dash-saldo-contas", path: "#/dash/saldo-contas", panel: "panel-cards", region: "main", minLevel: 0, addressable: !0 },
  "dash-contas-pagar": { id: "dash-contas-pagar", path: "#/dash/contas-pagar", panel: "panel-cards", region: "main", minLevel: 0, addressable: !0 },
  "dash-contas-receber": { id: "dash-contas-receber", path: "#/dash/contas-receber", panel: "panel-cards", region: "main", minLevel: 0, addressable: !0 },
  "dash-fluxo-caixa": { id: "dash-fluxo-caixa", path: "#/dash/fluxo-caixa", panel: "panel-cards", region: "main", minLevel: 0, addressable: !0 },
  "dash-indicadores-rh": { id: "dash-indicadores-rh", path: "#/dash/indicadores-rh", panel: "panel-cards", region: "main", minLevel: 0, addressable: !0 },
  "dash-bling": { id: "dash-bling", path: "#/dash/bling", panel: "panel-cards", region: "main", minLevel: 0, addressable: !0 },
  "dash-asaas": { id: "dash-asaas", path: "#/dash/asaas", panel: "panel-cards", region: "main", minLevel: 0, addressable: !0 },
  "dash-mercado-livre": { id: "dash-mercado-livre", path: "#/dash/mercado-livre", panel: "panel-cards", region: "main", minLevel: 0, addressable: !0 },
  "dash-pipedrive": { id: "dash-pipedrive", path: "#/dash/pipedrive", panel: "panel-cards", region: "main", minLevel: 0, addressable: !0 },
  "dash-google-ads": { id: "dash-google-ads", path: "#/dash/google-ads", panel: "panel-cards", region: "main", minLevel: 0, addressable: !0 },
  "dash-google-drive": { id: "dash-google-drive", path: "#/dash/google-drive", panel: "panel-cards", region: "main", minLevel: 0, addressable: !0 },
  "dash-instagram": { id: "dash-instagram", path: "#/dash/instagram", panel: "panel-cards", region: "main", minLevel: 0, addressable: !0 },
  "dash-produtos": { id: "dash-produtos", path: "#/dash/produtos", panel: "panel-cards", region: "main", minLevel: 0, addressable: !0 },
  "meu-perfil": { id: "meu-perfil", path: "#/meu-perfil", panel: "panel-user-profile", region: "main", minLevel: 0, addressable: !0 },
  "seguranca-conta": { id: "seguranca-conta", path: "#/seguranca-conta", panel: "panel-account-security", region: "main", minLevel: 0, addressable: !0 },
  notificacoes: { id: "notificacoes", path: "#/notificacoes", panel: "panel-user-notifications", region: "main", minLevel: 0, addressable: !0 },
  "sessoes-ativas": { id: "sessoes-ativas", path: "#/sessoes-ativas", panel: "panel-user-sessions", region: "main", minLevel: 0, addressable: !0 }
}), u = Object.freeze([
  { id: "nav-home", intent: "nav.home", action: "navigate", target: "home", region: "main", priority: 100 },
  { id: "nav-dashboard", intent: "nav.dashboard", action: "navigate", target: "dashboard", region: "main", priority: 100 },
  { id: "nav-clientes", intent: "nav.clientes", action: "navigate", target: "clientes", region: "main", priority: 100 },
  { id: "nav-produtos", intent: "nav.produtos", action: "navigate", target: "produtos", region: "main", priority: 100 },
  { id: "nav-financeiro", intent: "nav.financeiro", action: "navigate", target: "financeiro", region: "main", priority: 100 },
  { id: "nav-comercial", intent: "nav.comercial", action: "navigate", target: "comercial", region: "main", priority: 100 },
  { id: "nav-relatorios", intent: "nav.relatorios", action: "navigate", target: "relatorios", region: "main", priority: 100 },
  { id: "nav-analytics", intent: "nav.analytics", action: "navigate", target: "analytics", region: "main", priority: 100 },
  { id: "header-logout", intent: "header.user.menu.logout", action: "action", target: "auth:logout", region: "main", priority: 100 },
  { id: "footer-logout", intent: "footer.logout", action: "action", target: "auth:logout", region: "main", priority: 100 },
  { id: "kb-search", intent: "header.search", action: "panel", target: "search-modal", region: "modal", priority: 100 },
  { id: "kb-home", intent: "nav.home", action: "navigate", target: "home", region: "main", priority: 100 },
  { id: "kb-fullscreen", intent: "global.fullscreen", action: "action", target: "app:fullscreen", region: "main", priority: 100 },
  { id: "kb-refresh", intent: "global.refresh", action: "action", target: "app:refresh", region: "main", priority: 100 },
  { id: "navrail-home", intent: "navrail.home", action: "navigate", target: "home", region: "main", priority: 100 },
  { id: "navrail-dashboard", intent: "navrail.dashboard", action: "navigate", target: "dashboard", region: "main", priority: 100 },
  { id: "navrail-financeiro", intent: "navrail.financeiro", action: "navigate", target: "financeiro", region: "main", priority: 100 },
  { id: "navrail-comercial", intent: "navrail.comercial", action: "navigate", target: "comercial", region: "main", priority: 100 },
  { id: "navrail-clientes", intent: "navrail.clientes", action: "navigate", target: "clientes", region: "main", priority: 100 },
  { id: "navrail-analytics", intent: "navrail.analytics", action: "navigate", target: "analytics", region: "main", priority: 100 },
  { id: "navrail-relatorios", intent: "navrail.relatorios", action: "navigate", target: "relatorios", region: "main", priority: 100 },
  { id: "header-logo", intent: "header.logo", action: "navigate", target: "home", region: "main", priority: 100 },
  { id: "header-btn-logout", intent: "header.logout", action: "action", target: "auth:logout", region: "main", priority: 100 },
  { id: "nav-admin-orchestrator-manager", intent: "nav.admin.orchestrator-manager", action: "navigate", target: "admin-orchestrator-manager", region: "main", priority: 100 },
  { id: "nav-admin-uarps", intent: "sidebar.uarps-monitor", action: "navigate", target: "admin-uarps", region: "main", priority: 100 },
  { id: "nav-admin-users", intent: "nav.admin.user.management", action: "navigate", target: "admin-users", region: "main", priority: 90 },
  { id: "nav-admin-permissions", intent: "nav.admin.permissions.admin", action: "navigate", target: "admin-permissions", region: "main", priority: 90 },
  { id: "nav-admin-orchestrator", intent: "nav.admin.orchestrator.manager", action: "navigate", target: "admin-orchestrator", region: "main", priority: 90 },
  { id: "header-search", intent: "header.search", action: "panel", target: "search-modal", region: "modal", priority: 80 },
  { id: "header-notifications", intent: "header.notifications", action: "navigate", target: "status-notifications", region: "main", priority: 80 },
  { id: "header-profile", intent: "header.user.menu.profile", action: "navigate", target: "meu-perfil", region: "main", priority: 80 },
  { id: "header-settings", intent: "header.user.menu.preferences", action: "navigate", target: "preferencias", region: "main", priority: 80 },
  { id: "header-sessions", intent: "header.user.menu.sessions", action: "navigate", target: "sessoes", region: "main", priority: 80 },
  { id: "header-user-notifications", intent: "header.user.menu.notifications", action: "panel", target: "notifications-panel", region: "side", priority: 80 },
  { id: "header-security", intent: "header.user.menu.security", action: "navigate", target: "seguranca", region: "main", priority: 80 },
  { id: "footer-search", intent: "footer.search", action: "panel", target: "panel-search", region: "overlay", priority: 80 },
  { id: "header-refresh", intent: "header.refresh.action", action: "action", target: "app:refresh", region: "main", priority: 80 },
  { id: "header-fullscreen", intent: "header.fullscreen.action", action: "action", target: "app:fullscreen", region: "main", priority: 80 },
  { id: "header-btn-profile", intent: "header.profile", action: "navigate", target: "meu-perfil", region: "main", priority: 80 },
  { id: "header-btn-settings", intent: "header.settings", action: "navigate", target: "preferencias", region: "main", priority: 80 },
  { id: "panel-asaas-rule", intent: "header.panel.asaas", action: "navigate", target: "status-asaas", region: "main", priority: 80 },
  { id: "panel-chatgpt-rule", intent: "header.panel.chatgpt", action: "navigate", target: "status-chatgpt", region: "main", priority: 80 },
  { id: "panel-google-drive-rule", intent: "header.panel.google-drive", action: "navigate", target: "status-google-drive", region: "main", priority: 80 },
  { id: "panel-loja-integrada-rule", intent: "header.panel.loja-integrada", action: "navigate", target: "status-loja-integrada", region: "main", priority: 80 },
  { id: "panel-pipedrive-rule", intent: "header.panel.pipedrive", action: "navigate", target: "status-pipedrive", region: "main", priority: 80 },
  { id: "panel-adwords-rule", intent: "header.panel.adwords", action: "navigate", target: "status-adwords", region: "main", priority: 80 },
  { id: "panel-calendar-rule", intent: "header.panel.calendar", action: "navigate", target: "status-calendar", region: "main", priority: 80 },
  { id: "panel-bling-rule", intent: "header.panel.bling", action: "navigate", target: "status-bling", region: "main", priority: 80 },
  { id: "panel-mercado-livre-rule", intent: "header.panel.mercado-livre", action: "navigate", target: "status-mercado-livre", region: "main", priority: 80 },
  { id: "panel-maps-rule", intent: "header.panel.maps", action: "navigate", target: "status-maps", region: "main", priority: 80 },
  { id: "footer-termos", intent: "footer.termos", action: "external", target: "/termos", region: "main", priority: 50 },
  { id: "footer-privacidade", intent: "footer.privacidade", action: "external", target: "/privacidade", region: "main", priority: 50 },
  { id: "footer-activity", intent: "footer.activity", action: "navigate", target: "status-activity", region: "main", priority: 50 },
  { id: "footer-analytics", intent: "footer.analytics", action: "navigate", target: "analytics", region: "main", priority: 50 },
  { id: "footer-bell", intent: "footer.bell", action: "panel", target: "panel-notifications", region: "side", priority: 50 },
  { id: "footer-bookmark", intent: "footer.bookmark", action: "navigate", target: "status-bookmark", region: "main", priority: 50 },
  { id: "footer-calendar", intent: "footer.calendar", action: "navigate", target: "status-calendar", region: "main", priority: 50 },
  { id: "footer-clipboard", intent: "footer.clipboard", action: "navigate", target: "status-clipboard", region: "main", priority: 50 },
  { id: "footer-cloud", intent: "footer.cloud", action: "navigate", target: "status-cloud", region: "main", priority: 50 },
  { id: "footer-cpu", intent: "footer.cpu", action: "navigate", target: "status-cpu", region: "main", priority: 50 },
  { id: "footer-credit-card", intent: "footer.credit.card", action: "navigate", target: "status-credit-card", region: "main", priority: 50 },
  { id: "footer-dashboard", intent: "footer.dashboard", action: "navigate", target: "dashboard", region: "main", priority: 50 },
  { id: "footer-database", intent: "footer.database", action: "navigate", target: "status-database", region: "main", priority: 50 },
  { id: "footer-disk", intent: "footer.disk", action: "navigate", target: "status-disk", region: "main", priority: 50 },
  { id: "footer-folder", intent: "footer.folder", action: "navigate", target: "status-folder", region: "main", priority: 50 },
  { id: "footer-globe", intent: "footer.globe", action: "navigate", target: "status-globe", region: "main", priority: 50 },
  { id: "footer-hard-drive", intent: "footer.hard.drive", action: "navigate", target: "status-hard-drive", region: "main", priority: 50 },
  { id: "footer-language", intent: "footer.language", action: "navigate", target: "status-language", region: "main", priority: 50 },
  { id: "footer-lgpd", intent: "footer.lgpd", action: "external", target: "/lgpd", region: "main", priority: 50 },
  { id: "footer-link", intent: "footer.link", action: "navigate", target: "status-link", region: "main", priority: 50 },
  { id: "footer-lock", intent: "footer.lock", action: "navigate", target: "seguranca", region: "main", priority: 50 },
  { id: "footer-mail", intent: "footer.mail", action: "navigate", target: "status-mail", region: "main", priority: 50 },
  { id: "footer-memory", intent: "footer.memory", action: "navigate", target: "status-memory", region: "main", priority: 50 },
  { id: "footer-monitor", intent: "footer.monitor", action: "navigate", target: "status-monitor", region: "main", priority: 50 },
  { id: "footer-pie-chart", intent: "footer.pie.chart", action: "navigate", target: "status-pie-chart", region: "main", priority: 50 },
  { id: "footer-security", intent: "footer.security", action: "navigate", target: "seguranca", region: "main", priority: 50 },
  { id: "footer-server", intent: "footer.server", action: "navigate", target: "status-server", region: "main", priority: 50 },
  { id: "footer-settings", intent: "footer.settings", action: "navigate", target: "preferencias", region: "main", priority: 50 },
  { id: "footer-target", intent: "footer.target", action: "navigate", target: "status-target", region: "main", priority: 50 },
  { id: "footer-trending-up", intent: "footer.trending.up", action: "navigate", target: "status-trending", region: "main", priority: 50 },
  { id: "footer-users", intent: "footer.users", action: "navigate", target: "clientes", region: "main", priority: 50 },
  { id: "footer-wifi", intent: "footer.wifi", action: "navigate", target: "status-wifi", region: "main", priority: 50 },
  { id: "footer-zap", intent: "footer.zap", action: "navigate", target: "status-zap", region: "main", priority: 50 },
  { id: "header-user-menu-open", intent: "header.user.menu.open", action: "action", target: "ui:user-menu:open", region: "overlay", priority: 50 },
  { id: "header-user-menu-close", intent: "header.user.menu.close", action: "action", target: "ui:user-menu:close", region: "overlay", priority: 50 },
  { id: "header-adwords", intent: "header.adwords.link", action: "navigate", target: "status-adwords", region: "main", priority: 50 },
  { id: "header-alfinete", intent: "header.alfinete.link", action: "navigate", target: "status-alfinete", region: "main", priority: 50 },
  { id: "header-asaas", intent: "header.asaas.link", action: "navigate", target: "status-asaas", region: "main", priority: 50 },
  { id: "header-bling", intent: "header.bling.link", action: "navigate", target: "status-bling", region: "main", priority: 50 },
  { id: "header-calendar", intent: "header.calendar.link", action: "navigate", target: "status-calendar", region: "main", priority: 50 },
  { id: "header-chatgpt", intent: "header.chatgpt.link", action: "navigate", target: "status-chatgpt", region: "main", priority: 50 },
  { id: "header-google-drive", intent: "header.google.drive.link", action: "navigate", target: "status-google-drive", region: "main", priority: 50 },
  { id: "header-loja-integrada", intent: "header.loja.integrada.link", action: "navigate", target: "status-loja-integrada", region: "main", priority: 50 },
  { id: "header-mercado-livre", intent: "header.mercado.livre.link", action: "navigate", target: "status-mercado-livre", region: "main", priority: 50 },
  { id: "header-pipedrive", intent: "header.pipedrive.link", action: "navigate", target: "status-pipedrive", region: "main", priority: 50 },
  { id: "header-email", intent: "header.email.integration", action: "navigate", target: "status-email", region: "main", priority: 50 },
  { id: "header-instagram", intent: "header.instagram.messenger.integration", action: "navigate", target: "status-instagram", region: "main", priority: 50 },
  { id: "header-wechat", intent: "header.wechat.integration", action: "navigate", target: "status-wechat", region: "main", priority: 50 },
  { id: "header-whatsapp", intent: "header.whatsapp.integration", action: "navigate", target: "status-whatsapp", region: "main", priority: 50 },
  { id: "header-currency-btc", intent: "header.currency.btc", action: "navigate", target: "status-btc", region: "main", priority: 50 },
  { id: "header-currency-usd-brl", intent: "header.currency.usd.brl", action: "navigate", target: "status-usd-brl", region: "main", priority: 50 },
  { id: "header-currency-usd-cny", intent: "header.currency.usd.cny", action: "navigate", target: "status-usd-cny", region: "main", priority: 50 },
  { id: "header-weather", intent: "header.weather.sp", action: "navigate", target: "status-weather", region: "main", priority: 50 },
  { id: "header-app-status", intent: "header.app.status", action: "navigate", target: "status-app", region: "main", priority: 50 },
  { id: "header-errors-status", intent: "header.errors.status", action: "navigate", target: "status-errors", region: "main", priority: 50 }
]), A = Object.freeze({
  "header:btn-notifications": "header.notifications",
  "header:btn-profile": "header.profile",
  "header:btn-settings": "header.settings",
  "header:btn-logout": "header.logout",
  "header:btn-search": "header.search",
  "header:refresh-action": "header.refresh.action",
  "header:fullscreen-action": "header.fullscreen.action",
  "header:logo": "header.logo",
  "header:user-menu:open": "header.user.menu.open",
  "header:user-menu:close": "header.user.menu.close",
  "header:user-menu:profile": "header.user.menu.profile",
  "header:user-menu:preferences": "header.user.menu.preferences",
  "header:user-menu:security": "header.user.menu.security",
  "header:user-menu:notifications": "header.user.menu.notifications",
  "header:user-menu:sessions": "header.user.menu.sessions",
  "header:user-menu:logout": "header.user.menu.logout",
  "header:adwords-link": "header.adwords.link",
  "header:alfinete-link": "header.alfinete.link",
  "header:asaas-link": "header.asaas.link",
  "header:bling-link": "header.bling.link",
  "header:calendar-link": "header.calendar.link",
  "header:chatgpt-link": "header.chatgpt.link",
  "header:google-drive-link": "header.google.drive.link",
  "header:loja-integrada-link": "header.loja.integrada.link",
  "header:mercado-livre-link": "header.mercado.livre.link",
  "header:pipedrive-link": "header.pipedrive.link",
  "header:currency-btc": "header.currency.btc",
  "header:currency-usd-brl": "header.currency.usd.brl",
  "header:currency-usd-cny": "header.currency.usd.cny",
  "header:email-integration": "header.email.integration",
  "header:instagram-messenger-integration": "header.instagram.messenger.integration",
  "header:weather-sp": "header.weather.sp",
  "header:wechat-integration": "header.wechat.integration",
  "header:whatsapp-integration": "header.whatsapp.integration",
  "header:notifications": "header.notifications",
  "header:app-status": "header.app.status",
  "header:errors-status": "header.errors.status",
  "panel-asaas": "header.panel.asaas",
  "panel-chatgpt": "header.panel.chatgpt",
  "panel-google-drive": "header.panel.google-drive",
  "panel-loja-integrada": "header.panel.loja-integrada",
  "panel-pipedrive": "header.panel.pipedrive",
  "panel-adwords": "header.panel.adwords",
  "panel-calendar": "header.panel.calendar",
  "panel-bling": "header.panel.bling",
  "panel-mercado-livre": "header.panel.mercado-livre",
  "panel-maps": "header.panel.maps",
  "sidebar:user-management": "nav.user.management",
  "sidebar:automacoes": "nav.automacoes",
  "sidebar:principal": "nav.principal",
  "sidebar:geral": "nav.geral",
  "sidebar:permissions-admin": "nav.permissions.admin",
  "sidebar:bling": "nav.bling",
  "sidebar:clientes": "nav.clientes",
  "sidebar:session-admin": "nav.session.admin",
  "sidebar:colaboradores": "nav.colaboradores",
  "sidebar:audit-trail": "nav.audit.trail",
  "sidebar:comercial": "nav.comercial",
  "sidebar:nav-admin": "nav.nav.admin",
  "sidebar:compras": "nav.compras",
  "sidebar:user-preferences": "nav.user.preferences",
  "sidebar:contratos": "nav.contratos",
  "sidebar:uarps-monitor": "sidebar.uarps-monitor",
  "sidebar:financeiro": "nav.financeiro",
  "sidebar:fornecedores": "nav.fornecedores",
  "sidebar:google-ads": "nav.google.ads",
  "sidebar:google-drive": "nav.google.drive",
  "sidebar:importacao": "nav.importacao",
  "sidebar:instagram": "nav.instagram",
  "sidebar:operacional-menu": "nav.operacional.menu",
  "sidebar:orcamento-clientes": "nav.orcamento.clientes",
  "sidebar:pipedrive": "nav.pipedrive",
  "sidebar:produtos": "nav.produtos",
  "sidebar:rh-pessoas": "nav.rh.pessoas",
  "sidebar:servidores": "nav.servidores",
  "sidebar:orchestrator-manager": "nav.admin.orchestrator-manager",
  "trigger:nav:user-preferences": "sidebar.user-preferences",
  "trigger:nav:session-admin": "sidebar.session-admin",
  "trigger:nav:audit-trail": "sidebar.audit-trail",
  "trigger:nav:user-management": "sidebar.user-management",
  "trigger:nav:permissions-admin": "sidebar.permissions-admin",
  "trigger:nav:nav-admin": "sidebar.nav-admin",
  "trigger:nav:orchestrator-manager": "nav.admin.orchestrator-manager",
  "navrail:home": "navrail.home",
  "navrail:dashboard": "navrail.dashboard",
  "navrail:financeiro": "navrail.financeiro",
  "navrail:comercial": "navrail.comercial",
  "navrail:clientes": "navrail.clientes",
  "navrail:analytics": "navrail.analytics",
  "navrail:relatorios": "navrail.relatorios",
  "navrail:charts": "navrail.charts",
  "navrail:database": "navrail.database",
  "navrail:folder": "navrail.folder",
  "navrail:docs": "navrail.docs",
  "navrail:api": "navrail.api",
  "navrail:pipedrive": "navrail.pipedrive",
  "navrail:location": "navrail.location",
  "navrail:admin-users": "navrail.admin.users",
  "navrail:admin-settings": "navrail.admin.settings",
  "navrail:code": "navrail.code",
  "navrail:bell": "navrail.bell",
  "navrail:help": "navrail.help",
  "navrail:toggle-sidebar": "navrail.toggle.sidebar",
  "footer:language": "footer.language",
  "footer:logout": "footer.logout",
  "footer:termos": "footer.termos",
  "footer:privacidade": "footer.privacidade",
  "footer:lgpd": "footer.lgpd",
  "footer:activity": "footer.activity",
  "footer:analytics": "footer.analytics",
  "footer:bell": "footer.bell",
  "footer:bookmark": "footer.bookmark",
  "footer:calendar": "footer.calendar",
  "footer:clipboard": "footer.clipboard",
  "footer:cloud": "footer.cloud",
  "footer:cpu": "footer.cpu",
  "footer:credit-card": "footer.credit.card",
  "footer:dashboard": "footer.dashboard",
  "footer:database": "footer.database",
  "footer:folder": "footer.folder",
  "footer:globe": "footer.globe",
  "footer:hard-drive": "footer.hard.drive",
  "footer:link": "footer.link",
  "footer:lock": "footer.lock",
  "footer:mail": "footer.mail",
  "footer:monitor": "footer.monitor",
  "footer:pie-chart": "footer.pie.chart",
  "footer:search": "footer.search",
  "footer:security": "footer.security",
  "footer:server": "footer.server",
  "footer:settings": "footer.settings",
  "footer:target": "footer.target",
  "footer:trending-up": "footer.trending.up",
  "footer:users": "footer.users",
  "footer:zap": "footer.zap",
  "footer:wifi": "footer.wifi",
  "footer:memory": "footer.memory",
  "footer:disk": "footer.disk",
  "keyboard:ctrl+k": "header.search",
  "keyboard:ctrl+/": "global.shortcuts",
  "keyboard:ctrl+shift+n": "header.notifications",
  "keyboard:ctrl+h": "nav.home",
  "keyboard:ctrl+shift+f": "global.fullscreen",
  "keyboard:ctrl+shift+r": "global.refresh",
  "keyboard:escape": "global.close.modal",
  "keyboard:ctrl+,": "header.settings",
  "keyboard:ctrl+shift+p": "header.profile",
  "keyboard:ctrl+shift+l": "header.logout",
  "api:uarps-status": "api.uarps.status",
  "api:feature-flags:admin": "api.feature-flags.admin",
  "api:feature-flags:read": "api.feature-flags.read",
  "api:permission-audit:view": "api.permission-audit.view",
  "api:permission-audit:admin": "api.permission-audit.admin",
  "api:notification-rules:admin": "api.notification-rules.admin",
  "api:permissions:admin": "api.permissions.admin",
  "api:permissions:super-admin": "api.permissions.super-admin",
  "api:settings:admin": "api.settings.admin",
  "api:orchestrator:admin": "api.orchestrator.admin",
  "api:users:admin": "api.users.admin",
  "trigger:navrail:admin": "navrail.admin",
  "trigger:header:admin": "header.admin",
  "trigger:navigation:admin": "navigation.admin",
  "trigger:gate:admin": "gate.admin",
  "trigger:gate:diagnostics": "gate.diagnostics"
});
function N(e) {
  return L[e] || null;
}
function G(e) {
  return c[e] || null;
}
function z(e) {
  return m[e] || null;
}
function M(e) {
  for (let a = 0; a < u.length; a++)
    if (u[a].intent === e) return u[a];
  return null;
}
function F(e) {
  return A[e] || null;
}
function _(e) {
  const a = Object.keys(m);
  for (let n = 0; n < a.length; n++)
    if (m[a[n]].path === e) return m[a[n]];
  return null;
}
function U(e) {
  const a = [], n = Object.keys(c);
  for (let r = 0; r < n.length; r++)
    c[n[r]].regions && c[n[r]].regions.indexOf(e) >= 0 && a.push(c[n[r]]);
  return a;
}
function D() {
  return {
    version: R,
    moduleId: I,
    generatedAt: w,
    hash: O,
    source: "database",
    intents: Object.keys(L).length,
    panels: Object.keys(c).length,
    routes: Object.keys(m).length,
    rules: u.length,
    triggers: Object.keys(A).length
  };
}
function $() {
  return D();
}
function H() {
  return {
    status: "HEALTHY",
    moduleId: I,
    version: R,
    hash: O,
    source: "database-generated",
    checks: {
      intentsReady: Object.keys(L).length > 0,
      panelsReady: Object.keys(c).length > 0,
      routesReady: Object.keys(m).length > 0,
      rulesReady: u.length > 0,
      triggersReady: Object.keys(A).length > 0
    }
  };
}
const je = Object.freeze({
  VERSION: R,
  MODULE_ID: I,
  GENERATED_AT: w,
  MANIFEST_HASH: O,
  INTENT_REGISTRY: L,
  PANELS: c,
  ROUTES: m,
  RULES: u,
  TRIGGERS: A,
  getIntent: N,
  getPanel: G,
  getRoute: z,
  getRuleByIntent: M,
  getTriggerIntent: F,
  getRouteByPath: _,
  getPanelsByRegion: U,
  getManifestInfo: D,
  info: $,
  healthCheck: H
}), xe = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  GENERATED_AT: w,
  INTENT_REGISTRY: L,
  MANIFEST_HASH: O,
  MODULE_ID: I,
  PANELS: c,
  ROUTES: m,
  RULES: u,
  TRIGGERS: A,
  VERSION: R,
  default: je,
  getIntent: N,
  getManifestInfo: D,
  getPanel: G,
  getPanelsByRegion: U,
  getRoute: z,
  getRouteByPath: _,
  getRuleByIntent: M,
  getTriggerIntent: F,
  healthCheck: H,
  info: $
}, Symbol.toStringTag, { value: "Module" })), E = "5.0.0-P2-ENTERPRISE", k = "core.ui-orchestrator.core.resolver", h = T({ moduleId: k }), Re = () => {
  h.init();
}, Ie = (e) => h.get(e), Oe = (e) => h.inject(e), Ce = () => h.snapshot(), o = {
  initialized: !1,
  userLevel: 0,
  userPermissions: [],
  dbRules: /* @__PURE__ */ new Map(),
  overrides: /* @__PURE__ */ new Map()
}, d = {
  intentsReceived: 0,
  intentsResolved: 0,
  intentsFailed: 0,
  dbRulesUsed: 0,
  manifestRulesUsed: 0,
  fallbacksUsed: 0,
  lastResolveTime: 0,
  avgResolveTime: 0
}, v = {}, s = (e, a, n) => {
  const r = Ie("logger");
  r?.[e] && r[e](`[${k}] ${a}`, n || {});
}, qe = () => {
  l.info().initialized || (l.init(xe), typeof window < "u" && (window.ManifestState = l), s("info", "ManifestState initialized from generated manifest", l.info()));
}, Pe = (e) => {
  const a = d.intentsResolved;
  a <= 1 ? d.avgResolveTime = e : d.avgResolveTime = (d.avgResolveTime * (a - 1) + e) / a;
}, we = (e, a) => e ? e.minLevel && o.userLevel < e.minLevel ? { allowed: !1, reason: `Insufficient level: ${o.userLevel} < ${e.minLevel}` } : e.requiredPermissions && e.requiredPermissions.length > 0 && !e.requiredPermissions.every((r) => o.userPermissions.indexOf(r) >= 0) ? { allowed: !1, reason: "Missing permissions" } : { allowed: !0 } : { allowed: !0 }, De = (e) => ({
  success: !0,
  fallback: !0,
  action: x.NAVIGATE,
  target: "dashboard",
  region: f.MAIN,
  intent: e,
  timestamp: Date.now()
}), B = (e, a) => ({
  success: !1,
  denied: !0,
  reason: a,
  action: x.NOOP,
  intent: e,
  timestamp: Date.now()
}), Ee = (e, a) => {
  let n = null;
  const r = e.target || e.panel;
  return r && (n = l.getPanel(r) || v[r] || null), {
    success: !0,
    action: e.action || x.NAVIGATE,
    target: r,
    panel: n,
    region: e.region || f.MAIN,
    priority: e.priority || q.NORMAL,
    intent: a,
    rule: e,
    timestamp: Date.now()
  };
};
function V(e) {
  return v[e] || null;
}
function Se(e, a) {
  v[e] = Object.assign({ id: e, dynamic: !0 }, a), s("debug", "Dynamic panel registered", { panelId: e });
}
function Te(e) {
  if (e || (e = {}), o.initialized)
    return s("warn", "Resolver already initialized"), { success: !0, alreadyInitialized: !0 };
  try {
    Re(), qe(), o.userLevel = e.userLevel !== void 0 ? e.userLevel : 0, o.userPermissions = e.userPermissions || [], e.overrides && Z(e.overrides), e.rules && W(e.rules), o.initialized = !0;
    const a = l.info();
    return s("info", "Resolver initialized", {
      userLevel: o.userLevel,
      dbRules: o.dbRules.size,
      manifestRules: l.getRules().length,
      manifestHash: a.hash,
      manifestSource: a.source
    }), { success: !0 };
  } catch (a) {
    return s("error", "Init failed", { error: a.message }), { success: !1, error: a.message };
  }
}
function Y(e) {
  const a = performance.now();
  d.intentsReceived++;
  try {
    if (!e || !e.id) throw new Error("Invalid intent: missing id");
    s("debug", "Resolving intent", { intentId: e.id, source: e.source });
    let n = o.dbRules.get(e.id), r = "database";
    if (n ? (d.dbRulesUsed++, s("debug", "Rule found in database", { intentId: e.id })) : (n = l.getRuleByIntent(e.id), r = "manifest", n && (d.manifestRulesUsed++, s("debug", "Rule found in manifest", { intentId: e.id }))), o.overrides.has(e.id)) {
      const S = o.overrides.get(e.id);
      n = n ? Object.assign({}, n, S) : S, s("debug", "Override applied", { intentId: e.id });
    }
    if (!n)
      return s("warn", "No rule found for intent", { intentId: e.id }), d.fallbacksUsed++, De(e);
    const t = we(n, e);
    if (!t.allowed)
      return s("warn", "Permission denied", { intentId: e.id, reason: t.reason }), B(e, t.reason);
    const g = Ee(n, e);
    g.ruleSource = r;
    const C = performance.now() - a;
    return d.intentsResolved++, d.lastResolveTime = C, Pe(C), s("info", "Intent resolved", {
      intentId: e.id,
      action: g.action,
      target: g.target,
      panel: g.panel ? g.panel.id : null,
      source: r,
      time: `${C.toFixed(2)}ms`
    }), g;
  } catch (n) {
    return d.intentsFailed++, s("error", "Resolution failed", { intentId: e ? e.id : null, error: n.message }), { success: !1, error: n.message, intent: e, timestamp: Date.now() };
  }
}
function Ne(e, a) {
  a || (a = {});
  const n = l.getTriggerIntent(e);
  if (!n)
    return s("warn", "Unknown trigger", { triggerId: e }), { success: !1, error: `Unknown trigger: ${e}`, triggerId: e };
  const r = {
    id: n,
    source: e.split(":")[0],
    payload: a,
    timestamp: Date.now(),
    priority: q.NORMAL
  };
  return Y(r);
}
function Ge(e) {
  let a = l.getRouteByPath(e);
  if (!a) {
    const r = e.replace("#/", "").replace(/^\//, "").split("?")[0], t = V(r);
    t && (a = {
      id: r,
      path: e,
      panel: t.id,
      region: f.MAIN,
      addressable: !0,
      dynamic: !0
    }, s("debug", "Created dynamic route", { routeId: r, panel: t.id }));
  }
  if (!a)
    return s("warn", "No route for path", { path: e }), { success: !1, error: `No route for path: ${e}`, path: e };
  if (a.minLevel && o.userLevel < a.minLevel)
    return B({ id: `url:${e}` }, "Insufficient level");
  const n = l.getPanel(a.panel) || v[a.panel];
  return {
    success: !0,
    action: x.NAVIGATE,
    route: a,
    panel: n,
    region: a.region || f.MAIN,
    path: e,
    timestamp: Date.now()
  };
}
function W(e) {
  Array.isArray(e) && (o.dbRules.clear(), e.forEach((a) => {
    const n = a.intent_id || a.intentId || a.intent;
    n && o.dbRules.set(n, {
      id: a.id || a.rule_key,
      intent: n,
      action: a.action_type || a.action,
      target: a.target,
      region: a.region || f.MAIN,
      priority: a.priority || q.NORMAL,
      source: "database"
    });
  }), s("info", "DB Rules loaded", { count: o.dbRules.size }));
}
function ze(e, a) {
  o.dbRules.set(e, Object.assign({}, a, { intent: e, source: "runtime" }));
}
function Me(e) {
  o.dbRules.delete(e);
}
function Fe() {
  const e = {};
  return o.dbRules.forEach((a, n) => {
    e[n] = a;
  }), e;
}
function Z(e) {
  Array.isArray(e) && (o.overrides.clear(), e.forEach((a) => {
    const n = a.intent_id || a.intentId;
    n && o.overrides.set(n, a);
  }), s("info", "Overrides loaded", { count: o.overrides.size }));
}
function _e(e, a) {
  o.overrides.set(e, a);
}
function Ue() {
  o.overrides.clear();
}
function $e(e, a) {
  o.userLevel = e, o.userPermissions = a || [], s("debug", "User context updated", { level: e, permissions: (a || []).length });
}
function He() {
  const e = l.info();
  return {
    status: o.initialized ? "HEALTHY" : "NOT_INITIALIZED",
    version: E,
    moduleId: k,
    manifestHash: e.hash,
    manifestSource: e.source,
    metrics: Object.assign({}, d),
    dbRulesCount: o.dbRules.size,
    manifestRulesCount: l.getRules().length,
    dynamicPanelsCount: Object.keys(v).length,
    overridesCount: o.overrides.size,
    userLevel: o.userLevel,
    portsInitialized: h.isInitialized()
  };
}
function Be() {
  return Object.assign({}, d);
}
function Ve() {
  const e = l.info();
  return {
    version: E,
    moduleId: k,
    initialized: o.initialized,
    manifestVersion: e.version || "unknown",
    manifestHash: e.hash,
    manifestSource: e.source,
    intents: Object.keys(l.getIntents()).length,
    manifestRules: l.getRules().length,
    dbRules: o.dbRules.size,
    dynamicPanels: Object.keys(v).length,
    overrides: o.overrides.size,
    metrics: d,
    portsInitialized: h.isInitialized()
  };
}
var We = Object.freeze({
  VERSION: E,
  MODULE_ID: k,
  init: Te,
  resolve: Y,
  resolveFromTrigger: Ne,
  resolveFromURL: Ge,
  loadRules: W,
  addRule: ze,
  removeRule: Me,
  getDbRules: Fe,
  loadOverrides: Z,
  setOverride: _e,
  clearOverrides: Ue,
  setUserContext: $e,
  healthCheck: He,
  getMetrics: Be,
  info: Ve,
  getDynamicPanel: V,
  registerDynamicPanel: Se,
  ManifestState: l,
  injectPorts: Oe,
  getPorts: Ce
});
export {
  k as MODULE_ID,
  l as ManifestState,
  E as VERSION,
  ze as addRule,
  Ue as clearOverrides,
  We as default,
  Fe as getDbRules,
  V as getDynamicPanel,
  Be as getMetrics,
  Ce as getPorts,
  He as healthCheck,
  Ve as info,
  Te as init,
  Oe as injectPorts,
  Z as loadOverrides,
  W as loadRules,
  Se as registerDynamicPanel,
  Me as removeRule,
  Y as resolve,
  Ne as resolveFromTrigger,
  Ge as resolveFromURL,
  _e as setOverride,
  $e as setUserContext
};
