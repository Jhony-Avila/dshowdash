// v2/servico.ts — Geral V2 · Lançamento (CIMA, 23/11/2026): leitura dos blocos pelo CONTRATO proposto à ACIMA_DIREITA
// (PARA-STATUS compartilhado, "GERAL V2 — PROPOSTA DE CONTRATO"). A tela só LÊ; o serviço é da ACIMA_DIREITA.
// Regra da casa: valor desconhecido = null (nunca 0); cada bloco carrega e falha sozinho (um endpoint por bloco).

export type EstadoBloco = 'ok' | 'zero' | 'parcial' | 'desatualizado' | 'aguardando' | 'erro';
export type PeriodoV2 = 'ontem' | '7d' | 'mes';

export interface Periodo { id: PeriodoV2; de: string; ate: string; rotulo: string }
/**
 * Estado POR INDICADOR (retorno do mockup, 24/11; contrato proposto à ACIMA_ESQUERDA no PARA-STATUS-CIMA):
 * `fonte` e `consulta_completa` são aditivos e opcionais. Sem eles, a tela deriva a fonte pelo indicador e só aceita
 * "zero" com a fonte em dia no fontes.php (ver v2/coerencia.ts).
 */
interface Base { estado: EstadoBloco; ultimo_sucesso: string | null; motivo: string | null; lacunas?: string[]; fonte?: IdFonte; consulta_completa?: boolean; fonte_atualizada_em?: string | null; valor_em?: string | null }
/** Pedidos / OS do Bling principal (decisão de 25/11): SÓ QUANTIDADE. Nenhum valor em R$ entra na tela — nem se o serviço mandar
 *  (`normalizarResumo` descarta). `conta` = a conta da fonte (44); `universo` = o que é contado (texto do serviço). */
export interface PedidosBling extends Base, Comparativo { quantidade: number | null; por_dia: { dia: string; quantidade: number | null }[]; inclui_canceladas: boolean; conta?: number | null; universo?: string | null; sem_canal?: number | null }
export interface NegociosGanhos extends Base, Comparativo { quantidade: number | null; valor: number | null; sem_valor: number | null }
/** `fotografia_em` (serviço, 116): horário da leitura dos negócios usada na soma — o funil é fotografia, não movimento do período. */
export interface FunilAberto extends Base, Comparativo { quantidade: number | null; valor: number | null; sem_valor: number | null; fotografia_em?: string | null }
/** Recebido no período · Precifica (decisão de 25/11). No 116 o cartão é SEMPRE "— · Aguardando conexão": não existe leitura de
 *  recebimentos do Precifica. Nunca Asaas, Bling ou Pipedrive. */
