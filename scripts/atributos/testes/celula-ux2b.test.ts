// UX-2b (DIREITA, 19/11) — testes puros da edição na célula (src/ui/celula.ts). Rodar: bash scripts/atributos/testes/celula-ux2b.sh
import { ErroApi, MSG_DESCONHECIDO } from '../../../public/components/panels/panel-atributos/src/lib/api';
import {
  avisoAtivo, avisoTipo, avisoUnidade, bolinha, corpoCampoAtributo, estadoDaConferencia, estadoDaResposta, estadoDoErro, iconeDaFase, livre, MSG_NAO_RECEBIDO,
  mudou, podeConferir, umaLinha, validarCampoAtributo,
} from '../../../public/components/panels/panel-atributos/src/ui/celula';

let n = 0; let falhas = 0;
const igual = (nome: string, obtido: unknown, esperado: unknown) => { n++; if (JSON.stringify(obtido) !== JSON.stringify(esperado)) { falhas++; console.log(`[ERRO] ${nome}: obtido ${JSON.stringify(obtido)} · esperado ${JSON.stringify(esperado)}`); } };
const sim = (nome: string, v: boolean) => igual(nome, v, true);

// 1. Resposta com recibo
igual('aplicada → salvo', estadoDaResposta({ desfecho: 'aplicada', recibo: { desfecho: 'aplicada' } }, 'k1').fase, 'salvo');
igual('sem_mudanca → nada mudou', estadoDaResposta({ recibo: { desfecho: 'sem_mudanca' } }, 'k1').fase, 'sem_mudanca');
igual('chave guardada', estadoDaResposta({ recibo: { desfecho: 'aplicada' } }, 'k9').chave, 'k9');

// 2. Erros: só recusa ESCRITA = "não foi salvo"; resto = desconhecido
const desc = new ErroApi(0, 'RESULTADO_DESCONHECIDO', MSG_DESCONHECIDO, [], { desfecho: 'desconhecido', chave: 'kx' });
igual('resposta perdida → desconhecido (com a chave)', [estadoDoErro(desc, 'k1').fase, estadoDoErro(desc, 'k1').chave], ['desconhecido', 'kx']);
igual('2xx sem recibo (desconhecido) nunca "salvo"', estadoDoErro(new ErroApi(200, 'RESULTADO_DESCONHECIDO', MSG_DESCONHECIDO, [], { desfecho: 'desconhecido' }), 'k').fase, 'desconhecido');
const conf = new ErroApi(409, 'CONFLICT', 'Outra pessoa alterou este atributo.', [], { desfecho: 'conflito' });
igual('409 CONFLICT → conflito', estadoDoErro(conf, 'k').fase, 'conflito');
const tipoBloq = new ErroApi(409, 'TYPE_CHANGE_BLOCKED', 'Este atributo já tem valores; o tipo não pode mudar.', ['tipo'], { desfecho: 'recusada' });
igual('409 TYPE_CHANGE_BLOCKED → recusada com a mensagem (não conflito)', [estadoDoErro(tipoBloq, 'k').fase, estadoDoErro(tipoBloq, 'k').codigo], ['recusada', 'TYPE_CHANGE_BLOCKED']);
sim('mensagem do TYPE_CHANGE_BLOCKED aparece', (estadoDoErro(tipoBloq, 'k').mensagem ?? '').includes('o tipo não pode mudar'));
const motivo = new ErroApi(422, 'VALIDATION_ERROR', 'Dados inválidos.', ['rotulo'], { desfecho: 'recusada', motivos: { rotulo: 'Já existe um atributo com este rótulo.' } });
igual('422 com motivo do campo', estadoDoErro(motivo, 'k', 'rotulo').mensagem, 'Não foi salvo. Já existe um atributo com este rótulo.');
igual('422 sem motivo do campo → mensagem geral', estadoDoErro(motivo, 'k', 'descricao').mensagem, 'Não foi salvo. Dados inválidos.');
const unid = new ErroApi(422, 'UNIT_CHANGE_REQUIRES_REASON', 'Diga o motivo.', ['motivo'], { desfecho: 'recusada' });
igual('UNIT_CHANGE_REQUIRES_REASON preserva o código', estadoDoErro(unid, 'k').codigo, 'UNIT_CHANGE_REQUIRES_REASON');
igual('em andamento', estadoDoErro(new ErroApi(409, 'OPERATION_IN_PROGRESS', 'x', [], { desfecho: 'em_andamento' }), 'k').fase, 'em_andamento');
igual('5xx sem desfecho → desconhecido', estadoDoErro(new ErroApi(503, 'X', 'x', [], {}), 'k').fase, 'desconhecido');
igual('erro qualquer (não ErroApi) → desconhecido', estadoDoErro(new Error('x'), 'k').fase, 'desconhecido');

