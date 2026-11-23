// panel-atributos/src/ui/admin-ux2.ts — regras PURAS das telas administrativas do UX-2 (Unidades, Kits, Atributos).
// Sem React e sem rede: tudo aqui é testado por scripts/atributos/testes/ux2-admin.test.ts.
// Regra geral do UX-2: nenhuma contagem que o servidor ainda não devolve vira ZERO — vira "ainda não conferido" (null).
// A prévia mostra o MESMO que será gravado: o corpo do POST é montado aqui e a prévia é derivada desse mesmo corpo.
import { decimal } from '../lib/formatar';

export const NAO_CONFERIDO = 'ainda não conferido';
const fmt = (x: number) => x.toLocaleString('pt-BR');
const plural = (x: number, um: string, varios: string) => `${fmt(x)} ${x === 1 ? um : varios}`;
export const semAcento = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
/** Número vindo do servidor: só um número finito conta; ausente/nulo/texto = não conferido (null), NUNCA zero. */
export const contagemOuNula = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : typeof v === 'string' && /^\d+$/.test(v) ? Number(v) : null);

// ════════════════════════════════ Unidades ════════════════════════════════
export interface UnidadeBase { id: number; simbolo: string; nome: string; grandeza: string | null; fator_base: string | null; ativo: number | boolean }
export type SituacaoEquivalencia = 'base' | 'equivale' | 'sem_fator' | 'sem_grandeza' | 'sem_referencia' | 'referencia_ambigua';
export interface Equivalencia { situacao: SituacaoEquivalencia; referencia: UnidadeBase | null; texto: string }

const ehFatorUm = (f: string | null) => f !== null && /^0*1(\.0*)?$/.test(f.trim());

/** Equivalência de CADA unidade resolvida pelo GRUPO inteiro (grandeza), ANTES de qualquer filtro de busca.
 *  Referência da grandeza = a única unidade de fator 1; nenhuma → "sem referência"; mais de uma → "precisa de revisão". */
export function equivalencias<U extends UnidadeBase>(todas: readonly U[]): Map<number, Equivalencia> {
  const porGrandeza = new Map<string, U[]>();
  for (const u of todas) if (u.grandeza) porGrandeza.set(u.grandeza, [...(porGrandeza.get(u.grandeza) ?? []), u]);
  const out = new Map<number, Equivalencia>();
  for (const u of todas) {
    if (!u.grandeza) { out.set(u.id, { situacao: 'sem_grandeza', referencia: null, texto: 'Sem grandeza: não converte' }); continue; }
    if (u.fator_base === null) { out.set(u.id, { situacao: 'sem_fator', referencia: null, texto: 'Sem fator: não converte' }); continue; }
    const candidatas = (porGrandeza.get(u.grandeza) ?? []).filter((x) => ehFatorUm(x.fator_base));
    if (candidatas.length > 1) { out.set(u.id, { situacao: 'referencia_ambigua', referencia: null, texto: 'Referência da grandeza precisa de revisão' }); continue; }
    const ref = candidatas[0] ?? null;
    if (!ref) { out.set(u.id, { situacao: 'sem_referencia', referencia: null, texto: `Grandeza "${u.grandeza}" sem unidade de referência (fator 1)` }); continue; }
    if (ref.id === u.id) { out.set(u.id, { situacao: 'base', referencia: ref, texto: `Referência de ${u.grandeza}` }); continue; }
    out.set(u.id, { situacao: 'equivale', referencia: ref, texto: `1 ${u.simbolo} = ${decimal(u.fator_base)} ${ref.simbolo}` });
  }
  return out;
}

/** Filtro da busca (símbolo, nome ou grandeza, sem acento). Aplicado DEPOIS de equivalencias(). */
export function filtrarUnidades<U extends UnidadeBase>(todas: readonly U[], busca: string): U[] {
  const t = semAcento(busca.trim());
  return t ? todas.filter((u) => semAcento(`${u.simbolo} ${u.nome} ${u.grandeza ?? ''}`).includes(t)) : [...todas];
}

/** Uso de uma unidade. `itens_kit` e `configuracoes_produto` vêm da contagem completa da ESQUERDA (PARA-STATUS §31);
 *  enquanto não vierem, o uso fica INCOMPLETO e "sem uso" nunca é afirmado. */
