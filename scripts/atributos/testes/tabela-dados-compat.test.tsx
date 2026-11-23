// TabelaDados · compat da linha expansível (pedido da DIREITA §31.4, 18/11): `expandida` como CHAVE (React.Key | null) + `detalheLinha`,
// convivendo com a forma do Vincular (`expandida(linha)` + `renderExpansao`). Renderiza no servidor (react-dom/server), sem navegador.
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { TabelaDados, type ColunaTabela } from '../../../public/components/panels/panel-atributos/src/ui/TabelaDados';

let n = 0, falhas = 0;
const ok = (nome: string, cond: boolean, extra = '') => { n++; if (!cond) { falhas++; console.log(`FALHA ${nome}${extra ? ' · ' + extra : ''}`); } };
type L = { id: number; nome: string };
const linhas: L[] = [{ id: 1, nome: 'A' }, { id: 7, nome: 'B' }, { id: 9, nome: 'C' }];
const colunas: ColunaTabela<L>[] = [{ chave: 'nome', titulo: 'Nome', tipo: 'texto', render: (l, ctx) => <button type="button" {...ctx.gatilho}>{l.nome}</button> }];
const abertas = (html: string) => [...html.matchAll(/data-detalhe-de="([^"]+)"/g)].map((m) => m[1]);
const html = (p: Record<string, unknown>) => renderToStaticMarkup(<TabelaDados colunas={colunas} linhas={linhas} chaveLinha={(l) => l.id} idTabela="t" ordenacao={null} aoOrdenar={() => {}} {...p} />);

ok('chave numérica + detalheLinha: só a linha 7 aberta, com o detalhe', JSON.stringify(abertas(html({ expandida: 7, detalheLinha: (l: L) => <i>det-{l.id}</i> }))) === '["7"]' && html({ expandida: 7, detalheLinha: (l: L) => <i>det-{l.id}</i> }).includes('det-7'));
ok('chave em texto ("9") casa com a chave numérica 9', JSON.stringify(abertas(html({ expandida: '9', detalheLinha: (l: L) => <i>{l.id}</i> }))) === '["9"]');
ok('expandida null: nenhuma aberta', abertas(html({ expandida: null, detalheLinha: () => 'x' })).length === 0);
ok('chave sem detalhe (nem detalheLinha nem renderExpansao): nenhuma aberta', abertas(html({ expandida: 7 })).length === 0);
ok('forma do Vincular (função + renderExpansao): várias abertas', JSON.stringify(abertas(html({ expandida: (l: L) => l.id !== 7, renderExpansao: (l: L) => <b>{l.id}</b> }))) === '["1","9"]');
ok('os dois renderizadores: vale renderExpansao', html({ expandida: 1, renderExpansao: () => 'R-EXP', detalheLinha: () => 'D-LIN' }).includes('R-EXP') && !html({ expandida: 1, renderExpansao: () => 'R-EXP', detalheLinha: () => 'D-LIN' }).includes('D-LIN'));
ok('gatilho com aria-expanded=true só na linha aberta (chave)', (html({ expandida: 7, detalheLinha: () => 'x', aoAlternarExpansao: () => {} }).match(/aria-expanded="true"/g) ?? []).length === 1);
ok('id da linha de detalhe = idExpansao(idTabela, chave)', html({ expandida: 7, detalheLinha: () => 'x' }).includes('id="t-exp-7"'));

console.log(`${falhas === 0 ? '[OK]  ' : '[FALHA]'} tabela-dados-compat (expandida por chave + detalheLinha, §31.4): ${n} casos, ${falhas} falha(s)`);
process.exitCode = falhas === 0 ? 0 : 1;
