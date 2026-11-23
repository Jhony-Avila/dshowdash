// KITS V2 (19/11) — testes das funções puras de src/lib/kits.ts. Rodar: bash scripts/atributos/testes/kits-puras.sh
import * as K from '../../../public/components/panels/panel-atributos/src/lib/kits';
import type { ItemKit, KitResumo } from '../../../public/components/panels/panel-atributos/src/lib/tipos';

let n = 0; let falhas = 0;
function igual(nome: string, obtido: unknown, esperado: unknown) {
  n++; if (JSON.stringify(obtido) !== JSON.stringify(esperado)) { falhas++; console.log(`[ERRO] ${nome}: obtido ${JSON.stringify(obtido)} · esperado ${JSON.stringify(esperado)}`); }
}
const e = (categoria: string, subcategoria: string) => ({ categoria, subcategoria, produtos: 1 });

// ── escopo numa linha ──
igual('vazio = —', K.resumoEscopo([]).curto, '—');
igual('vazio marcado', K.resumoEscopo([]).vazio, true);
igual('1 item = o nome', K.resumoEscopo([e('PAINEIS_LED', 'CABOS')]).extras, 0);
igual('2 itens = "A; B" (sem +N)', K.resumoEscopo([e('X', 'TOTENS'), e('X', 'CAVALETES')]).extras, 0);
igual('2 itens com ;', K.resumoEscopo([e('X', 'TOTENS'), e('X', 'CAVALETES')]).curto.includes('; '), true);
igual('4 itens = 1º +3', K.resumoEscopo([e('X', 'A1'), e('X', 'B1'), e('X', 'C1'), e('X', 'D1')]).extras, 3);
igual('4 itens: completo com os 4', K.resumoEscopo([e('X', 'A1'), e('X', 'B1'), e('X', 'C1'), e('X', 'D1')]).completo.length, 4);
igual('categoria inteira vem primeiro', K.ordenarEscopos([e('X', 'Z1'), e('Y', '')])[0].subcategoria, '');
igual('categoria inteira dita no completo', K.rotuloEscopoCompleto(e('Y', '')).endsWith('(categoria inteira)'), true);
igual('resumo não muda a lista salva (entrada intacta)', (() => { const l = [e('X', 'B1'), e('X', 'A1'), e('X', 'C1')]; K.resumoEscopo(l); return l.map((x) => x.subcategoria); })(), ['B1', 'A1', 'C1']);

// ── colunas ──
igual('padrão da lista = mockup', K.colunasPadrao(K.COLUNAS_LISTA), ['kit', 'itens', 'escopo', 'aplica_a_todos', 'alcance', 'situacao', 'acoes']);
igual('fixas não saem', K.alternarColuna(K.COLUNAS_LISTA, K.colunasPadrao(K.COLUNAS_LISTA), 'kit').includes('kit'), true);
igual('ações não saem', K.alternarColuna(K.COLUNAS_LISTA, K.colunasPadrao(K.COLUNAS_LISTA), 'acoes').includes('acoes'), true);
igual('liga Descrição na ordem do catálogo', K.alternarColuna(K.COLUNAS_LISTA, K.colunasPadrao(K.COLUNAS_LISTA), 'descricao').slice(0, 2), ['kit', 'descricao']);
igual('preferência inválida = padrão + fixas', K.colunasValidas(K.COLUNAS_LISTA, ['xyz', 'diretos']), ['kit', 'diretos', 'acoes']);
igual('preferência ilegível = padrão', K.colunasValidas(K.COLUNAS_LISTA, 'lixo'), K.colunasPadrao(K.COLUNAS_LISTA));
igual('alcance: Produto fixo', K.alternarColuna(K.COLUNAS_ALCANCE, K.colunasPadrao(K.COLUNAS_ALCANCE), 'produto').includes('produto'), true);

// ── filtro / agrupar ──
const kits = [{ id: 1, nome: 'Cabos', ativo: true, aplica_a_todos: false }, { id: 2, nome: 'Integrações', ativo: false, aplica_a_todos: true }] as unknown as KitResumo[];
igual('situação ativos', K.filtrarKits(kits, 'ativos', '').map((k) => k.id), [1]);
igual('situação inativos', K.filtrarKits(kits, 'inativos', '').map((k) => k.id), [2]);
igual('situação todos', K.filtrarKits(kits, 'todos', '').map((k) => k.id), [1, 2]);
igual('busca sem acento', K.filtrarKits(kits, 'todos', 'integracoes').map((k) => k.id), [2]);
igual('agrupar por situação', K.grupoDoKit('situacao', kits[1]), 'inativo');
igual('agrupar por aplica a todos', K.grupoDoKit('aplica_a_todos', kits[1]), 'sim');
igual('sem agrupamento = plano', K.gruposKits('nenhum'), null);

