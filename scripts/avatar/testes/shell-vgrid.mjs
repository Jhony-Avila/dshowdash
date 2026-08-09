// testes/shell-vgrid.mjs — AS5 §276: VIRTUALIZAÇÃO da grade de itens.
// @version 1.0.0  @created 2026-08-03
//
// Cabelo tem 50 itens (> LIMIAR 40): os primeiros 24 montam de verdade e o
// resto entra como esqueleto (.avst-card-adiado). Ao rolar o painel até o
// fim, o IntersectionObserver promove os esqueletos a cards reais.
import { SAIDA, abrir, irParaHarness, relatorio } from './navegador.mjs';

const { navegador: b, pagina: p, erros } = await abrir({
  viewport: { width: 1500, height: 940 },
  init: () => { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': true, 'as6.dock_inferior': false })); },
});
await irParaHarness(p, 'avst-harness.html', 1200);

const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };

// R1: Cabelo (50 itens) ativa a virtualização — existem cards adiados
await p.evaluate(() => { [...document.querySelectorAll('.avst5-cat')].find((x) => x.textContent.includes('Cabelo'))?.click(); });
await p.waitForTimeout(900);
const cards = await p.locator('.avst5-painel .avst-card').count();
const adiadosAntes = await p.locator('[data-teste="card-adiado"]').count();
ok(cards >= 50, `Cabelo deveria listar 50+ cards (tem ${cards})`);
ok(adiadosAntes > 0, `com ${cards} itens deveria haver esqueletos adiados (tem ${adiadosAntes})`);
// os PRIMEIROS cards (acima da dobra) nunca são esqueleto
const primeiroAdiado = await p.locator('.avst5-painel .avst-card').first().getAttribute('data-teste');
ok(primeiroAdiado !== 'card-adiado', 'o 1º card não pode ser esqueleto');
await p.screenshot({ path: `${SAIDA}/vgrid-antes.png` });

// R2: rolar o painel até o fim promove os esqueletos a cards reais
await p.evaluate(() => {
  const alvo = [...document.querySelectorAll('.avst5-painel, .avst5-painel *')]
    .find((el) => el.scrollHeight > el.clientHeight + 40);
  alvo?.scrollTo({ top: alvo.scrollHeight });
});
await p.waitForTimeout(1200);
const adiadosDepois = await p.locator('[data-teste="card-adiado"]').count();
ok(adiadosDepois < adiadosAntes, `rolar deveria promover esqueletos (${adiadosAntes}→${adiadosDepois})`);
// o ÚLTIMO card virou real e tem thumbnail de verdade (svg montado)
const ultimoTemSvg = await p.locator('.avst5-painel .avst-card').last().locator('svg').count();
ok(ultimoTemSvg > 0, 'último card deveria ter thumbnail SVG após a rolagem');
await p.screenshot({ path: `${SAIDA}/vgrid-depois.png` });

// R3: card promovido continua CLICÁVEL (equipar funciona)
await p.evaluate(() => {
  const cards2 = [...document.querySelectorAll('.avst5-painel .avst-card')].filter((c) => !c.className.includes('avst-card-ativo') && !c.className.includes('avst-card-nenhum'));
  cards2[cards2.length - 1]?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
});
await p.waitForTimeout(600);
ok((await p.locator('.avst5-salvar').textContent())?.includes('cabelo'), 'equipar num card promovido deveria citar a categoria na barra');

// R4: categoria PEQUENA (Roupa, 30) não virtualiza — zero esqueletos
await p.evaluate(() => { [...document.querySelectorAll('.avst5-cat')].find((x) => x.textContent.includes('Roupa'))?.click(); });
await p.waitForTimeout(800);
ok(await p.locator('[data-teste="card-adiado"]').count() === 0, 'Roupa (30 itens) não deveria virtualizar');

const ok_ = relatorio('shell-vgrid', falhas, erros);
await b.close();
process.exit(ok_ ? 0 : 1);
