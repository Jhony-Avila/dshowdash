// panel-atributos/src/lib/vincular.ts — funções PURAS da tela Vincular (redesenho 18/11, ESQUERDA): produtos filtrados, seleção que
// sobrevive a busca/filtro, vínculos de um produto com a ORIGEM (kit × avulso) tirados da ficha do servidor, candidatos para vincular,
// estado de carga por produto com descarte de resposta atrasada, frases de confirmação e o corpo da operação em massa.
// Testes: scripts/atributos/testes/vincular-puras.sh.
import type { AtributoDicionario, Ficha, ItemFicha, Previa, ProdutoResumo } from './tipos';
import { valor as textoValor } from './formatar';

// ── texto ─────────────────────────────────────────────────────────────────────────────────────────────────────────────────
export const semAcento = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const termosDe = (q: string) => semAcento(q.trim()).split(/\s+/).filter(Boolean);
const plural = (n: number, um: string, varios: string) => `${n.toLocaleString('pt-BR')} ${n === 1 ? um : varios}`;

// ── produtos filtrados ───────────────────────────────────────────────────────────────────────────────────────────────────
export const SEM_KIT = '__sem_kit';
export interface FiltroVincular { busca: string; subcategoria: string; kit: string }
/**
 * Produtos ATIVOS que passam na busca (nome ou ID; todos os termos), na subcategoria ('' = todas) e no kit ('' = todos;
 * SEM_KIT = nenhum kit além dos que valem para todos; senão o id do kit, por qualquer motivo: escopo, direto ou todos). Sem corte.
 */
export function filtrarProdutos(produtos: readonly ProdutoResumo[], f: FiltroVincular): ProdutoResumo[] {
  const termos = termosDe(f.busca);
  const kitId = f.kit && f.kit !== SEM_KIT ? Number(f.kit) : null;
  return produtos.filter((p) => {
    if (!p.ativo) return false;
    if (f.subcategoria && (p.subcategoria ?? '') !== f.subcategoria) return false;
    if (f.kit === SEM_KIT && p.kits.some((k) => !k.motivos.includes('todos'))) return false;
    if (kitId !== null && !p.kits.some((k) => k.id === kitId)) return false;
    if (termos.length) { const alvo = semAcento(`${p.id} ${p.nome}`); if (!termos.every((t) => alvo.includes(t))) return false; }
    return true;
  });
}

// ── coluna Kit (v4, 19/11) ─────────────────────────────────────────────────────────────────────────────────────────────
/** Kits ESPECÍFICOS do produto (por subcategoria ou direto), em ordem de nome. Os que valem para TODOS os produtos ficam de fora: é a
 *  mesma regra do filtro "Sem kit específico" (filtrarProdutos), para a coluna e o filtro nunca discordarem. */
export function kitsEspecificos(p: Pick<ProdutoResumo, 'kits'>): ProdutoResumo['kits'] {
  return p.kits.filter((k) => !k.motivos.includes('todos')).sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base' }) || a.id - b.id);
}
/** Valor de ordenação da coluna Kit: os nomes dos kits específicos ("" = sem kit específico, vai para o fim em qualquer sentido). */
export const textoKits = (p: Pick<ProdutoResumo, 'kits'>): string => kitsEspecificos(p).map((k) => k.nome).join(', ');

