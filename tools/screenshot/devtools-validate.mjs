import { chromium } from 'playwright';
import { isLoginPage, loginViaPage } from './auth.mjs';
const OUT='/tmp/claude-0/-root/eb8bd5d1-086b-4892-9f3f-45825fb23b99/scratchpad';
const URL='https://dshowdash.com.br/';
const b=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage','--host-resolver-rules=MAP dshowdash.com.br 127.0.0.1','--ignore-certificate-errors']});
const ctx=await b.newContext({viewport:{width:1440,height:900},ignoreHTTPSErrors:true});
const p=await ctx.newPage();
const errs=[]; p.on('console',m=>{if(m.type()==='error'&&!/Fetch failed \(non-fatal\)/.test(m.text()))errs.push(m.text().slice(0,160));}); p.on('pageerror',e=>errs.push('PAGEERR: '+e.message));
async function setTheme(t){let c=await p.evaluate(()=>document.documentElement.getAttribute('data-theme'));for(let i=0;i<4&&c!==t;i++){await p.click('[data-dsd-theme-toggle]').catch(()=>{});await p.waitForTimeout(600);c=await p.evaluate(()=>document.documentElement.getAttribute('data-theme'));}return c;}
try{
  await p.goto(URL,{waitUntil:'domcontentloaded',timeout:40000});
  await p.waitForTimeout(3000);
  if(await isLoginPage(p)){await loginViaPage(p);await p.waitForTimeout(2000);}
  await p.waitForSelector('.cm-devtools-toggle',{timeout:30000});

  // ---- DEVTOOLS: abrir pelo botão de ferramentas ----
  await p.click('.cm-devtools-toggle'); await p.waitForTimeout(600);
  let st=await p.evaluate(()=>({cls:document.querySelector('.cm-devtools')?.className, tabs:document.querySelectorAll('.cm-devtools-tab').length}));
  console.log('APÓS CLIQUE toggle:', JSON.stringify(st));

  // trocar para Logs e checar texto-lixo do @ts-expect-error
  await p.evaluate(()=>window.__cmDevTools && null); // no-op
  const tabsInfo=await p.evaluate(()=>{
    const tabs=[...document.querySelectorAll('.cm-devtools-tab')].map(t=>t.textContent.trim());
    // clicar em cada aba via onclick real
    return tabs;
  });
  // clicar aba "Logs"
  await p.evaluate(()=>{ const t=[...document.querySelectorAll('.cm-devtools-tab')].find(x=>/Logs/.test(x.textContent)); if(t) t.click(); });
  await p.waitForTimeout(400);
  const logsCheck=await p.evaluate(()=>({ activeTab: document.querySelector('.cm-devtools-tab.active')?.textContent?.trim(), strayTsText: (document.querySelector('.cm-devtools-content')?.innerText||'').includes('@ts-expect-error'), overviewBtnOnclick: false }));
  // voltar Overview e checar botão Refresh (onclick válido?)
  await p.evaluate(()=>{ const t=[...document.querySelectorAll('.cm-devtools-tab')].find(x=>/Overview/.test(x.textContent)); if(t) t.click(); });
  await p.waitForTimeout(400);
  const ovBtn=await p.evaluate(()=>{ const btn=[...document.querySelectorAll('.cm-devtools-btn')].find(b=>/Refresh/.test(b.textContent)); return btn? btn.getAttribute('onclick'):null; });
  console.log('ABAS:', JSON.stringify(tabsInfo), '| activeAposLogs:', logsCheck.activeTab, '| textoLixo@ts:', logsCheck.strayTsText, '| RefreshOnclick:', ovBtn);
  await p.screenshot({path:`${OUT}/devtools-open-dark.png`});

  // fechar pelo botão "−"
  await p.evaluate(()=>{ const c=[...document.querySelectorAll('.cm-devtools-btn')].find(b=>b.textContent.trim()==='−'); if(c) c.click(); });
  await p.waitForTimeout(400);
  const afterClose=await p.evaluate(()=>document.querySelector('.cm-devtools')?.className);
  console.log('APÓS fechar (−):', afterClose);

  // ---- COMMAND PALETTE (Ctrl+K) ----
  await p.keyboard.press('Control+K'); await p.waitForTimeout(600);
  const cpOpen=await p.evaluate(()=>!!document.querySelector('.dsd-cp-item, .dsd-cp-empty, [class*="command-palette"], [class*="dsd-cp"]'));
  // digitar
  await p.keyboard.type('painel'); await p.waitForTimeout(600);
  const cpInfo=await p.evaluate(()=>{
    const items=[...document.querySelectorAll('.dsd-cp-item')];
    return { open: !!document.querySelector('[class*="dsd-cp"]'), count: items.length, firstOnclick: items[0]?.getAttribute('onclick'), anyAsAny: items.some(i=>(i.getAttribute('onclick')||'').includes('as any')) };
  });
  console.log('COMMAND PALETTE:', JSON.stringify(cpInfo));
  await p.screenshot({path:`${OUT}/devtools-cmdpalette.png`});
  // clicar no primeiro resultado (não deve lançar)
  const clickErr=await p.evaluate(()=>{ try{ const it=document.querySelector('.dsd-cp-item'); if(it){ it.click(); return 'clicou'; } return 'sem item'; }catch(e){ return 'ERRO: '+e.message; } });
  await p.waitForTimeout(600);
  console.log('clique resultado:', clickErr);
  // fechar a paleta (Esc) antes de mexer no tema
  await p.keyboard.press('Escape'); await p.waitForTimeout(400);
  await p.evaluate(()=>{ document.querySelector('.dsd-command-palette--visible')?.classList.remove('dsd-command-palette--visible'); document.querySelector('.dsd-command-palette__backdrop')?.remove(); });
  await p.waitForTimeout(300);

  // ---- LIGHT: reabrir devtools ----
  await setTheme('light'); await p.waitForTimeout(400);
  await p.click('.cm-devtools-toggle'); await p.waitForTimeout(500);
  const lightSt=await p.evaluate(()=>document.querySelector('.cm-devtools')?.className);
  console.log('LIGHT após clique toggle:', lightSt);
  await p.screenshot({path:`${OUT}/devtools-open-light.png`});

  console.log('ERROS NÃO-triviais:', errs.length, JSON.stringify(errs.slice(0,8)));
}catch(e){console.log('FALHA:',e.message); await p.screenshot({path:`${OUT}/devtools-fail.png`}).catch(()=>{});}
finally{await b.close();}