export interface UsoUnidade { atributos: number; valores: number; kits: number | null; produtos: number | null; completo: boolean; semUso: boolean | null; linhas: string[]; resumo: string }
export function usoUnidade(u: { atributos?: unknown; valores?: unknown; itens_kit?: unknown; configuracoes_produto?: unknown }): UsoUnidade {
  const atributos = contagemOuNula(u.atributos) ?? 0;   // estas duas o servidor já conta (LeituraVitrinePdo)
  const valores = contagemOuNula(u.valores) ?? 0;
  const kits = contagemOuNula(u.itens_kit);
  const produtos = contagemOuNula(u.configuracoes_produto);
  const completo = kits !== null && produtos !== null;
  const total = atributos + valores + (kits ?? 0) + (produtos ?? 0);
  const semUso = completo ? total === 0 : total > 0 ? false : null;
  const linhas = [`Padrão de ${plural(atributos, 'atributo', 'atributos')}`, `${plural(valores, 'valor gravado', 'valores gravados')} com esta unidade`];
  if (completo) linhas.push(`Unidade de ${plural(kits!, 'item de kit', 'itens de kit')}`, `Unidade de ${plural(produtos!, 'configuração de produto', 'configurações de produto')}`);
  else linhas.push('Uso em kits e configurações de produto ainda não conferido');
  const resumo = semUso === true ? 'Sem uso' : semUso === false ? 'Em uso' : 'Uso ainda não conferido';
  return { atributos, valores, kits, produtos, completo, semUso, linhas, resumo };
}

/** Corpo do POST `unidade` (edição) — o MESMO objeto que a prévia "antes → depois" lê. */
export function corpoEdicaoUnidade(u: UnidadeBase, form: { nome: string; grandeza: string; fatorApi: string; fatorMudou: boolean }, antes: unknown): Record<string, unknown> {
  const corpo: Record<string, unknown> = { id: u.id, nome: form.nome.trim(), grandeza: form.grandeza.trim() || null, antes };
  if (form.fatorMudou) corpo.fator_base = form.fatorApi || null;
  return corpo;
}
export interface Mudanca { campo: string; antes: string; depois: string }
const fatorTexto = (f: string | null | undefined) => (f === null || f === undefined || f === '' ? 'sem fator' : decimal(f));
/** "antes → depois" derivado do CORPO do POST (nunca do formulário). Só lista o que de fato muda. */
export function mudancasUnidade(u: UnidadeBase, corpo: Record<string, unknown>): Mudanca[] {
  const out: Mudanca[] = [];
  if (typeof corpo.nome === 'string' && corpo.nome !== u.nome) out.push({ campo: 'Nome', antes: u.nome, depois: corpo.nome });
  const g = (corpo.grandeza ?? null) as string | null;
  if ((g ?? '') !== (u.grandeza ?? '')) out.push({ campo: 'Grandeza', antes: u.grandeza ?? 'sem grandeza', depois: g ?? 'sem grandeza' });
  if ('fator_base' in corpo) {
    const novo = (corpo.fator_base ?? null) as string | null;
    if (fatorTexto(novo) !== fatorTexto(u.fator_base)) out.push({ campo: 'Fator', antes: fatorTexto(u.fator_base), depois: fatorTexto(novo) });
  }
  return out;
}
/** Mudança que altera a interpretação de medidas (grandeza ou fator) — pede o quadro "antes → depois" com o uso. */
export const mudaInterpretacao = (m: Mudanca[]) => m.some((x) => x.campo === 'Grandeza' || x.campo === 'Fator');

// ════════════════════════════════ Kits ════════════════════════════════
export interface ProdutoCatalogo { id: number; nome: string; categoria: string; subcategoria: string | null; ativo: boolean | number }
export interface CorpoEscopo { id: number; versao: number; escopos: { categoria: string; subcategoria: string }[]; aplica_a_todos: 0 | 1 }
/** Corpo do POST `kit_escopos` — a prévia (alcancePrevisto) lê EXATAMENTE este objeto. Ordem estável. */
export function corpoEscopo(id: number, versao: number, chaves: Iterable<string>, todos: boolean): CorpoEscopo {
  const escopos = [...new Set(chaves)].sort().map((c) => { const [categoria, subcategoria = ''] = c.split('|'); return { categoria, subcategoria }; });
  return { id, versao, escopos, aplica_a_todos: todos ? 1 : 0 };
}
const ativoDe = (v: boolean | number) => v === true || Number(v) === 1;
/** IDs DISTINTOS dos produtos ATIVOS que o kit alcança com este corpo (mesma regra de Aplicabilidade.php:
 *  categoria igual e subcategoria '' ou igual; "aplica a todos" = todos; avulsos sempre). Um produto com duas origens conta 1 vez. */
