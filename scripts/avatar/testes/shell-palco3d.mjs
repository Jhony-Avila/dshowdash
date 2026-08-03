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
ok(await p.locator('.avst5-p3d-personagens .avst5-p3d-chip').count() === 7, 'esperava Auto + 6 personagens (índice)');
// mega 9: ANIMAÇÕES reais viram seletor; trocar seleção funciona
ok(await p.locator('[data-teste="p3d-animacoes"] .avst5-p3d-chip').count() >= 2, 'seletor de animações ausente');
await p.locator('[data-teste="p3d-animacoes"] .avst5-p3d-chip', { hasText: 'Wave' }).click();
await p.waitForTimeout(600);
ok(await p.locator('[data-teste="p3d-animacoes"] .avst5-p3d-chip[aria-checked="true"]', { hasText: 'Wave' }).count() === 1,
  'seleção de animação não refletiu');
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

// R3c (mega 10): CAPTURA PNG 960 do palco 3D (download interceptado)
const captura = await p.evaluate(async () => {
  const original = HTMLAnchorElement.prototype.click;
  let pego = null;
  HTMLAnchorElement.prototype.click = function () { pego = { href: this.href, nome: this.download }; };
  document.querySelector('[data-teste="p3d-capturar"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  for (let i = 0; i < 50 && !pego; i += 1) await new Promise((r) => setTimeout(r, 100));
  HTMLAnchorElement.prototype.click = original;
  if (!pego) return null;
  const img = new Image();
  await new Promise((r) => { img.onload = r; img.src = pego.href; });
  return { nome: pego.nome, w: img.naturalWidth, h: img.naturalHeight };
});
ok(captura?.w === 960 && captura?.h === 960, `captura 3D deveria ser 960×960 (${captura?.w}×${captura?.h})`);
ok(captura?.nome === 'dshow-avatar-3d-960.png', `nome da captura inesperado (${captura?.nome})`);

// R3d (mega 10): SHOWCASE 3D — data-apresentando liga, quadros mudam, desliga
await p.locator('[data-teste="p3d-apresentar"]').click();
await p.waitForSelector('[data-teste="palco-3d"][data-apresentando]', { timeout: 5000 });
const showQuadros = await p.evaluate(async () => {
  const c = document.querySelector('[data-teste="palco-3d"] canvas');
  const a2 = c.toDataURL();
  await new Promise((r) => setTimeout(r, 900));
  return a2 !== c.toDataURL();
});
ok(showQuadros, 'showcase 3D não animou os quadros');
ok(await p.locator('[data-teste="p3d-apresentar"]').isDisabled(), 'Apresentar deveria desabilitar durante o showcase');
await p.waitForSelector('[data-teste="palco-3d"]:not([data-apresentando])', { timeout: 15000 });
ok(await p.locator('[data-teste="p3d-animacoes"] .avst5-p3d-chip[aria-checked="true"]', { hasText: 'Idle' }).count() === 1,
  'showcase deveria terminar de volta no Idle');

// R3e (mega 13): GRAVAÇÃO do showcase — REC dispara coreografia e baixa WebM
const gravacao = await p.evaluate(async () => {
  const original = HTMLAnchorElement.prototype.click;
  let pego = null;
  HTMLAnchorElement.prototype.click = function () { pego = { href: this.href, nome: this.download }; };
  document.querySelector('[data-teste="p3d-gravar"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
  for (let i = 0; i < 160 && !pego; i += 1) await new Promise((r) => setTimeout(r, 100));
  HTMLAnchorElement.prototype.click = original;
  if (!pego) return null;
  const blob = await fetch(pego.href).then((r) => r.blob());
  return { nome: pego.nome, tipo: blob.type, kb: Math.round(blob.size / 1024) };
});
ok(gravacao !== null, 'gravação do showcase não gerou download');
ok(gravacao?.nome === 'dshow-showcase.webm', `nome da gravação inesperado (${gravacao?.nome})`);
ok((gravacao?.kb ?? 0) > 5 && String(gravacao?.tipo).includes('webm'),
  `WebM suspeito (${gravacao?.kb}KB, ${gravacao?.tipo})`);
await p.waitForSelector('[data-teste="palco-3d"]:not([data-apresentando])', { timeout: 15000 });

// R3b (mega 9): AUTO segue a BASE 2D — equipar Androide troca o personagem
await p.locator('[data-teste="p3d-auto"]').click();
await p.waitForTimeout(4000);
await p.evaluate(() => { [...document.querySelectorAll('.avst5-cat')].find((x) => x.textContent.includes('Rosto'))?.click(); });
await p.waitForTimeout(700);
await p.evaluate(() => {
  const alvo = [...document.querySelectorAll('.avst5-painel .avst-card')].find((c) => c.textContent.includes('Androide'));
  alvo?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
});
await p.waitForTimeout(6000);
ok(await p.locator('.avst5-p3d-personagens .avst5-p3d-chip-on', { hasText: 'Androide' }).count() === 1,
  'auto-mapeamento base 2D→3D não trocou p/ Androide');
ok((await p.locator('[data-teste="p3d-pendencias"]').textContent())?.includes('Auto'),
  'nota deveria indicar modo Auto');

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
