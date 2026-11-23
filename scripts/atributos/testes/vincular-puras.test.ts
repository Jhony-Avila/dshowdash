// Vincular (redesenho 18/11, ESQUERDA) — testes das funções PURAS de src/lib/vincular.ts: produtos filtrados e seleção que sobrevive a
// busca/filtro, vínculos com origem (kit × avulso) a partir da ficha, candidatos para vincular, carga por produto com resposta atrasada
// descartada, expansão por chave, corpo canônico da massa (retrato + opostos), frases de confirmação e reuso da chave de idempotência.
// Rodar: bash scripts/atributos/testes/vincular-puras.sh
import {
  alcanceMassa, alternarExpansao, alternarSelecao, candidatosVincular, chaveParaPedido, concluirCarga, corpoMassa, desmarcarFiltrados,
  estadoMarcarTodos, falharCarga, filtrarPorIdNome, filtrarProdutos, foraDoFiltro, fraseAtributos, fraseKit, fraseRemocao, fraseRemovido, fraseUnidadeRemocao, unidadeRemocao, escolhaVigente, rotuloConfirmarVincular, textoEscolhidos, rotuloConfirmarMassa,
  fraseSalvo, iniciarCarga, marcarFiltrados, previaCobrePedido, selecaoParaRever, selecaoValida, SEM_KIT, temOpostos, textoContagem,
  vinculosDaFicha, kitsEspecificos, textoKits, type Cargas, type PreviaV2, ROTULO_JA_APLICAVEL, ROTULO_ENTRA, linkFichaAtributo, fraseConferencia, resultadoIncerto,
} from '../../../public/components/panels/panel-atributos/src/lib/vincular';
import type { AtributoDicionario, ItemFicha, Previa, ProdutoResumo, Valor } from '../../../public/components/panels/panel-atributos/src/lib/tipos';
import { ariaSortMatriz, larguraKit, MARCADOR, ORDEM_INICIAL, ordenarMatriz, origensDaCelula, produtosDaMatriz, proximaOrdem, rotuloOrdenar, textoOrigens } from '../../../public/components/panels/panel-atributos/src/lib/matriz';

let n = 0; let falhas = 0;
function igual(nome: string, obtido: unknown, esperado: unknown) {
  n++;
  if (JSON.stringify(obtido) !== JSON.stringify(esperado)) { falhas++; console.log(`[ERRO] ${nome}: obtido ${JSON.stringify(obtido)} · esperado ${JSON.stringify(esperado)}`); }
}

// ── produtos filtrados ────────────────────────────────────────────────────────────────────────────────────────────────
const prod = (id: number, nome: string, sub: string | null, kits: { id: number; motivos: string[] }[] = [], ativo = true) =>
  ({ id, nome, subcategoria: sub, ativo, kits: kits.map((k) => ({ ...k, nome: `K${k.id}` })), geral: { feitos: 0, total: kits.length * 3 } }) as unknown as ProdutoResumo;
const GERAL = { id: 1, motivos: ['todos'] };
const P = [
  prod(10, 'Módulo LED P2.5 Indoor', 'modulos', [GERAL, { id: 5, motivos: ['escopo'] }]),
  prod(11, 'Cabo de força 1,5 m', 'cabos', [GERAL, { id: 7, motivos: ['direto'] }]),
  prod(12, 'Gabinete 500x500', 'gabinetes', [GERAL]),
  prod(13, 'Módulo LED P3.9 Outdoor', 'modulos', [GERAL, { id: 5, motivos: ['escopo'] }]),
  prod(14, 'Inativo', 'modulos', [GERAL], false),
  prod(215, 'Fonte 5V', null, []),
];
const ids = (xs: { id: number }[]) => xs.map((x) => x.id);
const F0 = { busca: '', subcategoria: '', kit: '' };
igual('sem filtro: todos os ATIVOS, sem corte', ids(filtrarProdutos(P, F0)), [10, 11, 12, 13, 215]);
igual('busca por nome sem acento/maiúscula ("modulo led")', ids(filtrarProdutos(P, { ...F0, busca: 'modulo led' })), [10, 13]);
igual('busca: todos os termos ("led outdoor")', ids(filtrarProdutos(P, { ...F0, busca: 'led outdoor' })), [13]);
igual('busca por ID ("215")', ids(filtrarProdutos(P, { ...F0, busca: '215' })), [215]);
igual('subcategoria', ids(filtrarProdutos(P, { ...F0, subcategoria: 'modulos' })), [10, 13]);
igual('kit por escopo (5)', ids(filtrarProdutos(P, { ...F0, kit: '5' })), [10, 13]);
igual('kit direto (7)', ids(filtrarProdutos(P, { ...F0, kit: '7' })), [11]);
igual('kit geral (1) = todos com o geral', ids(filtrarProdutos(P, { ...F0, kit: '1' })), [10, 11, 12, 13]);
igual('"Sem kit específico" = só o geral ou nenhum', ids(filtrarProdutos(P, { ...F0, kit: SEM_KIT })), [12, 215]);
igual('filtros combinados', ids(filtrarProdutos(P, { busca: 'p3', subcategoria: 'modulos', kit: '5' })), [13]);
igual('348 produtos: sem corte (todos voltam)', filtrarProdutos(Array.from({ length: 348 }, (_, i) => prod(i + 1, `Produto ${i + 1}`, 'x')), F0).length, 348);

