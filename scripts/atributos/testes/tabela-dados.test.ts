// TabelaDados (18/11) — testes da ordenação pura (src/lib/ordenar.ts) usada por todas as tabelas do módulo.
// Rodar: bash scripts/atributos/testes/tabela-dados.sh (esbuild do Vite + Node; sem dependência nova).
// As especificações abaixo espelham as 9 colunas da tela Atributos (Dicionario.tsx: valor/tipo/comparador); o teste de
// navegador (validacao/shell-esquerda/teste-tabela-dados.cjs) confere as colunas reais na tela.
import { agruparOrdenado, alternarOrdenacao, ariaSort, comparadorPorLista, GRUPO_OUTROS, manterOrdem, compararTexto, ehVazio, ordenarLinhas, type Direcao, type EspecOrdenacao } from '../../../public/components/panels/panel-atributos/src/lib/ordenar';
import { IMPORTANCIAS, TIPO } from '../../../public/components/panels/panel-atributos/src/lib/rotulos';

let n = 0; let falhas = 0;
function igual(nome: string, obtido: unknown, esperado: unknown) {
  n++;
  if (JSON.stringify(obtido) !== JSON.stringify(esperado)) { falhas++; console.log(`[ERRO] ${nome}: obtido ${JSON.stringify(obtido)} · esperado ${JSON.stringify(esperado)}`); }
}

// ── básico: número × texto, vazios no fim, estabilidade ───────────────────────────────────────────────────────────────
type L = { id: number; v: unknown };
const ids = (ls: L[]) => ls.map((l) => l.id);
const num: EspecOrdenacao<L> = { valor: (l) => l.v, tipo: 'numero' };
const txt: EspecOrdenacao<L> = { valor: (l) => l.v, tipo: 'texto' };
const nums: L[] = [{ id: 1, v: 10 }, { id: 2, v: 9 }, { id: 3, v: null }, { id: 4, v: '100' }, { id: 5, v: 0 }, { id: 6, v: undefined }, { id: 7, v: '' }, { id: 8, v: 2 }];
igual('número ▲: 0 < 2 < 9 < 10 < 100 (não "10" < "9"), vazios no fim', ids(ordenarLinhas(nums, num, 'asc')), [5, 8, 2, 1, 4, 3, 6, 7]);
igual('número ▼: 100 > 10 > 9 > 2 > 0, vazios CONTINUAM no fim', ids(ordenarLinhas(nums, num, 'desc')), [4, 1, 2, 8, 5, 3, 6, 7]);
igual('número inválido (texto) conta como vazio', ehVazio('abc', 'numero'), true);
igual('zero NÃO é vazio', ehVazio(0, 'numero'), false);
igual('só espaços é vazio', ehVazio('   '), true);
const mesmos: L[] = ['10', '9', '100'].map((v, i) => ({ id: i, v }));
igual('o mesmo dado como TEXTO usa ordem natural (numeric: true): 9 < 10 < 100', ids(ordenarLinhas(mesmos, txt, 'asc')), [1, 0, 2]);
const textos: L[] = [{ id: 1, v: 'Ângulo' }, { id: 2, v: 'abertura' }, { id: 3, v: null }, { id: 4, v: 'Zíper' }, { id: 5, v: 'cabo 10' }, { id: 6, v: 'Cabo 2' }, { id: 7, v: '' }, { id: 8, v: 'éter' }];
igual('texto ▲ pt-BR: acento e caixa não mudam a ordem; "Cabo 2" < "cabo 10"; vazios no fim', ids(ordenarLinhas(textos, txt, 'asc')), [2, 1, 6, 5, 8, 4, 3, 7]);
igual('texto ▼: inverso, vazios no fim', ids(ordenarLinhas(textos, txt, 'desc')), [4, 8, 5, 6, 1, 2, 3, 7]);
igual('compararTexto = localeCompare(pt-BR, base, numeric)', ['a', 'Á', 'b', 'item 2', 'item 10'].map((x, i, arr) => Math.sign(compararTexto(x, arr[(i + 1) % arr.length]))),
  ['a', 'Á', 'b', 'item 2', 'item 10'].map((x, i, arr) => Math.sign(x.localeCompare(arr[(i + 1) % arr.length], 'pt-BR', { sensitivity: 'base', numeric: true }))));
