// READ-ONLY (Fase 1) — Sonda EXAUSTIVA da barra preta no item ativo da sidebar.
// Não altera nenhum arquivo da app. ALVO=texto do item; DSD_THEME=light|dark.
import pkg from './node_modules/playwright/index.js';
const { chromium } = pkg;
import { getSessionCookies, isLoginPage, loginViaPage } from './auth.mjs';

const ALVO = process.env.ALVO || 'Oportunidades';
const THEME = process.env.DSD_THEME || 'light';

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
const ctx = await browser.newContext({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 2 });
try { await ctx.addCookies(await getSessionCookies()); } catch (e) {}
// Forçar tema em contexto fresco (padrão do projeto: chave cm_theme)
await ctx.addInitScript((t) => { try { localStorage.setItem('cm_theme', t); } catch (e) {} }, THEME);
const page = await ctx.newPage();
await page.goto('https://dshowdash.com.br/', { waitUntil: 'domcontentloaded', timeout: 30000 });
await page.waitForTimeout(1500);
if (await isLoginPage(page)) await loginViaPage(page);
await page.waitForSelector('[data-dsd-theme-toggle]', { timeout: 12000 });
await page.waitForTimeout(2000);

// expandir todos os grupos e ativar o ALVO
await page.evaluate(() => document.querySelectorAll('.dsd-sidebar__group-button').forEach(b => { try { b.click(); } catch (e) {} }));
await page.waitForTimeout(800);
const clicked = await page.evaluate((alvo) => {
  const links = [...document.querySelectorAll('.dsd-sidebar__link, .dsd-sidebar__item a, .dsd-sidebar__item button')];
  const el = links.find(l => new RegExp(alvo, 'i').test(l.textContent || ''));
  if (el) { el.click(); return (el.textContent || '').trim().slice(0, 30); }
  return null;
}, ALVO);
await page.waitForTimeout(1200);

const dump = await page.evaluate(() => {
  const item = [...document.querySelectorAll('.dsd-sidebar__item--active')].find(el => el.getBoundingClientRect().height > 4)
            || [...document.querySelectorAll('.dsd-sidebar__link--active, [aria-current], .active')].find(el => el.getBoundingClientRect().height > 4);
  if (!item) return { error: 'sem item ativo' };
  const link = item.querySelector('.dsd-sidebar__link') || item;
  const lr = link.getBoundingClientRect();

  const propsOf = (el, pseudo = null) => {
    const cs = getComputedStyle(el, pseudo);
    return {
      pseudo: pseudo || undefined,
      content: pseudo ? cs.content : undefined,
      tag: el.tagName, cls: (el.className || '').toString().slice(0, 55),
      rect: pseudo ? undefined : (() => { const r = el.getBoundingClientRect(); return { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) }; })(),
      bg: cs.backgroundColor,
      bgImg: cs.backgroundImage === 'none' ? undefined : cs.backgroundImage.slice(0, 90),
      borderTop: `${cs.borderTopWidth} ${cs.borderTopStyle} ${cs.borderTopColor}`,
      borderBottom: `${cs.borderBottomWidth} ${cs.borderBottomStyle} ${cs.borderBottomColor}`,
      borderLeft: `${cs.borderLeftWidth} ${cs.borderLeftStyle} ${cs.borderLeftColor}`,
      borderRight: `${cs.borderRightWidth} ${cs.borderRightStyle} ${cs.borderRightColor}`,
      outline: `${cs.outlineWidth} ${cs.outlineStyle} ${cs.outlineColor}`,
      boxShadow: cs.boxShadow === 'none' ? undefined : cs.boxShadow.slice(0, 120),
      w: pseudo ? cs.width : undefined, h: pseudo ? cs.height : undefined,
      top: pseudo ? cs.top : undefined, left: pseudo ? cs.left : undefined,
      pos: cs.position, transform: cs.transform === 'none' ? undefined : cs.transform,
      z: cs.zIndex, radiusTop: cs.borderTopLeftRadius, overflow: cs.overflow,
    };
  };

  // cadeia: link + item + até 4 ancestrais, com ::before/::after de cada
  const chain = [];
  let node = link, depth = 0;
  while (node && depth < 6 && !node.classList?.contains('dsd-sidebar')) {
    chain.push(propsOf(node));
    chain.push(propsOf(node, '::before'));
    chain.push(propsOf(node, '::after'));
    node = node.parentElement; depth++;
  }

  // elementsFromPoint ao longo da faixa do topo do link (para achar quem pinta lá)
  const y = Math.round(lr.top + 1);
  const xs = [lr.left + 10, lr.left + lr.width / 2, lr.right - 10];
  const atTop = xs.map(x => {
    const stack = document.elementsFromPoint(Math.round(x), y).slice(0, 4)
      .map(e => ({ tag: e.tagName, cls: (e.className || '').toString().slice(0, 40), bg: getComputedStyle(e).backgroundColor }));
    return { x: Math.round(x), y, stack };
  });

  return { linkRect: { x: Math.round(lr.x), y: Math.round(lr.y), w: Math.round(lr.width), h: Math.round(lr.height) }, atTop, chain };
});

const shotPath = `/var/www/dshowdash/tools/screenshot/out-deep-${(process.env.ALVO || 'x')}-${THEME}.png`.replace(/\s+/g, '_');
console.log('CLICKED:', clicked, '| THEME:', THEME, '| SHOT:', shotPath);
console.log(JSON.stringify(dump, null, 2));

// SCAN visual: screenshot do LINK ativo via locator (auto-scroll em scroller aninhado)
try {
  const loc = page.locator('.dsd-sidebar__item--active .dsd-sidebar__link').first();
  await loc.scrollIntoViewIfNeeded({ timeout: 5000 });
  await page.waitForTimeout(300);
  // re-medir atTop AGORA que está visível
  const atTop2 = await page.evaluate(() => {
    const item = document.querySelector('.dsd-sidebar__item--active');
    const link = item.querySelector('.dsd-sidebar__link') || item;
    const lr = link.getBoundingClientRect();
    const y = Math.round(lr.top + 1);
    return [lr.left + 12, lr.left + lr.width / 2, lr.right - 12].map(x => ({
      x: Math.round(x), y,
      stack: document.elementsFromPoint(Math.round(x), y).slice(0, 4).map(e => ({ tag: e.tagName, cls: (e.className || '').toString().slice(0, 38), bg: getComputedStyle(e).backgroundColor })),
    }));
  });
  console.log('ATTOP_VISIBLE', JSON.stringify(atTop2));
  const box = await loc.boundingBox();
  if (box) {
    await page.screenshot({ path: shotPath, clip: { x: Math.max(0, box.x - 8), y: Math.max(0, box.y - 16), width: box.width + 16, height: box.height + 32 } });
    console.log('SHOT OK');
  } else console.log('SHOT SKIP: sem box');
} catch (e) { console.log('SHOT ERR:', e.message); }

await browser.close();