// ── seleção ───────────────────────────────────────────────────────────────────────────────────────────────────────────
igual('alternar: marca', alternarSelecao([1, 2], 3), [1, 2, 3]);
igual('alternar: desmarca', alternarSelecao([1, 2, 3], 2), [1, 3]);
igual('marcar todos = todos os FILTRADOS somados aos já marcados (sem repetir)', marcarFiltrados([99, 10], [10, 13]), [99, 10, 13]);
igual('desmarcar todos tira só os filtrados (os de fora do filtro ficam)', desmarcarFiltrados([99, 10, 13], [10, 13]), [99]);
igual('estado: nenhum', estadoMarcarTodos([99], [10, 13]), 'nenhum');
igual('estado: alguns', estadoMarcarTodos([10], [10, 13]), 'alguns');
igual('estado: todos', estadoMarcarTodos([13, 10, 99], [10, 13]), 'todos');
igual('estado com lista vazia = nenhum', estadoMarcarTodos([1], []), 'nenhum');
// a seleção sobrevive a busca e filtro: filtrar não mexe no conjunto; trocar o filtro e marcar de novo soma
{
  let sel: number[] = [];
  sel = marcarFiltrados(sel, ids(filtrarProdutos(P, { ...F0, subcategoria: 'modulos' })));   // 10, 13
  const outraBusca = ids(filtrarProdutos(P, { ...F0, busca: 'cabo' }));                    // 11
  igual('seleção sobrevive à busca: os marcados continuam marcados', sel, [10, 13]);
  igual('fora do filtro: 2 marcados fora da busca "cabo"', foraDoFiltro(sel, outraBusca), 2);
  sel = alternarSelecao(sel, 11);
  igual('marcar com outra busca SOMA', sel, [10, 13, 11]);
  igual('voltar ao filtro anterior: estado "todos" de novo', estadoMarcarTodos(sel, ids(filtrarProdutos(P, { ...F0, subcategoria: 'modulos' }))), 'todos');
}
igual('seleção válida: tira inativos e inexistentes (vindo de outra tela)', selecaoValida([10, 14, 999, 215], P), [10, 215]);
igual('contagem sem filtro', textoContagem(348, 348, 0, 0), '348 produtos · 0 selecionados');
igual('contagem filtrada com fora do filtro', textoContagem(40, 348, 12, 3), '40 de 348 produtos · 12 selecionados · 3 fora do filtro');
igual('contagem singular', textoContagem(1, 1, 1, 0), '1 produto · 1 selecionado');
igual('contagem com milhar pt-BR', textoContagem(1200, 1200, 0, 0), '1.200 produtos · 0 selecionados');

// ── vínculos com origem (da ficha) ────────────────────────────────────────────────────────────────────────────────────
const item = (atributo_id: number, rotulo: string, origens: ItemFicha['origens']) => ({ atributo_id, rotulo, codigo: rotulo.toLowerCase(), origens }) as ItemFicha;
const ficha = {
  produto: { id: 10, nome: 'Módulo', categoria: 'x', subcategoria: 'modulos', ativo: true }, versao_vinculos: 'v7', pode_vincular: true,
  itens: [
    item(3, 'Largura', [{ tipo: 'kit', grupo_id: 5, grupo_nome: 'Painel LED', motivos: [{ tipo: 'escopo' }] }]),
    item(1, 'Peso', [{ tipo: 'kit', grupo_id: 1, grupo_nome: 'Base', motivos: [{ tipo: 'todos' }] }, { tipo: 'kit', grupo_id: 5, grupo_nome: 'Painel LED', motivos: [{ tipo: 'escopo' }] }]),
    item(9, 'Altura', [{ tipo: 'avulso' }]),
    item(4, 'Ângulo', [{ tipo: 'kit', grupo_id: 7, grupo_nome: 'Cabos', motivos: [{ tipo: 'direto' }] }, { tipo: 'avulso' }]),
  ],
};
const v = vinculosDaFicha(ficha);
igual('ordem pelo rótulo pt-BR (Altura, Ângulo, Largura, Peso)', v.vinculos.map((x) => x.rotulo), ['Altura', 'Ângulo', 'Largura', 'Peso']);
igual('só avulso: origem "Avulso", removível', v.vinculos[0], { atributo_id: 9, rotulo: 'Altura', codigo: 'altura', origens: [{ tipo: 'avulso' }], avulso: true, valor: null });
igual('kit + avulso: kit primeiro, avulso no fim; removível (só o avulso)', v.vinculos[1].origens, [{ tipo: 'kit', kit_id: 7, nome: 'Cabos' }, { tipo: 'avulso' }]);
igual('kit + avulso: avulso = true', v.vinculos[1].avulso, true);
igual('só kit: não removível', v.vinculos[2].avulso, false);
igual('dois kits (geral + escopo): os dois, por nome', v.vinculos[3].origens, [{ tipo: 'kit', kit_id: 1, nome: 'Base' }, { tipo: 'kit', kit_id: 5, nome: 'Painel LED' }]);
igual('versão dos vínculos e permissão vêm da MESMA leitura', [v.product_id, v.versao_vinculos, v.pode_vincular], [10, 'v7', true]);
igual('o mesmo kit repetido nas origens aparece uma vez', vinculosDaFicha({ ...ficha, itens: [item(2, 'X', [{ tipo: 'kit', grupo_id: 5, grupo_nome: 'A' }, { tipo: 'kit', grupo_id: 5, grupo_nome: 'A' }])] }).vinculos[0].origens.length, 1);

// valor salvo formatado (só para explicar o efeito de remover)
{
  const val = (o: Partial<Valor>) => ({ estado: 'informado', texto: null, numero: null, booleano: null, data: null, opcao_ids: [], opcoes: [], unidade_id: null, origem: 'manual', lote_id: null, atualizado_em: '', atualizado_por: null, versao: 1, legado_bruto: null, ...o }) as Valor;
  const comValor = { ...item(4, 'Ângulo', [{ tipo: 'kit', grupo_id: 7, grupo_nome: 'Cabos' }, { tipo: 'avulso' }]), valor: val({ numero: '12.000000' }), unidade_efetiva: { id: 3, simbolo: 'mm' } } as ItemFicha;
  const vv = vinculosDaFicha({ ...ficha, itens: [comValor, { ...item(8, 'Cor', [{ tipo: 'avulso' }]), valor: val({ estado: 'nao_se_aplica' }) } as ItemFicha] });
  igual('valor salvo formatado com a unidade efetiva ("12 mm")', vv.vinculos.map((x) => x.valor), ['12 mm', 'Não se aplica']);
}

