// PROVA v3 (robusta) da intro "Weather Reveal": um interval IN-PAGE grava um log
// continuo {t,hasIntro,opacity,canvasScale} desde o init — nao depende do timing
// do lado Playwright (que erra por causa do caminho de auth cookie-vs-form).
// Le o log apos 7s e valida: janela do intro ~3s, opacity da saudacao sobe 0->1,
// escala do canvas 1.08->1.0. + passe reduced-motion (nunca esconde).
import pkg from './node_modules/playwright/index.js';
const { chromium } = pkg;
import { getSessionCookies, isLoginPage, loginViaPage } from './auth.mjs';
const DIR = '/tmp/claude-0/-root/bc74aab5-11d1-4120-9f90-0c27ab1f1966/scratchpad/';

function initScript() {
  window.__log = [];
  const t0 = performance.now();
  const scaleOf = (tf) => {
    if (!tf || tf === 'none') return 1;
    const m = tf.match(/matrix\(([^)]+)\)/);
    if (m) return Number(m[1].split(',')[0]);   // a = scaleX
    return 1;
  };
  setInterval(() => {
    const w = document.querySelector('.ph-wrapper');
    if (!w) return;
    const p = document.querySelector('.ph-message-primary');
    const c = document.querySelector('canvas[data-weather-fx]');
    const b = document.querySelector('.phf-band');
    window.__log.push({
      t: Math.round(performance.now() - t0),
      intro: w.classList.contains('wfx-intro'),
      op: p ? Number(getComputedStyle(p).opacity) : null,
      sc: c ? Number(scaleOf(getComputedStyle(c).transform).toFixed(3)) : null,
      cop: c ? Number(getComputedStyle(c).opacity) : null,
      bop: b ? Number(getComputedStyle(b).opacity) : null,
      cN: document.querySelectorAll('canvas[data-weather-fx]').length,
    });
  }, 90);
}

async function boot(ctx) {
  const page = await ctx.newPage();
  await page.addInitScript(initScript);
  await page.goto('https://dshowdash.com.br/', { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(1500);
  if (await isLoginPage(page)) await loginViaPage(page);
  await page.waitForSelector('.ph-wrapper', { timeout: 20000 });
  return page;
}

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });

// ---- PASSE 1: normal ----
const ctx1 = await browser.newContext({ viewport: { width: 1280, height: 720 } });
try { await ctx1.addCookies(await getSessionCookies()); } catch (e) {}
const page = await boot(ctx1);
await page.waitForTimeout(6500);                 // deixa o intro (3s) rodar por inteiro
const log = await page.evaluate(() => window.__log);

const introRows = log.filter(r => r.intro);
const win = introRows.length ? { first: introRows[0].t, last: introRows[introRows.length - 1].t } : null;
const opSeq = introRows.map(r => r.op);
const scSeq = introRows.map(r => r.sc);
const copSeq = introRows.map(r => r.cop);
const bopSeq = introRows.map(r => r.bop);
// screenshots representativos: pega o frame do log mais proximo de alvos e printa agora (estado final)
await page.screenshot({ path: DIR + 'intro-final.png' });

// ---- PASSE 2: reduced-motion ----
const ctx2 = await browser.newContext({ viewport: { width: 1280, height: 720 }, reducedMotion: 'reduce' });
try { await ctx2.addCookies(await getSessionCookies()); } catch (e) {}
const pageRM = await boot(ctx2);
await pageRM.waitForTimeout(4000);
const logRM = await pageRM.evaluate(() => window.__log);
await pageRM.screenshot({ path: DIR + 'intro-reduced-motion.png' });
const rmOps = logRM.map(r => r.op).filter(v => v != null);

console.log(JSON.stringify({
  PASSE1_normal: {
    introWindowMs: win,
    introDurationMs: win ? win.last - win.first : 0,
    canvasCounts: [...new Set(log.map(r => r.cN).filter(v => v != null))],
    greetingOpacity_firstFew: opSeq.slice(0, 6),
    greetingOpacity_lastFew: opSeq.slice(-4),
    bandOpacity_firstFew: bopSeq.slice(0, 8),
    bandOpacity_lastFew: bopSeq.slice(-4),
    canvasScale_firstFew: scSeq.slice(0, 6),
    canvasScale_lastFew: scSeq.slice(-4),
    canvasOpacity_firstFew: copSeq.slice(0, 4),
    finalGreetingOpacity: log.length ? log[log.length - 1].op : null,
    samplesInIntro: introRows.length,
  },
  PASSE2_reducedMotion: {
    minGreetingOpacity: rmOps.length ? Math.min(...rmOps) : null,   // ~1 => nunca preso invisivel
    everIntroClass: logRM.some(r => r.intro),
    canvasCount: logRM.length ? logRM[logRM.length - 1].cN : null,
  },
}, null, 2));
await browser.close();
