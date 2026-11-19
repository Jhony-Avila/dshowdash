// panel-atributos/src/lib/api.ts — cliente da API do módulo (/api/atributos). GET sem CSRF; POST com CSRF (padrão dos painéis do Dash:
// meta csrf-token / window.SecurityCSRF / /api/auth/check.php). Envelope do Dash: {ok, data, error: "<CÓDIGO>", meta?: {message, campos}}.
// `?r=` funciona em produção e na validação sem rota nova no nginx.

/** "FOI SALVO OU NÃO" (contrato da ESQUERDA, docs/atributos/CONTRATO-FOI-SALVO.md): desfecho de uma escrita. */
export type Desfecho = 'aplicada' | 'sem_mudanca' | 'recusada' | 'conflito' | 'em_andamento' | 'interrompida' | 'desconhecido';
/** Valor atual devolvido no conflito das rotas de valor (meta.atual). */
export interface ValorAtualConflito { versao: number | null; versao_conjunto?: string; valores: { estado: string; valor_texto: string | null; valor_num: string | null; valor_bool: number | boolean | null; valor_data: string | null; opcao_id: number | null; unidade_id: number | null; versao: number; excluido: boolean }[] }

export class ErroApi extends Error {
  constructor(public readonly http: number, public readonly codigo: string, mensagem: string, public readonly campos: string[] = [],
    public readonly extra: { desfecho?: Desfecho; motivos?: Record<string, string>; atual?: ValorAtualConflito; chave?: string | null; itens?: ItemLote[] } = {}) { super(mensagem); }
  get conflito() { return this.http === 409 && this.codigo !== 'VALUE_EXISTS' && this.codigo !== 'OPERATION_IN_PROGRESS'; }   // VALUE_EXISTS (D10) não é conflito de versão
  /** A requisição saiu, mas não sabemos se gravou (resposta perdida, corpo ilegível, 2xx sem recibo). NUNCA é "salvo" nem "não salvo". */
  get desconhecido() { return this.extra.desfecho === 'desconhecido'; }
  get emAndamento() { return this.extra.desfecho === 'em_andamento' || this.codigo === 'OPERATION_IN_PROGRESS'; }
  /** Lote parou no meio (503 OPERATION_INTERRUPTED): itens com desfecho estão gravados, os pendentes não; a MESMA chave retoma. */
  get interrompida() { return this.extra.desfecho === 'interrompida' || this.codigo === 'OPERATION_INTERRUPTED'; }
  /** Recusa comprovada pelo servidor (4xx com desfecho recusada, ou 4xx comum): nada foi gravado. */
  get recusada() { return !this.desconhecido && !this.conflito && !this.emAndamento && !this.interrompida && this.http >= 400 && this.http < 500; }
}
export const MSG_DESCONHECIDO = 'Não conseguimos confirmar se foi salvo.';

function csrfDoDom(): string {
  try {
    const g = (window as unknown as { SecurityCSRF?: { getToken?: () => string } }).SecurityCSRF;
    if (g?.getToken) { const t = g.getToken(); if (t) return t; }
  } catch { /* ignora */ }
  return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '';
}

let csrfCache = '';
async function csrf(): Promise<string> {
  const d = csrfDoDom();
  if (d) return d;
  if (csrfCache) return csrfCache;
  try {
    const r = await fetch('/api/auth/check.php', { credentials: 'same-origin', headers: { Accept: 'application/json' } });
    if (r.ok) csrfCache = (await r.json())?.data?.session?.csrf_token ?? '';
  } catch { /* o servidor recusa e a tela mostra o erro */ }
  return csrfCache;
}

const MENSAGENS: Record<number, string> = {
  401: 'Sua sessão expirou. Entre de novo.', 403: 'Seu nível não permite esta ação.', 404: 'Recurso não disponível para o seu usuário.',
  503: 'Catálogo de produtos indisponível no momento.',
};

type Corpo<T> = { ok?: boolean; data?: T; error?: string | null; meta?: { message?: string; campos?: string[]; desfecho?: Desfecho; motivos?: Record<string, string>; atual?: ValorAtualConflito; itens?: ItemLote[] } };

function erroDoCorpo(res: Response, corpo: Corpo<unknown>, chave: string | null = null): ErroApi {
  const msg = corpo.meta?.message || MENSAGENS[res.status] || `Falha (${res.status}).`;
  return new ErroApi(res.status, corpo.error || String(res.status), msg, corpo.meta?.campos ?? [],
    { desfecho: corpo.meta?.desfecho, motivos: corpo.meta?.motivos, atual: corpo.meta?.atual, chave, itens: corpo.meta?.itens });
}

async function tratar<T>(res: Response): Promise<T> {
  let corpo: Corpo<T> = {};
  try { corpo = await res.json(); } catch { /* corpo não-JSON */ }
  if (!res.ok || corpo.ok === false) throw erroDoCorpo(res, corpo);
  return corpo.data as T;
}