/** 25/11 (P15): recebido do Precifica — `valor` em TEXTO "1234.56" (centavos exatos) ou null; por empresa = CNPJ da parcela. */
export interface RecebidoEmpresa { empresa_id: number | null; cnpj: string | null; nome: string | null; quantidade: number; valor: string | null }
export interface Recebido extends Base, Comparativo { valor: string | number | null; quantidade?: number | null; por_empresa?: RecebidoEmpresa[] | null; sem_cnpj?: number | null }
/** Valor monetário do serviço ("1234.56" ou número) → número; texto inválido = null (desconhecido, nunca 0). */
export const numDe = (v: string | number | null | undefined): number | null => {
  if (v === null || v === undefined) return null; if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  return /^-?\d+(\.\d+)?$/.test(v) ? Number(v) : null;
};
export const fmtMoeda2 = (v: number | null) => (v === null ? '—' : v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', minimumFractionDigits: 2, maximumFractionDigits: 2 }));
/** 26/11 (VINHO, ed297028): `anterior` = o mesmo indicador no período anterior equivalente; `serie` = pontos por dia do período. null = desconhecido
 *  (nunca 0). Funil: sem fotografia diária → null + `serie_motivo`. O % da variação é calculado na tela a partir dos dois números do serviço. */
export interface AnteriorKpi { quantidade?: number | null; valor?: string | number | null }
export interface PontoSerie { dia: string; quantidade?: number | null; valor?: string | number | null }
export interface Comparativo { anterior?: AnteriorKpi | null; serie?: PontoSerie[] | null; serie_motivo?: string | null }
export interface Resumo { periodo_anterior?: { de: string; ate: string } | null; periodo: Periodo; pedidos_bling: PedidosBling; negocios_ganhos: NegociosGanhos; funil_aberto: FunilAberto; recebido?: Recebido }

export type IdPrioridade = 'atividade_vencida' | 'sem_proxima_atividade' | 'conflito_agenda';
export interface Prioridade extends Base { id: IdPrioridade; quantidade: number | null; gravidade: 1 | 2 | 3; desde: string | null; responsaveis: number | null; detalhe: string | null }
/** Verificação das prioridades, decidida pelo SERVIÇO (contrato com a ACIMA_ESQUERDA, retorno do mockup P10 2ª rodada).
 *  A tela só exibe: completa → "Sem pendências"; parcial → "Verificação parcial · <fonte>"; não verificada → "Prioridades não verificadas". */
export interface Verificacao {
  estado: 'completa' | 'parcial' | 'nao_verificada';
  fontes: { fonte: IdFonte; rotulo: string; estado: 'ok' | 'parcial' | 'desatualizado' | 'erro' | 'aguardando'; rotulo_estado: string }[];
}
export interface Prioridades { gerado_em: string | null; itens: Prioridade[]; verificacao?: Verificacao; /** pronto do serviço (9c0f45b3) */ sem_pendencias?: boolean }

export interface ItemLista { deal_id: number; titulo: string; organizacao: string | null; responsavel: string | null; etapa: string | null; prazo: string | null; valor: number | null; url_pipedrive: string | null }
/** total/responsaveis podem vir null quando a fonte não respondeu (aditivos do serviço 24e70e69: estado, motivo, paginas, ultimo_sucesso) */
/** total_sem_filtro (= número do cartão, mesmo com filtro de responsável) e sem_responsavel: aditivos do serviço 2a035013 (ACIMA_ESQUERDA) */
export interface Lista { id: IdPrioridade; total: number | null; total_sem_filtro?: number | null; sem_responsavel?: number | null; pagina: number; por_pagina: number; paginas?: number | null; estado?: EstadoBloco; motivo?: string | null; ultimo_sucesso?: string | null; criterios: { texto: string }; responsaveis: { id: number; nome: string }[] | null; itens: ItemLista[] }
export type OrdemLista = 'prazo' | 'valor' | 'responsavel';
export interface FiltrosLista { pagina: number; ordem: OrdemLista; dir: 'asc' | 'desc'; responsavel: number | null }

export interface Compromisso { inicio: string; fim: string | null; titulo: string; duracao_min: number | null; url_evento: string | null; conflito: boolean }
export interface Agenda extends Base { itens: Compromisso[]; url_agenda: string | null }

export type IdFonte = 'pipedrive' | 'bling' | 'calendar' | 'precifica' | 'asaas' | 'mercadolivre' | 'lojaintegrada';
export interface Fonte {
  fonte: IdFonte; estado: 'conectada' | 'desatualizada' | 'problema' | 'aguardando'; ultimo_sucesso: string | null; motivo: string | null;
  indicadores?: { id: string; estado: EstadoBloco }[];
  /** do serviço (aditivo): o texto do estado ("Com problema", "Desatualizado", "Dados parciais", "Atualizado", "Aguardando conexão") */
  rotulo_estado?: string;
  /** do serviço (aditivo): só as partes que não estão ok, com o rótulo curto ("funil") */
  afetado?: { id: string; rotulo: string; estado: EstadoBloco }[];
}

export class ErroV2 extends Error { constructor(public http: number, msg: string) { super(msg); } get semAcesso() { return this.http === 401 || this.http === 403; } }

const BASE = '/api/geral/v2';
async function ler<T>(caminho: string, sinal?: AbortSignal, timeoutMs = 12000): Promise<T> {
  const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), timeoutMs);
  sinal?.addEventListener('abort', () => ctrl.abort());
  try {
    // '/api/…' = rota de outro módulo (Asaas, P34); o resto é relativo à Geral V2
    const r = await fetch(caminho.startsWith('/api/') ? caminho : BASE + caminho, { credentials: 'same-origin', headers: { Accept: 'application/json' }, signal: ctrl.signal });
    let corpo: { ok?: boolean; data?: T; error?: string; meta?: { message?: string } } = {};
    try { corpo = await r.json(); } catch { /* corpo não-JSON */ }
    const sucesso = corpo.ok === true || (corpo as { success?: boolean }).success === true;   // ApiResponse: {ok,data,error,meta}
    if (!r.ok || !sucesso || corpo.data === undefined) throw new ErroV2(r.status, corpo.meta?.message || `Falha (${r.status}).`);
    return corpo.data;
  } finally { clearTimeout(t); }
}