// ── efeito de remover o avulso (regra real: só a linha do avulso sai; valor intocado; ficha = kits + avulsos) ─────────────────
const K1 = { tipo: 'kit' as const, kit_id: 7, nome: 'Cabos' }; const K2 = { tipo: 'kit' as const, kit_id: 5, nome: 'Painel LED' }; const AV = { tipo: 'avulso' as const };
igual('remover: também vem de 1 kit, sem valor', fraseRemocao({ origens: [K1, AV], valor: null }), 'Também vem do kit Cabos. O atributo continuará na ficha.');
igual('remover: kit + valor salvo continua na ficha', fraseRemocao({ origens: [K1, AV], valor: '12 mm' }), 'Também vem do kit Cabos. O atributo continuará na ficha. O valor salvo (12 mm) continua na ficha.');
igual('remover: dois kits', fraseRemocao({ origens: [K1, K2, AV], valor: null }), 'Também vem dos kits Cabos e Painel LED. O atributo continuará na ficha.');
igual('remover: só avulso, sem valor = sai da ficha', fraseRemocao({ origens: [AV], valor: null }), 'O atributo sai da ficha deste produto.');
igual('remover: só avulso com valor = valor guardado, fora da ficha', fraseRemocao({ origens: [AV], valor: '12 mm' }),
  'O atributo sai da ficha deste produto. O valor salvo (12 mm) continua guardado e vai para “Fora da ficha” (na ficha do produto e na Conferência).');
// ── unidade própria do produto na remoção (regra D3: valor → produto → kit → padrão; remover o avulso tira a linha do ajuste inteira) ──
{
  const val = (o: Partial<Valor>) => ({ estado: 'informado', texto: null, numero: null, booleano: null, data: null, opcao_ids: [], opcoes: [], unidade_id: null, origem: 'manual', lote_id: null, atualizado_em: '', atualizado_por: null, versao: 1, legado_bruto: null, ...o }) as Valor;
  const U = (id: number, simbolo: string) => ({ id, simbolo, nome: simbolo, grandeza: 'comprimento', fator_base: '1', ativo: 1 });
  const base = { ...item(4, 'Ângulo', [{ tipo: 'kit', grupo_id: 7, grupo_nome: 'Cabos' }, { tipo: 'avulso' }]), unidades: [U(3, 'mm'), U(4, 'cm')] };
  const comUn = { ...base, unidade_produto_id: 4, unidade_produto: { id: 4, simbolo: 'cm' }, unidade_sem_ajuste: { id: 3, simbolo: 'mm' }, unidade_efetiva: { id: 4, simbolo: 'cm' }, valor: null } as unknown as ItemFicha;
  const semUn = { ...base, unidade_produto_id: null, unidade_sem_ajuste: { id: 3, simbolo: 'mm' }, unidade_efetiva: { id: 3, simbolo: 'mm' }, valor: null } as unknown as ItemFicha;
  igual('unidade: sem unidade própria do produto → null (frase inalterada)', unidadeRemocao(semUn), null);
  igual('unidade: COM unidade própria, sem valor', fraseRemocao(vinculosDaFicha({ ...ficha, itens: [comUn] }).vinculos[0]),
    'Também vem do kit Cabos. O atributo continuará na ficha. A unidade escolhida para este produto (cm) deixa de valer. Sem esse ajuste, a unidade de referência será mm.');
  igual('unidade: SEM unidade própria — frase de antes', fraseRemocao(vinculosDaFicha({ ...ficha, itens: [semUn] }).vinculos[0]), 'Também vem do kit Cabos. O atributo continuará na ficha.');
  const numSem = { ...comUn, valor: val({ numero: '12.000000' }) } as ItemFicha;
  igual('unidade: valor SEM unidade própria — a LEITURA muda, sem converter', fraseRemocao(vinculosDaFicha({ ...ficha, itens: [numSem] }).vinculos[0]),
    'Também vem do kit Cabos. O atributo continuará na ficha. O valor salvo (12 cm) continua na ficha. A unidade escolhida para este produto (cm) deixa de valer. Sem esse ajuste, a unidade de referência será mm. O valor salvo (12) não tem unidade própria: a leitura muda de cm para mm, sem converter o número.');
  const numCom = { ...comUn, valor: val({ numero: '2.000000', unidade_id: 9 }), unidade_efetiva: { id: 9, simbolo: 'm' } } as ItemFicha;
  igual('unidade: valor COM unidade própria prevalece (não muda)', fraseUnidadeRemocao(vinculosDaFicha({ ...ficha, itens: [numCom] }).vinculos[0].unidade),
    'A unidade escolhida para este produto (cm) deixa de valer. Sem esse ajuste, a unidade de referência será m: é a unidade própria do valor salvo, que prevalece e não muda.');
  const so = { ...comUn, origens: [{ tipo: 'avulso' }], unidade_sem_ajuste: { id: 5, simbolo: 'pol' } } as unknown as ItemFicha;
  igual('unidade: só avulso → padrão do atributo (servidor) e o atributo sai da ficha', fraseRemocao(vinculosDaFicha({ ...ficha, itens: [so] }).vinculos[0]),
    'O atributo sai da ficha deste produto. A unidade escolhida para este produto (cm) deixa de valer. Sem esse ajuste, a unidade de referência será pol.');
  igual('unidade: sem unidade padrão nenhuma', fraseUnidadeRemocao(unidadeRemocao({ ...comUn, unidade_sem_ajuste: null } as ItemFicha)), 'A unidade escolhida para este produto (cm) deixa de valer. Sem esse ajuste, não haverá unidade de referência.');
  const antigo = { ...comUn } as Record<string, unknown>; delete antigo.unidade_sem_ajuste; delete antigo.unidade_produto;
  igual('unidade: servidor sem o campo → símbolo pela lista de unidades e frase genérica', fraseUnidadeRemocao(unidadeRemocao(antigo as unknown as ItemFicha)),
    'A unidade escolhida para este produto (cm) deixa de valer. Sem esse ajuste, a unidade de referência será a do kit ou, sem kit, a padrão do atributo.');
  igual('unidade: padrão igual à do produto', fraseUnidadeRemocao(unidadeRemocao({ ...comUn, unidade_sem_ajuste: { id: 4, simbolo: 'cm' }, valor: val({ numero: '1.0' }) } as ItemFicha)),
    'A unidade escolhida para este produto (cm) deixa de valer. Sem esse ajuste, a unidade de referência será cm.');
}
igual('removido: com kit diz por onde continua', fraseRemovido({ rotulo: 'Largura', origens: [K1, AV] }), 'Salvo: vínculo avulso de Largura removido. Continua na ficha pelo kit Cabos.');
igual('removido: sem kit', fraseRemovido({ rotulo: 'Largura', origens: [AV] }), 'Salvo: vínculo avulso de Largura removido.');

