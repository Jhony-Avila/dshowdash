// Visão geral V2 (ESQUERDA, 19/11) — funções PURAS de src/lib/visaoGeral.ts: indicadores (valores, complementos, destinos = filtros da lista
// servida), "nunca 0 inventado" e média sem base, linhas da cobertura (sem kit = ativos − com kit; soma = o indicador), ordenação NUMÉRICA
// pelo valor de base sobre o conjunto inteiro (não por texto), catálogo/preferência do "Colunas" e filtro do clique da cobertura.
// Rodar: bash scripts/atributos/testes/visao-geral-puras.sh
import {
  alternarColuna, COLUNAS_COBERTURA, colunasIniciais, colunasValidas, filtroDaCobertura, FILTRO_ESSENCIAL_INCOMPLETO, indicadores, inteiro, linhasCobertura,
  mediaTexto, numero, pctKit, pctServidor, textoSubcategorias,
} from '../../../public/components/panels/panel-atributos/src/lib/visaoGeral';
import { ordenarLinhas } from '../../../public/components/panels/panel-atributos/src/lib/ordenar';
import type { VisaoGeral } from '../../../public/components/panels/panel-atributos/src/lib/tipos';

let n = 0; let falhas = 0;
function igual(nome: string, obtido: unknown, esperado: unknown) {
  n++; if (JSON.stringify(obtido) !== JSON.stringify(esperado)) { falhas++; console.log(`[ERRO] ${nome}: obtido ${JSON.stringify(obtido)} · esperado ${JSON.stringify(esperado)}`); }
}

// fixture com a forma do servidor (ProdutosLeitura::visaoGeral) e números coerentes entre si
const cob = [
  { categoria: 'LED', subcategoria: 'TOTENS', ativos: 67, com_kit: 67, essencial_medio: 2.9 },
  { categoria: 'LED', subcategoria: 'GABINETES', ativos: 33, com_kit: 33, essencial_medio: 6.9 },
  { categoria: 'SERV', subcategoria: 'ASSISTENCIA', ativos: 30, com_kit: 0, essencial_medio: 9.4 },
  { categoria: 'LED', subcategoria: 'CABOS', ativos: 27, com_kit: 27, essencial_medio: 12.6 },
  { categoria: 'DIV', subcategoria: null, ativos: 3, com_kit: 1, essencial_medio: null },
  { categoria: 'DIV', subcategoria: 'MOCHILAS', ativos: 1, com_kit: 0, essencial_medio: 0 },
] as VisaoGeral['cobertura'];
const ativos = cob.reduce((s, x) => s + x.ativos, 0); const comKit = cob.reduce((s, x) => s + x.com_kit, 0);
const cartoes = { ativos, com_kit: comKit, sem_kit: ativos - comKit, essencial_medio: 8.2, sem_foto: 34, pendencias: 840, sugestoes: 639, fora_da_ficha: 201, obrigatorios_vazios: 512 } as VisaoGeral['cartoes'];

// ── indicadores ──────────────────────────────────────────────────────────────────────────────────────────────────────────────
const ind = indicadores(cartoes);
igual('5 indicadores na ordem do mockup', ind.map((i) => i.id), ['ativos', 'sem_kit', 'essencial', 'sem_foto', 'pendencias']);
igual('valores do servidor, com separador pt-BR', ind.map((i) => i.valor), [inteiro(ativos), inteiro(ativos - comKit), '8,2%', '34', '840']);
igual('rótulos do mockup', ind.map((i) => i.rotulo), ['Produtos ativos', 'Sem kit específico', 'Essencial preenchido', 'Produtos sem foto', 'Pendências de conferência']);
igual('complementos', ind.map((i) => i.complemento), ['Catálogo Precifica', `${comKit} com kit`, 'Média · obrigatórios + importantes', '', '639 sugestões · 201 fora da ficha']);
igual('destinos = filtros da lista servida (regras da DIREITA)', ind.map((i) => i.destino), [
  { tipo: 'produtos', filtro: {} }, { tipo: 'produtos', filtro: { semKit: true } }, { tipo: 'produtos', filtro: FILTRO_ESSENCIAL_INCOMPLETO },
  { tipo: 'produtos', filtro: { semFoto: true } }, { tipo: 'conferencia' }]);