const empates: L[] = [{ id: 1, v: 'b' }, { id: 2, v: 'A' }, { id: 3, v: 'a' }, { id: 4, v: 'B' }, { id: 5, v: 'á' }, { id: 6, v: null }, { id: 7, v: null }];
igual('estável ▲: empates (a/A/á) mantêm a ordem de entrada', ids(ordenarLinhas(empates, txt, 'asc')), [2, 3, 5, 1, 4, 6, 7]);
igual('estável ▼: empates mantêm a ordem de entrada (não são invertidos)', ids(ordenarLinhas(empates, txt, 'desc')), [1, 4, 2, 3, 5, 6, 7]);
igual('vazios mantêm a ordem de entrada entre si', ids(ordenarLinhas([{ id: 9, v: '' }, { id: 8, v: null }, { id: 7, v: undefined }], txt, 'desc')), [9, 8, 7]);
const entrada = [...nums]; ordenarLinhas(entrada, num, 'desc');
igual('não altera o array de entrada', ids(entrada), ids(nums));
igual('estável em lista grande (2.000 linhas, 3 valores)', (() => {
  const g = Array.from({ length: 2000 }, (_, i) => ({ id: i, v: ['x', 'y', 'z'][i % 3] }));
  const o = ordenarLinhas(g, txt, 'desc'); return o.every((l, i) => i === 0 || o[i - 1].v !== l.v || o[i - 1].id < l.id);
})(), true);

// ── clique no título e aria-sort ───────────────────────────────────────────────────────────────────────────────────────
igual('1º clique = crescente', alternarOrdenacao(null, 'rotulo'), { chave: 'rotulo', direcao: 'asc' });
igual('2º clique = decrescente', alternarOrdenacao({ chave: 'rotulo', direcao: 'asc' }, 'rotulo'), { chave: 'rotulo', direcao: 'desc' });
igual('3º clique volta a crescente', alternarOrdenacao({ chave: 'rotulo', direcao: 'desc' }, 'rotulo'), { chave: 'rotulo', direcao: 'asc' });
igual('outra coluna começa crescente', alternarOrdenacao({ chave: 'rotulo', direcao: 'desc' }, 'em_kits'), { chave: 'em_kits', direcao: 'asc' });
igual('aria-sort', [ariaSort({ chave: 'a', direcao: 'asc' }, 'a'), ariaSort({ chave: 'a', direcao: 'desc' }, 'a'), ariaSort({ chave: 'a', direcao: 'asc' }, 'b'), ariaSort(null, 'a')],
  ['ascending', 'descending', 'none', 'none']);