// ── escolha no seletor: nunca confirmar o que não está visível ───────────────────────────────────────────────────────
{
  const D = [{ id: 2, rotulo: 'Largura', codigo: 'largura_mm', ativo: 1 }, { id: 4, rotulo: 'Altura', codigo: 'altura', ativo: 1 }] as unknown as AtributoDicionario[];
  const visiveis = (q: string) => candidatosVincular(D, [], q).lista;
  igual('escolha única: visível → vale', escolhaVigente(2, visiveis('larg')), 2);
  igual('escolha única: busca "zzzz-sem-resultado" → escolha LIMPA', escolhaVigente(2, visiveis('zzzz-sem-resultado')), null);
  igual('escolha única: busca que mostra OUTRO atributo → limpa', escolhaVigente(2, visiveis('altura')), null);
  igual('escolha única: nada escolhido → null', escolhaVigente(null, visiveis('')), null);
  igual('confirmar com o NOME do escolhido', rotuloConfirmarVincular('Largura'), 'Vincular Largura');
  igual('confirmar sem escolha (desligado)', rotuloConfirmarVincular(null), 'Escolha um atributo');
  igual('massa: N escolhidos', [textoEscolhidos(1), textoEscolhidos(3)], ['1 escolhido', '3 escolhidos']);
  igual('massa: confirmar nomeia os atributos', rotuloConfirmarMassa({ tipo: 'atributos', atributos: [2, 4] }, ['Largura', 'Altura'], ''), 'Confirmar: vincular Largura e Altura');
  igual('massa: muitos → contagem', rotuloConfirmarMassa({ tipo: 'atributos', atributos: [1, 2, 3, 4] }, ['A', 'B', 'C', 'D'], ''), 'Confirmar: vincular 4 atributos');
  igual('massa: kit nomeado', rotuloConfirmarMassa({ tipo: 'kit', kit: 5 }, [], 'Painel LED'), 'Confirmar: aplicar kit Painel LED');
}

// ── candidatos para vincular ─────────────────────────────────────────────────────────────────────────────────────────
const atr = (id: number, rotulo: string, codigo: string, ativo = 1) => ({ id, rotulo, codigo, ativo }) as unknown as AtributoDicionario;
const DIC = [atr(1, 'Peso', 'peso'), atr(2, 'Largura', 'largura_mm'), atr(3, 'Largura útil', 'largura_util'), atr(4, 'Altura', 'altura'), atr(5, 'Lúmens', 'lumens', 0), atr(6, 'Ângulo de visão', 'angulo')];
igual('candidatos: ativos, não vinculados, ordem pt-BR', candidatosVincular(DIC, [1], '').lista.map((a) => a.id), [4, 6, 2, 3]);
igual('candidatos: busca pelo rótulo', candidatosVincular(DIC, [], 'larg').lista.map((a) => a.id), [2, 3]);
igual('candidatos: busca pelo código', candidatosVincular(DIC, [], 'util').lista.map((a) => a.id), [3]);
igual('candidatos: sem acento ("angulo")', candidatosVincular(DIC, [], 'angulo').lista.map((a) => a.id), [6]);
igual('candidatos: desativado nunca aparece', candidatosVincular(DIC, [], 'lumens').total, 0);
igual('candidatos: já vinculado sai', candidatosVincular(DIC, [2], 'larg').lista.map((a) => a.id), [3]);
igual('candidatos: limite + total', (() => { const r = candidatosVincular(DIC, [], '', 2); return [r.lista.length, r.total]; })(), [2, 5]);