/** Recibo de uma escrita (contrato §3). */
export interface Recibo { operacao: string; chave: string | null; desfecho: 'aplicada' | 'sem_mudanca'; confirmado_em: string; versao_nova?: number | string | null; campos_gravados?: string[]; parcial?: boolean; [k: string]: unknown }
/** Escritas que, por contrato, NÃO trazem recibo (não gravam nada). */
const SEM_RECIBO = new Set(['massa_previa']);

/** P1 "foi salvo ou não": numa escrita, SÓ é sucesso o 2xx com corpo legível E recibo. 2xx ilegível/sem recibo e resposta perdida = desconhecido. */
async function tratarEscrita<T>(rota: string, res: Response, chave: string | null): Promise<T> {
  let corpo: Corpo<T> | null = null;
  try { corpo = await res.json(); } catch { corpo = null; }
  if (res.ok && corpo && corpo.ok !== false) {
    const d = corpo.data as (T & { recibo?: Recibo }) | undefined;
    if (SEM_RECIBO.has(rota) || (d && typeof d === 'object' && d.recibo && typeof d.recibo === 'object')) return d as T;
    throw new ErroApi(res.status, 'RESULTADO_DESCONHECIDO', MSG_DESCONHECIDO, [], { desfecho: 'desconhecido', chave });
  }
  if (res.ok) throw new ErroApi(res.status, 'RESULTADO_DESCONHECIDO', MSG_DESCONHECIDO, [], { desfecho: 'desconhecido', chave });   // 2xx com corpo ilegível
  if (!corpo) {   // 4xx/5xx com corpo ilegível: só uma recusa ESCRITA pelo servidor prova que não gravou → 5xx/proxy = desconhecido
    if (res.status >= 500 || res.status === 0) throw new ErroApi(res.status, 'RESULTADO_DESCONHECIDO', MSG_DESCONHECIDO, [], { desfecho: 'desconhecido', chave });
    throw new ErroApi(res.status, String(res.status), MENSAGENS[res.status] || `Falha (${res.status}).`, [], { desfecho: 'recusada', chave });
  }
  throw erroDoCorpo(res, corpo, chave);
}

export async function obter<T>(rota: string, params: Record<string, string | number> = {}, sinal?: AbortSignal): Promise<T> {
  const q = new URLSearchParams({ r: rota, ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])) }).toString();
  return tratar<T>(await fetch(`/api/atributos/index.php?${q}`, { credentials: 'same-origin', headers: { Accept: 'application/json' }, signal: sinal }));
}

/** Escrita. `chave` (opcional) = chave de operação (X-Chave-Operacao): uma por INTENÇÃO, reaproveitada no reenvio (idempotência, contrato §4). */
export async function enviar<T>(rota: string, corpo: unknown, opc: { chave?: string | null } = {}): Promise<T> {
  const token = await csrf();
  const chave = opc.chave ?? null;
  const headers: Record<string, string> = { Accept: 'application/json', 'Content-Type': 'application/json', 'X-CSRF-Token': token };
  if (chave) headers['X-Chave-Operacao'] = chave;
  let res: Response;
  try {
    res = await fetch(`/api/atributos/index.php?r=${encodeURIComponent(rota)}`, { method: 'POST', credentials: 'same-origin', headers, body: JSON.stringify(corpo) });
  } catch {
    // a requisição pode ter chegado ao servidor: resposta perdida ≠ "não salvo"
    throw new ErroApi(0, 'RESULTADO_DESCONHECIDO', MSG_DESCONHECIDO, [], { desfecho: 'desconhecido', chave });
  }
  return tratarEscrita<T>(rota, res, chave);
}

/** Conferir gravação (contrato §5): GET, não grava nada; só o titular da chave. */
export interface Conferencia { chave: string; resultado: 'aplicada' | 'sem_mudanca' | 'em_andamento' | 'interrompida' | 'nao_aplicada' | 'nao_encontrada'; operacao: string | null; recibo: Recibo | null; erro: { codigo: string; http: number; mensagem: string; campos?: string[] } | null; tentativas?: number;
  sinal?: string; reenvio_seguro?: boolean; itens?: ItemLote[]; itens_resumo?: Partial<Record<DesfechoItemLote, number>> }
export const conferirGravacao = (chave: string) => obter<Conferencia>('conferir_gravacao', { chave });