export function alcancePrevisto(corpo: Pick<CorpoEscopo, 'escopos' | 'aplica_a_todos'>, catalogo: readonly ProdutoCatalogo[], avulsos: Iterable<number>): Set<number> {
  const diretos = new Set(avulsos);
  const out = new Set<number>();
  for (const p of catalogo) {
    if (!ativoDe(p.ativo)) continue;
    const sub = p.subcategoria ?? '';
    if (corpo.aplica_a_todos === 1 || diretos.has(p.id) || corpo.escopos.some((e) => e.categoria === p.categoria && (e.subcategoria === '' || e.subcategoria === sub))) out.add(p.id);
  }
  return out;
}
/** IDs distintos dos produtos ATIVOS do alcance devolvido pelo servidor. */
export const alcanceAtual = (alcance: readonly { id: number; ativo: boolean | number }[]) => new Set(alcance.filter((p) => ativoDe(p.ativo)).map((p) => p.id));
export interface ComparacaoAlcance { total: number; entram: number[]; saem: number[]; continuam: number[] }
export function compararAlcance(antes: ReadonlySet<number>, depois: ReadonlySet<number>): ComparacaoAlcance {
  const ord = (l: number[]) => l.sort((a, b) => a - b);
  return {
    total: depois.size,
    entram: ord([...depois].filter((x) => !antes.has(x))),
    saem: ord([...antes].filter((x) => !depois.has(x))),
    continuam: ord([...depois].filter((x) => antes.has(x))),
  };
}
/** A prévia só vale se a mesma regra, aplicada ao que está SALVO, reproduz o alcance do servidor (mesmos IDs). */
export function previaConfere(salvo: Pick<CorpoEscopo, 'escopos' | 'aplica_a_todos'>, catalogo: readonly ProdutoCatalogo[], avulsos: Iterable<number>, servidor: ReadonlySet<number>): boolean {
  const meu = alcancePrevisto(salvo, catalogo, avulsos);
  return meu.size === servidor.size && [...meu].every((x) => servidor.has(x));
}

/** Impacto de desativar um kit (contrato pedido à ESQUERDA, PARA-STATUS §31: GET kit → `impacto_desativar`).
 *  Sem o campo: os dois blocos ficam "ainda não conferido" (null), nunca lista vazia. */
export interface ImpactoDesativar { continuam: { atributo_id: number; rotulo: string; produtos: number }[]; fora_da_ficha: { atributo_id: number; rotulo: string; valores: number }[] }
export function lerImpactoDesativar(v: unknown): ImpactoDesativar | null {
  if (!v || typeof v !== 'object') return null;
  const o = v as Record<string, unknown>;
  if (!Array.isArray(o.continuam) || !Array.isArray(o.fora_da_ficha)) return null;
  const ok = (x: unknown, k: string) => !!x && typeof x === 'object' && typeof (x as Record<string, unknown>).atributo_id === 'number' && contagemOuNula((x as Record<string, unknown>)[k]) !== null;
  if (!o.continuam.every((x) => ok(x, 'produtos')) || !o.fora_da_ficha.every((x) => ok(x, 'valores'))) return null;
  return { continuam: o.continuam as ImpactoDesativar['continuam'], fora_da_ficha: o.fora_da_ficha as ImpactoDesativar['fora_da_ficha'] };
}

/** Detalhe mínimo do GET kit usado pelo diálogo de desativar (o ID e a versão vêm do PRÓPRIO detalhe conferido). */
export interface DetalheKitMin { kit: { id: number | string; versao: number | string }; impacto_desativar?: unknown }

/** IDENTIDADE DA ABERTURA do diálogo (DSHOW-094): kit + contador incrementado a CADA abertura (inclusive reabrir o mesmo kit
 *  e "Tentar de novo"). Tudo que chega de uma abertura anterior é descartado, mesmo que seja do mesmo kit. */
export interface AberturaDialogo { kitId: number; abertura: number }
/** Detalhe conferido + a abertura que o trouxe (o POST só sai se esta abertura ainda for a atual). */
export interface DetalheConferido<D extends DetalheKitMin = DetalheKitMin> { det: D; abertura: AberturaDialogo }

/** Leitor do GET kit do diálogo de desativar: cada abertura recebe uma identidade; só a resposta da abertura ATUAL, cujo
 *  `kit.id` confere com o kit aberto, é entregue. Respostas/erros de aberturas anteriores (outro kit, mesmo kit reaberto ou
 *  diálogo fechado) são descartados — nem sucesso nem erro chegam à tela. */
