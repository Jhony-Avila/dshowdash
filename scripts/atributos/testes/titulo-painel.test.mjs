// DSHOW-062 · teste determinístico do resolvedor de título/caminho do contêiner (main/ui/container-main/core/label-resolver.js — o JS
// distribuído). Painel COMPARTILHADO (panel-stub-dev) só tem título com IDENTIDADE (rota exata); sem ela → "Painel", com 0, 1 ou vários
// itens. Painéis EXCLUSIVOS: 1ª correspondência por panelId, como antes. Rodar: node scripts/atributos/testes/titulo-painel.test.mjs
import { createLabelResolver } from '../../../public/components/main/ui/container-main/core/label-resolver.js';
let n = 0, f = 0;
const ok = (nome, c, extra = '') => { n++; if (!c) { f++; console.log(`[ERRO] ${nome}${extra ? ' · ' + extra : ''}`); } };
globalThis.window = { location: { hash: '' } };
const it = (key, label, route, panelId) => ({ id: key, key, label, route, panelId });
const STUB = 'panel-stub-dev';
const muitos = [it('sidebar.compras.visao-geral', 'Geral Compras', '#/compras/visao-geral', STUB), it('sidebar.produtos.visao-geral', 'Geral Produtos', '#/produtos/visao-geral', STUB),
  it('sidebar.clientes.visao-geral', 'Geral Clientes', '#/clientes/visao-geral', STUB), it('sidebar.bling', 'Bling', '#/panel-bling', 'panel-bling'),
  it('sidebar.produtos.atributos.produtos', 'Geral Produtos', '#/panel-atributos', 'panel-atributos'), it('sidebar.produtos.atributos.kits', 'Kits', '#/panel-atributos/kits', 'panel-atributos')];
const R = (items) => createLabelResolver({ getItems: () => items });
const com = (items, route, hash = '') => { window.location.hash = hash; return R(items)(STUB, { route }); };
// compartilhado, com identidade
ok('compartilhado + rota exata do item → o PRÓPRIO rótulo (Geral Produtos, não Geral Compras)', com(muitos, '#/produtos/visao-geral') === 'Geral Produtos');
ok('compartilhado + rota exata de Clientes → Geral Clientes', com(muitos, '#/clientes/visao-geral') === 'Geral Clientes');
ok('compartilhado + rota ausente, mas endereço atual exato (Voltar/deep link) → o rótulo do endereço', com(muitos, null, '#/clientes/visao-geral') === 'Geral Clientes');
// compartilhado, SEM identidade
ok('compartilhado, vários itens, sem rota → "Painel"', com(muitos, null) === 'Painel');
ok('compartilhado, rota genérica #/panel-stub-dev (navegação parcial) → "Painel"', com(muitos, '#/panel-stub-dev') === 'Painel');
ok('compartilhado, 1 item visível, sem rota → "Painel" (a contagem não prova identidade)', com([muitos[1]], null) === 'Painel');
ok('compartilhado, 1 item visível, rota de OUTRO item (não visível) → "Painel"', com([muitos[1]], '#/compras/visao-geral') === 'Painel');
ok('compartilhado, 0 itens → "Painel" (nunca "Stub Dev")', com([], '#/produtos/visao-geral') === 'Painel');
ok('compartilhado, sem registro → "Painel"', createLabelResolver(null)(STUB, { route: '#/produtos/visao-geral' }) === 'Painel');
ok('compartilhado: rota PARECIDA não casa (#/produtos/visao-geral/ e #/produtos/visao-gera) → "Painel"', com(muitos, '#/produtos/visao-geral/') === 'Painel' && com(muitos, '#/produtos/visao-gera') === 'Painel');
ok('compartilhado: rota exata de um item de OUTRO painel não serve (#/panel-atributos) → "Painel"', com(muitos, '#/panel-atributos') === 'Painel');
ok('compartilhado: endereço atual de outro painel (stale) não serve → "Painel"', com(muitos, null, '#/panel-atributos/kits') === 'Painel');
// exclusivos: como antes
window.location.hash = '';
ok('exclusivo (panel-bling) → 1ª correspondência, como antes', R(muitos)('panel-bling', { route: '#/qualquer' }) === 'Bling');
ok('exclusivo com vários itens (panel-atributos) → 1ª correspondência, como antes', R(muitos)('panel-atributos', {}) === 'Geral Produtos');
ok('exclusivo sem item no menu → nome formatado, como antes', R(muitos)('panel-financeiro-x', {}) === 'Financeiro X');
ok('sem panelId → "Principal", como antes', R(muitos)('', {}) === 'Principal');
console.log(`${f === 0 ? '[OK]  ' : '[FALHA]'} titulo-painel (DSHOW-062, label-resolver.js distribuído): ${n} casos, ${f} falha(s)`);
process.exit(f ? 1 : 0);