// ── seleção (sobrevive a busca e filtro: é um conjunto de ids, nunca "as linhas visíveis") ─────────────────────────────────
export const alternarSelecao = (sel: readonly number[], id: number): number[] => (sel.includes(id) ? sel.filter((x) => x !== id) : [...sel, id]);
/** Marcar todos = todos os FILTRADOS (o que está na tabela), somados aos já marcados fora do filtro. */
export const marcarFiltrados = (sel: readonly number[], filtrados: readonly number[]): number[] => [...new Set([...sel, ...filtrados])];
/** Desmarcar todos = tira só os filtrados; os marcados fora do filtro continuam. */
export const desmarcarFiltrados = (sel: readonly number[], filtrados: readonly number[]): number[] => { const f = new Set(filtrados); return sel.filter((x) => !f.has(x)); };
export type EstadoMarcarTodos = 'nenhum' | 'alguns' | 'todos';
export function estadoMarcarTodos(sel: readonly number[], filtrados: readonly number[]): EstadoMarcarTodos {
  if (!filtrados.length) return 'nenhum';
  const s = new Set(sel); const n = filtrados.reduce((a, id) => a + (s.has(id) ? 1 : 0), 0);
  return n === 0 ? 'nenhum' : n === filtrados.length ? 'todos' : 'alguns';
}
/** Quantos marcados estão fora do filtro atual (para a contagem "N selecionados · 3 fora do filtro"). */
export const foraDoFiltro = (sel: readonly number[], filtrados: readonly number[]): number => { const f = new Set(filtrados); return sel.filter((x) => !f.has(x)).length; };
/** Só ids de produtos ativos que existem (a seleção vinda de outra tela pode ter produto inativo/sumido). */
export const selecaoValida = (sel: readonly number[], produtos: readonly ProdutoResumo[]): number[] => { const ok = new Set(produtos.filter((p) => p.ativo).map((p) => p.id)); return sel.filter((x) => ok.has(x)); };

/** Texto da contagem do topo: "347 produtos · 12 selecionados" / "40 de 347 produtos · 12 selecionados · 3 fora do filtro". */
export function textoContagem(filtrados: number, total: number, selecionados: number, fora: number): string {
  const prods = filtrados === total ? plural(total, 'produto', 'produtos') : `${filtrados.toLocaleString('pt-BR')} de ${plural(total, 'produto', 'produtos')}`;
  const sel = plural(selecionados, 'selecionado', 'selecionados') + (fora ? ` · ${fora.toLocaleString('pt-BR')} fora do filtro` : '');
  return `${prods} · ${sel}`;
}

// ── vínculos de um produto (da ficha do servidor: a MESMA aplicabilidade — kits gerais, por escopo, diretos e avulsos incluir/excluir) ──
export type OrigemVinculo = { tipo: 'kit'; kit_id: number; nome: string } | { tipo: 'avulso' };
/**
 * Efeito da remoção do avulso na UNIDADE (só quando o produto tem unidade própria no ajuste — eq_produto_atributo.unidade_id).
 * produto = símbolo da unidade do produto; padrao = a que passa a valer sem o ajuste (servidor: `unidade_sem_ajuste` =
 * Aplicabilidade::unidadeSemAjuste — kit → padrão do atributo; null = nenhuma; undefined = servidor sem o campo);
 * valor_propria = unidade própria do VALOR salvo (eq_valor.unidade_id), que prevalece e não muda; valor_numero = o número salvo SEM
 * unidade própria (passa a ser lido na padrão).
 */
export interface UnidadeRemocao { produto: string; padrao: string | null | undefined; valor_propria: string | null; valor_numero: string | null }
/** valor = o valor SALVO do produto para o atributo, já formatado (null = sem valor gravado). Só para explicar o efeito de remover. */
export interface Vinculo { atributo_id: number; rotulo: string; codigo: string | null; origens: OrigemVinculo[]; avulso: boolean; valor: string | null; unidade?: UnidadeRemocao | null }
export interface VinculosProduto { product_id: number; versao_vinculos: string | null; pode_vincular: boolean; vinculos: Vinculo[] }
/**
 * Atributos VINCULADOS ao produto (ficha.itens; os excluídos do produto e os "fora da ficha" não entram), com as origens na ordem:
 * kits (pelo nome) e "Avulso" no fim. Ordem da lista: rótulo pt-BR.
 */
export function vinculosDaFicha(f: Pick<Ficha, 'produto' | 'itens' | 'versao_vinculos' | 'pode_vincular'>): VinculosProduto {
  const vinculos = f.itens.map((i): Vinculo => {
    const kits = new Map<number, string>(); let avulso = false;
    for (const o of i.origens ?? []) {
      if (o.tipo === 'avulso') avulso = true;
      else if (o.grupo_id !== undefined && o.grupo_id !== null) kits.set(Number(o.grupo_id), o.grupo_nome ?? `Kit ${o.grupo_id}`);
    }
    const origens: OrigemVinculo[] = [...kits].map(([kit_id, nome]) => ({ tipo: 'kit' as const, kit_id, nome }))
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR', { sensitivity: 'base', numeric: true }));
    if (avulso) origens.push({ tipo: 'avulso' });
    const valor = i.valor ? textoValor(i.valor, i.unidade_efetiva?.simbolo ?? null) : null;
    const unidade = unidadeRemocao(i);
    return { atributo_id: i.atributo_id, rotulo: i.rotulo, codigo: i.codigo, origens, avulso, valor, ...(unidade ? { unidade } : {}) };
  }).sort((a, b) => a.rotulo.localeCompare(b.rotulo, 'pt-BR', { sensitivity: 'base', numeric: true }) || a.atributo_id - b.atributo_id);
  return { product_id: f.produto.id, versao_vinculos: f.versao_vinculos, pode_vincular: f.pode_vincular, vinculos };
}