export function criarLeitorDetalheKit<D extends DetalheKitMin>(buscar: (id: number) => Promise<D>) {
  let contador = 0;
  let atual: AberturaDialogo | null = null;
  return {
    abrir(id: number, aoOk: (c: DetalheConferido<D>) => void, aoErro: (e: unknown) => void): AberturaDialogo {
      const ab: AberturaDialogo = { kitId: id, abertura: ++contador };
      atual = ab;
      const vale = () => atual === ab;
      buscar(id).then((d) => { if (vale() && Number(d?.kit?.id) === id) aoOk({ det: d, abertura: ab }); }, (e) => { if (vale()) aoErro(e); });
      return ab;
    },
    fechar(): void { atual = null; },
    atual: (): AberturaDialogo | null => atual,
  };
}

export const MSG_KIT_MUDOU = 'O kit mudou; abra de novo para conferir.';
export type ConferenciaPost = { ok: true; corpo: CorpoKitAtivo } | { ok: false; mensagem: string };
/** Conferência no CLIQUE de confirmar, imediatamente antes do POST: abertura atual === abertura do detalhe conferido e
 *  kitId do diálogo === kit.id do detalhe === id do payload (e a versão do payload = a do detalhe). Divergiu → não envia. */
export function conferirAntesDoPost(atual: AberturaDialogo | null, kitIdDialogo: number | null, conferido: DetalheConferido | null, corpo: CorpoKitAtivo | null): ConferenciaPost {
  const falha: ConferenciaPost = { ok: false, mensagem: MSG_KIT_MUDOU };
  if (!atual || !conferido || !corpo || kitIdDialogo === null) return falha;
  if (conferido.abertura.abertura !== atual.abertura || conferido.abertura.kitId !== atual.kitId) return falha;
  if (atual.kitId !== kitIdDialogo || Number(conferido.det.kit.id) !== kitIdDialogo || corpo.id !== kitIdDialogo) return falha;
  if (corpo.versao !== Number(conferido.det.kit.versao)) return falha;
  return { ok: true, corpo };
}

export interface CorpoKitAtivo { id: number; versao: number; ativo: 0; motivo?: string }
export interface EstadoDesativarKit { habilitado: boolean; motivo: string | null; corpo: CorpoKitAtivo | null }
/** "Desativar" só habilita com o detalhe conferido DO KIT SELECIONADO e com o impacto completo do servidor
 *  (`impacto_desativar`). O corpo do POST usa o ID e a VERSÃO desse mesmo detalhe — nunca de outro estado. */
export function estadoDesativarKit(idSelecionado: number | null, det: DetalheKitMin | null, motivo = ''): EstadoDesativarKit {
  if (idSelecionado === null || !det || Number(det.kit.id) !== idSelecionado) return { habilitado: false, motivo: 'Conferindo o alcance deste kit…', corpo: null };
  if (lerImpactoDesativar(det.impacto_desativar) === null) {
    return { habilitado: false, motivo: `Desativar fica disponível quando o servidor devolver o impacto completo: impacto ${NAO_CONFERIDO}.`, corpo: null };
  }
  const corpo: CorpoKitAtivo = { id: Number(det.kit.id), versao: Number(det.kit.versao), ativo: 0 };
  if (motivo.trim()) corpo.motivo = motivo.trim();
  return { habilitado: true, motivo: null, corpo };
}

// ════════════════════════════════ Atributos (criação) ════════════════════════════════
export const PENDENCIA_UNIDADES = 'Atributo criado. As unidades adicionais continuam pendentes.';
export interface ResultadoCriarAtributo { id: number; pendencia: { texto: string; detalhe: string } | null }
/** Cria o atributo (1º POST) e grava as unidades adicionais (2º POST). Falha no 1º → lança (nada foi criado).
 *  Falha no 2º → devolve a pendência persistente e NÃO emite "sucesso"; o aviso de sucesso só sai com os dois gravados. */
export async function criarAtributoComUnidades(
  dep: { enviar: (acao: string, corpo: Record<string, unknown>) => Promise<unknown>; aviso: (texto: string) => void; mensagemErro: (e: unknown) => string },
  corpo: Record<string, unknown>, extras: readonly number[], rotulo: string,
): Promise<ResultadoCriarAtributo> {
  const r = (await dep.enviar('atributo', corpo)) as { atributo: { id: number } };
  const id = Number(r.atributo.id);
  if (extras.length) {
    try { await dep.enviar('atributo_unidades', { atributo_id: id, unidades: [...extras], unidades_antes: [] }); }
    catch (e) { return { id, pendencia: { texto: PENDENCIA_UNIDADES, detalhe: dep.mensagemErro(e) } }; }
  }
  dep.aviso(`Atributo "${rotulo}" criado.`);
  return { id, pendencia: null };
}

