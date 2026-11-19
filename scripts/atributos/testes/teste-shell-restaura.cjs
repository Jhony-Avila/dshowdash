// UX-1b refeito, condição do Cima: o overflow: clip nos elementos do shell só existe com o módulo montado e é DESFEITO ao ir para outro
// painel. Abre outro painel (referência), abre o módulo e rola (a troca acontece), vai para o outro painel de novo e volta.
// Prova: estilo inline e overflow calculado do .dsd-container__body e do #container-main idênticos à referência; captura do outro painel
// antes e depois (comparadas byte a byte e por pixel). Uso: PORTA=8115 flock … nice -n 10 node teste-shell-restaura.cjs
const { chromium } = require('/srv/dshow-work/atributos-web-wt/node_modules/playwright-core');
const fs = require('fs'); const { execFileSync } = require('child_process');
const B = `http://127.0.0.1:${process.env.PORTA || 8115}`; const CAP = 'capturas-sticky';
let ok = 0, falhas = 0;
const afirma = (n, c, x = '') => { if (c) { ok++; console.log('ok    ' + n); } else { falhas++; console.log('FALHA ' + n + (x ? ' · ' + x : '')); } };
(async () => {
  const b = await chromium.launch({ executablePath: '/root/.cache/ms-playwright/chromium_headless_shell-1208/chrome-headless-shell-linux64/chrome-headless-shell' });
  const pg = await (await b.newContext({ viewport: { width: 1440, height: 900 } })).newPage();
  await pg.goto(`${B}/__entrar?perfil=admin&ir=%2F`, { waitUntil: 'networkidle', timeout: 60000 });
  const estilo = () => pg.evaluate(() => ['.dsd-container__body', '#container-main'].map((q) => { const e = document.querySelector(q); return e ? `${q} inline="${e.style.overflow}" calc=${getComputedStyle(e).overflowX}/${getComputedStyle(e).overflowY}` : `${q} ausente`; }));
  const outro = async () => { await pg.click('a.dsd-sidebar__link:has-text("Geral Compras")'); await pg.waitForTimeout(2500); };
  // 1) referência: outro painel, sem o módulo nunca ter rolado
  await pg.evaluate(() => { try { sessionStorage.removeItem('__BOOT_LOOP_TRACKER__'); } catch {} }); await pg.reload({ waitUntil: 'networkidle' }); await pg.waitForTimeout(1500);
  await outro(); const ref = await estilo(); await pg.mouse.move(10, 10); await pg.screenshot({ path: `${CAP}/outro-painel-antes.png` });
  // 2) módulo: rola a página → a troca acontece
  await pg.click('a.dsd-sidebar__link[href="#/panel-atributos/produtos"], a.dsd-sidebar__link:has-text("Geral Produtos")').catch(async () => { await pg.goto(`${B}/#/panel-atributos`); });
  await pg.waitForSelector('[data-at-host] .at-raiz', { timeout: 40000 }); await pg.waitForTimeout(1500);
  await pg.mouse.move(720, 700); for (let k = 0; k < 6; k++) { await pg.mouse.wheel(0, 300); await pg.waitForTimeout(80); } await pg.waitForTimeout(500);
  const noModulo = await estilo();
  afirma('com o módulo aberto e a página rolada: os dois elementos do shell estão com overflow: clip', noModulo.every((x) => /inline="clip"/.test(x)), noModulo.join(' | '));
  const fixo = await pg.evaluate(() => { const f = document.querySelector('.at-fixo').getBoundingClientRect(); const m = document.querySelector('main#main'); return { f: Math.round(f.top), m: Math.round(m.getBoundingClientRect().top), s: m.scrollTop }; });
  afirma(`e o cabeçalho do módulo está grudado (fixo ${fixo.f} = topo da área ${fixo.m}, scroll ${fixo.s})`, fixo.s > 100 && Math.abs(fixo.f - fixo.m) <= 2, JSON.stringify(fixo));
  // 3) troca de painel: tudo volta ao original
  await outro(); const depois = await estilo(); await pg.mouse.move(10, 10);
  afirma('depois de ir para outro painel: estilo inline e overflow calculado idênticos à referência', JSON.stringify(depois) === JSON.stringify(ref), `ref=${ref.join(' | ')} · depois=${depois.join(' | ')}`);
  await pg.evaluate(() => { const m = document.querySelector('main#main'); if (m) m.scrollTo({ top: 0, behavior: 'instant' }); }); await pg.waitForTimeout(300);
  await pg.screenshot({ path: `${CAP}/outro-painel-depois.png` });
  let pix = 'n/d'; try { pix = execFileSync('compare', ['-metric', 'AE', `${CAP}/outro-painel-antes.png`, `${CAP}/outro-painel-depois.png`, '/dev/null'], { stdio: ['ignore', 'pipe', 'pipe'] }).toString(); } catch (e) { pix = (e.stderr || '').toString().trim(); }
  console.log(`info  pixels diferentes entre as capturas do outro painel (antes × depois): ${pix} (o relógio/ticker do topo muda sozinho)`);
  afirma('a área do painel (abaixo da barra de notícias) é idêntica antes e depois', (() => { try { execFileSync('convert', [`${CAP}/outro-painel-antes.png`, '-crop', '1140x700+300+120', `${CAP}/_a.png`]); execFileSync('convert', [`${CAP}/outro-painel-depois.png`, '-crop', '1140x700+300+120', `${CAP}/_b.png`]); let r = ''; try { r = execFileSync('compare', ['-metric', 'AE', `${CAP}/_a.png`, `${CAP}/_b.png`, '/dev/null'], { stdio: ['ignore', 'pipe', 'pipe'] }).toString(); } catch (e) { r = (e.stderr || '').toString(); } console.log(`info  pixels diferentes na área do painel: ${r.trim()}`); return Number(r.trim()) === 0; } catch { return false; } })());
  // 4) volta ao módulo: a troca acontece de novo e o cabeçalho gruda
  await pg.goto(`${B}/#/panel-atributos`); await pg.waitForSelector('[data-at-host] .at-raiz', { timeout: 40000 }); await pg.waitForTimeout(1200);
  await pg.mouse.move(720, 700); for (let k = 0; k < 6; k++) { await pg.mouse.wheel(0, 300); await pg.waitForTimeout(80); } await pg.waitForTimeout(500);
  const volta = await pg.evaluate(() => { const f = document.querySelector('.at-fixo').getBoundingClientRect(); const m = document.querySelector('main#main'); return Math.abs(f.top - m.getBoundingClientRect().top) <= 2 && m.scrollTop > 100; });
  afirma('voltando ao módulo: o cabeçalho volta a grudar', volta);
  console.log(`SHELL RESTAURA: ${ok} ok, ${falhas} falhas`); await b.close(); process.exit(falhas ? 1 : 0);
})().catch((e) => { console.error('ERRO', e.message, e.stack?.split('\n')[1]); process.exit(2); });
