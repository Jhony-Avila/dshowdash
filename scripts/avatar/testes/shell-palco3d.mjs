// testes/shell-palco3d.mjs — PRÉVIA 3D no shell (mega 7 · flag as5.palco3d).
// @version 1.0.0  @created 2026-08-03
// Personagens curados são VERSIONADOS (public/assets/avatars/3d/personagens)
// — o harness os serve direto. SwiftShader: esperas generosas.
import { SAIDA, abrir, irParaHarness, relatorio } from './navegador.mjs';

const { navegador: b, pagina: p, erros } = await abrir({
  viewport: { width: 1500, height: 940 }, webgl: true,
  init: () => {
    localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': true, 'as5.palco3d': true }));
  },
});
await irParaHarness(p, 'avst-harness.html', 1200);

const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };

// R1: botão 3D presente (flag ON) e liga o palco 3D
ok(await p.locator('[data-teste="botao-3d"]').count() === 1, 'botão 3D ausente com a flag ligada');
await p.locator('[data-teste="botao-3d"]').click();
await p.waitForSelector('[data-teste="palco-3d"]', { timeout: 15000 });
// motor3d + GLB no SwiftShader: espera o canvas pintar
await p.waitForSelector('[data-teste="palco-3d"] canvas', { timeout: 30000 });
await p.waitForTimeout(4000);
const pintou = await p.evaluate(() => {
  const c = document.querySelector('[data-teste="palco-3d"] canvas');
  return c ? c.toDataURL('image/png').length : 0;
});
ok(pintou > 2000, `canvas 3D não pintou (${pintou} bytes de dataURL)`);
ok(await p.locator('[data-teste="p3d-pendencias"]').count() === 1, 'chip de pendências §481 ausente');
ok(await p.locator('.avst5-p3d-personagens .avst5-p3d-chip').count() === 6, 'esperava 6 personagens curados');
await p.screenshot({ path: `${SAIDA}/palco3d-casual.png` });

// R2: trocar de personagem recarrega sem erro (Androide)
await p.locator('.avst5-p3d-chip', { hasText: 'Androide' }).click();
await p.waitForTimeout(5000);
const pintou2 = await p.evaluate(() => {
  const c = document.querySelector('[data-teste="palco-3d"] canvas');
  return c ? c.toDataURL('image/png').length : 0;
});
ok(pintou2 > 2000, 'troca de personagem apagou o canvas');
await p.screenshot({ path: `${SAIDA}/palco3d-androide.png` });

// R3: câmera cinemática ORBITA (quadros diferentes ao longo do tempo)
await p.locator('.avst5-p3d-cameras button[title^="Cinemática"]').click();
const orbita = await p.evaluate(async () => {
  const c = document.querySelector('[data-teste="palco-3d"] canvas');
  const a = c.toDataURL();
  await new Promise((r) => setTimeout(r, 900));
  return a !== c.toDataURL();
});
ok(orbita, 'câmera cinemática não orbitou');

// R4: voltar ao 2D restaura o palco SVG (e o 3D é descartado)
await p.locator('[data-teste="botao-3d"]').click();
await p.waitForTimeout(800);
ok(await p.locator('.avst5-palco svg').count() >= 1, 'voltar ao 2D não restaurou o SVG');
ok(await p.locator('[data-teste="palco-3d"]').count() === 0, 'palco 3D não foi desmontado');

// R5: flag OFF → botão nem existe (fail-safe)
const ctx2 = await b.newContext({ viewport: { width: 1500, height: 940 } });
await ctx2.addInitScript(() => {
  localStorage.setItem('dshow.avst5.tour.v1', 'feito');
  localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': true }));
});
const p2 = await ctx2.newPage();
await p2.goto('http://127.0.0.1:8901/avst-harness.html', { waitUntil: 'networkidle' });
await p2.waitForFunction(() => window.__pronto === true, { timeout: 20000 });
await p2.waitForTimeout(800);
ok(await p2.locator('[data-teste="botao-3d"]').count() === 0, 'botão 3D deveria sumir com a flag OFF');

const ok_ = relatorio('shell-palco3d', falhas, erros);
await b.close();
process.exit(ok_ ? 0 : 1);
