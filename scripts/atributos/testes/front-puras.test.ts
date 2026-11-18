// Produtos & Atributos — testes das funções puras do painel (formatação pt-BR, entrada numérica, busca, rótulos, cor do kit).
// Rodar: bash scripts/atributos/testes/front-puras.sh (empacota com o esbuild do Vite e executa no Node; sem dependência nova).
import { campoPrecifica, casaBusca, comparaMenosPreenchidos, dataCurta, dataHora, decimal, numeroParaApi, pct, pctDe, valor, sugestaoTexto } from '../../../public/components/panels/panel-atributos/src/lib/formatar';
import { corKit, rotuloSubcategoria } from '../../../public/components/panels/panel-atributos/src/lib/rotulos';
import { lerRota, rotaDe } from '../../../public/components/panels/panel-atributos/src/lib/rota';

let n = 0; let falhas = 0;
function igual(nome: string, obtido: unknown, esperado: unknown) {
  n++;
  if (JSON.stringify(obtido) !== JSON.stringify(esperado)) { falhas++; console.log(`[ERRO] ${nome}: obtido ${JSON.stringify(obtido)} · esperado ${JSON.stringify(esperado)}`); }
}
const V = (p: Partial<Parameters<typeof valor>[0]>) => ({ estado: 'informado', opcoes: [], numero: null, booleano: null, data: null, texto: null, ...p }) as Parameters<typeof valor>[0];

// decimal exato (sem float), igual ao app
igual('decimal milhar', decimal('1000.000000'), '1.000');
igual('decimal fração', decimal('2.500000'), '2,5');
igual('decimal negativo', decimal('-1234567.25'), '-1.234.567,25');
igual('decimal com casas fixas, sem arredondar', decimal('2.567', 2), '2,56');
igual('decimal zero', decimal('0.000000'), '0');
igual('decimal grande sem perder precisão', decimal('123456789012345.123456'), '123.456.789.012.345,123456');
// valor com estado e unidade
igual('valor número + unidade', valor(V({ numero: '150.000000' }), 'cm'), '150 cm');
igual('valor não se aplica', valor(V({ estado: 'nao_se_aplica' }), 'cm'), 'Não se aplica');
igual('valor desconhecido', valor(V({ estado: 'desconhecido' }), null), 'Desconhecido');
igual('valor opções', valor(V({ opcoes: ['Indoor', 'Outdoor'] }), null), 'Indoor, Outdoor');
igual('valor booleano', valor(V({ booleano: false }), null), 'Não');
igual('valor data', valor(V({ data: '2026-11-18' }), null), '18/11/2026');
// entrada do usuário → API
igual('vírgula decimal', numeroParaApi('2,5'), '2.5');
igual('milhar com vírgula', numeroParaApi('1.234,5'), '1234.5');
igual('milhar sem fração', numeroParaApi('1.500'), '1500');
igual('espaços', numeroParaApi(' 80 '), '80');
igual('ponto decimal isolado', numeroParaApi('0.5'), '0.5');
igual('0.001 é decimal (fator de mm), não 1', numeroParaApi('0.001'), '0.001');
igual('0.250 é decimal, não 250', numeroParaApi('0.250'), '0.250');
igual('-0.500 é decimal', numeroParaApi('-0.500'), '-0.500');
igual('12.345.678 é milhar', numeroParaApi('12.345.678'), '12345678');
// busca
igual('busca vazia casa tudo', casaBusca('  ', 1, 'x'), true);
igual('busca por ID exato', casaBusca('154', 154, 'Cabo Flat'), true);
igual('busca ID com zero à esquerda', casaBusca('0154', 154, 'Cabo Flat'), true);
igual('busca ID não casa outro', casaBusca('154', 15, 'Cabo'), false);
igual('busca nome sem acento', casaBusca('modulo p2', 1, 'Módulo LED P2.5 Indoor'), true);
igual('busca nome com todas as palavras', casaBusca('cabo hdmi', 1, 'Cabo DVI - DVI'), false);
// datas e percentuais
igual('dataHora', dataHora('2026-11-18 05:26:31.000'), '18/11/2026 05:26');
igual('dataHora vazia', dataHora(null), '—');
igual('dataCurta', dataCurta('2026-01-02T00:00:00Z'), '02/01/2026');
igual('pctDe sem total', pctDe({ feitos: 0, total: 0 }), null);
igual('pctDe', pctDe({ feitos: 1, total: 3 }), 33);
igual('pct', pct(1, 0), 0);
// Precifica (só leitura)
igual('Precifica vazio', campoPrecifica(''), '—');
igual('Precifica número + unidade', campoPrecifica('2.50', 'mm'), '2,5 mm');
igual('Precifica enumeração', campoPrecifica('IN', undefined, { IN: 'Indoor' }), 'Indoor');
// rótulos e cor do kit
igual('subcategoria traduzida', rotuloSubcategoria('CABLE'), 'Cabos');
igual('subcategoria nula', rotuloSubcategoria(null), 'Sem subcategoria');
igual('subcategoria desconhecida mantém o código', rotuloSubcategoria('XYZ_NOVA'), 'XYZ_NOVA');
igual('cor do kit estável', corKit('Cabos'), corKit('Cabos'));
igual('cor do kit base', corKit('Base (todos os produtos)'), 'var(--bl-serie-7)');
igual('cor sem kit', corKit(null), 'var(--bl-neutro)');

