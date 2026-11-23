// CONFERÊNCIA V2 (ESQUERDA, 23/11 — exceção de posse do Jhony) — lógica PURA das filas, sem React: tipos do contrato da Parte C
// (PARA-STATUS §94), "Atual", situação de cada linha, quem pode entrar em cada ação da seleção e a leitura do resultado do lote.
// Regras (BRIEFING-PRODUTOS-E-FILAS §C.3): aceitar nunca sobrescreve; "Recusada" só para recusa de verdade; resposta perdida = "A conferir"
// (sem reenvio); contadores só mudam com resultado confirmado; seleção e lote só com a PÁGINA exibida (≤ 50).
import { decimal } from '../../lib/formatar';

export const POR_PAGINA = 50;   // Q-SUG.4
export type FilaId = 'legado' | 'nome' | 'fora_da_ficha' | 'obrigatorios_vazios' | 'sem_kit';
export type EstadoSugestao = 'pendente' | 'ignorada' | 'recusada' | 'aceita';
export type Acao = 'aceitar' | 'recusar' | 'ignorar' | 'devolver' | 'reabrir';

export interface Atual { estado: 'vazio' | 'informado' | 'nao_se_aplica' | 'desconhecido'; texto?: string | null; numero?: string | null; booleano?: boolean | null;
  data?: string | null; opcoes?: string[]; unidade_id?: number | null; unidade?: string | null; versao?: number }
export interface ItemFila {
  id: number; product_id: number; produto: string; atributo_id: number; atributo: string | null; tipo_atributo?: string | null;
  atributo_alternativo_id: number | null; atributo_alternativo: string | null; fonte: string; tipo: string;
  valor_proposto: string | null; unidade: string | null; confianca: string; evidencia: string | null; versao: number;
  estado: EstadoSugestao; decidido_por: string | null; decidido_em: string | null; motivo: string | null; substitui_id: number | null;
  destino_atual: Atual; alternativo_atual: Atual | null; aceite_bloqueado: null | 'COM_VALOR' | 'ATRIBUTO_INATIVO' | 'FORA_DA_FICHA' | 'SEM_PERMISSAO';
  a_conferir: { chave: string } | null;
}
export interface RespFila<T> { fila: FilaId; estado?: EstadoSugestao; itens: T[]; total: number; proximo_cursor: string | null; por_pagina: number; gerado_em: string }

/** Desfecho de UM item (servidor) + o que só a tela conhece ("não enviada", "a conferir" por resposta perdida). */
export type DesfechoItem = 'aplicada' | 'nao_aplicada' | 'pendente' | 'nao_enviada' | 'a_conferir';
export interface ResultadoItem { id: number; desfecho: DesfechoItem; motivo?: string | null; detalhe?: string | null; mensagem?: string | null; estado_atual?: string | null }

const num = (v: string | null | undefined) => (v != null && /^-?\d+(\.\d+)?$/.test(v) ? decimal(v) : v ?? '');

/** "Atual" da linha (o mesmo conteúdo do valor da Ficha, em texto curto). */
export function textoAtual(a: Atual | null | undefined): string {
  if (!a || a.estado === 'vazio') return 'Sem valor';
  if (a.estado === 'nao_se_aplica') return 'Não se aplica';
  if (a.estado === 'desconhecido') return 'Desconhecido';
  let v = '';
  if (a.numero != null) v = num(a.numero);
  else if (a.opcoes && a.opcoes.length) v = a.opcoes.join(', ');
  else if (a.booleano != null) v = a.booleano ? 'Sim' : 'Não';
  else if (a.data) v = a.data;
  else v = a.texto ?? '';
  return `${v}${a.unidade ? ` ${a.unidade}` : ''}`.trim() || 'Informado';
}

/** "Sugerido" da linha. */
export const textoSugerido = (it: Pick<ItemFila, 'valor_proposto' | 'unidade'>) => `${num(it.valor_proposto) || '—'}${it.unidade ? ` ${it.unidade}` : ''}`;

