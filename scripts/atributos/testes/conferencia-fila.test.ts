// CONFERÊNCIA V2 (ESQUERDA, 23/11) — lógica pura das filas (screens/conferencia/fila.ts). Rodar: bash scripts/atributos/testes/conferencia-fila.sh
import { anterior, contar, elegiveis, faixa, motivoLegivel, PAGINAS0, paginasTotais, proxima, resultadoDaConferencia, resultadoDoLote, situacao, textoAtual, textoFora, textoSugerido,
  type ItemFila } from '../../../public/components/panels/panel-atributos/src/screens/conferencia/fila';

let n = 0; let falhas = 0;
const igual = (nome: string, obtido: unknown, esperado: unknown) => { n++; if (JSON.stringify(obtido) !== JSON.stringify(esperado)) { falhas++; console.log(`[ERRO] ${nome}: obtido ${JSON.stringify(obtido)} · esperado ${JSON.stringify(esperado)}`); } };
const base: ItemFila = { id: 1, product_id: 27, produto: 'P', atributo_id: 9, atributo: 'Pitch', atributo_alternativo_id: null, atributo_alternativo: null, fonte: 'nome_produto', tipo: 'valor',
  valor_proposto: '2.5', unidade: 'mm', confianca: 'media', evidencia: 'x', versao: 1, estado: 'pendente', decidido_por: null, decidido_em: null, motivo: null, substitui_id: null,
  destino_atual: { estado: 'vazio' }, alternativo_atual: null, aceite_bloqueado: null, a_conferir: null };
const it = (o: Partial<ItemFila>): ItemFila => ({ ...base, ...o });

// textoAtual / textoSugerido
igual('vazio → Sem valor', textoAtual({ estado: 'vazio' }), 'Sem valor');
igual('número com unidade', textoAtual({ estado: 'informado', numero: '3000', unidade: 'Hz' }), `${(3000).toLocaleString('pt-BR')} Hz`);
igual('opções', textoAtual({ estado: 'informado', opcoes: ['Indoor', 'Outdoor'] }), 'Indoor, Outdoor');
igual('não se aplica', textoAtual({ estado: 'nao_se_aplica' }), 'Não se aplica');
igual('booleano', textoAtual({ estado: 'informado', booleano: false }), 'Não');
igual('sugerido decimal', textoSugerido(it({ valor_proposto: '2.5', unidade: 'mm' })), '2,5 mm');

// situação: resultado desta tela > a_conferir do servidor > estado > bloqueio
igual('pendente', situacao(it({}), undefined).rotulo, 'Pendente');
igual('com valor', situacao(it({ aceite_bloqueado: 'COM_VALOR' }), undefined).rotulo, 'Com valor');
igual('a conferir do servidor', situacao(it({ a_conferir: { chave: 'k' } }), undefined).rotulo, 'A conferir');
igual('aplicada aceita', situacao(it({}), { id: 1, desfecho: 'aplicada', estado_atual: 'aceita' }).rotulo, 'Aceita');
igual('não aplicada NUNCA vira "Recusada"', situacao(it({}), { id: 1, desfecho: 'nao_aplicada', motivo: 'CONFLICT' }).rotulo, 'Não aplicada');
igual('erro técnico pendente = A conferir', situacao(it({}), { id: 1, desfecho: 'pendente', motivo: 'erro_tecnico' }).rotulo, 'A conferir');
igual('ignorada', situacao(it({ estado: 'ignorada' }), undefined).rotulo, 'Ignorada');
igual('Q-CONF.1: fora da ficha → pílula "Fora da ficha" com a dica', [situacao(it({ aceite_bloqueado: 'FORA_DA_FICHA' }), undefined).rotulo, situacao(it({ aceite_bloqueado: 'FORA_DA_FICHA' }), undefined).dica],
  ['Fora da ficha', 'Este atributo não está na ficha do produto. Vincule na fila Fora da ficha.']);
igual('Q-CONF.1: fora da ficha fica fora do Aceitar, mas entra em Recusar e Ignorar', [elegiveis('aceitar', [it({ id: 20, aceite_bloqueado: 'FORA_DA_FICHA' })], {}).fora[0]?.motivo,
  elegiveis('recusar', [it({ id: 20, aceite_bloqueado: 'FORA_DA_FICHA' })], {}).vao.length, elegiveis('ignorar', [it({ id: 20, aceite_bloqueado: 'FORA_DA_FICHA' })], {}).vao.length], ['fora da ficha', 1, 1]);