// rotas do módulo (endereço próprio por tela; recarregar/Voltar/compartilhar)
igual('rota base → produtos', lerRota('#/panel-atributos'), { aba: 'produtos', produto: null, kit: null });
igual('rota visão geral', lerRota('#/panel-atributos/visao-geral'), { aba: 'visao', produto: null, kit: null });
igual('rota kits', lerRota('#/panel-atributos/kits'), { aba: 'kits', produto: null, kit: null });
igual('rota kit aberto', lerRota('#/panel-atributos/kits/42'), { aba: 'kits', produto: null, kit: 42 });
igual('rota ficha 154', lerRota('#/panel-atributos/produto/154'), { aba: 'produtos', produto: 154, kit: null });
igual('rota com barra no fim', lerRota('#/panel-atributos/conferencia/'), { aba: 'conferencia', produto: null, kit: null });
igual('rota de outro painel → null', lerRota('#/panel-bling/kits'), null);
igual('rota prefixo parecido → null', lerRota('#/panel-atributosX'), null);
igual('rota desconhecida → produtos', lerRota('#/panel-atributos/xyz'), { aba: 'produtos', produto: null, kit: null });
igual('id inválido na ficha → lista', lerRota('#/panel-atributos/produto/abc'), { aba: 'produtos', produto: null, kit: null });
igual('rotaDe ficha', rotaDe({ aba: 'kits', produto: 154, kit: 3 }), '#/panel-atributos/produto/154');
igual('rotaDe kit', rotaDe({ aba: 'kits', produto: null, kit: 3 }), '#/panel-atributos/kits/3');
igual('rotaDe atributos', rotaDe({ aba: 'atributos', produto: null, kit: null }), '#/panel-atributos/atributos');
// UX-1: sugestão formatada pelo TIPO do atributo (igual na Ficha e na grade)
const itT = (tipo: string) => ({ tipo, opcoes: [{ id: 7, rotulo: 'Azul', ativo: true, posicao: 1 }], unidades: [{ id: 3, simbolo: 'mm' }] }) as never;
igual('sugestão de TEXTO preserva "00154"', sugestaoTexto({ valor_proposto: '00154', opcao_id: null, unidade_id: null }, itT('texto')), '00154');
igual('sugestão de NÚMERO em formato brasileiro com unidade', sugestaoTexto({ valor_proposto: '1234.50', opcao_id: null, unidade_id: 3 }, itT('numero')), '1.234,5 mm');
igual('sugestão de OPÇÃO mostra o rótulo', sugestaoTexto({ valor_proposto: 'azul', opcao_id: 7, unidade_id: null }, itT('opcao')), 'Azul');
igual('sugestão de SIM/NÃO', sugestaoTexto({ valor_proposto: '1', opcao_id: null, unidade_id: null }, itT('booleano')), 'Sim');
igual('número em atributo de TEXTO não vira número ("0012,5" fica igual)', sugestaoTexto({ valor_proposto: '0012.5', opcao_id: null, unidade_id: null }, itT('texto')), '0012.5');
igual('rotaDe produtos = endereço do item "Geral Produtos" (#/panel-atributos)', rotaDe({ aba: 'produtos', produto: null, kit: null }), '#/panel-atributos');
igual('lerRota /produtos (endereço antigo) continua abrindo a lista', JSON.stringify(lerRota('#/panel-atributos/produtos')), JSON.stringify({ aba: 'produtos', produto: null, kit: null }));
igual('ida e volta de todas as telas', (['visao', 'produtos', 'vincular', 'preencher', 'kits', 'atributos', 'unidades', 'conferencia'] as const).every((a) => lerRota(rotaDe({ aba: a, produto: null, kit: null }))?.aba === a), true);

// UX-1: "menos preenchidos" (caso do Cima: 0/0, 0/2 e 1/2 → a 1ª tarefa é a 0/2; 0/0 no fim)
const pr = (id: number, feitos: number, total: number) => ({ id, essencial: { feitos, total } });
igual('menos preenchidos: 0/0, 0/2 e 1/2 → 0/2, 1/2, 0/0', [pr(1, 0, 0), pr(2, 0, 2), pr(3, 1, 2)].sort(comparaMenosPreenchidos).map((p) => p.id).join(','), '2,3,1');
igual('menos preenchidos: 0/0 vai para o fim mesmo com ID menor; 2/2 (100%) antes do 0/0', [pr(9, 2, 2), pr(1, 0, 0), pr(5, 1, 4)].sort(comparaMenosPreenchidos).map((p) => p.id).join(','), '5,9,1');
igual('menos preenchidos: empate de % pelo ID', [pr(8, 1, 2), pr(4, 2, 4)].sort(comparaMenosPreenchidos).map((p) => p.id).join(','), '4,8');

console.log(`${falhas === 0 ? '[OK]  ' : '[FALHA]'} front-puras (formatação, entrada, busca, rótulos): ${n} casos, ${falhas} falha(s)`);
process.exitCode = falhas === 0 ? 0 : 1;