// ── carga por produto: resposta atrasada ──────────────────────────────────────────────────────────────────────────────
{
  let c: Cargas<string> = {};
  c = iniciarCarga(c, 10, 1);
  igual('carga: começa carregando', c[10], { fase: 'carregando', seq: 1, dados: null });
  c = iniciarCarga(c, 10, 2);                                   // 2ª tentativa antes da 1ª responder
  const depois1 = concluirCarga(c, 10, 1, 'VELHA');
  igual('resposta ATRASADA (seq 1) é ignorada: mapa igual', depois1 === c, true);
  c = concluirCarga(c, 10, 2, 'NOVA');
  igual('resposta vigente aplica', c[10], { fase: 'pronto', seq: 2, dados: 'NOVA' });
  igual('erro atrasado também é ignorado', falharCarga(c, 10, 1, 'x') === c, true);
  c = iniciarCarga(c, 10, 3);
  igual('recarga mantém os dados anteriores enquanto carrega', c[10], { fase: 'carregando', seq: 3, dados: 'NOVA' });
  c = falharCarga(c, 10, 3, 'Sem resposta do servidor.');
  igual('erro vigente: fase erro, dados anteriores preservados', c[10], { fase: 'erro', seq: 3, dados: 'NOVA', erro: 'Sem resposta do servidor.' });
  igual('produtos independentes: a carga de um não mexe no outro', iniciarCarga(c, 11, 4)[10], c[10]);
  igual('resposta para produto sem carga iniciada é ignorada', concluirCarga({}, 7, 1, 'x'), {});
  // corrida: produto A responde depois do B; cada um só aceita a própria sequência
  let d: Cargas<string> = iniciarCarga(iniciarCarga({}, 1, 10), 2, 11);
  d = concluirCarga(d, 2, 11, 'B'); d = concluirCarga(d, 1, 10, 'A');
  igual('corrida entre produtos: cada um com o seu', [d[1].dados, d[2].dados], ['A', 'B']);
}

// ── expansão ─────────────────────────────────────────────────────────────────────────────────────────────────────────
igual('expansão: abre', alternarExpansao([3], 5), [3, 5]);
igual('expansão: fecha', alternarExpansao([3, 5], 3), [5]);

// ── massa: corpo canônico, opostos, frases ───────────────────────────────────────────────────────────────────────────
igual('corpo atributos: ids ordenados e sem repetição; só incluir', corpoMassa([13, 10, 13], { tipo: 'atributos', atributos: [9, 2, 9] }),
  { produtos: [10, 13], kits_aplicar: [], kits_remover: [], atributos_incluir: [{ atributo_id: 2 }, { atributo_id: 9 }], atributos_excluir: [] });
igual('corpo kit: só kits_aplicar', corpoMassa([2, 1], { tipo: 'kit', kit: 5 }), { produtos: [1, 2], kits_aplicar: [5], kits_remover: [], atributos_incluir: [], atributos_excluir: [] });
igual('retrato: a mesma intenção em outra ordem gera o MESMO pedido', JSON.stringify(corpoMassa([1, 2], { tipo: 'atributos', atributos: [3, 4] })) === JSON.stringify(corpoMassa([2, 1], { tipo: 'atributos', atributos: [4, 3] })), true);
igual('retrato: seleção diferente = pedido diferente (a prévia cai)', JSON.stringify(corpoMassa([1, 2], { tipo: 'kit', kit: 5 })) === JSON.stringify(corpoMassa([1, 2, 3], { tipo: 'kit', kit: 5 })), false);
igual('opostos (056/084): corpo desta tela nunca tem', temOpostos(corpoMassa([1], { tipo: 'atributos', atributos: [2] })), false);
igual('opostos: kit em aplicar e remover', temOpostos({ produtos: [1], kits_aplicar: [5], kits_remover: [5], atributos_incluir: [], atributos_excluir: [] }), true);
igual('opostos: atributo em incluir e excluir', temOpostos({ produtos: [1], kits_aplicar: [], kits_remover: [], atributos_incluir: [{ atributo_id: 2 }], atributos_excluir: [{ atributo_id: 2, motivo: 'x' }] }), true);
const R = (o: Partial<{ produtos: number; produtos_afetados: number; atributos_acrescentados: number; atributos_removidos: number; ja_tinham: number; kits_ja_aplicados: number }>) =>
  ({ produtos: 12, produtos_afetados: 9, atributos_acrescentados: 9, atributos_removidos: 0, ja_tinham: 0, kits_ja_aplicados: 0, ...o });
igual('frase: 1 atributo, 3 já têm', fraseAtributos(['Largura'], R({ ja_tinham: 3 })), 'Largura será vinculado a 12 produtos; 3 já têm.');
igual('frase: 1 atributo, nenhum tem', fraseAtributos(['Largura'], R({})), 'Largura será vinculado a 12 produtos.');
igual('frase: 1 atributo, 1 já tem', fraseAtributos(['Largura'], R({ ja_tinham: 1 })), 'Largura será vinculado a 12 produtos; 1 já tem.');
igual('frase: 1 produto', fraseAtributos(['Largura'], R({ produtos: 1 })), 'Largura será vinculado a 1 produto.');
igual('frase: todos já têm (prévia 0 novos)', fraseAtributos(['Largura'], R({ ja_tinham: 12 })), 'Largura já é aplicável nos 12 produtos: nada será gravado.');
igual('frase: vinculos_novos do servidor manda (0 novos = nada será gravado)', fraseAtributos(['Largura', 'Altura'], { ...R({ produtos: 2, ja_tinham: 2 }), vinculos_novos: 0 }), 'Largura e Altura já são aplicáveis nos 2 produtos: nada será gravado.');
igual('frase: 1 produto, já aplicável', fraseAtributos(['Largura'], R({ produtos: 1, ja_tinham: 1 })), 'Largura já é aplicável neste produto: nada será gravado.');
igual('frase: 2 atributos (plural e vínculos)', fraseAtributos(['Largura', 'Altura'], R({ ja_tinham: 5 })), 'Largura e Altura serão vinculados a 12 produtos; 5 vínculos já existem.');
igual('frase: 3 atributos, 1 vínculo já existe', fraseAtributos(['A', 'B', 'C'], R({ ja_tinham: 1 })), 'A, B e C serão vinculados a 12 produtos; 1 vínculo já existe.');
igual('frase kit: novos vínculos + atributos que entram', fraseKit('Cabos', R({ kits_ja_aplicados: 2, atributos_acrescentados: 30, produtos_afetados: 10 })),
  'Kit Cabos será aplicado a 12 produtos; 2 já tinham o kit direto (10 novos vínculos). Entram 30 atributos em 10 produtos.');