igual('pendências dizem que são ocorrências, não produtos', /não é número de produtos/.test(ind[4].dica), true);
igual('número ausente/inválido → "—" (nunca 0 inventado)', indicadores({ ...cartoes, sem_foto: undefined as unknown as number, pendencias: -1 }).map((i) => i.valor).slice(3), ['—', '—']);
igual('média sem base → "Sem base" neutro (nunca 0%)', [indicadores({ ...cartoes, essencial_medio: null }).find((i) => i.id === 'essencial')!.valor, indicadores({ ...cartoes, essencial_medio: null }).find((i) => i.id === 'essencial')!.semBase], ['Sem base', true]);
igual('média 0 (com base) → "0%"', mediaTexto(0).texto, '0%');
igual('numero(): só finito ≥ 0', [numero(3), numero(0), numero(-1), numero(NaN), numero('3'), numero(null)], [3, 0, null, null, null, null]);

// ── cobertura ────────────────────────────────────────────────────────────────────────────────────────────────────────────────
const L = linhasCobertura(cob);
igual('uma linha por subcategoria (inclusive a nula), dinâmica', [L.length, textoSubcategorias(L.length), textoSubcategorias(1)], [6, '6 subcategorias', '1 subcategoria']);
igual('sem kit (produtos) = ativos − com kit', L.map((l) => l.semKit), [0, 0, 30, 0, 2, 1]);
igual('soma de "sem kit" das linhas = indicador sem_kit (mesma regra)', L.reduce((s, l) => s + l.semKit, 0), cartoes.sem_kit);
igual('soma de "produtos" das linhas = indicador ativos', L.reduce((s, l) => s + l.produtos, 0), cartoes.ativos);
igual('percentual com kit: mesma precisão de antes (inteiro)', L.map((l) => pctKit(l.comKitRazao)), ['100%', '100%', '0%', '100%', '33%', '0%']);
igual('essencial: precisão do servidor com vírgula; sem base = "—"', L.map((l) => (l.essencial === null ? '—' : pctServidor(l.essencial))), ['2,9%', '6,9%', '9,4%', '12,6%', '—', '0%']);
// ordenação NUMÉRICA pelo valor de base, conjunto inteiro (texto ordenaria "100%" < "33%" e "12,6%" < "2,9%")
const porEss = ordenarLinhas(L, { valor: (l) => l.essencial, tipo: 'numero' }, 'desc').map((l) => l.essencial);
igual('ordenar essencial ▼ numérico, sem base no fim', porEss, [12.6, 9.4, 6.9, 2.9, 0, null]);
const porKitAsc = ordenarLinhas(L, { valor: (l) => l.comKitRazao, tipo: 'numero' }, 'asc').map((l) => pctKit(l.comKitRazao));
igual('ordenar com kit ▲ pela razão exata (33% entre 0% e 100%)', porKitAsc, ['0%', '0%', '33%', '100%', '100%', '100%']);
igual('produtos ▼ (configuração inicial)', ordenarLinhas(L, { valor: (l) => l.produtos, tipo: 'numero' }, 'desc').map((l) => l.produtos), [67, 33, 30, 27, 3, 1]);
igual('clique da cobertura: categoria + subcategoria', filtroDaCobertura(L[0]), { categoria: 'LED', subcategoria: 'TOTENS' });
igual('clique da cobertura: subcategoria nula = "Sem subcategoria" (≠ Todas)', filtroDaCobertura(L[4]), { categoria: 'DIV', semSubcategoria: true });

// ── "Colunas" ────────────────────────────────────────────────────────────────────────────────────────────────────────────────
igual('configuração inicial = as 4 do mockup', colunasIniciais(), ['subcategoria', 'produtos', 'com_kit_pct', 'essencial']);
igual('catálogo só com colunas reais por subcategoria (7)', COLUNAS_COBERTURA.map((c) => c.id), ['subcategoria', 'categoria', 'produtos', 'com_kit_pct', 'com_kit_n', 'sem_kit_n', 'essencial']);
igual('preferência inválida → inicial', [colunasValidas(null), colunasValidas('x'), colunasValidas([])], [colunasIniciais(), colunasIniciais(), colunasIniciais()]);
igual('preferência: ids desconhecidos caem, fixa entra, ordem do catálogo', colunasValidas(['essencial', 'nao_existe', 'categoria']), ['subcategoria', 'categoria', 'essencial']);
igual('ligar/desligar coluna', alternarColuna(alternarColuna(colunasIniciais(), 'sem_kit_n'), 'produtos'), ['subcategoria', 'com_kit_pct', 'sem_kit_n', 'essencial']);
igual('Subcategoria (fixa) não sai', alternarColuna(colunasIniciais(), 'subcategoria'), colunasIniciais());

console.log(`${falhas === 0 ? '[OK]  ' : '[FALHA]'} visao-geral-puras (indicadores, cobertura, ordenação numérica, Colunas): ${n} casos, ${falhas} falha(s)`);
process.exitCode = falhas === 0 ? 0 : 1;