/**
 * Unidade própria do produto e o que vale sem ela (null = o produto não tem unidade própria para o atributo). Regra REAL (D3), uma só:
 *  · efetiva = valor → produto → kit → padrão do atributo (api/atributos/Aplicabilidade.php:10 e :123 unidadeEfetiva);
 *  · a do produto vem do ajuste vivo eq_produto_atributo.unidade_id, de qualquer modo (Aplicabilidade.php:113-116);
 *  · remover o avulso = modo null (KitsService.php:309) → AtributosRepo::definirAjusteProduto marca excluido_em na LINHA INTEIRA
 *    (AtributosRepo.php:410-412), então a unidade do produto some junto;
 *  · a que passa a valer = Aplicabilidade::unidadeSemAjuste (Aplicabilidade.php:139: mesma cascata sem produto e sem valor),
 *    exposta pela ficha como `unidade_sem_ajuste` (ProdutosLeitura.php:255); sem kit, o valor vai para "fora da ficha"
 *    (ProdutosLeitura.php:268, item sem aplicabilidade → padrão do atributo) — o mesmo resultado;
 *  · a unidade própria do VALOR (eq_valor.unidade_id) vence as demais e não é tocada pela remoção.
 */
/** Campos ADITIVOS da ficha (ProdutosLeitura.php:254-255) — declarados aqui para não mexer em lib/tipos.ts (dono: CIMA). */
export type ItemFichaUnidades = ItemFicha & { unidade_produto?: { id: number; simbolo: string } | null; unidade_sem_ajuste?: { id: number; simbolo: string } | null };
export function unidadeRemocao(i: Pick<ItemFichaUnidades, 'unidade_produto_id' | 'unidade_produto' | 'unidade_sem_ajuste' | 'unidades' | 'unidade_efetiva' | 'valor'>): UnidadeRemocao | null {
  if (i.unidade_produto_id === null || i.unidade_produto_id === undefined) return null;
  const produto = i.unidade_produto?.simbolo ?? i.unidades.find((u) => u.id === i.unidade_produto_id)?.simbolo ?? 'unidade própria';
  const padrao = i.unidade_sem_ajuste === undefined ? undefined : (i.unidade_sem_ajuste?.simbolo ?? null);
  const v = i.valor;
  const temNumero = !!v && v.estado === 'informado' && v.numero !== null;
  const valor_propria = temNumero && v!.unidade_id !== null ? (i.unidade_efetiva?.simbolo ?? null) : null;
  const valor_numero = temNumero && v!.unidade_id === null ? textoValor(v!, null) : null;
  return { produto, padrao, valor_propria, valor_numero };
}
/**
 * Frase da unidade na confirmação de remoção (vazia quando o produto não tem unidade própria para o atributo). Diz a unidade de
 * REFERÊNCIA que passa a valer, na ordem real: valor > ajuste (o que sai) > kit > padrão do atributo. Valor antigo SEM unidade própria:
 * avisa que a LEITURA muda — o número não é convertido.
 */
export function fraseUnidadeRemocao(u: UnidadeRemocao | null | undefined): string {
  if (!u) return '';
  const base = `A unidade escolhida para este produto (${u.produto}) deixa de valer.`;
  if (u.valor_propria) return `${base} Sem esse ajuste, a unidade de referência será ${u.valor_propria}: é a unidade própria do valor salvo, que prevalece e não muda.`;
  if (u.padrao === undefined) return `${base} Sem esse ajuste, a unidade de referência será a do kit ou, sem kit, a padrão do atributo.`;
  const leitura = (para: string) => (u.valor_numero !== null ? ` O valor salvo (${u.valor_numero}) não tem unidade própria: a leitura muda de ${u.produto} para ${para}, sem converter o número.` : '');
  if (u.padrao === null) return `${base} Sem esse ajuste, não haverá unidade de referência.${leitura('nenhuma unidade')}`;
  return `${base} Sem esse ajuste, a unidade de referência será ${u.padrao}.${u.padrao !== u.produto ? leitura(u.padrao) : ''}`;
}