igual('frase kit (INTEGRIDADE-1 d): ficha já contém tudo', fraseKit('Base', R({ produtos: 1, atributos_acrescentados: 0, produtos_afetados: 0 })), 'Kit Base será aplicado a 1 produto. As fichas já contêm todos os atributos dele.');
igual('salvo: atributos', fraseSalvo({ kits_aplicados: 0, inclusoes: 9 }, false, { tipo: 'atributos', atributos: [1] }), 'Salvo: 9 vínculos avulsos gravados.');
igual('salvo: kit', fraseSalvo({ kits_aplicados: 1, inclusoes: 0 }, false, { tipo: 'kit', kit: 5 }), 'Salvo: kit aplicado a 1 produto (os demais já tinham).');
igual('salvo: 0 inclusões = nada mudou (desfecho sem_mudanca)', fraseSalvo({ kits_aplicados: 0, inclusoes: 0 }, false, { tipo: 'atributos', atributos: [1] }), 'Nada mudou: o atributo já era aplicável em todos os produtos. Nenhum vínculo avulso foi criado.');
igual('salvo: kit 0 = nada mudou', fraseSalvo({ kits_aplicados: 0, inclusoes: 0 }, false, { tipo: 'kit', kit: 5 }), 'Nada mudou: todos os produtos já tinham o kit.');
igual('salvo: repetido (mesma chave)', fraseSalvo({ kits_aplicados: 0, inclusoes: 0 }, true, { tipo: 'kit', kit: 5 }), 'Esta gravação já tinha sido feita (nada repetido).');

// ── alcance da massa (números e destinos da MESMA prévia) ──────────────────────────────────────────────────────────────
{
  const PV = (resumo: Partial<Previa['resumo']>, produtos: [number, string, number][]): Previa => ({ resumo: { ...R({}), ...resumo } as Previa['resumo'],
    produtos: produtos.map(([product_id, nome, acrescenta]) => ({ product_id, nome, acrescenta, remove: 0, antes: 5, depois: 5 + acrescenta })), versao_previa: 'f'.repeat(64) });
  const p2 = PV({ produtos: 2, ja_tinham: 1, atributos_acrescentados: 1, produtos_afetados: 1 }, [[20, 'Cabo B', 0], [11, 'Cabo A', 1]]);
  const a = alcanceMassa({ tipo: 'atributos', atributos: [9] }, '', p2, [20]);
  igual('alcance atributos: o texto do aceite', a.texto, '2 produtos selecionados · 1 atributo · 1 entra na ficha · 1 já aplicável');
  igual('alcance: destinos = todos da prévia, pelo ID, com o efeito e "fora do filtro"', a.destinos, [
    { product_id: 11, nome: 'Cabo A', efeito: 'Entra na ficha', fora: false }, { product_id: 20, nome: 'Cabo B', efeito: 'Já aplicável', fora: true }]);
  igual('alcance: 2 atributos', alcanceMassa({ tipo: 'atributos', atributos: [1, 2] }, '', PV({ produtos: 3, ja_tinham: 2 }, [[1, 'X', 2], [2, 'Y', 1], [3, 'Z', 1]])).texto,
    '3 produtos selecionados · 2 atributos · 4 entram na ficha · 2 já aplicáveis');
  igual('alcance: efeito por produto com 2 atributos', alcanceMassa({ tipo: 'atributos', atributos: [1, 2] }, '', PV({ produtos: 1, ja_tinham: 1 }, [[1, 'X', 1]])).destinos[0].efeito, '1 entra na ficha · 1 já aplicável');
  // P1 (18/11): os campos do servidor (vinculos_novos, entram, ja_aplicaveis) mandam — 550/158 com o 27 só pelo kit = 0 novos
  const pv27: PreviaV2 = { resumo: { ...R({ produtos: 2, ja_tinham: 2, atributos_acrescentados: 0, produtos_afetados: 0 }), vinculos_novos: 0 }, versao_previa: 'f'.repeat(64),
    produtos: [{ product_id: 550, nome: 'P550', acrescenta: 0, remove: 0, antes: 3, depois: 3, entram: [], ja_aplicaveis: [27] }, { product_id: 158, nome: 'P158', acrescenta: 0, remove: 0, antes: 3, depois: 3, entram: [], ja_aplicaveis: [27] }] };
  const a27 = alcanceMassa({ tipo: 'atributos', atributos: [27] }, '', pv27);
  igual('alcance 550/158/27: 0 entram, 2 já aplicáveis', a27.texto, '2 produtos selecionados · 1 atributo · 0 entram na ficha · 2 já aplicáveis');
  igual('alcance 550/158/27: os dois destinos "Já aplicável"', a27.destinos.map((d) => [d.product_id, d.efeito]), [[158, 'Já aplicável'], [550, 'Já aplicável']]);
  igual('rótulos da prévia', [ROTULO_JA_APLICAVEL, ROTULO_ENTRA], ['Já aplicável', 'Entra na ficha']);
  igual('alcance kit', alcanceMassa({ tipo: 'kit', kit: 5 }, 'Cabos', PV({ produtos: 2, kits_ja_aplicados: 1, atributos_acrescentados: 3 }, [[1, 'X', 3], [2, 'Y', 0]])).texto,
    '2 produtos selecionados · kit Cabos · 1 vínculo novo · 1 já existente · 3 atributos entram na ficha');
  igual('alcance kit: efeito por destino', alcanceMassa({ tipo: 'kit', kit: 5 }, 'Cabos', PV({ produtos: 2 }, [[1, 'X', 3], [2, 'Y', 0]])).destinos.map((d) => d.efeito), ['+3 atributos na ficha', 'nenhum atributo novo']);
  igual('prévia cobre o pedido (mesmos produtos)', previaCobrePedido(p2, { produtos: [11, 20] }), true);
  igual('prévia NÃO cobre: produto a mais no pedido', previaCobrePedido(p2, { produtos: [11, 20, 30] }), false);
  igual('prévia NÃO cobre: produto diferente', previaCobrePedido(p2, { produtos: [11, 21] }), false);
  const muitos = Array.from({ length: 14 }, (_, i) => ({ id: i + 1, nome: i === 12 ? 'Fonte Meanwell' : `Módulo ${i + 1}` }));
  igual('busca de destinos por nome sem acento', filtrarPorIdNome(muitos, 'modulo 1', (x) => x.id).map((x) => x.id), [1, 10, 11, 12, 14]);
  igual('busca de destinos por ID', filtrarPorIdNome(muitos, '13', (x) => x.id).map((x) => x.id), [13]);
  igual('busca vazia devolve todos', filtrarPorIdNome(muitos, '  ', (x) => x.id).length, 14);
}
// ── rever seleção ────────────────────────────────────────────────────────────────────────────────────────────────────
igual('rever: os fora do filtro primeiro, depois pelo ID; ignora sumidos', selecaoParaRever([215, 13, 10, 999, 11], P, [10, 13]).map((x) => [x.id, x.fora]), [[11, true], [215, true], [10, false], [13, false]]);
igual('rever: nome e subcategoria', selecaoParaRever([11], P, []).map((x) => [x.nome, x.subcategoria]), [['Cabo de força 1,5 m', 'cabos']]);