/** Dinheiro do serviço vem como TEXTO decimal ("1035031.51"; ACIMA_DIREITA 24e70e69) ou número; null = sem dado (nunca 0). */
export function dinheiro(v: unknown): number | null {
  if (v === null || v === undefined || v === '') return null;
  if (typeof v === 'number') return Number.isFinite(v) ? v : null;
  const m = /^(-?)(\d+)(?:\.(\d{1,2}))?$/.exec(String(v).trim()); if (!m) return null;
  const cent = Number(m[2]) * 100 + Number((m[3] ?? '').padEnd(2, '0')); return (m[1] ? -cent : cent) / 100;
}
const contagem = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);
function normalizarResumo(r: Resumo): Resumo {
  const p = r.pedidos_bling, g = r.negocios_ganhos, f = r.funil_aberto;
  return { ...r,
    // 116: Pedidos/OS sem R$ — qualquer `valor` que ainda venha do serviço é DESCARTADO aqui (nunca chega à tela)
    pedidos_bling: (({ valor: _v, ...resto }) => ({ ...resto, quantidade: contagem(p.quantidade), por_dia: (p.por_dia ?? []).map((d) => ({ dia: d.dia, quantidade: contagem(d.quantidade) })) }))(p as PedidosBling & { valor?: unknown }),
    negocios_ganhos: { ...g, quantidade: contagem(g.quantidade), valor: dinheiro(g.valor), sem_valor: contagem(g.sem_valor) },
    funil_aberto: { ...f, quantidade: contagem(f.quantidade), valor: dinheiro(f.valor), sem_valor: contagem(f.sem_valor) } };
}
// caminhos com .php (rota sem .php exigiria bloco novo no nginx = portão; ajuste 1 aceito da ACIMA_DIREITA)
/** LEITURA ÚNICA (decisão do Jhony; serviço 74ea03ae/9c0f45b3 da ACIMA_ESQUERDA): cartões, prioridades, agenda e fontes da MESMA
 *  leitura — a linha de fontes nunca diverge dos cartões. As rotas separadas ficam só para compatibilidade (e a lista paginada). */
export interface Painel { leitura_em: string | null; periodo: Resumo['periodo']; resumo: Resumo; prioridades: Prioridades; agenda: Agenda; fontes: Fonte[] }
export const lerPainel = (p: PeriodoV2, s?: AbortSignal) => ler<Painel>(`/painel.php?periodo=${p}`, s)
  .then((x) => ({ ...x, resumo: normalizarResumo({ ...x.resumo, periodo: x.resumo?.periodo ?? x.periodo }) }));
