import { chromium } from 'playwright';
import { isLoginPage, loginViaPage } from './auth.mjs';
const URL = 'https://dshowdash.com.br/';
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox','--disable-dev-shm-usage','--host-resolver-rules=MAP dshowdash.com.br 127.0.0.1','--ignore-certificate-errors'] });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, ignoreHTTPSErrors: true });
const page = await ctx.newPage();
try {
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 40000 });
  await page.waitForTimeout(2500);
  if (await isLoginPage(page)) await loginViaPage(page);
  await page.waitForSelector('.real-time-clock-component', { timeout: 40000 });
  await page.click('.real-time-clock-component');
  await page.waitForSelector('.wcm-map-wrap', { timeout: 20000 });
  await page.waitForTimeout(1200);
  // Alterna para DARK antes de sondar.
  for (let i=0;i<4;i++){ const c = await page.evaluate(()=>document.documentElement.getAttribute('data-theme')); if(c==='dark')break; await page.click('[data-dsd-theme-toggle]').catch(()=>{}); await page.waitForTimeout(700); }
  await page.waitForTimeout(800);
  const diag = await page.evaluate(() => {
    const q = (s) => document.querySelector(s);
    const wrap = q('.wcm-map-wrap'), svg = q('.wcm-map-svg'), ocean = q('.wcm-ocean'), land = q('.wcm-land'), night = q('.wcm-night');
    const rc = (e) => { if (!e) return null; const r = e.getBoundingClientRect(); return { w: Math.round(r.width), h: Math.round(r.height), x: Math.round(r.x), y: Math.round(r.y) }; };
    const cs = (e, p) => e ? getComputedStyle(e)[p] : null;
    let oceanBBox = null; try { oceanBBox = ocean ? ocean.getBBox() : null; } catch (_) {}
    return {
      theme: document.documentElement.getAttribute('data-theme'),
      wrapRect: rc(wrap), svgRect: rc(svg),
      wrapCS: { display: cs(wrap,'display'), aspectRatio: cs(wrap,'aspectRatio'), height: cs(wrap,'height'), width: cs(wrap,'width') },
      svgCS: { display: cs(svg,'display'), width: cs(svg,'width'), height: cs(svg,'height'), visibility: cs(svg,'visibility'), opacity: cs(svg,'opacity') },
      oceanFill: cs(ocean,'fill'), oceanOpacity: cs(ocean,'opacity'), oceanVis: cs(ocean,'visibility'),
      oceanBBox: oceanBBox ? { w: oceanBBox.width, h: oceanBBox.height } : null,
      landFill: cs(land,'fill'),
      varOcean: cs(document.documentElement,'--wcm-ocean'),
      svgViewBox: svg ? svg.getAttribute('viewBox') : null,
      cssLoaded: !!document.querySelector('link[href*="world-clock-map.css"]')
    };
  });
  console.log(JSON.stringify(diag, null, 2));
} catch (e) { console.log('FALHA:', e.message); }
finally { await browser.close(); }
