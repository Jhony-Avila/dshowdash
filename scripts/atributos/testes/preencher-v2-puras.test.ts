// PREENCHER V2 · ordenação por tipo (vazio no fim; zero e falso são valores; unidades pelo fator).
import { chaveOrdem, compararChaves } from '../../../public/components/panels/panel-atributos/src/lib/preencherOrdem';
let n = 0, f = 0; const ok = (nome: string, c: boolean) => { n++; if (!c) { f++; console.log('FALHA ' + nome); } };
const val = (x: Record<string, unknown>) => ({ estado: 'informado', texto: null, numero: null, booleano: null, data: null, opcao_ids: [], opcoes: [], unidade_id: null, origem: 'manual', lote_id: null, atualizado_em: '', atualizado_por: null, versao: 1, legado_bruto: null, ...x }) as never;
const un = [{ id: 1, simbolo: 'cm', nome: 'cm', grandeza: 'comprimento', fator_base: '0.01', ativo: 1 }, { id: 2, simbolo: 'm', nome: 'm', grandeza: 'comprimento', fator_base: '1', ativo: 1 }] as never[];
const it = (tipo: string, v: unknown) => ({ tipo, valor: v, unidades: un, opcoes: [{ id: 7, rotulo: 'Cobre', posicao: 1, ativo: true }] }) as never;
const ord = (xs: unknown[], dir: 1 | -1 = 1) => xs.map((x, k) => ({ k, c: chaveOrdem(x as never) })).sort((a, b) => compararChaves(a.c, b.c, dir) || a.k - b.k).map((x) => x.k);
ok('números: 100 cm < 2 m (fator da unidade)', JSON.stringify(ord([it('numero', val({ numero: '2', unidade_id: 2 })), it('numero', val({ numero: '100', unidade_id: 1 }))])) === '[1,0]');
ok('zero é valor (não vai para o fim); vazio vai', JSON.stringify(ord([it('numero', null), it('numero', val({ numero: '0', unidade_id: 1 })), it('numero', val({ numero: '5', unidade_id: 1 }))])) === '[1,2,0]');
ok('decrescente inverte os valores, mas vazio continua no fim', JSON.stringify(ord([it('numero', null), it('numero', val({ numero: '0' })), it('numero', val({ numero: '5' }))], -1)) === '[2,1,0]');
ok('booleano: Não (falso) < Sim; nulo no fim', JSON.stringify(ord([it('booleano', val({ booleano: true })), it('booleano', val({ booleano: null })), it('booleano', val({ booleano: false }))])) === '[2,0,1]');
ok('texto natural pt-BR: "Cabo 2" < "Cabo 10"', JSON.stringify(ord([it('texto', val({ texto: 'Cabo 10' })), it('texto', val({ texto: 'Cabo 2' }))])) === '[1,0]');
ok('estado gravado (Não se aplica) depois dos valores e antes do vazio', JSON.stringify(ord([it('texto', null), it('texto', val({ estado: 'nao_se_aplica' })), it('texto', val({ texto: 'a' }))])) === '[2,1,0]');
ok('opção pelo rótulo', chaveOrdem(it('opcao', val({ opcao_ids: [7] }))).txt === 'Cobre');
console.log(`${f ? '[ERRO]' : '[OK]  '} preencher-v2-puras (ordenação por tipo): ${n} casos, ${f} falha(s)`); process.exit(f ? 1 : 0);