export const lerResumo = (p: PeriodoV2, s?: AbortSignal) => ler<Resumo>(`/resumo.php?periodo=${p}`, s).then(normalizarResumo);
export const lerPrioridades = (s?: AbortSignal) => ler<Prioridades>('/prioridades.php', s);
export const lerAgenda = (s?: AbortSignal) => ler<Agenda>('/agenda.php', s);
export const lerFontes = (s?: AbortSignal) => ler<Fonte[]>('/fontes.php', s);
/** 25/11 noite (CIMA): estado das integrações — contrato da ACIMA_ESQUERDA (P22), nível ≥ 80, só leitura. */
export interface Integracao { id: string; nome: string; estado: 'ok' | 'atrasado' | 'com_problema' | 'aguardando' | 'sem_acesso' | 'nao_integrado'; ultima_sincronizacao: string | null; erro: string | null; proximo_passo: string | null }
export function lerIntegracoes(s?: AbortSignal) { return ler<{ gerado_em: string; integracoes: Integracao[] }>('/integracoes.php', s); }
/** 26/11 (CIMA): conciliação Asaas × Precifica — contrato da ACIMA_ESQUERDA (P31 c5451876). Dinheiro em TEXTO "1234.56" ou null. */
/** P38 (26/11, janela ±3 dias úteis): `restante` = sobra do dia depois do casamento; `conciliado_com` = os pares (dia, dias úteis, valor). */
export interface ConcPar { dia: string; dias_uteis: number; valor: string }
export interface ConcDia { dia: string; asaas: string | null; asaas_liquido: string | null; precifica: string | null; diferenca: string | null; divergente: boolean; motivo: string | null; restante?: string | null; conciliado_com?: ConcPar[] }
export interface ConcResumo { asaas: string | null; precifica: string | null; diferenca: string | null; itens_sem_par: number | null; conciliados_com_atraso: number | null }
export interface ConcEmpresa { conta: string; nome: string | null; empresa_precifica: string | null; estado: 'ok' | 'sem_par' | 'indisponivel'; motivo: string | null; dias: ConcDia[] | null; divergencias: number | null; resumo?: ConcResumo | null; ligacao_a_confirmar?: boolean }
export interface Conciliacao { gerado_em: string; janela: { de: string; ate: string }; tolerancia: string; estado: 'ok' | 'indisponivel'; motivo: string | null; precifica_em?: string | null; divergencias?: number | null; conciliados_com_atraso?: number | null; ligacoes_a_confirmar?: number | null; casamento?: { dias_uteis: number; por: string } | null; empresas: ConcEmpresa[] | null }
export function lerConciliacao(s?: AbortSignal) { return ler<Conciliacao>('/conciliacao-asaas.php?dias=30', s, 20000); }
/** 26/11 (CIMA): cartão do Asaas — contrato da ACIMA_ESQUERDA (P21, GET /api/geral/v2/asaas.php; GeralV2Asaas::cartao). Dinheiro em TEXTO.
 *  404 = flag global `geral_v2_asaas` desligada OU sem `financeiro_asaas_leitura` → o cartão NÃO aparece. Total só com TODAS as empresas ok. */
export interface AsaasValores { recebido_hoje: string; a_receber_7d: string; vencidas: string; vencidas_qtd: number }
export interface AsaasEmpresa { conta: string; nome: string | null; estado: 'ok' | 'desatualizado' | 'indisponivel'; motivo: string | null; atualizado_em: string | null; valores: AsaasValores | null }
export interface AsaasCartao { gerado_em: string; janela: { hoje: string; a_receber_ate: string }; empresas: AsaasEmpresa[]; total: AsaasValores | null; total_parcial: boolean; regras?: string }
export function lerAsaas(s?: AbortSignal) { return ler<AsaasCartao>('/asaas.php', s); }
/** Drill-down das vencidas (P34, GET /api/asaas/?r=vencidas; AsaasResumo::vencidas). `cliente` = código do cliente no Asaas (o serviço não manda nome). */
export interface VencidaAsaas { cobranca: string; cliente: string | null; vencimento: string | null; valor: string; dias_atraso: number | null; forma: string | null }
export interface VencidasConta { conta: string; nome: string | null; disponivel: boolean; motivo: string | null; atualizado_em: string | null; qtd: number | null; total: string | null; truncada: boolean | null; cobrancas: VencidaAsaas[] | null }
export interface VencidasAsaas { contas: VencidasConta[]; limite_por_empresa: number; gerado_em: string }
export function lerVencidasAsaas(s?: AbortSignal) { return ler<VencidasAsaas>('/api/asaas/?r=vencidas', s, 20000); }
export function lerLista(id: IdPrioridade, f: FiltrosLista, s?: AbortSignal) {
  const q = new URLSearchParams({ id, pagina: String(f.pagina), por_pagina: '50', ordem: f.ordem, dir: f.dir });
  if (f.responsavel !== null) q.set('responsavel', String(f.responsavel));
  return ler<Lista>(`/prioridades/lista.php?${q}`, s).then((l) => ({ ...l, itens: l.itens.map((i) => ({ ...i, valor: dinheiro(i.valor) })) }));
}