// ════════════════════════════════ Atributos (opções) ════════════════════════════════
/** Uso de UMA opção (contrato pedido à ESQUERDA: GET atributo → opcoes[].produtos). Ausente = null (não conferido). */
export const usoOpcao = (o: { produtos?: unknown }) => contagemOuNula(o.produtos);
export interface CorpoRenomear { id: number; rotulo: string; rotulo_atual: string }
export interface Confirmacao { precisa: boolean; titulo: string; texto: string; botao: string }
/** Confirmação de renomear/desativar opção. Em uso (N>0) ou uso não conferido → pede confirmação com o alcance.
 *  O texto vem do CORPO que será enviado (rotulo_atual → rotulo), não do campo digitado. */
export function confirmacaoOpcao(acao: 'renomear' | 'desativar', uso: number | null, corpo: { rotulo_atual: string; rotulo?: string }): Confirmacao {
  const x = corpo.rotulo_atual;
  const alcance = uso === null ? 'em todos os produtos que a usam (uso desta opção ainda não conferido)' : `em ${plural(uso, 'produto', 'produtos')}`;
  if (acao === 'renomear') {
    const y = corpo.rotulo ?? '';
    return {
      precisa: uso !== 0,
      titulo: uso === null ? `Renomear "${x}" para "${y}"?` : `Renomear "${x}" para "${y}" em ${plural(uso, 'produto', 'produtos')}?`,
      texto: `O novo nome vale ${alcance}. Use para corrigir a grafia; se o significado mudou (ex.: Azul → Preto), crie outra opção.`,
      botao: 'Renomear agora',
    };
  }
  return {
    precisa: uso !== 0,
    titulo: `Desativar "${x}" para novas escolhas?`,
    texto: uso === null
      ? 'Os produtos que já a usam continuam com ela (uso desta opção ainda não conferido). Ela deixa de ser oferecida em novas escolhas.'
      : `${plural(uso, 'produto continua', 'produtos continuam')} com ela. Ela deixa de ser oferecida em novas escolhas.`,
    botao: 'Desativar agora',
  };
}
/** Registro do que já foi salvo individualmente (opções) enquanto o formulário do atributo estava aberto. */
export interface SalvoIndividual { texto: string }
/** Rótulo e nota do botão de saída do editor: depois de uma gravação individual, "Cancelar" NÃO pode sugerir desfazer o que já foi salvo. */
export function saidaEditor(salvos: readonly SalvoIndividual[], somenteLeitura: boolean): { rotulo: string; nota: string | null } {
  if (somenteLeitura) return { rotulo: 'Fechar', nota: null };
  if (salvos.length === 0) return { rotulo: 'Cancelar', nota: null };
  return {
    rotulo: 'Fechar sem salvar o formulário',
    nota: `Já salvo (não volta ao fechar): ${salvos.map((s) => s.texto).join('; ')}. O que está nos campos acima continua em rascunho até "Salvar".`,
  };
}

// ════════════════════════════════ Histórico ════════════════════════════════
export interface EventoAuditoria { id: number; usuario?: string | null; acao: string; antes?: unknown; depois?: unknown; motivo?: string | null; criado_em: string; entidade?: string; entidade_id?: string }
const json = (v: unknown): Record<string, unknown> | null => {
  if (v && typeof v === 'object') return v as Record<string, unknown>;
  if (typeof v === 'string') { try { const o = JSON.parse(v); return o && typeof o === 'object' ? o : null; } catch { return null; } }
  return null;
};
const curto = (v: unknown) => (v === null || v === undefined ? '—' : typeof v === 'object' ? JSON.stringify(v) : String(v));
/** Linhas legíveis: quando, quem, o que mudou (campo: antes → depois) e motivo. */
export function linhasHistorico(eventos: readonly EventoAuditoria[]): { id: number; quando: string; quem: string; acao: string; mudancas: string[]; motivo: string | null }[] {
  return eventos.map((e) => {
    const a = json(e.antes) ?? {}, d = json(e.depois) ?? {};
    const campos = [...new Set([...Object.keys(a), ...Object.keys(d)])];
    return {
      id: e.id, quando: e.criado_em, quem: e.usuario ?? '—', acao: e.acao,
      mudancas: campos.filter((c) => curto(a[c]) !== curto(d[c])).map((c) => `${c}: ${curto(a[c])} → ${curto(d[c])}`),
      motivo: e.motivo ?? null,
    };
  });
}