// 3. Conferir gravação
igual('conferir aplicada → salvo', estadoDaConferencia({ resultado: 'aplicada', erro: null }, 'k').fase, 'salvo');
igual('conferir nao_aplicada → recusada com motivo', estadoDaConferencia({ resultado: 'nao_aplicada', erro: { codigo: 'X', http: 422, mensagem: 'Rótulo repetido.' } }, 'k').mensagem, 'Não foi salvo. Rótulo repetido.');
igual('conferir nao_encontrada → não recebeu', estadoDaConferencia({ resultado: 'nao_encontrada', erro: null }, 'k').mensagem, MSG_NAO_RECEBIDO);
igual('conferir em_andamento', estadoDaConferencia({ resultado: 'em_andamento', erro: null }, 'k').fase, 'em_andamento');
sim('podeConferir só em desconhecido/em andamento', podeConferir('desconhecido') && podeConferir('em_andamento') && !podeConferir('salvo') && !podeConferir('recusada'));
sim('livre: salvando/conferindo travam a célula', !livre('salvando') && !livre('conferindo') && livre('salvo') && livre('ocioso'));
igual('ícones', ['salvo', 'recusada', 'desconhecido', 'ocioso'].map((f) => iconeDaFase(f as never)?.simbolo ?? null), ['✓', '✕', '?', null]);

// 4. Corpo de UM campo (versão + campo; vazio = null; unidade como número; motivo aparado)
igual('rótulo', corpoCampoAtributo({ id: 7, versao: 3 }, 'rotulo', '  Largura '), { id: 7, versao: 3, rotulo: 'Largura' });
igual('descrição vazia = limpar', corpoCampoAtributo({ id: 7, versao: 3 }, 'descricao', '  '), { id: 7, versao: 3, descricao: null });
igual('unidade com motivo', corpoCampoAtributo({ id: 7, versao: 3 }, 'unidade_id', '10', ' troca de padrão '), { id: 7, versao: 3, unidade_id: 10, motivo: 'troca de padrão' });
igual('sem unidade', corpoCampoAtributo({ id: 7, versao: 3 }, 'unidade_id', ''), { id: 7, versao: 3, unidade_id: null });
igual('validar rótulo vazio', validarCampoAtributo('rotulo', '  '), 'O rótulo não pode ficar vazio.');
igual('validar descrição longa', validarCampoAtributo('descricao', 'x'.repeat(501)), 'No máximo 500 caracteres.');
igual('validar ok', validarCampoAtributo('rotulo', 'Peso'), null);
sim('mudou: espaços não contam', !mudou('Peso', ' Peso ') && mudou(null, 'x') && !mudou(null, ''));

// 5. Textos da confirmação na linha
sim('tipo com valores avisa a recusa', avisoTipo({ rotulo: 'Cor', produtos_com_valor: 3 }, 'Texto', 'Opção').includes('3 produtos têm valor'));
sim('tipo sem valores', avisoTipo({ rotulo: 'Cor', produtos_com_valor: 0 }, 'Texto', 'Opção').includes('Nenhum produto'));
igual('unidade com valores pede motivo', avisoUnidade({ rotulo: 'Peso', produtos_com_valor: 1 }, 'g', 'kg').pedeMotivo, true);
igual('unidade sem valores não pede', avisoUnidade({ rotulo: 'Peso', produtos_com_valor: 0 }, 'g', 'kg').pedeMotivo, false);
sim('desativar mostra quantos produtos e kits', avisoAtivo({ rotulo: 'Peso', produtos_com_valor: 12, em_kits: 2 }, false).includes('12 produtos com valor · em 2 kits'));
sim('desativar sem uso', avisoAtivo({ rotulo: 'Peso', produtos_com_valor: 0, em_kits: 0 }, false).includes('nenhum produto com valor · em nenhum kit'));
sim('reativar', avisoAtivo({ rotulo: 'Peso', produtos_com_valor: 0, em_kits: 0 }, true).startsWith('Reativar'));

// 6. Unidades
igual('uma linha com +N', umaLinha(['a', 'b', 'c', 'd'], 2), { texto: 'a · b', resto: 2 });
igual('uma linha sem resto', umaLinha(['a'], 2), { texto: 'a', resto: 0 });
igual('bolinha ativa/inativa', [bolinha(1).tom, bolinha(0).tom, bolinha(true).rotulo], ['sucesso', 'neutro', 'Ativa']);

console.log(`${falhas ? '[ERRO]' : '[OK]  '} celula-ux2b (edição na célula: recibo, conferir, corpos, confirmações): ${n} casos, ${falhas} falha(s)`);
process.exit(falhas ? 1 : 0);
