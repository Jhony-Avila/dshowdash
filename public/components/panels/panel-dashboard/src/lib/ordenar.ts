// panel-atributos/src/lib/ordenar.ts — ordenação pura das tabelas do módulo (TabelaDados).
// Regras: número ordena como número; texto com localeCompare pt-BR (sensitivity 'base', numeric true); vazios
// (null, undefined, '' ou só espaços, número inválido) SEMPRE no fim, nos dois sentidos; ordenação ESTÁVEL (empate
// mantém a ordem de entrada, também no sentido decrescente); comparador opcional por coluna (só recebe valores não vazios).

export type Direcao = 'asc' | 'desc';
export type TipoColuna = 'texto' | 'numero';
export interface Ordenacao { chave: string; direcao: Direcao }

/** Comparador de texto do módulo (equivale a a.localeCompare(b, 'pt-BR', { sensitivity: 'base', numeric: true })). */
const COLADOR = new Intl.Collator('pt-BR', { sensitivity: 'base', numeric: true });
export const compararTexto = (a: unknown, b: unknown): number => COLADOR.compare(String(a), String(b));
export const compararNumero = (a: unknown, b: unknown): number => Number(a) - Number(b);

/** Vazio = null, undefined, texto vazio (ou só espaços) e, em coluna numérica, valor que não vira número finito. */
export function ehVazio(v: unknown, tipo: TipoColuna = 'texto'): boolean {
  if (v === null || v === undefined) return true;
  if (typeof v === 'string' && v.trim() === '') return true;
  if (tipo === 'numero') return !Number.isFinite(Number(v));
  return false;
}

/** Comparador pela posição numa lista lógica (ex.: importância Obrigatório → Opcional). Valores fora da lista vão depois dos conhecidos. */
export function comparadorPorLista(lista: readonly unknown[]): (a: unknown, b: unknown) => number {
  const pos = (v: unknown) => { const i = lista.indexOf(v); return i < 0 ? lista.length : i; };
  return (a, b) => pos(a) - pos(b);
}

export interface EspecOrdenacao<T> {
  /** Valor da célula usado na ordenação. */
  valor: (linha: T) => unknown;
  tipo: TipoColuna;
  /** Compara dois valores NÃO vazios (crescente). Sem ele: número como número, texto por localeCompare pt-BR. */
  comparador?: (a: any, b: any) => number;
}

/** Devolve uma CÓPIA ordenada (a entrada não muda). */
export function ordenarLinhas<T>(linhas: readonly T[], espec: EspecOrdenacao<T>, direcao: Direcao): T[] {
  const cmp = espec.comparador ?? (espec.tipo === 'numero' ? compararNumero : compararTexto);
  const sinal = direcao === 'desc' ? -1 : 1;
  const decorado = linhas.map((linha, i) => { const v = espec.valor(linha); return { linha, i, v, vazio: ehVazio(v, espec.tipo) }; });
  decorado.sort((x, y) => {
    if (x.vazio !== y.vazio) return x.vazio ? 1 : -1;          // vazios no fim, nos dois sentidos
    if (!x.vazio) { const r = cmp(x.v, y.v); if (r !== 0 && !Number.isNaN(r)) return sinal * r; }
    return x.i - y.i;                                           // estável: empate mantém a ordem de entrada
  });
  return decorado.map((d) => d.linha);
}

/** Clique no título: outra coluna → crescente; mesma coluna → alterna crescente ↔ decrescente. */
export function alternarOrdenacao(atual: Ordenacao | null, chave: string): Ordenacao {
  if (atual && atual.chave === chave) return { chave, direcao: atual.direcao === 'asc' ? 'desc' : 'asc' };
  return { chave, direcao: 'asc' };
}

/** Valor de aria-sort do título da coluna. */
export function ariaSort(atual: Ordenacao | null, chave: string): 'ascending' | 'descending' | 'none' {
  if (!atual || atual.chave !== chave) return 'none';
  return atual.direcao === 'asc' ? 'ascending' : 'descending';
}

// ── Grupos de linhas (TabelaDados com `grupos`) ───────────────────────────────────────────────────────────────────────────
export interface DefGrupo { chave: string; titulo: string }
export interface GrupoLinhas<T> { chave: string; titulo: string; linhas: T[] }
/** Chave do grupo automático para linhas cujo grupo não está na lista dada. */
export const GRUPO_OUTROS = '__outros';

/**
 * Agrupa e ordena: os grupos ficam NA ORDEM DADA (a coluna nunca reordena grupos); a ordenação (estável, vazios no fim) vale
 * DENTRO de cada grupo. Linha com grupo fora da lista vai para um grupo final "Outros" (só se existir). Grupo sem linhas
 * some, a menos que mostrarVazios.
 */
export function agruparOrdenado<T>(linhas: readonly T[], grupos: readonly DefGrupo[], grupoDaLinha: (l: T) => string | null | undefined,
  espec: EspecOrdenacao<T> | null, direcao: Direcao, mostrarVazios = false): GrupoLinhas<T>[] {
  const conhecidos = new Set(grupos.map((g) => g.chave));
  const por = new Map<string, T[]>();
  for (const l of linhas) { const g = grupoDaLinha(l); const k = g != null && conhecidos.has(g) ? g : GRUPO_OUTROS; (por.get(k) ?? por.set(k, []).get(k)!).push(l); }
  const todos: DefGrupo[] = [...grupos, { chave: GRUPO_OUTROS, titulo: 'Outros' }];
  return todos
    .map((g) => { const ls = por.get(g.chave) ?? []; return { chave: g.chave, titulo: g.titulo, linhas: espec ? ordenarLinhas(ls, espec, direcao) : ls }; })
    .filter((g) => g.linhas.length > 0 || (mostrarVazios && g.chave !== GRUPO_OUTROS));
}

/**
 * Ordem CONGELADA (célula em edição): mantém a posição de cada linha como estava em `anterior` (por chave estável), usando os
 * objetos ATUAIS (valores novos). Linha nova entra no fim do seu grupo atual; linha que sumiu sai; grupo novo vai para o fim.
 */
export function manterOrdem<T>(anterior: readonly GrupoLinhas<T>[], atual: readonly GrupoLinhas<T>[], chave: (l: T) => unknown): GrupoLinhas<T>[] {
  const atualPorChave = new Map<unknown, T>();
  for (const g of atual) for (const l of g.linhas) atualPorChave.set(chave(l), l);
  const usadas = new Set<unknown>();
  const saida: GrupoLinhas<T>[] = anterior.map((g) => {
    const ls: T[] = [];
    for (const l of g.linhas) { const k = chave(l); const v = atualPorChave.get(k); if (v !== undefined && !usadas.has(k)) { ls.push(v); usadas.add(k); } }
    return { chave: g.chave, titulo: g.titulo, linhas: ls };
  });
  for (const g of atual) {
    const novas = g.linhas.filter((l) => !usadas.has(chave(l)));
    if (!novas.length) continue;
    const alvo = saida.find((s) => s.chave === g.chave);
    if (alvo) alvo.linhas.push(...novas); else saida.push({ chave: g.chave, titulo: g.titulo, linhas: [...novas] });
  }
  const titulos = new Map(atual.map((g) => [g.chave, g.titulo]));
  return saida.filter((g) => g.linhas.length > 0 || atual.some((a) => a.chave === g.chave)).map((g) => ({ ...g, titulo: titulos.get(g.chave) ?? g.titulo }));
}
