// testes/shell-palco3d-criativo.mjs — lote 31–40 no PALCO 3D: cenas salvas
// (31), captura transparente (32), turntable 360° (33), qualidade manual
// (34) e modo apresentação/tela cheia (39).
// @version 1.0.0  @created 2026-08-04
import { SAIDA, abrir, irParaHarness, relatorio } from './navegador.mjs';

const { navegador: b, pagina: p, erros } = await abrir({
  viewport: { width: 1500, height: 940 }, webgl: true,
  init: () => {
    // lote 691-700: quality_v2 OFF aqui — este teste cobre o modo antigo
    // (4 chips §651); os perfis Ultra/Cine têm teste próprio
    localStorage.setItem('dshow.avst.flags.v1',
      JSON.stringify({ 'as5.novo_shell': true, 'as6.dock_inferior': false, 'as5.palco3d': true, 'as5.quality3d_v2': false }));
  },
});
await irParaHarness(p, 'avst-harness.html', 1200);

const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };

await p.locator('[data-teste="botao-3d"]').click();
await p.waitForSelector('[data-teste="palco-3d"] canvas', { timeout: 30000 });
await p.waitForTimeout(4000);

// R1 (mega 34): QUALIDADE MANUAL — 4 chips; Econ. reflete na nota; persiste
ok(await p.locator('[data-teste="p3d-qualidade"] .avst5-p3d-chip').count() === 4, 'esperava 4 chips de qualidade');
await p.locator('[data-teste="p3d-qualidade"] .avst5-p3d-chip', { hasText: 'Econ.' }).click();
await p.waitForTimeout(2500); // troca de LOD a quente
ok((await p.locator('[data-teste="p3d-pendencias"]').textContent())?.includes('econômica'),
  'nota deveria mostrar a qualidade manual econômica');
const persistiu = await p.evaluate(() => localStorage.getItem('dshow.avst5.p3d.qualidade.v1'));
ok(persistiu === 'economico', `qualidade não persistiu (${persistiu})`);
await p.locator('[data-teste="p3d-qualidade"] .avst5-p3d-chip', { hasText: 'Auto' }).click();
await p.waitForTimeout(2500);

// R2 (mega 31): CENAS — salvar captura o setup; aplicar restaura; excluir some
await p.locator('[data-teste="p3d-fundos"] .avst5-p3d-chip', { hasText: 'Grade' }).click();
await p.locator('[data-teste="p3d-luzes"] .avst5-p3d-chip', { hasText: 'Neon' }).click();
await p.waitForTimeout(400);
await p.locator('[data-teste="p3d-cena-salvar"]').click();
await p.waitForTimeout(300);
ok(await p.locator('[data-teste="p3d-cenas"] .avst5-p3d-cena').count() === 1, 'salvar cena não criou o chip');
// muda o setup → aplicar a cena traz Grade+Neon de volta
await p.locator('[data-teste="p3d-fundos"] .avst5-p3d-chip', { hasText: 'Estúdio' }).click();
await p.locator('[data-teste="p3d-luzes"] .avst5-p3d-chip', { hasText: 'Estúdio' }).click();
await p.waitForTimeout(400);
await p.locator('[data-teste="p3d-cenas"] .avst5-p3d-cena button', { hasText: 'Cena 1' }).click();
await p.waitForTimeout(600);
ok(await p.locator('[data-teste="p3d-fundos"] .avst5-p3d-chip[aria-checked="true"]', { hasText: 'Grade' }).count() === 1,
  'aplicar cena não restaurou o fundo Grade');
ok(await p.locator('[data-teste="p3d-luzes"] .avst5-p3d-chip[aria-checked="true"]', { hasText: 'Neon' }).count() === 1,
  'aplicar cena não restaurou a luz Neon');
await p.screenshot({ path: `${SAIDA}/palco3d-cena.png` });
await p.locator('.avst5-p3d-cena-x').click();
await p.waitForTimeout(300);
ok(await p.locator('[data-teste="p3d-cenas"] .avst5-p3d-cena').count() === 0, 'excluir cena não removeu o chip');
// volta ao fundo padrão p/ o resto do teste
await p.locator('[data-teste="p3d-fundos"] .avst5-p3d-chip', { hasText: 'Estúdio' }).click();
await p.locator('[data-teste="p3d-luzes"] .avst5-p3d-chip', { hasText: 'Estúdio' }).click();

