// panel-atributos/src/lib/integridade.ts — funções PURAS do hotfix de integridade (18/11): decisões de gravação concorrente das telas
// Unidades (DSHOW-071), Kits (DSHOW-064/065), Dicionário (DSHOW-070) e Vincular (ações opostas). Testes: scripts/atributos/testes/hotfix-puras.sh.

// ── DSHOW-071 · Unidades ─────────────────────────────────────────────────────────────────────────────────────────────────────
/** ✕, Esc e clique no fundo só fecham o editor quando NÃO há gravação em curso. */
export const decidirFechar = (salvando: boolean): boolean => !salvando;

/** Marca o início de UMA gravação; devolve false se já há outra em curso (Enter repetido, duplo clique). */
export function iniciarGravacao(ref: { current: boolean }): boolean {
  if (ref.current) return false;
  ref.current = true;
  return true;
}

export interface FotografiaUnidade { nome: string; grandeza: string | null; fator_base: string | null }
/** O que a tela viu ao abrir o editor (enviado como `antes`; o servidor compara com a linha travada). */
export const fotografiaUnidade = (u: { nome: string; grandeza: string | null; fator_base: string | null }): FotografiaUnidade =>
  ({ nome: u.nome, grandeza: u.grandeza ?? null, fator_base: u.fator_base ?? null });

// ── DSHOW-064 · Kits: rascunho de seção × base em que foi começado ───────────────────────────────────────────────────────────
/** Base de um rascunho: versão do kit e assinatura do que estava PERSISTIDO naquela seção quando o rascunho começou. */
export interface BaseSecao { versao: number; assinatura: string }
export interface AvancoBase { base: BaseSecao; reiniciar: boolean; mudou: boolean }
/**
 * Depois de ler o kit de novo: seção incluída na recarga → reinicia rascunho e base; seção não incluída → a base só avança de versão se
 * o persistido daquela seção continua igual (mudança só de nome/outra seção não é conflito); senão marca "mudou" e preserva o rascunho.
 */
export function avancarBase(base: BaseSecao, fresco: BaseSecao, incluida: boolean): AvancoBase {
  if (incluida) return { base: fresco, reiniciar: true, mudou: false };
  if (fresco.assinatura === base.assinatura) return { base: { versao: fresco.versao, assinatura: base.assinatura }, reiniciar: false, mudou: false };
  return { base, reiniciar: false, mudou: true };
}

export type DecisaoEnvio = { acao: 'enviar'; versao: number } | { acao: 'conflito'; motivo: 'pendente' | 'base_mudou' | 'persistido_mudou' };
/** Antes de gravar a seção, com o kit lido AGORA: persistido ≠ base → conflito local (não envia); senão envia com a versão fresca. */
export function decidirEnvio(base: BaseSecao, fresco: BaseSecao, estado: { pendente?: boolean; baseMudou?: boolean } = {}): DecisaoEnvio {
  if (estado.pendente) return { acao: 'conflito', motivo: 'pendente' };
  if (estado.baseMudou) return { acao: 'conflito', motivo: 'base_mudou' };
  if (fresco.assinatura !== base.assinatura) return { acao: 'conflito', motivo: 'persistido_mudou' };
  return { acao: 'enviar', versao: fresco.versao };
}

/** Assinatura do escopo do kit ("aplica a todos" + chaves categoria|subcategoria, sem ordem). */
export const assinaturaEscopo = (todos: boolean, chaves: Iterable<string>): string => JSON.stringify([todos ? 1 : 0, [...chaves].sort()]);

/** Recarga de itens preserva os itens NOVOS do rascunho que ainda não estão no persistido. */
export function manterNovos<T extends { atributo_id: number; novo?: boolean }>(frescos: T[], rascunho: T[]): T[] {
  const ids = new Set(frescos.map((i) => i.atributo_id));
  return [...frescos, ...rascunho.filter((i) => i.novo && !ids.has(i.atributo_id))];
}

// ── DSHOW-070 · Dicionário: renomear opção pelo rótulo ORIGINAL (o que estava na tela quando "Renomear" foi clicado) ───────────
export interface RascunhoRenomear { id: number; texto: string; original: string }
export type PrecondicaoRenomear = { acao: 'nada' } | { acao: 'enviar'; id: number; rotulo: string; rotulo_atual: string };
/** "Nada mudou" e `rotulo_atual` usam o original imutável do rascunho, nunca o rótulo da lista relida depois. */
export function precondicaoRenomear(r: RascunhoRenomear): PrecondicaoRenomear {
  const rotulo = r.texto.trim();
  if (!rotulo || rotulo === r.original) return { acao: 'nada' };
  return { acao: 'enviar', id: r.id, rotulo, rotulo_atual: r.original };
}

// ── Vincular · ações opostas: o mesmo kit (ou atributo) nunca fica nos dois lados ────────────────────────────────────────────
export interface Lados { a: number[]; b: number[] }
/**
 * Marca/desmarca `id` no lado escolhido ('a' = aplicar/incluir, 'b' = remover/excluir). Marcar num lado TIRA do oposto (trocou = true,
 * para a tela avisar "passou de Aplicar para Remover"); clicar de novo no mesmo lado desmarca.
 */
export function alternarLado(estado: Lados, id: number, lado: 'a' | 'b'): { estado: Lados; trocou: boolean } {
  const mesmo = lado === 'a' ? estado.a : estado.b;
  const oposto = lado === 'a' ? estado.b : estado.a;
  if (mesmo.includes(id)) {
    const novo = mesmo.filter((x) => x !== id);
    return { estado: lado === 'a' ? { a: novo, b: oposto } : { a: oposto, b: novo }, trocou: false };
  }
  const trocou = oposto.includes(id);
  const op = oposto.filter((x) => x !== id);
  return { estado: lado === 'a' ? { a: [...mesmo, id], b: op } : { a: op, b: [...mesmo, id] }, trocou };
}
