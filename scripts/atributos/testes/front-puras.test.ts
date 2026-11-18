// Produtos & Atributos — testes das funções puras do painel (formatação pt-BR, entrada numérica, busca, rótulos, cor do kit).
// Rodar: bash scripts/atributos/testes/front-puras.sh (empacota com o esbuild do Vite e executa no Node; sem dependência nova).
import { campoPrecifica, casaBusca, dataCurta, dataHora, decimal, numeroParaApi, pct, pctDe, valor } from '../../../public/components/panels/panel-atributos/src/lib/formatar';
import { corKit, rotuloSubcategoria } from '../../../public/components/panels/panel-atributos/src/lib/rotulos';

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

console.log(`${falhas === 0 ? '[OK]  ' : '[FALHA]'} front-puras (formatação, entrada, busca, rótulos): ${n} casos, ${falhas} falha(s)`);
process.exitCode = falhas === 0 ? 0 : 1;