/**
 * Efeito de REMOVER o vínculo avulso, pela regra REAL do serviço:
 *  · remover = exclusão lógica SÓ da linha eq_produto_atributo (AtributosRepo::definirAjusteProduto, $dados null → excluido_em);
 *    o valor do produto não é tocado (fica em eq_valor);
 *  · a ficha = kits + avulsos (Aplicabilidade): se o atributo também vem de um kit, continua na ficha — com o valor;
 *  · sem kit, o atributo sai da ficha e o valor salvo passa a "fora da ficha" (ProdutosLeitura::fichaProduto: valores − ficha),
 *    que a Ficha (seção "Fora da ficha") e a Conferência listam — mesmo texto da exceção na Ficha (Ficha.tsx: "o valor, se houver, vai para 'Fora da ficha'").
 */
export function fraseRemocao(v: Pick<Vinculo, 'origens' | 'valor'> & Pick<Partial<Vinculo>, 'unidade'>): string {
  const kits = v.origens.flatMap((o) => (o.tipo === 'kit' ? [o.nome] : []));
  const un = fraseUnidadeRemocao(v.unidade);
  const mais = (s: string) => (un ? `${s} ${un}` : s);
  if (kits.length) {
    const s = `Também vem ${kits.length === 1 ? 'do kit' : 'dos kits'} ${lista(kits)}. O atributo continuará na ficha.`;
    return mais(v.valor !== null ? `${s} O valor salvo (${v.valor}) continua na ficha.` : s);
  }
  const s = 'O atributo sai da ficha deste produto.';
  return mais(v.valor !== null ? `${s} O valor salvo (${v.valor}) continua guardado e vai para “Fora da ficha” (na ficha do produto e na Conferência).` : s);
}
/** Mensagem de "Salvo" depois de remover o avulso (diz por onde o atributo continua, se continua). */
export function fraseRemovido(v: Pick<Vinculo, 'rotulo' | 'origens'>): string {
  const kits = v.origens.flatMap((o) => (o.tipo === 'kit' ? [o.nome] : []));
  return `Salvo: vínculo avulso de ${v.rotulo} removido.` + (kits.length ? ` Continua na ficha pelo ${kits.length === 1 ? 'kit' : 'kits'} ${lista(kits)}.` : '');
}

/** Atributos ATIVOS que ainda não estão vinculados, filtrados por rótulo ou código (todos os termos). Ordem: rótulo pt-BR. */
export function candidatosVincular(dic: readonly AtributoDicionario[], vinculados: Iterable<number>, q: string, limite = 50): { lista: AtributoDicionario[]; total: number } {
  const ja = new Set(vinculados); const termos = termosDe(q);
  const todos = dic.filter((a) => Number(a.ativo) === 1 && !ja.has(a.id) && (!termos.length || termos.every((t) => semAcento(`${a.rotulo} ${a.codigo}`).includes(t))))
    .sort((a, b) => a.rotulo.localeCompare(b.rotulo, 'pt-BR', { sensitivity: 'base', numeric: true }) || a.id - b.id);
  return { lista: todos.slice(0, limite), total: todos.length };
}

// ── escolha no seletor (nunca confirmar o que o operador não está vendo) ───────────────────────────────────────────────────
/**
 * Seletor de escolha ÚNICA ("+ Vincular atributo…" da linha): a escolha só vale enquanto o atributo está NA LISTA VISÍVEL. Se a busca
 * mudou e ele saiu dos resultados, a escolha é limpa (null) e o botão de confirmar fica desligado.
 */
