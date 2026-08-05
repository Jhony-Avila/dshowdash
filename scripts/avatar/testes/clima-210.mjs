// testes/clima-210.mjs — LOTE 201–210: clima §163 (overlay/persistência/
// composição §185 v2/preset §180 v2/ponte §179 Clima→Luz) + preview por
// contexto §181 no detalhe de moldura/banner.
// @version 1.0.0  @created 2026-08-05
import { BASE, SAIDA, abrir, irParaHarness, relatorio } from './navegador.mjs';

const { navegador: b, pagina: p, erros } = await abrir({
  viewport: { width: 1500, height: 940 },
  init: () => { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': true })); },
});
await irParaHarness(p, 'avst-harness.html', 1000);

const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };

// R1 (§163): chips de clima; chuva liga o overlay + data-clima
ok(await p.locator('[data-teste="climas-2d"] button').count() >= 4, 'esperava 4 climas (§163)');
await p.locator('[data-teste="climas-2d"] button', { hasText: 'Chuva' }).click();
await p.waitForTimeout(400);
ok(await p.locator('.avst5-viewport[data-clima="chuva"]').count() === 1, 'data-clima não refletiu a chuva');
ok(await p.locator('[data-teste="clima-overlay"] line').count() >= 10, 'overlay de chuva sem as linhas');

// R2 (§179): chuva sugere luz FRIA; aplicar muda a luz
await p.waitForSelector('[data-teste="sugestao-luz"]', { timeout: 3000 });
await p.locator('[data-teste="sugestao-luz"]').click();
await p.waitForTimeout(300);
ok(await p.locator('[data-teste="luzes-2d"] [aria-checked="true"]', { hasText: 'Fria' }).count() === 1,
  'sugestão §179 não aplicou a luz fria');
ok(await p.locator('[data-teste="sugestao-luz"]').count() === 0, 'sugestão deveria sumir depois de aplicada');

// R3 (§185 v2): composição com clima entra no histórico e RESTAURA
await p.evaluate(() => { [...document.querySelectorAll('[data-teste="climas-2d"] button')].find((x) => x.textContent.trim() === 'Neve')?.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
await p.waitForTimeout(1000); // debounce do histórico
await p.evaluate(() => { [...document.querySelectorAll('[data-teste="climas-2d"] button')].find((x) => x.textContent.trim() === 'Limpo')?.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
await p.waitForTimeout(1000);
await p.evaluate(() => { [...document.querySelectorAll('button')].find((x) => x.title?.includes('Studio'))?.click(); });
await p.waitForTimeout(600);
await p.waitForSelector('[data-teste="hist-restaurar"]', { timeout: 4000 });
await p.evaluate(() => document.querySelector('[data-teste="hist-restaurar"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true })));
await p.waitForTimeout(500);
ok(await p.locator('.avst5-viewport[data-clima="neve"]').count() === 1, 'restaurar §185 não voltou o clima');
ok(await p.locator('[data-teste="clima-overlay"] circle').count() >= 10, 'overlay de neve sem os flocos');
await p.screenshot({ path: `${SAIDA}/clima-neve.png` });

// R4 (§180 v2): preset guarda o clima; aplicar depois de limpar restaura
await p.evaluate(() => document.querySelector('[data-teste="apresentacao-salvar"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true })));
await p.waitForTimeout(400);
await p.evaluate(() => { [...document.querySelectorAll('[data-teste="climas-2d"] button')].find((x) => x.textContent.trim() === 'Limpo')?.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
await p.waitForTimeout(300);
await p.evaluate(() => { const l = document.querySelectorAll('[data-teste="ap-aplicar"]'); l[l.length - 1]?.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
await p.waitForTimeout(400);
ok(await p.locator('.avst5-viewport[data-clima="neve"]').count() === 1, 'preset §180 não guardou/aplicou o clima');
// volta ao modo edição p/ o R5
await p.evaluate(() => { [...document.querySelectorAll('button')].find((x) => x.title?.includes('Studio'))?.click(); });
await p.waitForTimeout(500);

// R5 (§181): detalhe de MOLDURA ganha chips de contexto (perfil/header/menu)
await p.evaluate(() => { [...document.querySelectorAll('.avst5-cat')].find((x) => x.textContent.includes('Moldura'))?.click(); });
await p.waitForTimeout(700);
await p.evaluate(() => {
  const c = [...document.querySelectorAll('.avst5-painel .avst-card')]
    .find((x) => !x.className.includes('avst-card-bloqueado') && !x.className.includes('avst-card-nenhum'));
  c?.querySelector('.avst-card-info-btn')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
});
await p.waitForTimeout(600);
ok(await p.locator('[data-teste="ctx-preview"]').count() === 1, 'chips de contexto §181 ausentes no detalhe da moldura');
await p.locator('[data-teste="ctx-menu"]').click();
await p.waitForTimeout(300);
ok(await p.locator('.avst5-det-hero.avst5-ctx-menu').count() === 1, 'contexto Menu não aplicou no hero');
await p.screenshot({ path: `${SAIDA}/clima-ctx.png` });

const ok_ = relatorio('clima-210', falhas, erros);
await b.close();
process.exit(ok_ ? 0 : 1);