// ── composição: ordem é dado do kit ──
igual('mover 0→2', K.moverItem(['a', 'b', 'c'], 0, 2), ['b', 'c', 'a']);
igual('mover fora do limite não muda', K.moverItem(['a', 'b'], 1, 2), ['a', 'b']);
igual('1ª não sobe', K.podeSubir(0), false);
igual('última não desce', K.podeDescer(7, 8), false);
igual('meio sobe e desce', [K.podeSubir(3), K.podeDescer(3, 8)], [true, true]);
const item = (p: Partial<ItemKit>) => ({ atributo_id: 1, rotulo: 'X', codigo: 'x', tipo: 'numero', atributo_ativo: 1, posicao: 1, obrigatorio: 0, visivel: 1, destaque: 0, importancia: null,
  unidade_id: null, unidade: null, unidade_padrao: 'mês', unidade_padrao_id: 9, importancia_padrao: 'importante', legado_id: null, versao: 1, ...p }) as ItemKit;
igual('unidade herdada = "Padrão (mês)"', K.rotuloUnidadeKit(item({})), 'Padrão (mês)');
igual('unidade sobrescrita = o símbolo', K.rotuloUnidadeKit(item({ unidade_id: 3, unidade: 'ano' })), 'ano');
igual('não numérico = —', K.rotuloUnidadeKit(item({ tipo: 'texto' })), '—');
igual('herança NUNCA vira sobrescrita no envio', K.corpoItens([item({})])[0].unidade_id, null);
igual('importância herdada vai null', K.corpoItens([item({})])[0].importancia, null);
igual('sobrescrita vai como está', K.corpoItens([item({ unidade_id: 3, importancia: 'obrigatorio' as ItemKit['importancia'] })])[0], { atributo_id: 1, posicao: 1, obrigatorio: 0, visivel: 1, destaque: 0, importancia: 'obrigatorio', unidade_id: 3 });
igual('posição = ordem da lista', K.corpoItens([item({ atributo_id: 7, posicao: 9 }), item({ atributo_id: 8, posicao: 1 })]).map((i) => [i.atributo_id, i.posicao]), [[7, 1], [8, 2]]);

// ── origens (legenda da Matriz) ──
igual('coexistem na ordem fixa', K.origensDoAlcance(['todos', 'escopo']), ['escopo', 'todos']);
igual('texto Subcat. + Todos', K.textoOrigens(['todos', 'escopo']), 'Subcat. + Todos');
igual('desconhecida ignorada', K.origensDoAlcance(['xyz', 'direto']), ['direto']);
igual('cores = classes da Matriz', ['escopo', 'direto', 'todos'].map((o) => K.ORIGEM[o as K.Origem].classe), ['subcat', 'direto', 'todos']);

// ── foi salvo: conferir gravação ──
igual('aplicada confirma', K.faseDoConferir('aplicada').confirmado, true);
igual('sem_mudanca confirma sem mudança', [K.faseDoConferir('sem_mudanca').confirmado, K.faseDoConferir('sem_mudanca').semMudanca], [true, true]);
igual('em_andamento continua incerto', K.faseIncerta(K.faseDoConferir('em_andamento').fase), true);
igual('nao_encontrada NÃO prova "não salvo"', K.faseDoConferir('nao_encontrada').fase, 'desconhecido');
igual('interrompida = não gravou, pode repetir', [K.faseDoConferir('interrompida').fase, K.faseDoConferir('interrompida').podeRepetir], ['recusada', true]);
igual('nao_aplicada = recusada', K.faseDoConferir('nao_aplicada').fase, 'recusada');
igual('salvo não é incerto', K.faseIncerta('salvo'), false);

console.log(falhas ? `[FALHA] kits-puras: ${n} casos, ${falhas} falha(s)` : `[OK]   kits-puras (escopo, colunas, filtro, composição, herança, origens, conferir): ${n} casos, 0 falha(s)`);
if (falhas) process.exit(1);