export function escolhaVigente(escolhido: number | null, visiveis: readonly { id: number }[]): number | null {
  return escolhido !== null && visiveis.some((a) => a.id === escolhido) ? escolhido : null;
}
/** Botão de confirmar do seletor único: sempre com o NOME do escolhido ("Vincular Largura"). */
export const rotuloConfirmarVincular = (rotulo: string | null): string => (rotulo ? `Vincular ${rotulo}` : 'Escolha um atributo');
/**
 * Massa (escolha MÚLTIPLA, decisão 18/11): os escolhidos persistem independentemente da busca, mas ficam SEMPRE visíveis em chips
 * ("N escolhidos") — o operador vê tudo o que vai na prévia; a confirmação nomeia o que será gravado.
 */
export const textoEscolhidos = (n: number): string => plural(n, 'escolhido', 'escolhidos');
export function rotuloConfirmarMassa(i: IntencaoMassa, rotulos: readonly string[], nomeKit: string): string {
  if (i.tipo === 'kit') return `Confirmar: aplicar kit ${nomeKit}`;
  return `Confirmar: vincular ${rotulos.length <= 3 ? lista(rotulos) : plural(rotulos.length, 'atributo', 'atributos')}`;
}

// ── carga por produto (sob demanda) com descarte de resposta atrasada ──────────────────────────────────────────────────────
export type EstadoCarga<T> = { fase: 'carregando'; seq: number; dados: T | null } | { fase: 'pronto'; seq: number; dados: T } | { fase: 'erro'; seq: number; dados: T | null; erro: string };
export type Cargas<T> = Readonly<Record<number, EstadoCarga<T>>>;
/** Começa (ou recomeça) a carga do produto: devolve o novo mapa e o número desta tentativa. Mantém os dados anteriores enquanto carrega. */
export function iniciarCarga<T>(c: Cargas<T>, id: number, seq: number): Cargas<T> {
  return { ...c, [id]: { fase: 'carregando', seq, dados: c[id]?.dados ?? null } };
}
/** Aplica a resposta SÓ se ela é da tentativa vigente daquele produto (resposta atrasada = ignorada; o mapa volta igual). */
export function concluirCarga<T>(c: Cargas<T>, id: number, seq: number, dados: T): Cargas<T> {
  const a = c[id]; if (!a || a.seq !== seq) return c;
  return { ...c, [id]: { fase: 'pronto', seq, dados } };
}
export function falharCarga<T>(c: Cargas<T>, id: number, seq: number, erro: string): Cargas<T> {
  const a = c[id]; if (!a || a.seq !== seq) return c;
  return { ...c, [id]: { fase: 'erro', seq, dados: a.dados, erro } };
}

// ── expansão (por chave estável; sobrevive a ordenação/filtro) ──────────────────────────────────────────────────────────
export const alternarExpansao = (abertos: readonly number[], id: number): number[] => (abertos.includes(id) ? abertos.filter((x) => x !== id) : [...abertos, id]);

// ── massa (massa_previa / massa_aplicar) ─────────────────────────────────────────────────────────────────────────────────
/**
 * Campos ADITIVOS da prévia (P1 18/11, KitsService::inclusoesQueEntram — a MESMA regra decide a prévia e a gravação): `vinculos_novos`
 * no resumo; por produto, `entram` (atributos que entram na ficha como avulso) e `ja_aplicaveis` (já estão na ficha por kit ou avulso:
 * nada é gravado). Declarados aqui para não mexer em lib/tipos.ts (dono: CIMA). Servidor sem os campos → cai na conta antiga.
 */
