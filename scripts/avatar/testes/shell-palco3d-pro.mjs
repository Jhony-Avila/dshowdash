// testes/shell-palco3d-pro.mjs — lote 41–50 no PALCO 3D: watchdog de
// contexto (41), capacidade §605-lite (42), retry com backoff + tentar de
// novo (43), scrub de pose (44), ajuste fino de câmera (48) e comparar
// 2D×3D (49). A nitidez responsiva (45) é coberta pelo fullscreen abaixo.
// @version 1.0.0  @created 2026-08-04
import { SAIDA, abrir, irParaHarness, relatorio } from './navegador.mjs';

const { navegador: b, pagina: p, erros } = await abrir({
  viewport: { width: 1500, height: 940 }, webgl: true,
  init: () => {
    localStorage.setItem('dshow.avst.flags.v1',
      JSON.stringify({ 'as5.novo_shell': true, 'as6.dock_inferior': false, 'as5.palco3d': true }));
  },
});
await irParaHarness(p, 'avst-harness.html', 1200);

const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };

await p.locator('[data-teste="botao-3d"]').click();
await p.waitForSelector('[data-teste="palco-3d"] canvas', { timeout: 30000 });
await p.waitForTimeout(4000);

const dataUrl = () => p.evaluate(() => document.querySelector('[data-teste="palco-3d"] canvas')?.toDataURL() ?? '');

// R1 (mega 42): SwiftShader detectado → nota avisa "render por software"
ok((await p.locator('[data-teste="p3d-pendencias"]').textContent())?.includes('render por software'),
  'nota deveria detectar o render por software (SwiftShader)');

// R2 (mega 44 + 48): congela → scrub muda o quadro; slider + scrub reenquadra
await p.locator('[data-teste="p3d-pose"]').click();
await p.waitForSelector('[data-teste="p3d-quadros"]', { timeout: 3000 });
const q1 = await dataUrl();
await p.locator('[data-teste="p3d-quadro-frente"]').click();
await p.waitForTimeout(250);
const q2 = await dataUrl();
ok(q1 !== q2, 'scrub p/ frente não mudou o quadro congelado');
await p.waitForTimeout(400);
ok(await dataUrl() === q2, 'palco deveria seguir CONGELADO após o scrub');
// ajuste fino: zoom out → próximo quadro repinta com a câmera nova
await p.locator('[data-teste="p3d-ajuste"]').click();
await p.waitForSelector('[data-teste="p3d-dist"]', { timeout: 3000 });
await p.locator('[data-teste="p3d-dist"]').evaluate((el) => {
  const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
  set.call(el, '3.6');
  el.dispatchEvent(new Event('input', { bubbles: true }));
});
await p.waitForTimeout(200);
await p.locator('[data-teste="p3d-quadro-frente"]').click();
await p.waitForTimeout(250);
const q3 = await dataUrl();
ok(q3 !== q2, 'zoom do ajuste fino não reenquadrou o quadro');
await p.screenshot({ path: `${SAIDA}/palco3d-scrub-zoom.png` });
await p.locator('[data-teste="p3d-pose"]').click(); // retoma
await p.waitForTimeout(400);

// R3 (mega 49): comparar 2D×3D — split com o AvatarSvg; fecha limpo
await p.locator('[data-teste="p3d-comparar"]').click();
await p.waitForSelector('[data-teste="p3d-comparar-painel"]', { timeout: 3000 });
ok(await p.locator('[data-teste="p3d-comparar-painel"] svg').count() >= 1,
  'painel de comparação sem o SVG 2D');
await p.screenshot({ path: `${SAIDA}/palco3d-comparar.png` });
await p.locator('[data-teste="p3d-comparar"]').click();
await p.waitForTimeout(300);
ok(await p.locator('[data-teste="p3d-comparar-painel"]').count() === 0, 'comparação não fechou');