// ── chave de idempotência ───────────────────────────────────────────────────────────────────────────────────────────
let k = 0; const nova = () => `nova${++k}`;
igual('sem incerteza: chave nova', chaveParaPedido('P1', null, nova), 'nova1');
igual('resultado incerto do MESMO pedido: reaproveita a chave', chaveParaPedido('P1', { pedido: 'P1', chave: 'velha' }, nova), 'velha');
igual('pedido diferente: chave nova (nunca a de outro pedido)', chaveParaPedido('P2', { pedido: 'P1', chave: 'velha' }, nova), 'nova2');

// ── link do resultado e conferência (P1 18/11) ───────────────────────────────────────────────────────────────────────────
igual('link da ficha focando o atributo', linkFichaAtributo(550, 27), '#/panel-atributos/produto/550?atributo=27');
igual('link da ficha sem atributo', linkFichaAtributo(158), '#/panel-atributos/produto/158');
igual('conferir: aplicada = salvo, final', [fraseConferencia('aplicada').gravado, fraseConferencia('aplicada').final, fraseConferencia('aplicada').texto], [true, true, 'Conferido: foi salvo.']);
igual('conferir: sem_mudanca = gravado (nada mudou)', fraseConferencia('sem_mudanca').texto, 'Conferido: nada mudou (já estava assim).');
igual('conferir: em_andamento mantém a pendência', [fraseConferencia('em_andamento').final, fraseConferencia('em_andamento').gravado], [false, false]);
igual('conferir: nao_aplicada com o motivo do servidor', fraseConferencia('nao_aplicada', 'O atributo foi desativado. Atualize a seleção.').texto, 'Não foi salvo: O atributo foi desativado. Atualize a seleção. Pode tentar de novo.');
igual('conferir: nao_encontrada mantém a chave (pendência continua)', [fraseConferencia('nao_encontrada').final, fraseConferencia('nao_encontrada').gravado], [false, false]);
igual('conferir: interrompida NÃO é final (mesma chave retoma os pendentes, 5e5fa7cc)', [fraseConferencia('interrompida').final, fraseConferencia('interrompida').gravado], [false, false]);
// ── resultado incerto × recusa definitiva (regra do 5e5fa7cc) ─────────────────────────────────────────────────────────────
const E = (http: number, desconhecido = false, emAndamento = false) => ({ http, desconhecido, emAndamento });
igual('incerto: sem ErroApi (resposta perdida)', resultadoIncerto(null), true);
igual('incerto: desfecho desconhecido (2xx sem recibo)', resultadoIncerto(E(200, true)), true);
igual('incerto: em andamento (409 OPERATION_IN_PROGRESS)', resultadoIncerto(E(409, false, true)), true);
igual('incerto: 500 com corpo', resultadoIncerto(E(500)), true);
igual('incerto: 503 interrompida (lote)', resultadoIncerto(E(503)), true);
igual('incerto: http 0', resultadoIncerto(E(0)), true);
igual('definitivo: 422 recusada → chave nova', resultadoIncerto(E(422)), false);
igual('definitivo: 409 conflito real → chave nova', resultadoIncerto(E(409)), false);

// ── coluna Kit (v4) ─────────────────────────────────────────────────────────────────────────────────────────────────────
const comNomes = (id: number, kits: { id: number; nome: string; motivos: string[] }[]) => ({ id, kits }) as unknown as ProdutoResumo;
const PK = comNomes(1, [{ id: 1, nome: 'Geral', motivos: ['todos'] }, { id: 9, nome: 'Painéis', motivos: ['escopo'] }, { id: 3, nome: 'cabos', motivos: ['direto'] }, { id: 4, nome: 'Ábaco', motivos: ['direto', 'escopo'] }]);
igual('kit: só os específicos (sem o de todos), por nome sem acento/caixa', kitsEspecificos(PK).map((k) => k.id), [4, 3, 9]);
igual('kit: texto de ordenação', textoKits(PK), 'Ábaco, cabos, Painéis');
igual('kit: só o geral = sem kit específico (vazio → fim da ordenação)', textoKits(comNomes(2, [{ id: 1, nome: 'Geral', motivos: ['todos'] }])), '');
igual('kit: coluna e filtro "Sem kit específico" concordam', filtrarProdutos(P, { ...F0, kit: SEM_KIT }).map((p) => textoKits(p)), filtrarProdutos(P, F0).filter((p) => textoKits(p) === '').map((p) => textoKits(p)));
igual('kit: produtos do filtro "Sem kit específico" = os de coluna vazia', ids(filtrarProdutos(P, { ...F0, kit: SEM_KIT })), ids(filtrarProdutos(P, F0).filter((p) => textoKits(p) === '')));
kitsEspecificos(PK); igual('kit: não altera a lista original (ordena uma cópia)', PK.kits.map((k) => k.id), [1, 9, 3, 4]);

