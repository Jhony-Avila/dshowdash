// panel-atributos/src/lib/kits.ts — KITS V2 (ESQUERDA, 19/11; BRIEFING-QUATRO-TELAS parte A + MOCKUP-KITS-LISTA / MOCKUP-KIT-DETALHE).
// Funções PURAS da lista e do detalhe: resumo do escopo numa linha, colunas opcionais, agrupamento, composição (mover/ponta), unidade e
// importância herdadas ("Padrão (mês)" — nunca vira sobrescrita), origens do alcance (mesma legenda da Matriz) e a situação de uma gravação
// pelo contrato "foi salvo". Nenhuma métrica nova: tudo vem de GET kits / GET kit (KitsService/ProdutosLeitura servidos).
import type { ItemKit, KitResumo } from './tipos';
import { rotuloCategoria, rotuloSubcategoria } from './rotulos';

export interface Escopo { categoria: string; subcategoria: string; produtos?: number }

/** Rótulo de UM escopo salvo. Categoria inteira ('' na subcategoria) = o nome da categoria. */
export const rotuloEscopoCurto = (e: Escopo) => (e.subcategoria === '' ? rotuloCategoria(e.categoria) : rotuloSubcategoria(e.subcategoria));
/** Rótulo completo (lista acessível): diz quando é a categoria inteira. */
export const rotuloEscopoCompleto = (e: Escopo) => (e.subcategoria === '' ? `${rotuloCategoria(e.categoria)} (categoria inteira)` : rotuloSubcategoria(e.subcategoria));

/** Ordem estável dos escopos: categoria inteira primeiro, depois subcategorias, alfabético pt-BR. */
export function ordenarEscopos<T extends Escopo>(l: readonly T[]): T[] {
  return [...l].sort((a, b) => (a.subcategoria === '' ? 0 : 1) - (b.subcategoria === '' ? 0 : 1)
    || rotuloEscopoCurto(a).localeCompare(rotuloEscopoCurto(b), 'pt-BR', { sensitivity: 'base' }));
}

/**
 * Escopo resumido NUMA linha (mockup): até 2 itens = "A; B"; mais de 2 = "A +N". Vazio = "—". O completo fica acessível (title + popover):
 * nada é apagado, a abrangência salva não muda.
 */
export function resumoEscopo(escopos: readonly Escopo[]): { curto: string; extras: number; completo: string[]; vazio: boolean } {
  const l = ordenarEscopos(escopos);
  if (l.length === 0) return { curto: '—', extras: 0, completo: [], vazio: true };
  const completo = l.map(rotuloEscopoCompleto);
  if (l.length <= 2) return { curto: l.map(rotuloEscopoCurto).join('; '), extras: 0, completo, vazio: false };
  return { curto: rotuloEscopoCurto(l[0]), extras: l.length - 1, completo, vazio: false };
}

// ── Lista: colunas opcionais (Colunas) e agrupamento (Agrupar) ──────────────────────────────────────────────────────────────────────────
export type ColunaLista = 'kit' | 'descricao' | 'itens' | 'escopo' | 'aplica_a_todos' | 'diretos' | 'alcance' | 'situacao' | 'acoes';
export const COLUNAS_LISTA: { id: ColunaLista; rotulo: string; fixa?: boolean; padrao: boolean }[] = [
  { id: 'kit', rotulo: 'Kit', fixa: true, padrao: true },
  { id: 'descricao', rotulo: 'Descrição', padrao: false },
  { id: 'itens', rotulo: 'Atributos', padrao: true },
  { id: 'escopo', rotulo: 'Escopo configurado', padrao: true },
  { id: 'aplica_a_todos', rotulo: 'Aplica a todos', padrao: true },
  { id: 'diretos', rotulo: 'Avulsos', padrao: false },
  { id: 'alcance', rotulo: 'Produtos alcançados', padrao: true },
  { id: 'situacao', rotulo: 'Situação', padrao: true },
  { id: 'acoes', rotulo: 'Ações', fixa: true, padrao: true },
];
export const CHAVE_COLUNAS_LISTA = 'at.kits.lista.colunas.v1';
export const CHAVE_COLUNAS_ITENS = 'at.kits.itens.colunas.v1';
export const CHAVE_COLUNAS_ALCANCE = 'at.kits.alcance.colunas.v1';