export type Situacao = { rotulo: string; tom: 'pendente' | 'aviso' | 'ativa' | 'neutro' | 'erro'; dica?: string };
/** Q-CONF.1 (Jhony, 23/11): texto da pílula "Fora da ficha" (mouse e foco). */
export const DICA_FORA_DA_FICHA = 'Este atributo não está na ficha do produto. Vincule na fila Fora da ficha.';
/** Pílula de situação: primeiro o desfecho recém-confirmado nesta tela, depois o "a conferir" do servidor, depois o estado da linha. */
export function situacao(it: ItemFila, ultimo: ResultadoItem | undefined): Situacao {
  if (ultimo) {
    if (ultimo.desfecho === 'aplicada') return { rotulo: ({ aceita: 'Aceita', recusada: 'Recusada', ignorada: 'Ignorada', pendente: 'De volta à fila' } as Record<string, string>)[ultimo.estado_atual ?? ''] ?? 'Feito', tom: 'ativa' };
    if (ultimo.desfecho === 'nao_aplicada') return { rotulo: 'Não aplicada', tom: 'erro' };
    if (ultimo.desfecho === 'pendente' || ultimo.desfecho === 'a_conferir') return { rotulo: 'A conferir', tom: 'aviso' };
  }
  if (it.a_conferir) return { rotulo: 'A conferir', tom: 'aviso' };
  if (it.estado === 'ignorada') return { rotulo: 'Ignorada', tom: 'neutro' };
  if (it.estado === 'recusada') return { rotulo: 'Recusada', tom: 'neutro' };
  if (it.estado === 'aceita') return { rotulo: 'Aceita', tom: 'ativa' };
  if (it.aceite_bloqueado === 'COM_VALOR') return { rotulo: 'Com valor', tom: 'aviso' };
  if (it.aceite_bloqueado === 'FORA_DA_FICHA') return { rotulo: 'Fora da ficha', tom: 'neutro', dica: DICA_FORA_DA_FICHA };   // Q-CONF.1: só na tela, do que o endpoint já devolve
  return { rotulo: 'Pendente', tom: 'pendente' };
}

/** A linha está "a conferir" (servidor ou resposta perdida aqui): só "Conferir gravação" e "Detalhes"; nenhuma outra ação. */
export const aConferir = (it: ItemFila, ultimo?: ResultadoItem) => !!it.a_conferir || ultimo?.desfecho === 'a_conferir' || ultimo?.desfecho === 'pendente';
/** Já decidida NESTA tela (confirmada): a linha fica visível até "Ocultar concluídas", sem ações. */
export const concluida = (ultimo?: ResultadoItem) => ultimo?.desfecho === 'aplicada';

/** Quem da seleção pode entrar em cada ação (o resto vira "não enviada", com o motivo). */
export function elegiveis(acao: Acao, selecionados: readonly ItemFila[], ultimos: Readonly<Record<number, ResultadoItem>>): { vao: ItemFila[]; fora: { it: ItemFila; motivo: string }[] } {
  const vao: ItemFila[] = []; const fora: { it: ItemFila; motivo: string }[] = [];
  const origem: Record<Acao, EstadoSugestao> = { aceitar: 'pendente', recusar: 'pendente', ignorar: 'pendente', devolver: 'ignorada', reabrir: 'recusada' };
  for (const it of selecionados) {
    const u = ultimos[it.id];
    if (aConferir(it, u)) { fora.push({ it, motivo: 'a conferir' }); continue; }
    if (concluida(u)) { fora.push({ it, motivo: 'já decidida' }); continue; }
    if (it.estado !== origem[acao]) { fora.push({ it, motivo: 'situação diferente' }); continue; }
    if (acao === 'aceitar' && it.aceite_bloqueado) { fora.push({ it, motivo: ({ COM_VALOR: 'com valor', ATRIBUTO_INATIVO: 'atributo inativo', FORA_DA_FICHA: 'fora da ficha' } as Record<string, string>)[it.aceite_bloqueado] ?? 'sem permissão' }); continue; }
    vao.push(it);
  }
  return { vao, fora };
}

/** "1 com valor e 1 a conferir" — o escopo da confirmação, em português simples. */
export function textoFora(fora: readonly { motivo: string }[]): string {
  const n: Record<string, number> = {};
  for (const f of fora) n[f.motivo] = (n[f.motivo] ?? 0) + 1;
  const partes = Object.entries(n).map(([m, q]) => `${q} ${m}`);
  return partes.length <= 1 ? partes.join('') : `${partes.slice(0, -1).join(', ')} e ${partes[partes.length - 1]}`;
}