export type PreviaV2 = Omit<Previa, 'resumo' | 'produtos'> & {
  resumo: Previa['resumo'] & { vinculos_novos?: number };
  produtos: (Previa['produtos'][number] & { entram?: number[]; ja_aplicaveis?: number[] })[];
};
const novosDaPrevia = (r: PreviaV2['resumo'], nA: number) => r.vinculos_novos ?? Math.max(0, r.produtos * nA - r.ja_tinham);
export type IntencaoMassa = { tipo: 'atributos'; atributos: number[] } | { tipo: 'kit'; kit: number };
export interface CorpoMassa { produtos: number[]; kits_aplicar: number[]; kits_remover: number[]; atributos_incluir: { atributo_id: number }[]; atributos_excluir: { atributo_id: number; motivo: string }[] }
/** Corpo CANÔNICO (ids ordenados, sem repetição) — o retrato da intenção que vai para a prévia e, idêntico, para a confirmação. */
export function corpoMassa(produtos: readonly number[], i: IntencaoMassa): CorpoMassa {
  const ord = (xs: readonly number[]) => [...new Set(xs)].sort((a, b) => a - b);
  return {
    produtos: ord(produtos), kits_aplicar: i.tipo === 'kit' ? [i.kit] : [], kits_remover: [],
    atributos_incluir: i.tipo === 'atributos' ? ord(i.atributos).map((atributo_id) => ({ atributo_id })) : [], atributos_excluir: [],
  };
}
/** DSHOW-056/084: o mesmo kit (ou atributo) nunca vai nos dois lados. Esta tela só ACRESCENTA, mas a guarda fica (o servidor também recusa). */
export function temOpostos(c: CorpoMassa): boolean {
  const kr = new Set(c.kits_remover); const ae = new Set(c.atributos_excluir.map((x) => x.atributo_id));
  return c.kits_aplicar.some((k) => kr.has(k)) || c.atributos_incluir.some((x) => ae.has(x.atributo_id));
}

const lista = (nomes: readonly string[]) => (nomes.length <= 1 ? nomes[0] ?? '' : `${nomes.slice(0, -1).join(', ')} e ${nomes[nomes.length - 1]}`);
/**
 * Frase curta da confirmação de atributos: "Largura será vinculado a 12 produtos; 3 já têm." · vários: "Largura e Altura serão vinculados a
 * 12 produtos; 5 vínculos já existem." · "a 1 produto" · todos já têm: "…; todos já têm (nada muda na ficha)".
 */
export function fraseAtributos(rotulos: readonly string[], r: PreviaV2['resumo']): string {
  const um = rotulos.length === 1;
  const novos = novosDaPrevia(r, rotulos.length);
  if (novos === 0) return `${lista(rotulos)} já ${um ? 'é aplicável' : 'são aplicáveis'} ${r.produtos === 1 ? 'neste produto' : `nos ${plural(r.produtos, 'produto', 'produtos')}`}: nada será gravado.`;
  const base = `${lista(rotulos)} ${um ? 'será vinculado' : 'serão vinculados'} a ${plural(r.produtos, 'produto', 'produtos')}`;
  if (!r.ja_tinham) return `${base}.`;
  return um ? `${base}; ${r.ja_tinham.toLocaleString('pt-BR')} já ${r.ja_tinham === 1 ? 'tem' : 'têm'}.` : `${base}; ${plural(r.ja_tinham, 'vínculo já existe', 'vínculos já existem')}.`;
}
/** Frase do kit (INTEGRIDADE-1 d: vínculo produto–kit separado dos atributos que entram). */
export function fraseKit(nome: string, r: Previa['resumo']): string {
  const novos = r.produtos - r.kits_ja_aplicados;
  let s = `Kit ${nome} será aplicado a ${plural(r.produtos, 'produto', 'produtos')}`;
  s += r.kits_ja_aplicados ? `; ${r.kits_ja_aplicados.toLocaleString('pt-BR')} já ${r.kits_ja_aplicados === 1 ? 'tinha' : 'tinham'} o kit direto (${plural(novos, 'novo vínculo', 'novos vínculos')}).` : '.';
  s += r.atributos_acrescentados
    ? ` Entram ${plural(r.atributos_acrescentados, 'atributo', 'atributos')} em ${plural(r.produtos_afetados, 'produto', 'produtos')}.`
    : ` As fichas já contêm todos os atributos dele.`;
  return s;
}
/** Mensagem de "Salvo" depois da massa (só com recibo — quem chama garante). 0 efeitos = "Nada mudou" (desfecho sem_mudanca). */
export function fraseSalvo(g: { kits_aplicados: number; inclusoes: number }, repetido: boolean | undefined, i: IntencaoMassa): string {
  if (repetido) return 'Esta gravação já tinha sido feita (nada repetido).';
  if (i.tipo === 'atributos' && g.inclusoes === 0) return 'Nada mudou: o atributo já era aplicável em todos os produtos. Nenhum vínculo avulso foi criado.';
  if (i.tipo === 'kit' && g.kits_aplicados === 0) return 'Nada mudou: todos os produtos já tinham o kit.';
  return i.tipo === 'kit' ? `Salvo: kit aplicado a ${plural(g.kits_aplicados, 'produto', 'produtos')} (os demais já tinham).`
    : `Salvo: ${plural(g.inclusoes, 'vínculo avulso gravado', 'vínculos avulsos gravados')}.`;
}

