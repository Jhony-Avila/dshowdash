// wcm-auditoria.mjs — mede contraste WCAG e custo de renderização do Relógio Mundial.
// @version 1.0.0  @created 2026-07-30
//
// Diagnóstico, não teste: não reprova nada, só mede e reporta. Serve para decidir
// onde mexer com base em número, e não em impressão.
//
//   WCM_OUT=/tmp/wcm node tools/screenshot/wcm-auditoria.mjs

import pkg from './node_modules/playwright/index.js';
const { chromium } = pkg;
import { getSessionCookies, isLoginPage, loginViaPage } from './auth.mjs';

const browser = await chromium.launch({
  headless: true,
  args: ['--no-sandbox', '--disable-dev-shm-usage',
    '--host-resolver-rules=MAP dshowdash.com.br 127.0.0.1', '--ignore-certificate-errors'],
});
const ctx = await browser.newContext({ viewport: { width: 1560, height: 940 }, ignoreHTTPSErrors: true });
try { await ctx.addCookies(await getSessionCookies()); } catch { /* login por formulário */ }
const page = await ctx.newPage();

await page.goto('https://dshowdash.com.br/', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(1500);
if (await isLoginPage(page)) await loginViaPage(page);
await page.waitForTimeout(1800);
await page.evaluate(() => { location.hash = '#/panel-relogio-mundial'; });
await page.waitForSelector('[data-wcm-react-root] .wcm-root', { timeout: 30000 });
await page.waitForFunction(() => !document.querySelector('.wcm-map__loading'), { timeout: 30000 });
await page.waitForTimeout(2000);

// ===================== contraste =====================
const auditoriaContraste = async (tema) => page.evaluate((tema) => {
  const lin = (c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));
  const lum = ([r, g, b]) => 0.2126 * lin(r / 255) + 0.7152 * lin(g / 255) + 0.0722 * lin(b / 255);
  const parse = (s) => {
    const m = s.match(/rgba?\(([^)]+)\)/);
    if (!m) return null;
    const p = m[1].split(',').map((x) => parseFloat(x));
    return { rgb: [p[0], p[1], p[2]], a: p.length > 3 ? p[3] : 1 };
  };
  const mistura = (frente, fundo, alfa) => frente.map((c, i) => c * alfa + fundo[i] * (1 - alfa));

  // Fundo efetivo: sobe a árvore acumulando camadas translúcidas até achar opaco.
  const fundoEfetivo = (el) => {
    const pilha = [];
    let n = el;
    while (n && n !== document.documentElement) {
      const bg = parse(getComputedStyle(n).backgroundColor);
      if (bg && bg.a > 0) {
        pilha.push(bg);
        if (bg.a >= 0.999) break;
      }
      n = n.parentElement;
    }
    let cor = [11, 15, 26];
    for (let i = pilha.length - 1; i >= 0; i--) cor = mistura(pilha[i].rgb, cor, pilha[i].a);
    return cor;
  };

  const razao = (a, b) => {
    const la = lum(a);
    const lb = lum(b);
    return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
  };

  const raiz = document.querySelector('[data-wcm-react-root]');
  const resultados = [];
  const vistos = new Set();

  for (const el of raiz.querySelectorAll('*')) {
    // Só elementos com texto PRÓPRIO visível.
    const texto = [...el.childNodes]
      .filter((n) => n.nodeType === 3)
      .map((n) => n.textContent.trim())
      .join('')
      .trim();
    if (!texto) continue;
    const cs = getComputedStyle(el);
    if (cs.visibility === 'hidden' || cs.display === 'none' || Number(cs.opacity) < 0.1) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) continue;

    const fg = parse(cs.color);
    if (!fg) continue;
    const bg = fundoEfetivo(el);
    const corTexto = fg.a >= 0.999 ? fg.rgb : mistura(fg.rgb, bg, fg.a);
    const ratio = razao(corTexto, bg);

    const px = parseFloat(cs.fontSize);
    const peso = Number(cs.fontWeight) || 400;
    // WCAG: "texto grande" = ≥18.66px negrito ou ≥24px.
    const grande = px >= 24 || (px >= 18.66 && peso >= 700);
    const alvoAAA = grande ? 4.5 : 7;
    const alvoAA = grande ? 3 : 4.5;

    const chave = `${el.className}|${Math.round(px)}|${cs.color}`;
    if (vistos.has(chave)) continue;
    vistos.add(chave);

    resultados.push({
      classe: String(el.className).split(' ')[0] || el.tagName.toLowerCase(),
      amostra: texto.slice(0, 28),
      px: Math.round(px * 10) / 10,
      peso,
      ratio: Math.round(ratio * 100) / 100,
      alvoAAA,
      alvoAA,
      passaAAA: ratio >= alvoAAA,
      passaAA: ratio >= alvoAA,
      cor: cs.color,
    });
  }
  return { tema, total: resultados.length, itens: resultados };
}, tema);