/** Preferência guardada → lista válida (fixas sempre; desconhecidas fora; ordem do catálogo). Sem preferência = padrão. */
export function colunasValidas<C extends string>(catalogo: readonly { id: C; fixa?: boolean; padrao: boolean }[], v: unknown): C[] {
  const pedidas = Array.isArray(v) ? new Set(v.filter((x): x is C => typeof x === 'string')) : null;
  return catalogo.filter((c) => c.fixa || (pedidas ? pedidas.has(c.id) : c.padrao)).map((c) => c.id);
}
export function alternarColuna<C extends string>(catalogo: readonly { id: C; fixa?: boolean }[], visiveis: readonly C[], id: C): C[] {
  const c = catalogo.find((x) => x.id === id);
  if (!c || c.fixa) return [...visiveis];
  const s = new Set(visiveis); if (s.has(id)) s.delete(id); else s.add(id);
  return catalogo.filter((x) => x.fixa || s.has(x.id)).map((x) => x.id);
}
export const colunasPadrao = <C extends string>(catalogo: readonly { id: C; fixa?: boolean; padrao: boolean }[]) => colunasValidas(catalogo, null);

export type Situacao = 'ativos' | 'inativos' | 'todos';
export type Agrupamento = 'nenhum' | 'situacao' | 'aplica_a_todos';
export function filtrarKits(kits: readonly KitResumo[], situacao: Situacao, termo: string): KitResumo[] {
  const t = normalizar(termo.trim());
  return kits.filter((k) => (situacao === 'todos' || (situacao === 'ativos') === !!k.ativo) && (!t || normalizar(k.nome).includes(t)));
}
export function gruposKits(agr: Agrupamento): { chave: string; titulo: string }[] | null {
  if (agr === 'situacao') return [{ chave: 'ativo', titulo: 'Ativos' }, { chave: 'inativo', titulo: 'Inativos' }];
  if (agr === 'aplica_a_todos') return [{ chave: 'sim', titulo: 'Aplica a todos' }, { chave: 'nao', titulo: 'Por escopo e avulsos' }];
  return null;
}
export function grupoDoKit(agr: Agrupamento, k: KitResumo): string | null {
  if (agr === 'situacao') return k.ativo ? 'ativo' : 'inativo';
  if (agr === 'aplica_a_todos') return k.aplica_a_todos ? 'sim' : 'nao';
  return null;
}

// ── Composição: ordem é DADO do kit (só arrastar e ▲▼; nunca ordenar por coluna) ───────────────────────────────────────────────────────
export function moverItem<T>(l: readonly T[], de: number, para: number): T[] {
  if (de < 0 || de >= l.length || para < 0 || para >= l.length || de === para) return [...l];
  const n = [...l]; const [x] = n.splice(de, 1); n.splice(para, 0, x); return n;
}
export const podeSubir = (n: number) => n > 0;
export const podeDescer = (n: number, total: number) => n < total - 1;

/** Unidade do kit em repouso: sobrescrita = o símbolo; herdada = "Padrão (mês)"; sem unidade/ não numérico = "—". */
export function rotuloUnidadeKit(i: Pick<ItemKit, 'tipo' | 'unidade_id' | 'unidade' | 'unidade_padrao'>): string {
  const numerico = i.tipo === 'numero' || i.tipo === 'inteiro';
  if (!numerico) return '—';
  if (i.unidade_id != null) return i.unidade ?? '—';
  return i.unidade_padrao ? `Padrão (${i.unidade_padrao})` : '—';
}
/** O que vai para o servidor: herança continua null (nunca converte "Padrão (mês)" em unidade_id do padrão). */
export const unidadeParaEnvio = (i: Pick<ItemKit, 'unidade_id'>) => (i.unidade_id == null ? null : Number(i.unidade_id));
export const importanciaParaEnvio = (i: Pick<ItemKit, 'importancia'>) => (i.importancia == null || (i.importancia as string) === '' ? null : i.importancia);

/** Corpo de kit_itens a partir do rascunho (ordem = a da lista; herança preservada). */
export function corpoItens(itens: readonly ItemKit[]) {
  return itens.map((i, n) => ({ atributo_id: i.atributo_id, posicao: n + 1, obrigatorio: +i.obrigatorio ? 1 : 0, visivel: +i.visivel ? 1 : 0, destaque: +i.destaque ? 1 : 0,
    importancia: importanciaParaEnvio(i), unidade_id: unidadeParaEnvio(i) }));
}