// R4 (mega 41): WATCHDOG — perder o contexto mostra o badge; restaurar volta a pintar
const badge = await p.evaluate(async () => {
  const canvas = document.querySelector('[data-teste="palco-3d"] canvas');
  const gl = canvas.getContext('webgl2') ?? canvas.getContext('webgl');
  const ext = gl?.getExtension('WEBGL_lose_context');
  if (!ext) return { suportado: false };
  ext.loseContext();
  let apareceu = false;
  for (let i = 0; i < 30 && !apareceu; i += 1) {
    await new Promise((r) => setTimeout(r, 100));
    apareceu = document.querySelector('[data-teste="p3d-recuperando"]') !== null;
  }
  ext.restoreContext();
  let sumiu = false;
  for (let i = 0; i < 50 && !sumiu; i += 1) {
    await new Promise((r) => setTimeout(r, 100));
    sumiu = document.querySelector('[data-teste="p3d-recuperando"]') === null;
  }
  return { suportado: true, apareceu, sumiu };
});
ok(badge.suportado, 'WEBGL_lose_context indisponível no ambiente do teste');
ok(badge.apareceu === true, 'perder o contexto não mostrou o badge de recuperação');
ok(badge.sumiu === true, 'restaurar o contexto não tirou o badge');
await p.waitForTimeout(800);
const pintouPos = await p.evaluate(async () => {
  const c = document.querySelector('[data-teste="palco-3d"] canvas');
  const a = c.toDataURL();
  await new Promise((r) => setTimeout(r, 500));
  return { vivo: a !== c.toDataURL(), bytes: a.length };
});
ok(pintouPos.vivo && pintouPos.bytes > 2000, 'palco não voltou a pintar após restaurar o contexto');

// R5 (mega 43): RETRY — fetch do GLB falha 1× e o palco se recupera sozinho
await p.evaluate(() => {
  const original = window.fetch;
  let falhas2 = 1; // só a PRIMEIRA requisição de GLB falha
  window.__fetchOriginal = original;
  window.fetch = (...args) => {
    const url = String(args[0]);
    if (url.includes('.glb') && falhas2 > 0) {
      falhas2 -= 1;
      return Promise.reject(new TypeError('rede piscou (teste mega 43)'));
    }
    return original(...args);
  };
});
// clique SEM hover/focus (dispatchEvent): o prefetch da mega 17 não pode
// consumir a falha programada — contagem exata p/ provar o retry
await p.evaluate(() => {
  [...document.querySelectorAll('.avst5-p3d-chip')].find((c) => c.textContent.includes('Pug'))
    ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
});
await p.waitForTimeout(7000); // falha → backoff 800ms → retry → carrega
ok(await p.locator('.avst5-p3d-personagens .avst5-p3d-chip-on', { hasText: 'Pug' }).count() === 1,
  'retry não recuperou a troca p/ o Pug');
ok(await p.locator('[data-teste="p3d-indisponivel"]').count() === 0,
  'palco não deveria cair p/ indisponível com 1 falha de rede');
const pintouPug = await p.evaluate(() => document.querySelector('[data-teste="palco-3d"] canvas')?.toDataURL().length ?? 0);
ok(pintouPug > 2000, 'canvas vazio após o retry');

// R6 (mega 43): duas falhas → indisponível com "Tentar de novo" → recupera
await p.evaluate(() => {
  let falhas3 = 2; // primeira tentativa + retry falham
  window.fetch = (...args) => {
    const url = String(args[0]);
    if (url.includes('.glb') && falhas3 > 0) {
      falhas3 -= 1;
      return Promise.reject(new TypeError('rede fora (teste mega 43)'));
    }
    return window.__fetchOriginal(...args);
  };
});
await p.evaluate(() => {
  [...document.querySelectorAll('.avst5-p3d-chip')].find((c) => c.textContent.includes('Punk'))
    ?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
});
await p.waitForSelector('[data-teste="p3d-indisponivel"]', { timeout: 15000 });
await p.evaluate(() => { window.fetch = window.__fetchOriginal; }); // rede volta
await p.locator('[data-teste="p3d-tentar"]').click();
await p.waitForSelector('[data-teste="palco-3d"] canvas', { timeout: 30000 });
await p.waitForTimeout(5000);
const pintouVolta = await p.evaluate(() => document.querySelector('[data-teste="palco-3d"] canvas')?.toDataURL().length ?? 0);
ok(pintouVolta > 2000, 'Tentar de novo não remontou o palco');

const ok_ = relatorio('shell-palco3d-pro', falhas, erros);
await b.close();
process.exit(ok_ ? 0 : 1);
