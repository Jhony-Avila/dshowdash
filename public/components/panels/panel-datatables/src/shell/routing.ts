// shell/routing.ts — roteamento interno em SEGMENTOS do hash (Fase 3, URL limpa).
// @version 2.0.0  @created 2026-07-20
//
// FASE 1 usava query (`?route=grupo/tela`) porque o `extractPanelId` do shell
// casa `^panel-[a-z0-9-]+$` e DESCARTA a query antes do regex — a query sobrava
// `panel-datatables` puro e resolvia. Um sub-path caía em 404.
//
// FASE 3: registramos `panel-datatables` no registro ESTÁTICO do shell
// (definitions/routes-dashboard.js, mesmo padrão de panel-01..08). Agora o
// `extractPanelId`, ao ver `#/panel-datatables/infrastructure/servers`, resolve
// pelo PRIMEIRO segmento (`panel-datatables`) via getRouteByIdOrPath — SEM que
// tenhamos tocado no `extractPanelId` (veto do dono respeitado).
//
// URL nova:  #/panel-datatables/infrastructure/servers
// Legado:    #/panel-datatables?route=infrastructure/servers  (ainda LIDO, p/ bookmarks)
// Filtros continuam em query:  #/panel-datatables/data/tables?orphan=1

export const HASH_BASE = '#/panel-datatables';
export const ROTA_PADRAO = 'overview';

/** Rotas conhecidas: grupo/tela. A camada 1 e o grupo, a 2 e a tela. */
export const GRUPOS = [
  { id: 'overview',      rotulo: 'Visão geral',        icone: 'LayoutDashboard',
    telas: [{ id: 'overview', rotulo: 'Dashboard' }] },
  { id: 'infrastructure', rotulo: 'Infraestrutura',    icone: 'Network',
    telas: [
      { id: 'tree',       rotulo: 'Árvore' },
      { id: 'servers',    rotulo: 'Servidores' },
      { id: 'databases',  rotulo: 'Bancos' },
      { id: 'connections', rotulo: 'Conexões' },
      { id: 'discovery',  rotulo: 'Descoberta' },
    ] },
  { id: 'data',          rotulo: 'Estrutura de dados', icone: 'TableProperties',
    telas: [
      { id: 'tables',       rotulo: 'Tabelas' },
      { id: 'compare',      rotulo: 'Comparar' },
      { id: 'dependencies', rotulo: 'Dependências' },
      { id: 'sensitive',    rotulo: 'Campos sensíveis' },
      { id: 'search',       rotulo: 'Busca global' },
    ] },
  { id: 'observability', rotulo: 'Observabilidade',    icone: 'Gauge',
    telas: [
      { id: 'quality',     rotulo: 'Qualidade' },
      { id: 'alerts',      rotulo: 'Alertas' },
      { id: 'maintenance', rotulo: 'Manutenções' },
    ] },
  { id: 'sources',       rotulo: 'Fontes',             icone: 'Unplug',
    telas: [{ id: 'integrations', rotulo: 'Integrações' }] },
  { id: 'admin',         rotulo: 'Administração',      icone: 'Settings',
    telas: [{ id: 'settings', rotulo: 'Configurações' }] },
] as const;

/**
 * Metadados de apresentação por tela (Elevação visual §1): título grande +
 * subtítulo + ícone. Fonte única do PageHeader — toda tela começa igual.
 */
export const META_TELAS: Record<string, { titulo: string; subtitulo: string; icone: string }> = {
  overview:     { titulo: 'Infraestrutura de dados', subtitulo: 'Panorama de servidores, bancos, conexões, qualidade e alertas.', icone: 'LayoutDashboard' },
  tree:         { titulo: 'Árvore de infraestrutura', subtitulo: 'Servidor → conexão → banco → tabela → campo, com expansão sob demanda.', icone: 'ListTree' },
  servers:      { titulo: 'Servidores',        subtitulo: 'Máquinas e VPSs que hospedam as conexões monitoradas.', icone: 'Server' },
  databases:    { titulo: 'Bancos',            subtitulo: 'Bancos catalogados, tamanho e distribuição por ambiente.', icone: 'Database' },
  connections:  { titulo: 'Conexões',          subtitulo: 'Fontes monitoradas — verifique, inventarie e gerencie credenciais.', icone: 'PlugZap' },
  discovery:    { titulo: 'Descoberta e reconciliação', subtitulo: 'Audita todos os schemas visíveis, cruza com config e lista conhecida e explica cada ausência.', icone: 'Radar' },
  tables:       { titulo: 'Tabelas',           subtitulo: 'Catálogo de tabelas com estrutura, tamanho e saúde.', icone: 'TableProperties' },
  compare:      { titulo: 'Comparar esquemas',  subtitulo: 'Diferenças estruturais entre dois bancos — drift de tabelas e colunas entre clones prod/homolog/dev.', icone: 'GitCompare' },
  dependencies: { titulo: 'Dependências',      subtitulo: 'Relações entre tabelas, órfãs e chaves estrangeiras quebradas.', icone: 'GitBranch' },
  sensitive:    { titulo: 'Campos sensíveis',  subtitulo: 'Indício de dados sensíveis por metadado — para revisão.', icone: 'ShieldAlert' },
  search:       { titulo: 'Busca global',      subtitulo: 'Encontre campos, tabelas, bancos e servidores no catálogo.', icone: 'Search' },
  quality:      { titulo: 'Qualidade',         subtitulo: 'Score de saúde dos dados, problemas e regras aplicadas.', icone: 'Gauge' },
  alerts:       { titulo: 'Alertas',           subtitulo: 'Central de alertas deduplicados — reconheça e resolva.', icone: 'BellRing' },
  maintenance:  { titulo: 'Manutenções',       subtitulo: 'Janelas de manutenção que saem do cálculo de disponibilidade.', icone: 'Wrench' },
  integrations: { titulo: 'Integrações',       subtitulo: 'Fontes externas: APIs, arquivos e caches monitorados.', icone: 'Unplug' },
  settings:     { titulo: 'Administração',     subtitulo: 'Limites, regras de alerta, canais, silêncios e rotinas.', icone: 'Settings' },
};

