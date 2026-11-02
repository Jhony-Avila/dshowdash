// READ-ONLY: prova a causa raiz do cm-devtools-toggle (onclick com (window as any) inválido).
import { chromium } from 'playwright';
import { isLoginPage, loginViaPage } from './auth.mjs';
const URL = 'https://dshowdash.com.br/';
const OUT='/tmp/claude-0/-root/eb8bd5d1-086b-4892-9f3f-45825fb23b99/scratchpad';
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox','--disable-dev-shm-usage','--host-resolver-rules=MAP dshowdash.com.br 127.0.0.1','--ignore-certificate-errors'] });
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, ignoreHTTPSErrors: true });
const page = await ctx.newPage();
const errs=[]; page.on('console',m=>{if(m.type()==='error')errs.push(m.text().slice(0,160));}); page.on('pageerror',e=>errs.push('PAGEERR: '+e.message));
try {
  await page.goto(URL, { waitUntil: 'domcontentloaded', timeout: 40000 });
  await page.waitForTimeout(3000);
  if (await isLoginPage(page)) { await loginViaPage(page); await page.waitForTimeout(2000); }
  await page.waitForSelector('.cm-devtools-toggle', { timeout: 30000 });
  const before = await page.evaluate(()=>({ cls: document.querySelector('.cm-devtools')?.className, hasApi: typeof window.__cmDevTools?.toggle }));
  console.log('ANTES:', JSON.stringify(before));

  // 1) clicar no toggle (como o usuário) — espera-se: NÃO abre (onclick inválido)
  await page.click('.cm-devtools-toggle').catch(e=>console.log('click err:',e.message));
  await page.waitForTimeout(800);
  const afterClick = await page.evaluate(()=>({ cls: document.querySelector('.cm-devtools')?.className }));
  console.log('APÓS CLIQUE no toggle:', JSON.stringify(afterClick));

  // 2) chamar a API diretamente — espera-se: ABRE (prova que o fix é só remover o "as any")
  const apiResult = await page.evaluate(()=>{ try { window.__cmDevTools.toggle(); return 'ok'; } catch(e){ return 'ERRO: '+e.message; } });
  await page.waitForTimeout(800);
  const afterApi = await page.evaluate(()=>({ cls: document.querySelector('.cm-devtools')?.className, panelVisible: !!document.querySelector('.cm-devtools:not(.collapsed) .cm-devtools-header, .cm-devtools-tabs, .cm-devtools-tab') }));
  console.log('window.__cmDevTools.toggle() =>', apiResult);
  console.log('APÓS API:', JSON.stringify(afterApi));
  await page.screenshot({ path: `${OUT}/tools-btn-opened.png` });

  console.log('CONSOLE ERRORS:', errs.length, JSON.stringify(errs.slice(0,6)));
} catch(e){ console.log('FALHA:', e.message); }
finally { await browser.close(); }