// elegibilidade da seleção (prancha 05: 6 selecionadas · 4 aceitas · 1 com valor e 1 a conferir fora)
const sel = [it({ id: 1 }), it({ id: 2 }), it({ id: 3 }), it({ id: 4 }), it({ id: 5, aceite_bloqueado: 'COM_VALOR' }), it({ id: 6, a_conferir: { chave: 'k' } })];
const e = elegiveis('aceitar', sel, {});
igual('aceitar: 4 vão', e.vao.map((x) => x.id), [1, 2, 3, 4]);
igual('aceitar: escopo explicado', textoFora(e.fora), '1 com valor e 1 a conferir');
igual('recusar: com valor pode ser recusada; a conferir não', elegiveis('recusar', sel, {}).vao.map((x) => x.id), [1, 2, 3, 4, 5]);
igual('já decidida nesta tela fica fora', elegiveis('ignorar', [it({ id: 7 })], { 7: { id: 7, desfecho: 'aplicada', estado_atual: 'recusada' } }).fora[0]?.motivo, 'já decidida');
igual('devolver só ignoradas', elegiveis('devolver', [it({ id: 8, estado: 'ignorada' }), it({ id: 9 })], {}).vao.map((x) => x.id), [8]);
igual('reabrir só recusadas', elegiveis('reabrir', [it({ id: 10, estado: 'recusada' }), it({ id: 11, estado: 'ignorada' })], {}).vao.map((x) => x.id), [10]);

// resultado do lote
const r = resultadoDoLote([{ id: 1, desfecho: 'aplicada', estado_atual: 'aceita' }, { id: 2, desfecho: 'nao_aplicada', motivo: 'VALUE_EXISTS' }, { id: 3, desfecho: 'pendente', motivo: 'erro_tecnico' }], [1, 2, 3, 4], [5, 6]);
igual('resultado por item', [r[1].desfecho, r[2].desfecho, r[3].desfecho, r[4].desfecho, r[5].desfecho], ['aplicada', 'nao_aplicada', 'pendente', 'a_conferir', 'nao_enviada']);
igual('contar', contar(r), { aplicadas: 1, nao_aplicadas: 1, a_conferir: 2, nao_enviadas: 2 });
igual('contar só o lote atual (ids)', contar(r, [3, 4]), { aplicadas: 0, nao_aplicadas: 0, a_conferir: 2, nao_enviadas: 0 });
igual('conferir (itens do livro)', resultadoDaConferencia([{ item: '1', desfecho: 'aplicada', detalhe: { estado_atual: 'ignorada' } }, { item: '2', desfecho: 'pendente' }], [1, 2])[1].estado_atual, 'ignorada');
igual('motivo legível VALUE_EXISTS', motivoLegivel({ motivo: 'VALUE_EXISTS' }).startsWith('O campo já tem valor'), true);
igual('motivo legível pendente_existente', motivoLegivel({ motivo: 'CONFLICT', detalhe: 'pendente_existente' }).includes('mais nova em aberto'), true);

// paginação por cursor (pilha; nunca posição)
let p = PAGINAS0; p = proxima(p, 'c2'); p = proxima(p, 'c3');
igual('pilha de cursores', p, { cursores: [null, 'c2', 'c3'], indice: 2 });
p = anterior(p); igual('anterior volta na pilha', p.indice, 1);
p = proxima(p, 'c3b'); igual('próxima depois de voltar substitui o resto', p.cursores, [null, 'c2', 'c3b']);
igual('sem próximo cursor não avança', proxima(p, null), p);
igual('faixa 1–50 de 567', faixa(PAGINAS0, 50, 567), '1–50 de 567');
igual('faixa página 12', faixa({ cursores: [], indice: 11 }, 17, 567), '551–567 de 567');
igual('páginas totais', paginasTotais(567), 12);

console.log(`${falhas === 0 ? '[OK]  ' : '[ERRO]'} conferencia-fila (lógica pura da fila V2): ${n} casos, ${falhas} falha(s)`);
process.exit(falhas === 0 ? 0 : 1);