export interface Rota {
  /** Grupo da camada 1. */
  grupo: string;
  /** Tela da camada 2. */
  tela: string;
  /** Segmentos extras: detalhe (ex.: data/tables/app_users). */
  detalhe: string | null;
  /** Demais parametros da URL (filtros). */
  params: Record<string, string>;
}

/** Rota canonica "grupo/tela[/detalhe]". */
export function serializar(r: Rota): string {
  const partes = [r.grupo, r.tela];
  if (r.detalhe) partes.push(r.detalhe);
  return partes.join('/');
}

/**
 * Le a rota do hash atual. Rota invalida cai no padrao, nunca quebra.
 * Aceita as DUAS formas: segmentos (Fase 3) e `?route=` (legado).
 */
export function lerRota(hash = window.location.hash): Rota {
  const iq = hash.indexOf('?');
  const caminho = iq >= 0 ? hash.slice(0, iq) : hash;
  const qs = iq >= 0 ? hash.slice(iq + 1) : '';
  const sp = new URLSearchParams(qs);

  // 1) Forma nova: segmentos depois de HASH_BASE.
  //    `#/panel-datatables/observability/alerts` -> "observability/alerts"
  let bruto = '';
  if (caminho.startsWith(HASH_BASE)) {
    bruto = caminho.slice(HASH_BASE.length).replace(/^\/+|\/+$/g, '');
  }
  // 2) Legado: `?route=grupo/tela` (bookmarks/links antigos). So vale se nao
  //    houver segmentos no caminho.
  if (!bruto && sp.has('route')) {
    bruto = (sp.get('route') || '').replace(/^\/+|\/+$/g, '');
  }
  if (!bruto) bruto = ROTA_PADRAO;

  const [grupoBruto, telaBruta, ...resto] = bruto.split('/');

  const grupo = GRUPOS.find((g) => g.id === grupoBruto);
  if (!grupo) {
    return { grupo: 'overview', tela: 'overview', detalhe: null, params: extras(sp) };
  }

  const tela = grupo.telas.find((t) => t.id === telaBruta) ?? grupo.telas[0];

  return {
    grupo: grupo.id,
    tela: tela.id,
    detalhe: resto.length ? resto.join('/') : null,
    params: extras(sp),
  };
}

function extras(sp: URLSearchParams): Record<string, string> {
  const out: Record<string, string> = {};
  // `route` era a chave do esquema legado; nunca vira filtro.
  sp.forEach((v, k) => { if (k !== 'route') out[k] = v; });
  return out;
}

/** Monta o hash em SEGMENTOS. Filtros continuam em query. */
export function montarHash(r: Partial<Rota> & { grupo: string; tela: string }): string {
  const caminho = `${HASH_BASE}/${serializar({ detalhe: null, params: {}, ...r } as Rota)}`;
  const sp = new URLSearchParams();
  Object.entries(r.params ?? {}).forEach(([k, v]) => { if (v !== '') sp.set(k, v); });
  const query = sp.toString();
  return query ? `${caminho}?${query}` : caminho;
}

/**
 * Navega. `substituir` troca a entrada atual em vez de empilhar — usado quando
 * a mudanca e correcao de estado, nao acao do usuario (senao o botao Voltar
 * ficaria preso repetindo a mesma tela).
 */
export function navegar(r: Partial<Rota> & { grupo: string; tela: string }, substituir = false): void {
  const novo = montarHash(r);
  if (window.location.hash === novo) return;

  if (substituir) {
    window.history.replaceState(null, '', novo);
    // replaceState nao dispara hashchange; avisa quem escuta.
    window.dispatchEvent(new HashChangeEvent('hashchange'));
  } else {
    window.location.hash = novo;
  }
}

/**
 * O hash pertence a este painel? Evita reagir a navegacao de outro modulo.
 * Casa `#/panel-datatables`, `#/panel-datatables/...` e `#/panel-datatables?...`,
 * mas NAO um irmao como `#/panel-datatables-outro` (o caractere seguinte a base
 * precisa ser fim, `/` ou `?`).
 */
export function ehNossoHash(hash = window.location.hash): boolean {
  if (!hash.startsWith(HASH_BASE)) return false;
  const prox = hash.charAt(HASH_BASE.length);
  return prox === '' || prox === '/' || prox === '?';
}
