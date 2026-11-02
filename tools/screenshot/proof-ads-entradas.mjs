// READ-ONLY: prova que os 2 pontos de entrada abrem o panel-ads, com cliques REAIS (trusted).
import pkg from './node_modules/playwright/index.js';
const { chromium } = pkg;
import { getSessionCookies, isLoginPage, loginViaPage } from './auth.mjs';
const OUT = '/tmp/claude-0/-root/5a545447-8152-4236-820b-4c9775d9d709/scratchpad/ads-shots';
const log = (...a) => console.log(...a);

const browser = await chromium.launch({ headless: true, args: ['--no-sandbox','--disable-dev-shm-usage','--host-resolver-rules=MAP dshowdash.com.br 127.0.0.1','--ignore-certificate-errors'] });
const ctx = await browser.newContext({ viewport: { width: 1600, height: 950 }, deviceScaleFactor: 1, ignoreHTTPSErrors: true });
try { await ctx.addCookies(await getSessionCookies()); } catch (e) { log('[warn] cookie:', e.message); }
const page = await ctx.newPage();

async function mounted(tag, ms=15000){ try { await page.waitForSelector('[data-ads-react-root] .ads-shell',{timeout:ms}); log(`  ✓ montou (${tag})`); return true;}catch{log(`  ✗ NAO montou (${tag})`);return false;} }
async function hash(){ return page.evaluate(()=>location.hash); }
async function goHome(){ await page.evaluate(()=>{location.hash='#/';}); await page.waitForTimeout(1200); }

await page.goto('https://dshowdash.com.br/', { waitUntil:'domcontentloaded', timeout:30000 });
await page.waitForTimeout(1500);
if (await isLoginPage(page)) await loginViaPage(page);
await page.waitForSelector('.site-header, header', { timeout:20000 }).catch(()=>{});
await page.waitForTimeout(2500);

// CONTROLE: sidebar Outlook (clique real)
log('\n[CONTROLE] sidebar Outlook (clique real):');
await goHome();
let okOutlook=false;
try { await page.locator('[data-panel-id="panel-outlook"]').first().click({timeout:5000});
  try{await page.waitForSelector('[data-outlook-react-root], .outlook-shell, [data-ol-react-root]',{timeout:12000}); okOutlook=true; log('  ✓ Outlook montou');}catch{ log('  hash:',await hash()); log('  ✗ Outlook nao montou (selector?)'); }
} catch(e){ log('  erro click Outlook:', e.message); }

// PROOF 1: header icone Google Ads (clique real)
log('\n[PROOF 1] header icone Google Ads (clique real):');
await goHome();
let okHeader=false;
try { await page.locator('[data-panel-trigger="panel-adwords"]').first().click({timeout:5000});
  okHeader = await mounted('header'); log('  hash:', await hash());
} catch(e){ log('  erro click header:', e.message); }

// PROOF 2: sidebar Ads (clique real)
log('\n[PROOF 2] sidebar botao Ads (clique real):');
await goHome();
let okSidebar=false;
try {
  const loc = page.locator('[data-panel-id="panel-ads"]').first();
  const cnt = await page.locator('[data-panel-id="panel-ads"]').count();
  log('  elementos [data-panel-id=panel-ads]:', cnt);
  await loc.click({timeout:5000});
  okSidebar = await mounted('sidebar'); log('  hash:', await hash());
} catch(e){ log('  erro click sidebar:', e.message); }

log('\n=== RESUMO PROOF ===');
log(JSON.stringify({ controleOutlook: okOutlook, header_panelAds: okHeader, sidebar_panelAds: okSidebar }, null, 2));
await browser.close();
log('=== FIM ===');