// ── as 9 colunas da tela Atributos, nos dois sentidos ──────────────────────────────────────────────────────────────────
type A = { id: number; rotulo: string; codigo: string; tipo: string; unidade: string | null; grupo_atributos: string | null; importancia_padrao: string | null; em_kits: number; produtos_com_valor: number; ativo: number };
const ATR: A[] = [
  { id: 1, rotulo: 'Peso', codigo: 'peso', tipo: 'numero', unidade: 'kg', grupo_atributos: 'Físico', importancia_padrao: 'importante', em_kits: 12, produtos_com_valor: 300, ativo: 1 },
  { id: 2, rotulo: 'Ângulo de visão', codigo: 'angulo_visao', tipo: 'inteiro', unidade: '°', grupo_atributos: null, importancia_padrao: 'obrigatorio', em_kits: 2, produtos_com_valor: 45, ativo: 1 },
  { id: 3, rotulo: 'cor', codigo: 'cor', tipo: 'opcao', unidade: null, grupo_atributos: 'Aparência', importancia_padrao: 'opcional', em_kits: 100, produtos_com_valor: 9, ativo: 0 },
  { id: 4, rotulo: 'Bitola', codigo: 'bitola_2', tipo: 'texto', unidade: 'mm', grupo_atributos: 'Físico', importancia_padrao: null, em_kits: 0, produtos_com_valor: 0, ativo: 1 },
  { id: 5, rotulo: 'Bitola', codigo: 'bitola_10', tipo: 'booleano', unidade: null, grupo_atributos: 'Elétrico', importancia_padrao: 'basico', em_kits: 9, produtos_com_valor: 1000, ativo: 0 },
];
const COLS: Record<string, EspecOrdenacao<A>> = {
  rotulo: { valor: (a) => a.rotulo, tipo: 'texto' },
  codigo: { valor: (a) => a.codigo, tipo: 'texto' },
  tipo: { valor: (a) => TIPO[a.tipo] ?? a.tipo, tipo: 'texto' },
  unidade: { valor: (a) => a.unidade, tipo: 'texto' },
  grupo_atributos: { valor: (a) => a.grupo_atributos, tipo: 'texto' },
  importancia_padrao: { valor: (a) => a.importancia_padrao, tipo: 'texto', comparador: comparadorPorLista(IMPORTANCIAS) },
  em_kits: { valor: (a) => a.em_kits, tipo: 'numero' },
  produtos_com_valor: { valor: (a) => a.produtos_com_valor, tipo: 'numero' },
  situacao: { valor: (a) => (a.ativo ? 'Ativo' : 'Inativo'), tipo: 'texto' },
};
const ESPERADO: Record<string, Record<Direcao, number[]>> = {
  rotulo: { asc: [2, 4, 5, 3, 1], desc: [1, 3, 4, 5, 2] },                        // Bitola×2 empatam: ordem de entrada nos dois sentidos
  codigo: { asc: [2, 4, 5, 3, 1], desc: [1, 3, 5, 4, 2] },                        // bitola_2 < bitola_10 (numeric)
  tipo: { asc: [2, 1, 3, 5, 4], desc: [4, 5, 3, 1, 2] },                          // Inteiro < Número < Opção < Sim/Não < Texto (pelo rótulo exibido)
  unidade: { asc: [2, 1, 4, 3, 5], desc: [4, 1, 2, 3, 5] },                       // ° < kg < mm; sem unidade no fim
  grupo_atributos: { asc: [3, 5, 1, 4, 2], desc: [1, 4, 5, 3, 2] },               // sem grupo no fim
  importancia_padrao: { asc: [2, 1, 5, 3, 4], desc: [3, 5, 1, 2, 4] },            // ordem lógica; sem padrão no fim
  em_kits: { asc: [4, 2, 5, 1, 3], desc: [3, 1, 5, 2, 4] },                       // 0 < 2 < 9 < 12 < 100 (numérico)
  produtos_com_valor: { asc: [4, 3, 2, 1, 5], desc: [5, 1, 2, 3, 4] },            // 0 < 9 < 45 < 300 < 1000
  situacao: { asc: [1, 2, 4, 3, 5], desc: [3, 5, 1, 2, 4] },
};
for (const [chave, esp] of Object.entries(COLS)) for (const d of ['asc', 'desc'] as Direcao[])
  igual(`coluna ${chave} ${d === 'asc' ? '▲' : '▼'}`, ordenarLinhas(ATR, esp, d).map((a) => a.id), ESPERADO[chave][d]);
igual('importância é lógica, não alfabética (alfabético daria Básico < Importante < Obrigatório < Opcional)',
  ordenarLinhas(ATR, COLS.importancia_padrao, 'asc').map((a) => a.importancia_padrao), ['obrigatorio', 'importante', 'basico', 'opcional', null]);
igual('ordem lógica completa da importância', ordenarLinhas(['sem_importancia', 'opcional', 'complementar', 'basico', 'importante', 'obrigatorio'].map((v, i) => ({ id: i, v })), { valor: (l) => l.v, tipo: 'texto', comparador: comparadorPorLista(IMPORTANCIAS) }, 'asc').map((l) => l.v),
  ['obrigatorio', 'importante', 'basico', 'complementar', 'opcional', 'sem_importancia']);

// ── filtro + ordenação mantida: ordenar(filtrar(x)) = filtrar(ordenar(x)) (a ordem não depende do filtro) ────────────
for (const [chave, esp] of Object.entries(COLS)) for (const d of ['asc', 'desc'] as Direcao[]) {
  const filtro = (a: A) => a.ativo === 1 || a.em_kits > 50;
  igual(`filtro + ${chave} ${d}: mesma ordem antes ou depois de filtrar`, ordenarLinhas(ATR.filter(filtro), esp, d).map((a) => a.id), ordenarLinhas(ATR, esp, d).filter(filtro).map((a) => a.id));
}
const busca = (t: string) => ATR.filter((a) => a.rotulo.toLowerCase().includes(t));
igual('busca muda, ordenação (em_kits ▼) mantida', ordenarLinhas(busca('bitola'), COLS.em_kits, 'desc').map((a) => a.id), [5, 4]);

