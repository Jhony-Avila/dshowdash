// DSHOW-105 (DIREITA, 23/11) — "Aceitar as N visíveis" só com a página exibida. Rodar: bash scripts/atributos/testes/conferencia-lote.sh
import { congelarConfirmacao, elegiveisDaPagina, PAGINA_SUGESTOES, paginaExibida } from '../../../public/components/panels/panel-atributos/src/ui/conferencia-lote';

let n = 0; let falhas = 0;
const igual = (nome: string, obtido: unknown, esperado: unknown) => { n++; if (JSON.stringify(obtido) !== JSON.stringify(esperado)) { falhas++; console.log(`[ERRO] ${nome}: obtido ${JSON.stringify(obtido)} · esperado ${JSON.stringify(esperado)}`); } };
const lanca = (nome: string, f: () => unknown) => { n++; try { f(); falhas++; console.log(`[ERRO] ${nome}: não lançou`); } catch { /* esperado */ } };

// fila de 450: os 50 primeiros já têm valor; atributos alternados A/B
const fila = Array.from({ length: 450 }, (_, i) => ({ id: 1000 + i, versao: i % 7, ja_tem_valor: i < 50, atributo: i % 2 ? 'B' : 'A' }));

// 1. a página é a ÚNICA coleção: no máximo 200, na ordem, respeitando o filtro
const p = paginaExibida(fila, '');
igual('página = 200 primeiras linhas', [p.length, p[0].id, p[199].id], [PAGINA_SUGESTOES, 1000, 1199]);
const pA = paginaExibida(fila, 'A');
igual('filtro preservado: só A, 200 linhas', [pA.length, pA.every((x) => x.atributo === 'A'), pA[199].id], [200, true, 1398]);

// 2. elegíveis = itens DA PÁGINA sem valor (antes: da fila inteira → IDs além das linhas exibidas)
const e = elegiveisDaPagina(p);
igual('elegíveis só da página (150 = 200 − 50 com valor)', [e.length, Math.max(...e.map((x) => x.id))], [150, 1199]);
const antes = fila.filter((x) => !x.ja_tem_valor).slice(0, 200);   // a regra antiga
igual('regra antiga mandava IDs fora das 200 exibidas (prova do defeito)', antes.some((x) => x.id > 1199), true);

// 3. confirmação congelada: ids + versões; nada fora da página; limite
const c = congelarConfirmacao(p, e);
igual('ids congelados = elegíveis da página', [c.ids.length, c.ids[0], c.ids[c.ids.length - 1]], [150, 1050, 1199]);
igual('versões congeladas = as da página no momento da confirmação', [c.versoes[1050], c.versoes[1199]], [50 % 7, 199 % 7]);
lanca('item fora da página é recusado', () => congelarConfirmacao(p, [...e, fila[300]]));
lanca('lote vazio é recusado', () => congelarConfirmacao(p, []));
igual('confirmação imutável', Object.isFrozen(c) && Object.isFrozen(c.ids) && Object.isFrozen(c.versoes), true);
igual('IDs sem repetição', congelarConfirmacao(p, [e[0], e[0], e[1]]).ids, [e[0].id, e[1].id]);

console.log(falhas ? `[FALHA] conferencia-lote (DSHOW-105): ${falhas} falha(s) em ${n} casos` : `[OK]   conferencia-lote (DSHOW-105, só a página exibida): ${n} casos, 0 falha(s)`);
process.exit(falhas ? 1 : 0);