// ── alcance da massa (P1: os números e os destinos vêm da MESMA prévia que será confirmada) ───────────────────────────────
export interface DestinoMassa { product_id: number; nome: string; efeito: string; fora: boolean }
export interface AlcanceMassa { texto: string; destinos: DestinoMassa[] }
/**
 * "2 produtos selecionados · 1 atributo · 1 vínculo novo · 1 já existente" (atributos: vínculo = produto × atributo; já existente = já
 * estava na ficha — por kit ou avulso) · kit: "2 produtos selecionados · kit X · 1 vínculo novo · 1 já existente · 3 atributos entram
 * na ficha" (vínculo = produto–kit direto). Destinos = TODOS os produtos da prévia (inclusive os fora do filtro), pelo ID.
 */
export const ROTULO_JA_APLICAVEL = 'Já aplicável';
export const ROTULO_ENTRA = 'Entra na ficha';
export function alcanceMassa(i: IntencaoMassa, nomeKit: string, p: PreviaV2, foraDoFiltroIds: Iterable<number> = []): AlcanceMassa {
  const r = p.resumo; const fora = new Set(foraDoFiltroIds);
  const prods = plural(r.produtos, 'produto selecionado', 'produtos selecionados');
  let texto: string; let efeito: (x: PreviaV2['produtos'][number]) => string;
  if (i.tipo === 'atributos') {
    const nA = new Set(i.atributos).size; const novos = novosDaPrevia(r, nA);
    texto = `${prods} · ${plural(nA, 'atributo', 'atributos')} · ${plural(novos, 'entra na ficha', 'entram na ficha')} · ${plural(r.ja_tinham, 'já aplicável', 'já aplicáveis')}`;
    efeito = (x) => { const entram = x.entram ? x.entram.length : x.acrescenta; const ja = x.ja_aplicaveis ? x.ja_aplicaveis.length : Math.max(0, nA - entram);
      return nA === 1 ? (entram ? ROTULO_ENTRA : ROTULO_JA_APLICAVEL) : `${plural(entram, 'entra na ficha', 'entram na ficha')} · ${plural(ja, 'já aplicável', 'já aplicáveis')}`; };
  } else {
    const novos = Math.max(0, r.produtos - r.kits_ja_aplicados);
    texto = `${prods} · kit ${nomeKit} · ${plural(novos, 'vínculo novo', 'vínculos novos')} · ${plural(r.kits_ja_aplicados, 'já existente', 'já existentes')} · `
      + (r.atributos_acrescentados ? `${plural(r.atributos_acrescentados, 'atributo entra', 'atributos entram')} na ficha` : 'nenhum atributo novo na ficha');
    efeito = (x) => (x.acrescenta ? `+${plural(x.acrescenta, 'atributo', 'atributos')} na ficha` : 'nenhum atributo novo');
  }
  const destinos = p.produtos.map((x) => ({ product_id: x.product_id, nome: x.nome, efeito: efeito(x), fora: fora.has(x.product_id) }))
    .sort((a, b) => a.product_id - b.product_id);
  return { texto, destinos };
}
/** A prévia cobre EXATAMENTE os produtos do pedido (nem um a mais, nem um a menos) — senão não se confirma. */
export function previaCobrePedido(p: Pick<Previa, 'produtos' | 'resumo'>, c: Pick<CorpoMassa, 'produtos'>): boolean {
  const a = [...new Set(p.produtos.map((x) => x.product_id))].sort((x, y) => x - y); const b = [...new Set(c.produtos)].sort((x, y) => x - y);
  return p.resumo.produtos === b.length && a.length === b.length && a.every((x, k) => x === b[k]);
}
/** Busca na lista de destinos / da seleção (ID ou nome; todos os termos). */
export function filtrarPorIdNome<T extends { nome: string }>(xs: readonly T[], q: string, id: (x: T) => number): T[] {
  const termos = termosDe(q); if (!termos.length) return [...xs];
  return xs.filter((x) => { const alvo = semAcento(`${id(x)} ${x.nome}`); return termos.every((t) => alvo.includes(t)); });
}
/** Lista de "Rever seleção": os selecionados com nome e subcategoria; os FORA do filtro primeiro, depois pelo ID. */
export function selecaoParaRever(sel: readonly number[], produtos: readonly ProdutoResumo[], filtrados: readonly number[]): { id: number; nome: string; subcategoria: string | null; fora: boolean }[] {
  const porId = new Map(produtos.map((p) => [p.id, p])); const f = new Set(filtrados);
  return [...new Set(sel)].flatMap((id) => { const p = porId.get(id); return p ? [{ id, nome: p.nome, subcategoria: p.subcategoria, fora: !f.has(id) }] : []; })
    .sort((a, b) => Number(b.fora) - Number(a.fora) || a.id - b.id);
}

