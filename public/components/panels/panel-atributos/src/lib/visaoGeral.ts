// panel-atributos/src/lib/visaoGeral.ts — funções PURAS da Visão geral V2 (ESQUERDA, 19/11; briefing BRIEFING-VISAO-GERAL-V2 do Jhony).
// Só APRESENTAÇÃO: nenhum número muda de regra. Fonte = GET visao_geral (ProdutosLeitura::visaoGeral, servida e4ee5f48). Regras aproveitadas
// da DIREITA (fb88a1e9 / e14ccc66, "Visão geral v2" e as 4 correções): número ausente nunca vira 0 (numero), média sem base nunca vira "0%"
// (mediaTexto), clique da cobertura com categoria E subcategoria e "Sem subcategoria" ≠ "Todas" (filtroDaCobertura) e o clique do essencial
// abrindo "essencial incompleto, menor preenchimento primeiro" (FILTRO_ESSENCIAL_INCOMPLETO). A lista de Produtos servida já lê esses filtros.
// Testes: scripts/atributos/testes/visao-geral-puras.sh.
import type { VisaoGeral } from './tipos';
import type { FiltroProdutos } from '../app/contexto';
import { decimal } from './formatar';

type Cartoes = VisaoGeral['cartoes'];
type ItemCobertura = VisaoGeral['cobertura'][number];

/** Número do servidor ou null (ausente/inválido): nunca inventa 0. */
export const numero = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) && v >= 0 ? v : null);
export const inteiro = (n: number | null): string => (n === null ? '—' : n.toLocaleString('pt-BR'));
/** Percentual já calculado pelo servidor (essencial: 1 casa, como vem), com vírgula decimal. Sem base = "—". */
export const pctServidor = (v: number | null): string => (v === null ? '—' : `${decimal(String(v))}%`);
/** Média sem base (nenhum produto com atributos essenciais) = texto neutro, nunca "0%". */
export function mediaTexto(v: number | null): { texto: string; semBase: boolean } {
  return v === null ? { texto: 'Sem base', semBase: true } : { texto: pctServidor(v), semBase: false };
}

// ── filtros dos cliques (regras da DIREITA; a lista de Produtos servida já os aplica) ──────────────────────────────────────────────
/** Linha da cobertura → Produtos com categoria E subcategoria; subcategoria nula = filtro "Sem subcategoria" (≠ "Todas"). */
export function filtroDaCobertura(s: { categoria: string; subcategoria: string | null }): FiltroProdutos {
  return s.subcategoria === null ? { categoria: s.categoria, semSubcategoria: true } : { categoria: s.categoria, subcategoria: s.subcategoria };
}
/** "Essencial incompleto" (feitos < total), menor preenchimento primeiro. */
export const FILTRO_ESSENCIAL_INCOMPLETO: FiltroProdutos = { essencialIncompleto: true, ordem: 'preenchimento' };

// ── faixa de indicadores ──────────────────────────────────────────────────────────────────────────────────────────────────────────
export type IconeIndicador = 'caixa' | 'camadas-menos' | 'lista-conferida' | 'imagem-riscada' | 'prancheta';
export type DestinoIndicador = { tipo: 'produtos'; filtro: FiltroProdutos } | { tipo: 'conferencia' };
export interface Indicador { id: 'ativos' | 'sem_kit' | 'essencial' | 'sem_foto' | 'pendencias'; icone: IconeIndicador; valor: string; rotulo: string;
  complemento: string; /** texto do title/aria: o que o número é e para onde o clique leva */ dica: string; destino: DestinoIndicador; semBase?: boolean }

/** Os cinco indicadores (mockup V2). Valores e regras = os do servidor; o clique abre a lista correspondente. */
export function indicadores(c: Cartoes): Indicador[] {
  const at = numero(c.ativos); const sk = numero(c.sem_kit); const ck = numero(c.com_kit); const sf = numero(c.sem_foto);
  const pend = numero(c.pendencias); const sug = numero(c.sugestoes); const fora = numero(c.fora_da_ficha);
  const media = mediaTexto(c.essencial_medio === null ? null : numero(c.essencial_medio));
  return [
    { id: 'ativos', icone: 'caixa', valor: inteiro(at), rotulo: 'Produtos ativos', complemento: 'Catálogo Precifica',
      dica: 'Produtos ativos no catálogo do Precifica. Abrir a lista de produtos', destino: { tipo: 'produtos', filtro: {} } },
    { id: 'sem_kit', icone: 'camadas-menos', valor: inteiro(sk), rotulo: 'Sem kit específico', complemento: `${inteiro(ck)} com kit`,
      dica: 'Produtos ativos sem kit específico. Abrir exatamente esses produtos', destino: { tipo: 'produtos', filtro: { semKit: true } } },
    { id: 'essencial', icone: 'lista-conferida', valor: media.texto, semBase: media.semBase, rotulo: 'Essencial preenchido', complemento: 'Média · obrigatórios + importantes',
      dica: 'Média do preenchimento de obrigatórios + importantes. Abrir os produtos com essencial incompleto, menor preenchimento primeiro',
      destino: { tipo: 'produtos', filtro: FILTRO_ESSENCIAL_INCOMPLETO } },
    { id: 'sem_foto', icone: 'imagem-riscada', valor: inteiro(sf), rotulo: 'Produtos sem foto', complemento: '',
      dica: 'Produtos ativos sem foto (as fotos são cuidadas no app). Abrir exatamente esses produtos', destino: { tipo: 'produtos', filtro: { semFoto: true } } },
    // 840 = ocorrências de conferência (sugestões + campos fora da ficha), NÃO produtos: o rótulo e a dica dizem isso
    { id: 'pendencias', icone: 'prancheta', valor: inteiro(pend), rotulo: 'Pendências de conferência', complemento: `${inteiro(sug)} sugestões · ${inteiro(fora)} fora da ficha`,
      dica: 'Ocorrências a conferir (não é número de produtos): sugestões + campos com valor fora da ficha. Abrir a Conferência', destino: { tipo: 'conferencia' } },
  ];
}