/** Motivo legível de "não aplicada" (nunca "recusada" para conflito/erro técnico — C.3). */
export function motivoLegivel(r: Pick<ResultadoItem, 'motivo' | 'detalhe' | 'mensagem'>): string {
  switch (r.motivo) {
    case 'VALUE_EXISTS': return 'O campo já tem valor: a sugestão não sobrescreve. Revise na ficha.';
    case 'CONFLICT': return r.detalhe === 'pendente_existente' ? 'Já existe uma sugestão mais nova em aberto para este campo.'
      : r.detalhe === 'tem_sucessora' ? 'Já existe uma sugestão mais nova para este campo.' : 'A sugestão mudou ou já foi decidida. Recarregue.';
    case 'NOT_FOUND': return 'A sugestão não existe mais.';
    case 'ATTRIBUTE_NOT_APPLICABLE': return 'O atributo não faz parte da ficha deste produto. Vincule-o antes (aba Fora da ficha ou Vincular).';
    case 'INSUFFICIENT_LEVEL': case 'NOT_CATALOG_ADMIN': return 'Seu perfil não permite esta ação.';
    case 'erro_tecnico': return 'Erro técnico momentâneo; nada foi gravado neste item.';
    default: return r.mensagem ?? 'Não aplicada.';
  }
}

export interface ItemServidor { id: number; desfecho: string; motivo?: string | null; detalhe?: string | null; mensagem?: string | null; estado_atual?: string | null }
/** Resposta (ou meta do 503) do sugestoes_decidir → resultado por item. Itens que a tela não mandou viram "não enviada". */
export function resultadoDoLote(itensServidor: readonly ItemServidor[] | undefined, enviados: readonly number[], naoEnviados: readonly number[]): Record<number, ResultadoItem> {
  const out: Record<number, ResultadoItem> = {};
  const porId = new Map((itensServidor ?? []).map((x) => [Number(x.id), x]));
  for (const id of enviados) {
    const x = porId.get(id);
    out[id] = x ? { id, desfecho: (['aplicada', 'nao_aplicada', 'pendente'].includes(x.desfecho) ? x.desfecho : 'a_conferir') as DesfechoItem,
      motivo: x.motivo ?? null, detalhe: x.detalhe ?? null, mensagem: x.mensagem ?? null, estado_atual: x.estado_atual ?? null } : { id, desfecho: 'a_conferir' };
  }
  for (const id of naoEnviados) out[id] = { id, desfecho: 'nao_enviada' };
  return out;
}

/** Itens do conferir_gravacao ({item, desfecho, detalhe}) → o mesmo formato. */
export function resultadoDaConferencia(itens: readonly { item: string; desfecho: string; detalhe?: Record<string, unknown> | null }[] | undefined, enviados: readonly number[]): Record<number, ResultadoItem> {
  const srv: ItemServidor[] = (itens ?? []).map((i) => ({ id: Number(i.item), desfecho: i.desfecho, motivo: (i.detalhe?.motivo as string) ?? null, detalhe: (i.detalhe?.detalhe as string) ?? null,
    mensagem: (i.detalhe?.mensagem as string) ?? null, estado_atual: (i.detalhe?.estado_atual as string) ?? null }));
  return resultadoDoLote(srv, enviados, []);
}

/** Contagem do lote. `ids` = só os itens DESTE lote (resultados de lotes anteriores não entram na faixa). */
export function contar(r: Readonly<Record<number, ResultadoItem>>, ids?: readonly number[]) {
  const c = { aplicadas: 0, nao_aplicadas: 0, a_conferir: 0, nao_enviadas: 0 };
  for (const x of ids ? ids.map((id) => r[id]).filter((v): v is ResultadoItem => !!v) : Object.values(r)) {
    if (x.desfecho === 'aplicada') c.aplicadas++; else if (x.desfecho === 'nao_aplicada') c.nao_aplicadas++;
    else if (x.desfecho === 'nao_enviada') c.nao_enviadas++; else c.a_conferir++;
  }
  return c;
}

/** Paginação por cursor: a pilha guarda o cursor de cada página já visitada (Anterior = voltar na pilha; nunca OFFSET). */
export interface Paginas { cursores: (string | null)[]; indice: number }
export const PAGINAS0: Paginas = { cursores: [null], indice: 0 };
export const proxima = (p: Paginas, cursor: string | null): Paginas => (cursor ? { cursores: [...p.cursores.slice(0, p.indice + 1), cursor], indice: p.indice + 1 } : p);
export const anterior = (p: Paginas): Paginas => (p.indice > 0 ? { ...p, indice: p.indice - 1 } : p);
export const faixa = (p: Paginas, n: number, total: number) => (total === 0 || n === 0 ? `0 de ${total.toLocaleString('pt-BR')}`
  : `${(p.indice * POR_PAGINA + 1).toLocaleString('pt-BR')}–${(p.indice * POR_PAGINA + n).toLocaleString('pt-BR')} de ${total.toLocaleString('pt-BR')}`);
export const paginasTotais = (total: number) => Math.max(1, Math.ceil(total / POR_PAGINA));