// R3 (mega 32): CAPTURA TRANSPARENTE — canto do PNG com alpha 0
await p.locator('[data-teste="p3d-transparente"]').click();
ok(await p.locator('[data-teste="p3d-transparente"][aria-pressed="true"]').count() === 1,
  'toggle transparente não ligou');
const captura = await p.evaluate(async () => {
  const original = HTMLAnchorElement.prototype.click;
  let pego = null;
  HTMLAnchorElement.prototype.click = function () { pego = { href: this.href, nome: this.download }; };
  document.querySelector('[data-teste="p3d-capturar"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  for (let i = 0; i < 100 && !pego; i += 1) await new Promise((r) => setTimeout(r, 100));
  HTMLAnchorElement.prototype.click = original;
  if (!pego) return null;
  const img = new Image();
  await new Promise((r) => { img.onload = r; img.src = pego.href; });
  const c = document.createElement('canvas');
  c.width = img.width; c.height = img.height;
  const g = c.getContext('2d');
  g.drawImage(img, 0, 0);
  const canto = g.getImageData(2, 2, 1, 1).data;
  const centro = g.getImageData(Math.floor(img.width / 2), Math.floor(img.height / 2), 1, 1).data;
  return { w: img.width, h: img.height, alphaCanto: canto[3], alphaCentro: centro[3] };
});
ok(captura?.w === 960 && captura?.h === 960, `captura transparente deveria ser 960² (${captura?.w}×${captura?.h})`);
ok(captura?.alphaCanto === 0, `canto deveria ser transparente (alpha ${captura?.alphaCanto})`);
ok((captura?.alphaCentro ?? 0) > 0, 'centro (personagem) não deveria ser transparente');
// o palco continua pintando o fundo NORMAL depois da captura (restauração)
const fundoVoltou = await p.evaluate(() => {
  const c = document.querySelector('[data-teste="palco-3d"] canvas');
  const c2 = document.createElement('canvas');
  c2.width = 8; c2.height = 8;
  const g = c2.getContext('2d');
  g.drawImage(c, 0, 0);
  return g.getImageData(2, 2, 1, 1).data[3];
});
ok(fundoVoltou === 255, `captura transparente vazou p/ o palco (alpha ${fundoVoltou})`);
await p.locator('[data-teste="p3d-transparente"]').click(); // desliga

// R4 (mega 33): TURNTABLE — folha 4×2 com 8 ângulos (1920×960)
const turn = await p.evaluate(async () => {
  const original = HTMLAnchorElement.prototype.click;
  let pego = null;
  HTMLAnchorElement.prototype.click = function () { pego = { href: this.href, nome: this.download }; };
  document.querySelector('[data-teste="p3d-turntable"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  for (let i = 0; i < 300 && !pego; i += 1) await new Promise((r) => setTimeout(r, 100));
  HTMLAnchorElement.prototype.click = original;
  if (!pego) return null;
  const img = new Image();
  await new Promise((r) => { img.onload = r; img.src = pego.href; });
  return { nome: pego.nome, w: img.naturalWidth, h: img.naturalHeight };
});
ok(turn?.w === 1920 && turn?.h === 960, `turntable deveria ser 1920×960 (${turn?.w}×${turn?.h})`);
ok(/^dshow-turntable-.+\.png$/.test(turn?.nome ?? ''), `nome do turntable inesperado (${turn?.nome})`);

// R5 (mega 39): TELA CHEIA — liga (data-tela-cheia); o MESMO botão desliga
// (Esc sintético não conta como gesto de UI p/ o Chromium sair do fullscreen)
await p.locator('[data-teste="p3d-tela-cheia"]').click();
await p.waitForSelector('[data-teste="palco-3d"][data-tela-cheia]', { timeout: 5000 });
ok(await p.evaluate(() => Boolean(document.fullscreenElement)), 'fullscreenElement deveria existir');
ok(await p.locator('[data-teste="p3d-tela-cheia"][aria-pressed="true"]').count() === 1,
  'botão de tela cheia deveria refletir aria-pressed');
await p.locator('[data-teste="p3d-tela-cheia"]').click();
await p.waitForSelector('[data-teste="palco-3d"]:not([data-tela-cheia])', { timeout: 5000 });
ok(await p.evaluate(() => !document.fullscreenElement), 'segundo clique não saiu da tela cheia');

const ok_ = relatorio('shell-palco3d-criativo', falhas, erros);
await b.close();
process.exit(ok_ ? 0 : 1);