/** Chave de operação (8–64, [A-Za-z0-9_-]). */
export const novaChaveOperacao = () => `op-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;

/** URL da miniatura autenticada (A6). */
export const urlFoto = (id: number, lado: 480 | 1280 = 480) => `/api/atributos/index.php?r=foto&id=${id}&t=${lado}`;

/** Chave de idempotência das operações em massa. */
export const novaChave = () => `m${Date.now().toString(36)}${Math.random().toString(36).slice(2, 10)}`;

/* ── LOTE COM CHAVE (DSHOW-096; contrato §10-A/§10-B) ── `sugestoes_lote` com chave POR INTENÇÃO: gerada ao CONFIRMAR, com o corpo e os
   IDs CONGELADOS; a MESMA chave em qualquer reenvio (o servidor retoma só os pendentes, sem duplicar). Usado pelo Preencher (CIMA) e
   pela Conferência (DIREITA). Desfecho por item: aceita · falha (= rejeitada) · ignorada · pendente. */
export type DesfechoItemLote = 'aceita' | 'ignorada' | 'falha' | 'pendente';
export interface ItemLote { item: string; desfecho: DesfechoItemLote; detalhe?: Record<string, unknown> | null }
export interface ResultadoLote {
  aceitas: number; aceitas_ids?: number[]; ignoradas?: { id: number; motivo: string; estado?: string }[];
  falhas?: { id: number; codigo?: string; erro: string; campos?: string[] }[]; pedidas?: number; desfecho?: string; recibo: Recibo;
}
export interface IntencaoLote { readonly chave: string; readonly ids: readonly number[]; readonly corpo: Readonly<{ ids: readonly number[]; confirmar: true }> }
/** Cria a intenção NO MOMENTO DA CONFIRMAÇÃO: IDs sem repetição, na ordem; corpo e lista congelados (nada que a tela mude depois entra no reenvio). */
export function novaIntencaoLote(ids: readonly number[]): IntencaoLote {
  const lista = Object.freeze([...new Set(ids.map(Number))]);
  return Object.freeze({ chave: novaChaveOperacao(), ids: lista, corpo: Object.freeze({ ids: lista, confirmar: true as const }) });
}
/** Envia (ou REENVIA) a intenção: sempre o mesmo corpo e a mesma chave. */
export const enviarLoteSugestoes = (i: IntencaoLote) => enviar<ResultadoLote>('sugestoes_lote', i.corpo, { chave: i.chave });
export interface ResumoLote { aceitas: number[]; rejeitadas: { id: number; motivo: string }[]; ignoradas: { id: number; motivo: string }[]; pendentes: number[] }
const vazio = (): ResumoLote => ({ aceitas: [], rejeitadas: [], ignoradas: [], pendentes: [] });
function deItens(itens: ItemLote[], ids: readonly number[]): ResumoLote {
  const r = vazio(); const vistos = new Set<number>();
  for (const it of itens) {
    const id = Number(it.item); vistos.add(id); const d = it.detalhe ?? {};
    const motivo = String((d as Record<string, unknown>).erro ?? (d as Record<string, unknown>).motivo ?? (d as Record<string, unknown>).codigo ?? '');
    if (it.desfecho === 'aceita') r.aceitas.push(id); else if (it.desfecho === 'falha') r.rejeitadas.push({ id, motivo });
    else if (it.desfecho === 'ignorada') r.ignoradas.push({ id, motivo }); else r.pendentes.push(id);
  }
  for (const id of ids) if (!vistos.has(id)) r.pendentes.push(id);   // item sem registro = não sabemos: conta como pendente
  return r;
}
function deResultado(x: Partial<ResultadoLote>): ResumoLote {
  return { aceitas: [...(x.aceitas_ids ?? [])], rejeitadas: (x.falhas ?? []).map((f) => ({ id: f.id, motivo: f.erro || f.codigo || '' })),
    ignoradas: (x.ignoradas ?? []).map((g) => ({ id: g.id, motivo: g.motivo === 'ja_decidida' ? `já decidida${g.estado ? ` (${g.estado})` : ''}` : g.motivo === 'nao_encontrada' ? 'não encontrada' : g.motivo })), pendentes: [] };
}
/** Resumo por item a partir da resposta com recibo. */
export const resumoDoLote = (r: ResultadoLote): ResumoLote => deResultado(r);
/** Resumo por item a partir de um erro (interrompida traz meta.itens); sem itens → null (não sabemos). */
export const resumoDoErroLote = (e: ErroApi, ids: readonly number[]): ResumoLote | null => (e.extra.itens?.length ? deItens(e.extra.itens, ids) : null);
/** Resumo por item a partir do Conferir gravação: itens por desfecho; concluída sem itens → pelo recibo; nada → null. */
export function resumoDaConferencia(c: Conferencia, ids: readonly number[]): ResumoLote | null {
  if (c.itens?.length) return deItens(c.itens, ids);
  if (c.recibo && (c.resultado === 'aplicada' || c.resultado === 'sem_mudanca')) return deResultado(c.recibo as unknown as Partial<ResultadoLote>);
  return null;
}