// ── formatação (pt-BR; null = "—", nunca 0) ─────────────────────────
export const fmtN = (v: number | null) => (v === null ? '—' : v.toLocaleString('pt-BR'));
export const fmtMoeda = (v: number | null) => (v === null ? '—' : v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }));
export function fmtMoedaCurta(v: number | null): string {
  if (v === null) return '—';
  if (Math.abs(v) >= 1e6) return `${(v / 1e6).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mi`;
  if (Math.abs(v) >= 1e3) return `${(v / 1e3).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} mil`;
  return v.toLocaleString('pt-BR', { maximumFractionDigits: 0 });
}
const FUSO = 'America/Sao_Paulo';
export const fmtHora = (iso: string) => new Date(iso).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', timeZone: FUSO });
export const fmtDiaMes = (iso: string) => new Date(iso.length === 10 ? `${iso}T12:00:00-03:00` : iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', timeZone: FUSO });
export const fmtData = (iso: string) => new Date(iso.length === 10 ? `${iso}T12:00:00-03:00` : iso).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: FUSO });
export function hojeExtenso(): string {
  const s = new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric', timeZone: FUSO });
  return s.charAt(0).toUpperCase() + s.slice(1);
}
/** "às 13:28" hoje; "21/11 às 17:40" em outro dia (Brasília) */
export function fmtQuando(iso: string): string {
  const d = new Date(iso);
  const dia = (x: Date) => x.toLocaleDateString('pt-BR', { timeZone: FUSO });
  return dia(d) === dia(new Date()) ? `às ${fmtHora(iso)}` : `${fmtDiaMes(iso)} às ${fmtHora(iso)}`;
}

// ── Cobranças vencidas · Asaas (26/11, contrato v1 do VINHO/ACIMA_ESQUERDA, PARA-STATUS 13:40) ──────────────────────────
// GET /api/asaas/?r=vencidas_resumo | vencidas_lista | vencida&id= · mesmo portão do Asaas (404 = sem acesso) · dinheiro em texto · null = "—".
export interface EmpresaCv { conta: string; rotulo: string }
export interface SemLeituraCv { empresa: EmpresaCv; motivo: string | null }
export interface SomaCv { valor: string | null; cobrancas: number | null }
export type FaixaCv = '1-30' | '31-90' | '91-180' | '180+';
export interface ResumoCv {
  gerado_em: string; empresa: EmpresaCv | null; completo: boolean; empresas_sem_leitura: SemLeituraCv[];
  total: { valor: string | null; cobrancas: number | null; clientes: number | null } | null;
  por_vencimento: { mes_atual: SomaCv | null; ultimos_30_dias: SomaCv | null; ultimos_3_meses: SomaCv | null } | null;
  faixas: { faixa: FaixaCv; valor: string | null; cobrancas: number | null }[] | null;
  maior: { id: string; empresa: EmpresaCv; cliente_nome: string | null; valor: string | null; dias_atraso: number | null } | null;
  /** opcional (pedido ao VINHO): as empresas que podem ser filtradas */
  empresas?: EmpresaCv[] | null;
}
export interface ItemCv {
  id: string; empresa: EmpresaCv; cliente_nome: string | null; vencimento: string | null;
  valor_original: string | null; valor_atualizado: string | null; juros_multa: string | null; dias_atraso: number | null;
  forma: { codigo: string | null; rotulo: string | null } | null;
  situacao: { status_asaas: string | null; negativacao: boolean | null; protesto: null; cobranca_externa: null } | null;
}
export interface ListaCv { total: number | null; pagina: number; por_pagina: number; completo: boolean; empresas_sem_leitura: SemLeituraCv[]; itens: ItemCv[] }
export interface DetalheCv extends ItemCv {
  cliente_codigo: string | null; descricao: string | null; numero_fatura: string | null; link_fatura: string | null; criada_em: string | null;
  vencimento_original: string | null; eventos: { data: string; evento: string }[] | null;
  outras_do_cliente: { cobrancas: number | null; valor: string | null; itens: { id: string; vencimento: string | null; valor_original: string | null; dias_atraso: number | null }[] } | null;
}
const qEmp = (empresa: string | null) => (empresa ? `&empresa=${encodeURIComponent(empresa)}` : '');
export function lerResumoCv(empresa: string | null, s?: AbortSignal) { return ler<ResumoCv>(`/api/asaas/?r=vencidas_resumo${qEmp(empresa)}`, s, 20000); }
/** A tela carrega até POR_PAGINA_CV linhas de uma vez (maiores primeiro) e ordena/filtra localmente em todas as colunas. */
export const POR_PAGINA_CV = 500;
export function lerListaCv(empresa: string | null, s?: AbortSignal) {
  return ler<ListaCv>(`/api/asaas/?r=vencidas_lista&ordem=valor&dir=desc&pagina=1&por_pagina=${POR_PAGINA_CV}${qEmp(empresa)}`, s, 20000);
}
export function lerDetalheCv(id: string, s?: AbortSignal) { return ler<DetalheCv>(`/api/asaas/?r=vencida&id=${encodeURIComponent(id)}`, s, 20000); }
