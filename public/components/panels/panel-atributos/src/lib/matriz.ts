// panel-atributos/src/lib/matriz.ts — funções PURAS da MATRIZ V2 do Vincular (ESQUERDA, 19/11; BRIEFING-MATRIZ-V2 do Jhony). Só apresentação:
// os dados e as regras de origem são os da vitrine (ProdutoResumo.kits[].motivos, do servidor). Testes: scripts/atributos/testes/vincular-puras.sh.
import type { ProdutoResumo } from './tipos';

/** Origens de vínculo que o servidor manda em kits[].motivos. "todos" = o kit vale para TODOS os produtos (nunca "desligado"). */
export type Origem = 'escopo' | 'direto' | 'todos';
/** Ordem VISUAL fixa dos marcadores (organiza a leitura; não é prioridade entre as origens). */
export const ORDEM_ORIGENS: readonly Origem[] = ['escopo', 'direto', 'todos'];
export const MARCADOR: Readonly<Record<Origem, { texto: string; titulo: string; classe: string }>> = {
  escopo: { texto: 'Subcat.', titulo: 'Pela subcategoria', classe: 'subcat' },
  direto: { texto: 'Direto', titulo: 'Vínculo direto', classe: 'direto' },
  todos: { texto: 'Todos', titulo: 'Todos os produtos', classe: 'todos' },
};

/** Origens da célula produto × kit, CUMULATIVAS e na ordem fixa. `outras` = motivo desconhecido (mostrado como veio; nada se perde). */
export function origensDaCelula(p: Pick<ProdutoResumo, 'kits'>, kitId: number): { origens: Origem[]; outras: string[] } {
  const k = p.kits.find((x) => x.id === kitId); if (!k) return { origens: [], outras: [] };
  const set = new Set(k.motivos);
  return { origens: ORDEM_ORIGENS.filter((o) => set.has(o)), outras: [...set].filter((m) => !(ORDEM_ORIGENS as readonly string[]).includes(m)) };
}
export const temVinculo = (p: Pick<ProdutoResumo, 'kits'>, kitId: number): boolean => p.kits.some((x) => x.id === kitId);
/** Texto de ajuda da célula (title): as origens por extenso, na ordem fixa. */
export function textoOrigens(p: Pick<ProdutoResumo, 'kits'>, kitId: number): string {
  const { origens, outras } = origensDaCelula(p, kitId);
  return [...origens.map((o) => MARCADOR[o].titulo), ...outras].join(' · ');
}

/** Produtos da matriz: ATIVOS, só os selecionados quando há seleção (como no ar), na subcategoria escolhida ('' = todas). SEM corte:
 *  o ar cortava em 80 e o briefing pede que a ordenação valha para o conjunto filtrado inteiro e que se chegue ao último produto. */
export function produtosDaMatriz(produtos: readonly ProdutoResumo[], sel: ReadonlySet<number>, sub: string): ProdutoResumo[] {
  return produtos.filter((p) => p.ativo && (sel.size ? sel.has(p.id) : true) && (!sub || (p.subcategoria ?? '') === sub)).sort((a, b) => a.id - b.id);
}

export type ChaveMatriz = 'produto' | `kit:${number}`;
export interface OrdemMatriz { chave: ChaveMatriz; direcao: 'asc' | 'desc' }
/** Começa por Produto ▲ (código numérico crescente), como no ar. */
export const ORDEM_INICIAL: OrdemMatriz = { chave: 'produto', direcao: 'asc' };
/** Produto: ID numérico (nunca o texto "27 · nome"). Kit: presença de vínculo (qualquer origem) — 'desc' = COM vínculo primeiro,
 *  'asc' = SEM vínculo primeiro —, desempate estável pelo ID crescente. Vale para o conjunto inteiro recebido (já filtrado). */
export function ordenarMatriz(prods: readonly ProdutoResumo[], o: OrdemMatriz): ProdutoResumo[] {
  const s = o.direcao === 'desc' ? -1 : 1;
  if (o.chave === 'produto') return [...prods].sort((a, b) => s * (a.id - b.id));
  const kid = Number(o.chave.slice(4));
  return [...prods].sort((a, b) => s * (Number(temVinculo(a, kid)) - Number(temVinculo(b, kid))) || a.id - b.id);
}
/** Clique no título: mesma coluna alterna; outra coluna começa em Produto ▲ ou, num kit, "com vínculo primeiro" (▼). */
export function proximaOrdem(atual: OrdemMatriz, chave: ChaveMatriz): OrdemMatriz {
  if (atual.chave === chave) return { chave, direcao: atual.direcao === 'asc' ? 'desc' : 'asc' };
  return { chave, direcao: chave === 'produto' ? 'asc' : 'desc' };
}
/** aria-sort do título. */
export const ariaSortMatriz = (atual: OrdemMatriz, chave: ChaveMatriz): 'ascending' | 'descending' | 'none' =>
  (atual.chave === chave ? (atual.direcao === 'asc' ? 'ascending' : 'descending') : 'none');
/** Nome acessível do botão de ordenar (diz o critério e o que o próximo clique faz). */
export function rotuloOrdenar(atual: OrdemMatriz, chave: ChaveMatriz, nomeKit?: string): string {
  const prox = proximaOrdem(atual, chave);
  if (chave === 'produto') return `Ordenar pelo código do produto, ${prox.direcao === 'asc' ? 'crescente' : 'decrescente'}`;
  return `Ordenar por vínculo com o kit ${nomeKit ?? ''}: ${prox.direcao === 'desc' ? 'com vínculo primeiro' : 'sem vínculo primeiro'}`.replace(/\s+:/, ':');
}

/** Largura da coluna de um kit: cabe o MAIOR conjunto de marcadores da coluna (e o título em até 2 linhas). Sem medir no DOM. */
export const LARGURA_MARCADOR: Readonly<Record<Origem, number>> = { escopo: 52, direto: 48, todos: 46 };   // marcador de 11 px (19/11)
export function larguraKit(prods: readonly Pick<ProdutoResumo, 'kits'>[], kitId: number): number {
  let maior = 0;
  for (const p of prods) { const { origens, outras } = origensDaCelula(p, kitId); const w = origens.reduce((s, o) => s + LARGURA_MARCADOR[o], 0) + outras.length * 50 + Math.max(0, origens.length + outras.length - 1) * 4; if (w > maior) maior = w; }
  return Math.max(104, maior + 2 * 18);   // 18 px de cada lado (espaço reservado para a seta sem deslocar o título)
}