// ── MATRIZ V2 (19/11) ───────────────────────────────────────────────────────────────────────────────────────────────────────
{
  const mk = (id: number, kits: { id: number; motivos: string[] }[], sub: string | null = 'modulos', ativo = true) => ({ id, nome: `P${id}`, subcategoria: sub, ativo, kits: kits.map((k) => ({ ...k, nome: `K${k.id}` })) }) as unknown as ProdutoResumo;
  const M = [mk(30, [{ id: 1, motivos: ['todos', 'escopo'] }, { id: 5, motivos: ['direto'] }]), mk(27, [{ id: 1, motivos: ['todos'] }]), mk(110, [{ id: 1, motivos: ['todos'] }, { id: 5, motivos: ['escopo', 'direto', 'todos'] }], 'gabinetes'),
    mk(2, [{ id: 1, motivos: ['todos'] }, { id: 5, motivos: ['escopo'] }]), mk(9, [], 'modulos', false), mk(45, [{ id: 1, motivos: ['todos'] }, { id: 7, motivos: ['xyz'] }])];
  igual('matriz: origens cumulativas na ordem fixa Subcat. → Direto → Todos', origensDaCelula(M[2], 5).origens, ['escopo', 'direto', 'todos']);
  igual('matriz: "todos" = Todos os produtos (marcador, nunca "desligado")', [origensDaCelula(M[1], 1).origens, MARCADOR.todos.titulo], [['todos'], 'Todos os produtos']);
  igual('matriz: célula sem vínculo = vazia', origensDaCelula(M[1], 5), { origens: [], outras: [] });
  igual('matriz: motivo desconhecido não se perde', origensDaCelula(M[5], 7), { origens: [], outras: ['xyz'] });
  igual('matriz: texto de ajuda da célula', textoOrigens(M[0], 1), 'Pela subcategoria · Todos os produtos');
  igual('matriz: só ativos, ordem inicial por ID, SEM corte de 80', produtosDaMatriz(M, new Set(), '').map((p) => p.id), [2, 27, 30, 45, 110]);
  igual('matriz: com seleção, só os selecionados (como no ar)', produtosDaMatriz(M, new Set([30, 2]), '').map((p) => p.id), [2, 30]);
  igual('matriz: filtro de subcategoria', produtosDaMatriz(M, new Set(), 'gabinetes').map((p) => p.id), [110]);
  const F = produtosDaMatriz(M, new Set(), '');
  igual('matriz: Produto ▲/▼ pelo ID NUMÉRICO (não pelo texto "110 · …" < "27 · …")', [ordenarMatriz(F, ORDEM_INICIAL).map((p) => p.id), ordenarMatriz(F, { chave: 'produto', direcao: 'desc' }).map((p) => p.id)], [[2, 27, 30, 45, 110], [110, 45, 30, 27, 2]]);
  igual('matriz: kit ▼ = com vínculo primeiro, desempate pelo ID', ordenarMatriz(F, { chave: 'kit:5', direcao: 'desc' }).map((p) => p.id), [2, 30, 110, 27, 45]);
  igual('matriz: kit ▲ = sem vínculo primeiro, desempate pelo ID', ordenarMatriz(F, { chave: 'kit:5', direcao: 'asc' }).map((p) => p.id), [27, 45, 2, 30, 110]);
  igual('matriz: ordenar não altera as origens da célula (mesmo objeto)', ordenarMatriz(F, { chave: 'kit:5', direcao: 'desc' })[2] === M[2], true);
  igual('matriz: clique: kit novo começa "com vínculo primeiro"; mesma coluna alterna; Produto começa ▲', [proximaOrdem(ORDEM_INICIAL, 'kit:5'), proximaOrdem({ chave: 'kit:5', direcao: 'desc' }, 'kit:5'), proximaOrdem({ chave: 'kit:5', direcao: 'desc' }, 'produto'), proximaOrdem(ORDEM_INICIAL, 'produto')],
    [{ chave: 'kit:5', direcao: 'desc' }, { chave: 'kit:5', direcao: 'asc' }, { chave: 'produto', direcao: 'asc' }, { chave: 'produto', direcao: 'desc' }]);
  igual('matriz: aria-sort e rótulo dizem o critério', [ariaSortMatriz(ORDEM_INICIAL, 'produto'), ariaSortMatriz(ORDEM_INICIAL, 'kit:5'), rotuloOrdenar(ORDEM_INICIAL, 'produto')], ['ascending', 'none', 'Ordenar pelo código do produto, decrescente']);
  igual('matriz: largura cabe o maior conjunto de marcadores (mínimo 104)', [larguraKit(F, 1), larguraKit(F, 5), larguraKit(F, 99)], [Math.max(104, 52 + 46 + 4 + 36), 52 + 48 + 46 + 8 + 36, 104]);
}

console.log(`${falhas === 0 ? '[OK]  ' : '[FALHA]'} vincular-puras (seleção, filtrados, origens, carga atrasada, massa, alcance, remoção, frases): ${n} casos, ${falhas} falha(s)`);
process.exitCode = falhas === 0 ? 0 : 1;