export type ColunaItens = 'codigo' | 'tipo';
export const COLUNAS_ITENS_OPCIONAIS: { id: ColunaItens; rotulo: string; padrao: boolean }[] = [
  { id: 'codigo', rotulo: 'Código técnico', padrao: false }, { id: 'tipo', rotulo: 'Tipo', padrao: false },
];

// ── Produtos alcançados: origens (mesma legenda da Matriz: Subcat. azul, Direto lavanda, Todos cinza) ────────────────────────────────
export type Origem = 'escopo' | 'direto' | 'todos';
export const ORIGEM: Record<Origem, { curto: string; longo: string; classe: string }> = {
  escopo: { curto: 'Subcat.', longo: 'Pela subcategoria (escopo do kit)', classe: 'subcat' },
  direto: { curto: 'Direto', longo: 'Vínculo direto (produto avulso)', classe: 'direto' },
  todos: { curto: 'Todos', longo: 'Aplica a todos os produtos', classe: 'todos' },
};
const ORDEM_ORIGEM: Origem[] = ['escopo', 'direto', 'todos'];
/** Origens conhecidas, sem repetição, na ordem fixa da legenda (coexistem: "Subcat. + Todos"). */
export const origensDoAlcance = (motivos: readonly string[]): Origem[] => ORDEM_ORIGEM.filter((o) => motivos.includes(o));
export const textoOrigens = (motivos: readonly string[]) => origensDoAlcance(motivos).map((o) => ORIGEM[o].curto).join(' + ');

export type ColunaAlcance = 'id' | 'produto' | 'subcategoria' | 'origem' | 'situacao';
export const COLUNAS_ALCANCE: { id: ColunaAlcance; rotulo: string; fixa?: boolean; padrao: boolean }[] = [
  { id: 'id', rotulo: 'ID', padrao: true }, { id: 'produto', rotulo: 'Produto', fixa: true, padrao: true }, { id: 'subcategoria', rotulo: 'Subcategoria', padrao: true },
  { id: 'origem', rotulo: 'Origem do vínculo', padrao: true }, { id: 'situacao', rotulo: 'Situação', padrao: true },
];

// ── Contrato "foi salvo": situação de UMA gravação de seção ─────────────────────────────────────────────────────────────────────────────
export type FaseGravacao = 'parado' | 'salvando' | 'salvo' | 'recusada' | 'conflito' | 'desconhecido' | 'emAndamento' | 'conferindo';
/** Resultado do "Conferir gravação" → próxima fase (nao_encontrada NÃO prova "não salvo": DSHOW-099). */
export function faseDoConferir(resultado: string): { fase: FaseGravacao; confirmado: boolean; semMudanca: boolean; podeRepetir: boolean; msg?: string } {
  switch (resultado) {
    case 'aplicada': return { fase: 'salvo', confirmado: true, semMudanca: false, podeRepetir: false };
    case 'sem_mudanca': return { fase: 'salvo', confirmado: true, semMudanca: true, podeRepetir: false };
    case 'em_andamento': return { fase: 'emAndamento', confirmado: false, semMudanca: false, podeRepetir: false };
    case 'nao_aplicada': return { fase: 'recusada', confirmado: false, semMudanca: false, podeRepetir: false, msg: 'O servidor não aplicou esta alteração.' };
    case 'interrompida': return { fase: 'recusada', confirmado: false, semMudanca: false, podeRepetir: true, msg: 'A gravação foi interrompida antes de concluir. Nada foi gravado.' };
    default: return { fase: 'desconhecido', confirmado: false, semMudanca: false, podeRepetir: true, msg: 'Ainda não encontramos o resultado desta gravação.' };
  }
}
/** Fases em que o resultado é INCERTO: a seção não inicia outra gravação da mesma intenção antes de "Conferir gravação". */
export const faseIncerta = (f: FaseGravacao) => f === 'desconhecido' || f === 'emAndamento' || f === 'conferindo';

export const normalizar = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
export const plural = (n: number, um: string, varios: string) => `${n.toLocaleString('pt-BR')} ${n === 1 ? um : varios}`;