async function setTheme(t) {
  await page.evaluate((tt) => {
    document.documentElement.setAttribute('data-theme', tt);
    document.body.classList.toggle('theme-light', tt === 'light');
    document.body.classList.toggle('theme-dark', tt === 'dark');
  }, t);
  await page.waitForTimeout(900);
}

for (const tema of ['dark', 'light']) {
  await setTheme(tema);
  const r = await auditoriaContraste(tema);
  const reprovaAAA = r.itens.filter((i) => !i.passaAAA).sort((a, b) => a.ratio - b.ratio);
  const reprovaAA = r.itens.filter((i) => !i.passaAA).sort((a, b) => a.ratio - b.ratio);
  console.log(`\n═══ CONTRASTE — tema ${tema} ═══`);
  console.log(`amostras únicas: ${r.total} · reprovam AAA: ${reprovaAAA.length} · reprovam AA: ${reprovaAA.length}`);
  console.log('\npiores casos (razão · alvo · px · classe · texto):');
  for (const i of reprovaAAA.slice(0, 22)) {
    const tag = i.passaAA ? 'AA-ok ' : 'AA-REP';
    console.log(`  ${tag} ${String(i.ratio).padStart(5)} / ${i.alvoAAA}  ${String(i.px).padStart(4)}px  ${i.classe.padEnd(26)} "${i.amostra}"`);
  }
}

await setTheme('dark');

// ===================== custo de renderização =====================
console.log('\n═══ CUSTO DE RENDERIZAÇÃO ═══');
const perf = await page.evaluate(async () => {
  const canvas = document.querySelector('.wcm-map__canvas');
  const out = {};

  // Mede o tempo de um quadro forçando reprojeções sucessivas (como num arrasto).
  const medir = async (nome, acao, n = 30) => {
    const t = [];
    for (let i = 0; i < n; i++) {
      const a = performance.now();
      acao(i);
      // Espera o próximo quadro para incluir a pintura real.
      await new Promise((r) => requestAnimationFrame(() => r()));
      t.push(performance.now() - a);
    }
    t.sort((a, b) => a - b);
    out[nome] = {
      mediana: Math.round(t[Math.floor(n / 2)] * 100) / 100,
      p95: Math.round(t[Math.floor(n * 0.95)] * 100) / 100,
      max: Math.round(t[n - 1] * 100) / 100,
    };
  };

  // Simula arrasto: dispara pointermove no mapa, o que reprojeta e repinta.
  const mapa = document.querySelector('.wcm-map');
  const r = mapa.getBoundingClientRect();
  mapa.dispatchEvent(new PointerEvent('pointerdown', {
    bubbles: true, clientX: r.left + r.width / 2, clientY: r.top + r.height / 2, button: 0, pointerId: 1,
  }));
  await medir('arrasto (pointermove + repintura)', (i) => {
    mapa.dispatchEvent(new PointerEvent('pointermove', {
      bubbles: true, clientX: r.left + r.width / 2 + i * 3, clientY: r.top + r.height / 2, pointerId: 1,
    }));
  });
  mapa.dispatchEvent(new PointerEvent('pointerup', { bubbles: true, pointerId: 1 }));

  out.canvas = { w: canvas.width, h: canvas.height, dpr: window.devicePixelRatio };
  return out;
});
console.log(JSON.stringify(perf, null, 1));

// Perfil de tarefas longas durante um arrasto real.
console.log('\n── tarefas longas (>50ms) durante arrasto real ──');
const longas = await page.evaluate(() => new Promise((resolve) => {
  const marcas = [];
  const obs = new PerformanceObserver((list) => {
    for (const e of list.getEntries()) marcas.push(Math.round(e.duration));
  });
  try { obs.observe({ entryTypes: ['longtask'] }); } catch { resolve('longtask não suportado'); return; }
  setTimeout(() => { obs.disconnect(); resolve(marcas); }, 2600);
}));
const mapa = await page.$('.wcm-map');
const bb = await mapa.boundingBox();
await page.mouse.move(bb.x + bb.width / 2, bb.y + bb.height / 2);
await page.mouse.down();
for (let i = 0; i < 40; i++) {
  await page.mouse.move(bb.x + bb.width / 2 + i * 6, bb.y + bb.height / 2 + Math.sin(i / 4) * 30);
}
await page.mouse.up();
console.log('tarefas longas:', JSON.stringify(await longas));

await browser.close();
