// v2/servico.ts — Geral V2 · Lançamento (CIMA, 23/11/2026): leitura dos blocos pelo CONTRATO proposto à ACIMA_DIREITA
// (PARA-STATUS compartilhado, "GERAL V2 — PROPOSTA DE CONTRATO"). A tela só LÊ; o serviço é da ACIMA_DIREITA.
// Regra da casa: valor desconhecido = null (nunca 0); cada bloco carrega e falha sozinho (um endpoint por bloco).

export type EstadoBloco = 'ok' | 'zero' | 'parcial' | 'desatualizado' | 'aguardando' | 'erro';
export type PeriodoV2 = 'ontem' | '7d' | 'mes';

export interface Periodo { id: PeriodoV2; de: string; ate: string; rotulo: string }
interface Base { estado: EstadoBloco; ultimo_sucesso: string | null; motivo: string | null }
export interface PedidosBling extends Base { quantidade: number | null; valor: number | null; por_dia: { dia: string; quantidade: number | null; valor: number | null }[]; inclui_canceladas: boolean }
export interface NegociosGanhos extends Base { quantidade: number | null; valor: number | null; sem_valor: number | null }
export interface FunilAberto extends Base { quantidade: number | null; valor: number | null; sem_valor: number | null }
export interface Resumo { periodo: Periodo; pedidos_bling: PedidosBling; negocios_ganhos: NegociosGanhos; funil_aberto: FunilAberto }

export type IdPrioridade = 'atividade_vencida' | 'sem_proxima_atividade' | 'conflito_agenda';
export interface Prioridade extends Base { id: IdPrioridade; quantidade: number | null; gravidade: 1 | 2 | 3; desde: string | null; responsaveis: number | null; detalhe: string | null }
export interface Prioridades { gerado_em: string | null; itens: Prioridade[] }

export interface ItemLista { deal_id: number; titulo: string; organizacao: string | null; responsavel: string | null; etapa: string | null; prazo: string | null; valor: number | null; url_pipedrive: string | null }
export interface Lista { id: IdPrioridade; total: number; pagina: number; por_pagina: number; criterios: { texto: string }; responsaveis: { id: number; nome: string }[]; itens: ItemLista[] }
export type OrdemLista = 'prazo' | 'valor' | 'responsavel';
export interface FiltrosLista { pagina: number; ordem: OrdemLista; dir: 'asc' | 'desc'; responsavel: number | null }

export interface Compromisso { inicio: string; fim: string | null; titulo: string; duracao_min: number | null; url_evento: string | null; conflito: boolean }
export interface Agenda extends Base { itens: Compromisso[]; url_agenda: string | null }

export type IdFonte = 'pipedrive' | 'bling' | 'calendar' | 'asaas' | 'mercadolivre' | 'lojaintegrada';
export interface Fonte { fonte: IdFonte; estado: 'conectada' | 'desatualizada' | 'problema' | 'aguardando'; ultimo_sucesso: string | null; motivo: string | null }

export class ErroV2 extends Error { constructor(public http: number, msg: string) { super(msg); } get semAcesso() { return this.http === 401 || this.http === 403; } }

const BASE = '/api/geral/v2';
async function ler<T>(caminho: string, sinal?: AbortSignal, timeoutMs = 12000): Promise<T> {
  const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), timeoutMs);
  sinal?.addEventListener('abort', () => ctrl.abort());
  try {
    const r = await fetch(BASE + caminho, { credentials: 'same-origin', headers: { Accept: 'application/json' }, signal: ctrl.signal });
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
    pedidos_bling: { ...p, quantidade: contagem(p.quantidade), valor: dinheiro(p.valor), por_dia: (p.por_dia ?? []).map((d) => ({ dia: d.dia, quantidade: contagem(d.quantidade), valor: dinheiro(d.valor) })) },
    negocios_ganhos: { ...g, quantidade: contagem(g.quantidade), valor: dinheiro(g.valor), sem_valor: contagem(g.sem_valor) },
    funil_aberto: { ...f, quantidade: contagem(f.quantidade), valor: dinheiro(f.valor), sem_valor: contagem(f.sem_valor) } };
}
// caminhos com .php (rota sem .php exigiria bloco novo no nginx = portão; ajuste 1 aceito da ACIMA_DIREITA)
export const lerResumo = (p: PeriodoV2, s?: AbortSignal) => ler<Resumo>(`/resumo.php?periodo=${p}`, s).then(normalizarResumo);
export const lerPrioridades = (s?: AbortSignal) => ler<Prioridades>('/prioridades.php', s);
export const lerAgenda = (s?: AbortSignal) => ler<Agenda>('/agenda.php', s);
export const lerFontes = (s?: AbortSignal) => ler<Fonte[]>('/fontes.php', s);
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