// ── grupos: ordenação DENTRO de cada grupo, ordem dos grupos preservada, contagem, vazios, "Outros" ─────────────────────
type G = { id: number; g: string | null; v: number | null };
const GL: G[] = [{ id: 1, g: 'base', v: 5 }, { id: 2, g: 'kit', v: 1 }, { id: 3, g: 'base', v: 1 }, { id: 4, g: 'avulso', v: 9 }, { id: 5, g: 'kit', v: null },
  { id: 6, g: 'base', v: 3 }, { id: 7, g: 'x', v: 0 }, { id: 8, g: 'kit', v: 7 }];
const DEFS = [{ chave: 'kit', titulo: 'Kit Cabos' }, { chave: 'base', titulo: 'Base (todos os produtos)' }, { chave: 'avulso', titulo: 'Avulsos' }, { chave: 'vazio', titulo: 'Sem uso' }];
const espG: EspecOrdenacao<G> = { valor: (l) => l.v, tipo: 'numero' };
const resumo = (gs: { chave: string; linhas: G[] }[]) => gs.map((g) => `${g.chave}:${g.linhas.map((l) => l.id).join(',')}`);
igual('grupos ▲: ordem dos grupos = a dada; ordenação dentro de cada um; vazio dentro do grupo no fim; grupo desconhecido → Outros; grupo vazio some',
  resumo(agruparOrdenado(GL, DEFS, (l) => l.g, espG, 'asc')), ['kit:2,8,5', 'base:3,6,1', 'avulso:4', `${GRUPO_OUTROS}:7`]);
igual('grupos ▼: grupos NÃO são reordenados; só o miolo inverte (vazio continua no fim)',
  resumo(agruparOrdenado(GL, DEFS, (l) => l.g, espG, 'desc')), ['kit:8,2,5', 'base:1,6,3', 'avulso:4', `${GRUPO_OUTROS}:7`]);
igual('contagem por grupo', agruparOrdenado(GL, DEFS, (l) => l.g, espG, 'asc').map((g) => [g.titulo, g.linhas.length]),
  [['Kit Cabos', 3], ['Base (todos os produtos)', 3], ['Avulsos', 1], ['Outros', 1]]);
igual('mostrarVazios: grupo sem linhas aparece (na sua posição)', agruparOrdenado(GL.filter((l) => l.g !== 'x'), DEFS, (l) => l.g, espG, 'asc', true).map((g) => `${g.chave}=${g.linhas.length}`),
  ['kit=3', 'base=3', 'avulso=1', 'vazio=0']);
igual('sem ordenação: entrada preservada dentro do grupo', resumo(agruparOrdenado(GL, DEFS, (l) => l.g, null, 'asc')), ['kit:2,5,8', 'base:1,3,6', 'avulso:4', `${GRUPO_OUTROS}:7`]);

// ── ordem congelada (célula em edição): posições ficam, valores atualizam ─────────────────────────────────────────────
{
  const antes = agruparOrdenado(GL, DEFS, (l) => l.g, espG, 'asc');
  const editado = GL.map((l) => (l.id === 3 ? { ...l, v: 100 } : l));             // digitou na linha 3: pela regra iria para o fim de "base"
  const recalculado = agruparOrdenado(editado, DEFS, (l) => l.g, espG, 'asc');
  const cong = manterOrdem(antes, recalculado, (l) => l.id);
  igual('congelado: a linha editada NÃO muda de lugar', resumo(cong), resumo(antes));
  igual('congelado: usa o valor novo', cong[1].linhas[0].v, 100);
  igual('descongelado: a ordem nova se aplica', resumo(recalculado)[1], 'base:6,1,3');
  const outraOrdem = agruparOrdenado(editado, DEFS, (l) => l.g, espG, 'desc');   // mudou a ordenação durante a edição
  igual('congelado + troca de ordenação: nada se move', resumo(manterOrdem(antes, outraOrdem, (l) => l.id)), resumo(antes));
  const comNova = agruparOrdenado([...GL, { id: 9, g: 'base', v: 0 }], DEFS, (l) => l.g, espG, 'asc').map((g) => ({ ...g, linhas: g.linhas.filter((l) => l.id !== 4) }));
  igual('congelado: linha nova entra no fim do grupo; linha removida sai', resumo(manterOrdem(antes, comNova, (l) => l.id)), ['kit:2,8,5', 'base:3,6,1,9', 'avulso:', `${GRUPO_OUTROS}:7`]);
}

console.log(`${falhas === 0 ? '[OK]  ' : '[FALHA]'} tabela-dados (ordenação pura das tabelas): ${n} casos, ${falhas} falha(s)`);
process.exitCode = falhas === 0 ? 0 : 1;