/**
 * Link da ficha do produto focando o atributo (rota do UX-1: App.tsx lê `?atributo=` do endereço). Usado no RESULTADO da gravação.
 */
export const linkFichaAtributo = (productId: number, atributoId?: number | null): string =>
  `#/panel-atributos/produto/${productId}${atributoId ? `?atributo=${atributoId}` : ''}`;

/**
 * "Foi salvo ou não" (contrato da ESQUERDA §5, api.ts da CIMA): o que dizer depois de "Conferir gravação". `final` = a pendência acabou
 * (aplicada/sem_mudanca = gravado e confirmado; nao_aplicada = NADA foi gravado — pode tentar de novo, com chave nova); em_andamento,
 * interrompida e nao_encontrada mantêm a pendência (a chave é reaproveitada no próximo envio da MESMA intenção). `interrompida` (só lote,
 * contrato §10-B) NÃO é final: parte pode ter sido gravada e o reenvio com a MESMA chave assume e retoma os pendentes (regra do 5e5fa7cc).
 */
export type ResultadoConferencia = 'aplicada' | 'sem_mudanca' | 'em_andamento' | 'interrompida' | 'nao_aplicada' | 'nao_encontrada';
export function fraseConferencia(r: ResultadoConferencia, erro?: string | null): { tom: 'ok' | 'erro' | 'andando'; texto: string; gravado: boolean; final: boolean } {
  switch (r) {
    case 'aplicada': return { tom: 'ok', texto: 'Conferido: foi salvo.', gravado: true, final: true };
    case 'sem_mudanca': return { tom: 'ok', texto: 'Conferido: nada mudou (já estava assim).', gravado: true, final: true };
    case 'em_andamento': return { tom: 'andando', texto: 'A gravação ainda está em andamento. Confira de novo em instantes.', gravado: false, final: false };
    case 'interrompida': return { tom: 'erro', texto: 'A gravação foi interrompida no meio: parte pode ter sido salva. Envie de novo para retomar (a mesma chave completa o que faltou, sem gravar duas vezes).', gravado: false, final: false };
    case 'nao_aplicada': return { tom: 'erro', texto: `Não foi salvo${erro ? `: ${erro}` : '.'} Pode tentar de novo.`, gravado: false, final: true };
    default: return { tom: 'erro', texto: 'O servidor não registrou esta gravação: nada foi salvo. Pode tentar de novo (a mesma chave evita gravar duas vezes).', gravado: false, final: false };
  }
}

/**
 * Resultado INCERTO de uma escrita (regra do 5e5fa7cc): sem ErroApi (resposta perdida), desfecho desconhecido, em andamento, ou QUALQUER 5xx
 * (inclusive `interrompida` 503 do lote e `falhou` 503 do livro) → a chave fica guardada e o reenvio da MESMA intenção usa a MESMA chave.
 * Só recusa definitiva (4xx recusada, 409 de conflito real) libera chave nova.
 */
export function resultadoIncerto(e: { desconhecido: boolean; emAndamento: boolean; http: number } | null): boolean {
  return !e || e.desconhecido || e.emAndamento || e.http === 0 || e.http >= 500;
}

/** Chave de idempotência: a mesma intenção depois de um resultado INCERTO reaproveita a chave; intenção nova = chave nova. */
export function chaveParaPedido(pedido: string, incerta: { pedido: string; chave: string } | null, nova: () => string): string {
  return incerta && incerta.pedido === pedido ? incerta.chave : nova();
}