// ── cobertura por subcategoria (uma linha por subcategoria) ──────────────────────────────────────────────────────────────────────────
export interface LinhaCobertura {
  chave: string; categoria: string; subcategoria: string | null;
  produtos: number; comKit: number; semKit: number;
  /** razão EXATA (0–1) para ordenar; o texto arredonda como antes (inteiro) */ comKitRazao: number | null;
  essencial: number | null;
}
export function linhasCobertura(cob: readonly ItemCobertura[]): LinhaCobertura[] {
  return cob.map((s) => {
    const ativos = numero(s.ativos) ?? 0; const ck = numero(s.com_kit) ?? 0;
    return { chave: `${s.categoria}|${s.subcategoria ?? ''}`, categoria: s.categoria, subcategoria: s.subcategoria, produtos: ativos, comKit: ck,
      semKit: Math.max(0, ativos - ck), comKitRazao: ativos > 0 ? ck / ativos : null, essencial: s.essencial_medio === null ? null : numero(s.essencial_medio) };
  });
}
/** "100%" / "0%" / "67%": a mesma precisão de antes (inteiro); null = "—". */
export const pctKit = (r: number | null): string => (r === null ? '—' : `${Math.round(100 * r)}%`);

/**
 * Catálogo do "Colunas": SÓ o que o servidor já entrega POR SUBCATEGORIA (ProdutosLeitura::visaoGeral → cobertura[]: categoria, subcategoria,
 * ativos, com_kit, essencial_medio) e o que sai deles por uma regra já definida. "Sem kit específico (produtos)" = ativos − com_kit: no servidor,
 * com_kit conta kits_especificos > 0 e o cartão sem_kit conta kits_especificos = 0 dos MESMOS ativos — a soma das linhas = o cartão (testado).
 * DESCARTADAS (sem agregação por subcategoria definida; listadas no LEIA-ME): sem foto, obrigatórios vazios, fora da ficha, sugestões,
 * preenchimento completo/geral, fotos, kits por nome.
 */
export type IdColuna = 'subcategoria' | 'categoria' | 'produtos' | 'com_kit_pct' | 'com_kit_n' | 'sem_kit_n' | 'essencial';
export interface DefColuna { id: IdColuna; rotulo: string; inicial: boolean; fixa?: boolean; origem: string }
export const COLUNAS_COBERTURA: readonly DefColuna[] = [
  { id: 'subcategoria', rotulo: 'Subcategoria', inicial: true, fixa: true, origem: 'cobertura[].subcategoria' },
  { id: 'categoria', rotulo: 'Categoria', inicial: false, origem: 'cobertura[].categoria' },
  { id: 'produtos', rotulo: 'Produtos', inicial: true, origem: 'cobertura[].ativos' },
  { id: 'com_kit_pct', rotulo: 'Com kit específico', inicial: true, origem: 'cobertura[].com_kit ÷ ativos' },
  { id: 'com_kit_n', rotulo: 'Com kit específico (produtos)', inicial: false, origem: 'cobertura[].com_kit' },
  { id: 'sem_kit_n', rotulo: 'Sem kit específico (produtos)', inicial: false, origem: 'ativos − com_kit (mesma regra do indicador)' },
  { id: 'essencial', rotulo: 'Essencial médio', inicial: true, origem: 'cobertura[].essencial_medio' },
];
export const colunasIniciais = (): IdColuna[] => COLUNAS_COBERTURA.filter((c) => c.inicial).map((c) => c.id);
/** Preferência salva → só ids conhecidos, na ordem do catálogo, com as fixas sempre presentes. Lixo/ausente = configuração inicial. */
export function colunasValidas(salvo: unknown): IdColuna[] {
  if (!Array.isArray(salvo)) return colunasIniciais();
  const pedidas = new Set(salvo.filter((x): x is string => typeof x === 'string'));
  const ids = COLUNAS_COBERTURA.filter((c) => c.fixa || pedidas.has(c.id)).map((c) => c.id);
  return ids.length > 1 ? ids : colunasIniciais();
}
/** Liga/desliga uma coluna (as fixas não saem). */
export function alternarColuna(atuais: readonly IdColuna[], id: IdColuna): IdColuna[] {
  const def = COLUNAS_COBERTURA.find((c) => c.id === id); if (!def || def.fixa) return [...atuais];
  const set = new Set(atuais); if (set.has(id)) set.delete(id); else set.add(id);
  return COLUNAS_COBERTURA.filter((c) => set.has(c.id)).map((c) => c.id);
}
export const CHAVE_PREFERENCIA_COLUNAS = 'at.visao-geral.colunas.v1';

/** "36 subcategorias" / "1 subcategoria". */
export const textoSubcategorias = (n: number): string => `${n.toLocaleString('pt-BR')} ${n === 1 ? 'subcategoria' : 'subcategorias'}`;
