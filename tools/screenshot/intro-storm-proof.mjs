// PROVA SANCIONADA v2 do flash-herói: mocka clima=tempestade (page.route) -> pipeline
// REAL monta cena com LightningEffect. Detecta o flash por HOOK no fillRect (o clarao usa
// fillStyle 'rgb(224,232,255)' unico; fundos usam gradiente) = event-driven, nao perde o
// pulso de 0.22s. Marca a CHEGADA da cena de tempestade pela populacao da faixa (.phf-band).
// TESE: flash < 2.25s apos a cena chegar = HERO (o AMBIENTE so dispara >=2.25s). Controle:
// ceu-limpo (code 1) -> sem LightningEffect -> ZERO flashes.
import pkg from './node_modules/playwright/index.js';
const { chromium } = pkg;
import { readFileSync } from 'node:fs';
import { getSessionCookies, isLoginPage, loginViaPage } from './auth.mjs';
const DIR = '/tmp/claude-0/-root/bc74aab5-11d1-4120-9f90-0c27ab1f1966/scratchpad/';
const WFX_ROOT = '/var/www/dshowdash/public';   // servir weather-fx do disco (mata cache SW/CF/HTTP)

function mkForecast(code) {
  const days = [];
  for (let i = 0; i < 7; i++) days.push({ date: `2026-07-${String(6 + i).padStart(2, '0')}`, weather_code: code, temp_max: 24 - i, temp_min: 14 + (i % 3) });
  return days;
}
function payload(code) {
  return JSON.stringify({ ok: true, data: {
    temperature: 22, feels_like: 22, humidity: 90, precipitation: code >= 95 ? 6 : 0,
    weather_code: code, wind_speed: 12, condition: code >= 95 ? 'Tempestade' : 'Céu limpo',
    icon: 'x', updated_at: '2026-07-06T20:00:00', forecast: mkForecast(code),
  }});
}

async function run(code, tag) {
  // CAMINHO REAL: SW ligado (como usuario real), weather-fx vem da REDE (origin no-store).
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  try { await ctx.addCookies(await getSessionCookies()); } catch (e) {}
  const page = await ctx.newPage();
  await page.route('**/get_sao_paulo.php*', (route) =>
    route.fulfill({ status: 200, contentType: 'application/json', body: payload(code) }));
  void WFX_ROOT; void readFileSync;

  await page.addInitScript(() => {
    const t0 = performance.now();
    const now = () => Math.round(performance.now() - t0);
    window.__flash = []; window.__bandT = null; window.__canvasT = null; window.__rainT = null;
    window.__styles = {}; window.__bigFills = 0;
    // HOOK fillRect: registra frames de CLARAO (fillStyle unico do lightning) + diag
    const proto = CanvasRenderingContext2D.prototype;
    const orig = proto.fillRect;
    proto.fillRect = function (x, y, w, h) {
      try {
        const fs = String(this.fillStyle);
        if (w > 200 && h > 200) {
          window.__bigFills++; window.__styles[fs] = (window.__styles[fs] || 0) + 1;
          if (fs === '[object CanvasPattern]' && window.__rainT == null) window.__rainT = now();
        }
        const norm = fs.replace(/\s/g, '').toLowerCase();
        if (norm === '#e0e8ff' || norm === 'rgb(224,232,255)') window.__flash.push(now());
      } catch (e) {}
      return orig.apply(this, arguments);
    };
    // marca chegada da cena (faixa popula) e do canvas
    const mo = new MutationObserver(() => {
      const c = document.querySelector('canvas[data-weather-fx]');
      if (c && window.__canvasT == null) window.__canvasT = now();
      const b = document.querySelector('.phf-band');
      if (b && b.childElementCount > 0 && window.__bandT == null) window.__bandT = now();
    });
    const start = () => { if (document.documentElement) mo.observe(document.documentElement, { subtree: true, childList: true }); else setTimeout(start, 30); };
    start();
  });

  await page.goto('https://dshowdash.com.br/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(1500);
  if (await isLoginPage(page)) await loginViaPage(page);
  await page.waitForSelector('.ph-wrapper', { timeout: 22000 });
  await page.waitForTimeout(7000);                 // cobre chegada da cena + hero + margem
  const r = await page.evaluate(() => ({ flash: window.__flash, bandT: window.__bandT, canvasT: window.__canvasT, rainT: window.__rainT, styles: window.__styles, bigFills: window.__bigFills }));
  await page.screenshot({ path: DIR + `intro-storm-${tag}.png` });
  await ctx.close();

  const flashes = r.flash || [];
  const firstFlash = flashes.length ? flashes[0] : null;
  // agrupa frames em "eventos" (gap > 500ms = novo raio)
  const events = [];
  for (const t of flashes) { if (!events.length || t - events[events.length - 1] > 500) events.push(t); }
  // proxy do mount da cena de RAIOS = início da chuva (CanvasPattern); ambiente só
  // dispara >=2.25s após esse ponto -> flash < 2.25s depois = HERO.
  const firstAfterRain = (firstFlash != null && r.rainT != null) ? firstFlash - r.rainT : null;
  const topStyles = Object.entries(r.styles || {}).sort((a, b) => b[1] - a[1]).slice(0, 6);
  return { tag, flashFrames: flashes.length, flashEvents: events, firstFlashMs: firstFlash,
    rainStartMs: r.rainT, bandMs: r.bandT, canvasMs: r.canvasT,
    firstFlashAfterRainMs: firstAfterRain,
    heroProven: firstAfterRain != null && firstAfterRain < 2250,
    bigFills: r.bigFills, topFillStyles: topStyles };
}

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const storm = await run(99, 'STORM');
const clear = await run(1, 'CLEAR');
console.log(JSON.stringify({ storm, clear }, null, 2));
await browser.close();
