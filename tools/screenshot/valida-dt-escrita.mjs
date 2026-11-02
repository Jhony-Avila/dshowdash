// valida-dt-escrita.mjs — prova o fluxo de ESCRITA do painel DataTables.
import pkg from './node_modules/playwright/index.js';
const { chromium } = pkg;
import { getSessionCookies, isLoginPage, loginViaPage } from './auth.mjs';

const OUT = '/tmp/claude-0/-root/700a9e7d-2830-4fec-a39f-5b02b7bd1074/scratchpad';
const cookies = await getSessionCookies();
const browser = await chromium.launch({ headless: true, args: ['--no-sandbox','--disable-dev-shm-usage','--host-resolver-rules=MAP dshowdash.com.br 127.0.0.1'] });
const ctx = await browser.newContext({ viewport:{width:1500,height:950}, colorScheme:'dark', serviceWorkers:'block', ignoreHTTPSErrors:true });
await ctx.addCookies(cookies);
const page = await ctx.newPage();
const errors=[], writes=[];
page.on('pageerror', e=>errors.push(String(e).slice(0,200)));
page.on('response', r=>{ const u=r.url(); const m=r.request().method();
  if(u.includes('/api/datatables') && m!=='GET') writes.push(`${m} ${r.status()} ${u.replace(/^https:\/\/[^/]+/,'')}`); });
page.on('dialog', d=>d.accept('teste automatizado'));

const log=[];
await page.goto('https://dshowdash.com.br/#/panel-datatables',{waitUntil:'domcontentloaded',timeout:30000}).catch(()=>{});
await page.waitForTimeout(3000);
if (await isLoginPage(page)) { await loginViaPage(page).catch(()=>{}); await page.goto('https://dshowdash.com.br/#/panel-datatables').catch(()=>{}); await page.waitForTimeout(3000); }
await page.waitForSelector('.dt-root',{timeout:20000}).catch(()=>{});

// aba Conexoes
await page.click('.dt-tab[data-tab="conns"]').catch(()=>{});
await page.waitForTimeout(1800);
log.push('conexoes iniciais: ' + await page.evaluate(()=>document.querySelectorAll('tr[data-conn]').length));

// 1) NOVA CONEXAO
await page.click('[data-dt-new]').catch(()=>{});
await page.waitForTimeout(700);
log.push('formulario abriu: ' + await page.evaluate(()=>!!document.querySelector('[data-f="name"]')));
await page.fill('[data-f="name"]','[UI-TESTE] conexao via painel').catch(()=>{});
await page.fill('[data-f="host"]','127.0.0.1').catch(()=>{});
await page.fill('[data-f="db_name"]','DSHOWDASH').catch(()=>{});
await page.fill('[data-f="username"]','usuario_errado_xyz').catch(()=>{});
await page.fill('[data-f="password"]','senha_errada_abc').catch(()=>{});
await page.screenshot({path:`${OUT}/dt-escrita-1-form.png`}).catch(()=>{});
await page.click('[data-dt-save]').catch(()=>{});
await page.waitForTimeout(4000);
const t1 = await page.evaluate(()=>((document.querySelector('[data-dt-toast]')||{}).textContent||'').trim());
log.push('toast pos-cadastro: ' + t1.slice(0,110));
await page.screenshot({path:`${OUT}/dt-escrita-2-cadastrada.png`}).catch(()=>{});

const id = await page.evaluate(()=>{
  const rows=[...document.querySelectorAll('tr[data-conn]')];
  const r=rows.find(x=>x.textContent.includes('[UI-TESTE]'));
  return r? r.getAttribute('data-conn') : null; });
log.push('id criado: ' + id);

// 2) senha vazia na EDICAO nao pode apagar a senha
await page.click(`[data-dt-edit="${id}"]`).catch(()=>{});
await page.waitForTimeout(1200);
const pwdVal = await page.evaluate(()=>((document.querySelector('[data-f="password"]')||{}).value)||'');
log.push('campo senha vem VAZIO na edicao: ' + (pwdVal===''));
await page.fill('[data-f="name"]','[UI-TESTE] renomeada').catch(()=>{});
await page.click('[data-dt-save]').catch(()=>{});
await page.waitForTimeout(3500);
const hasPwd = await page.evaluate(()=>{
  const rows=[...document.querySelectorAll('tr[data-conn]')];
  const r=rows.find(x=>x.textContent.includes('[UI-TESTE]'));
  return r? r.cells[6].textContent.trim() : '?'; });
log.push('senha preservada apos editar sem preencher: ' + hasPwd);

// 3) MANUTENCAO
await page.click(`[data-dt-mstart="${id}"]`).catch(()=>{});
await page.waitForTimeout(3000);
const st1 = await page.evaluate((i)=>{const r=document.querySelector(`tr[data-conn="${i}"]`); return r?r.cells[0].textContent.trim():'?';},id);
log.push('status apos manutencao: ' + st1);
await page.screenshot({path:`${OUT}/dt-escrita-3-manutencao.png`}).catch(()=>{});

await page.click(`[data-dt-mend="${id}"]`).catch(()=>{});
await page.waitForTimeout(3500);
const st2 = await page.evaluate((i)=>{const r=document.querySelector(`tr[data-conn="${i}"]`); return r?r.cells[0].textContent.trim():'?';},id);
log.push('status apos encerrar manutencao: ' + st2);

// 4) DESATIVAR
await page.click(`[data-dt-edit="${id}"]`).catch(()=>{});
await page.waitForTimeout(1000);
await page.click('[data-dt-deact]').catch(()=>{});
await page.waitForTimeout(3000);
const still = await page.evaluate(()=>[...document.querySelectorAll('tr[data-conn]')].some(x=>x.textContent.includes('[UI-TESTE]')));
log.push('sumiu da lista apos desativar: ' + !still);
await page.screenshot({path:`${OUT}/dt-escrita-4-final.png`}).catch(()=>{});

await ctx.close(); await browser.close();
console.log(JSON.stringify({log, writes:[...new Set(writes)], errors}, null, 2));
