// ACABAMENTOS (Jhony, 19/11 ~14h30) · teste leve + capturas SÓ dos 3 pontos. Flags de shell da produção. Nada é gravado.
// (1) Ficha · sugestão (produto 27): "Sugestão: X · Usar · Recusar" com contraste e comandos separados; Recusar tão legível quanto Usar. 2200×1470.
// (2) Preencher · coluna Produto contida (reticências, sem passar do divisor; divisor contínuo). 2200×1470 e 1440×900.
// (3) Preencher · rolagem horizontal: barra espelho embaixo + indicação "›" de colunas à direita. 2200×1470 e 1440×900.
// Uso: PORTA_FICHA=8115 PORTA_PREENCHER=8112 flock … nice -n 10 node teste-acabamentos.cjs
const { chromium } = require('/srv/dshow-work/atributos-web-wt/node_modules/playwright-core');
const PF = process.env.PORTA_FICHA || 8115, PP = process.env.PORTA_PREENCHER || 8112; const CAP = 'capturas-acabamentos'; require('fs').mkdirSync(CAP, { recursive: true });
let ok = 0, falhas = 0; const afirma = (n, c, x = '') => { if (c) { ok++; console.log('ok    ' + n); } else { falhas++; console.log('FALHA ' + n + (x ? ' · ' + x : '')); } };
const lum = (rgb) => { const srgb = rgb.startsWith('color(srgb'); const [r, g, b] = rgb.match(/\d+(\.\d+)?/g).slice(0, 3).map(Number).map((v) => { v = srgb ? v : v / 255;   // color-mix devolve color(srgb 0..1)
 return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const contraste = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
(async () => {
  const b = await chromium.launch({ executablePath: '/root/.cache/ms-playwright/chromium_headless_shell-1208/chrome-headless-shell-linux64/chrome-headless-shell' });
  const entrar = async (porta, W, H) => { const pg = await (await b.newContext({ viewport: { width: W, height: H }, deviceScaleFactor: 1 })).newPage(); await pg.goto(`http://127.0.0.1:${porta}/__entrar?perfil=admin&ir=%2F`, { waitUntil: 'networkidle', timeout: 60000 }); await pg.evaluate(() => sessionStorage.removeItem('__BOOT_LOOP_TRACKER__')); return pg; };
  // (1) Ficha 27 · sugestão
  { const pg = await entrar(PF, 2200, 1470); await pg.goto(`http://127.0.0.1:${PF}/#/panel-atributos/produto/27`); await pg.reload({ waitUntil: 'networkidle' }); await pg.waitForSelector('.at-tabela-ficha--v3', { timeout: 40000 }); await pg.waitForTimeout(1000);
    await pg.click('.at-fixo button:has-text("Com sugestão")'); await pg.waitForTimeout(500);
    const s = await pg.evaluate(() => { const e = document.querySelector('.at-v3-sit .at-sugestao'); if (!e) return null; const bs = [...e.querySelectorAll('button')]; const cs = (x) => getComputedStyle(x); const bg = cs(e).backgroundColor;
      const usar = bs.find((x) => /Usar/.test(x.textContent)), rec = bs.find((x) => /Recusar/.test(x.textContent)); const r = (x) => x.getBoundingClientRect();
      return { texto: e.textContent.replace(/\s+/g, ' ').trim(), umaLinha: Math.round(r(e).height) <= 26, usar: usar && { cor: cs(usar).color, peso: cs(usar).fontWeight, fs: cs(usar).fontSize, borda: cs(usar).borderTopWidth, op: cs(usar).opacity }, rec: rec && { cor: cs(rec).color, peso: cs(rec).fontWeight, fs: cs(rec).fontSize, borda: cs(rec).borderTopWidth, op: cs(rec).opacity }, bg, sep: usar && rec ? Math.round(r(rec).left - r(usar).right) : null, val: cs(e.querySelector('.at-sugestao__val')).color }; });
    afirma('(1) Ficha 27 · "Sugestão: … · Usar · Recusar" numa linha', !!s && /^Sugestão: .+ · Usar · Recusar$/.test(s.texto) && s.umaLinha, JSON.stringify(s?.texto));
    afirma(`(1) Recusar tão legível quanto Usar (mesmo peso ${s?.rec?.peso}, tamanho ${s?.rec?.fs}, opacidade 1, contorno) e os dois com contraste ≥ 4,5 (${s && contraste(s.usar.cor, s.bg).toFixed(1)} / ${s && contraste(s.rec.cor, s.bg).toFixed(1)}); comandos separados (${s?.sep} px)`,
      !!s && s.usar.peso === s.rec.peso && s.usar.fs === s.rec.fs && s.rec.op === '1' && s.rec.borda !== '0px' && contraste(s.usar.cor, s.bg) >= 4.5 && contraste(s.rec.cor, s.bg) >= 4.5 && s.sep >= 6, JSON.stringify(s));
    const box = await pg.evaluate(() => { const r = document.querySelector('.at-v3-sit .at-sugestao').closest('tr').getBoundingClientRect(); return { x: Math.max(0, r.left - 10), y: Math.max(0, r.top - 50), width: Math.min(innerWidth, r.width + 20), height: r.height + 100 }; });
    await pg.screenshot({ path: `${CAP}/1-ficha27-sugestao-2200x1470.png`, clip: box }); await pg.screenshot({ path: `${CAP}/1-ficha27-sugestao-2200x1470-tela.png` });
    await pg.context().close(); }
  // (2)(3) Preencher · coluna Produto e rolagem horizontal
  for (const [W, H] of [[2200, 1470], [1440, 900]]) {
    const pg = await entrar(PP, W, H); await pg.goto(`http://127.0.0.1:${PP}/#/panel-atributos/preencher`); await pg.reload({ waitUntil: 'networkidle' }); await pg.waitForSelector('select[aria-label="Kit"]', { timeout: 40000 });
    const v = await pg.$$eval('select[aria-label="Kit"] option', (os) => os.find((o) => o.textContent.startsWith('Cabos'))?.value); await pg.selectOption('select[aria-label="Kit"]', v); await pg.waitForSelector('.pv2-grade', { timeout: 90000 }); await pg.waitForTimeout(1200);
    const nome = await pg.evaluate(() => { const div = document.querySelector('.pv2-corpo__fixo').getBoundingClientRect().right; const bs = [...document.querySelectorAll('.pv2-td--nome .at-link-produto')];
      const longos = bs.filter((b) => b.scrollWidth > b.clientWidth + 1); const r = (x) => x.getBoundingClientRect();
      return { divisor: Math.round(div), passa: bs.filter((b) => r(b).right > div + 0.5).map((b) => b.textContent), longos: longos.map((b) => b.closest('.pv2-linha--fixa').querySelector('.pv2-td--id').textContent), reticencias: longos.every((b) => getComputedStyle(b).textOverflow === 'ellipsis' && b.title.length > 0),
        continuo: getComputedStyle(document.querySelector('.pv2-corpo__fixo'), '::after').width === '1px' && getComputedStyle(document.querySelector('.pv2-cab__fixo')).borderRightWidth !== '0px', fundoContido: [...document.querySelectorAll('.pv2-linha--fixa')].every((l) => r(l).right <= div + 0.5), continuoSobre: getComputedStyle(document.querySelector('.pv2-corpo__fixo'), '::after').zIndex === '3' }; });
    afirma(`(2) ${W}×${H} · Produto contido: nenhum nome passa do divisor (${nome.divisor} px); longos com reticências e nome no title (${nome.longos.join(', ') || 'nenhum longo nesta largura'}); fundo contido; divisor contínuo`, nome.passa.length === 0 && nome.reticencias && nome.fundoContido && nome.continuo, JSON.stringify(nome));
    const clip = await pg.evaluate(() => { const r = document.querySelector('.pv2-grade').getBoundingClientRect(); return { x: Math.max(0, r.left - 4), y: Math.max(0, r.top - 4), width: 520, height: Math.min(innerHeight - Math.max(0, r.top - 4), 620) }; });
    await pg.screenshot({ path: `${CAP}/2-preencher-produto-${W}x${H}.png`, clip });
    const ind0 = await pg.evaluate(() => { const m = document.querySelector('.pv2-mais'); const bar = document.querySelector('[data-pv2-barra]'); const g = document.querySelector('.pv2-grade').getBoundingClientRect(); const cab = document.querySelector('.pv2-cab').getBoundingClientRect();
      return { mais: !!m && getComputedStyle(m).visibility !== 'hidden', maisDireita: m ? Math.round(m.getBoundingClientRect().right) : null, cabDireita: Math.round(cab.right), barra: !!bar, barraBase: bar ? Math.round(bar.getBoundingClientRect().bottom) : null, alvo: Math.round(Math.min(innerHeight, g.bottom)) }; });
    await pg.screenshot({ path: `${CAP}/3-preencher-mais-colunas-${W}x${H}.png` });
    await pg.click('.pv2-mais'); await pg.waitForTimeout(400);
    const depois = await pg.evaluate(() => ({ sl: document.querySelector('.pv2-corpo__rola').scrollLeft, cab: document.querySelector('.pv2-cab__rola').scrollLeft, barra: document.querySelector('[data-pv2-barra]')?.scrollLeft }));
    await pg.evaluate(() => { const c = document.querySelector('.pv2-corpo__rola'); c.scrollLeft = c.scrollWidth; c.dispatchEvent(new Event('scroll')); }); await pg.waitForTimeout(300);
    const fim = await pg.evaluate(() => !document.querySelector('.pv2-mais'));
    afirma(`(3) ${W}×${H} · há mais colunas: indicação "›" no canto direito do cabeçalho travado + barra espelho grudada embaixo (${ind0.barraBase} ≈ ${ind0.alvo}); clicar "›" rola grade, cabeçalho e barra juntos (${depois.sl}/${depois.cab}/${depois.barra}); no fim, o "›" some`,
      ind0.mais && Math.abs(ind0.maisDireita - ind0.cabDireita) <= 2 && ind0.barra && Math.abs(ind0.barraBase - ind0.alvo) <= 2 && depois.sl > 0 && depois.sl === depois.cab && depois.sl === depois.barra && fim, JSON.stringify({ ind0, depois, fim }));
    await pg.screenshot({ path: `${CAP}/3-preencher-no-fim-${W}x${H}.png` });
    await pg.context().close();
  }
  console.log(`ACABAMENTOS: ${ok} ok, ${falhas} falhas`); await b.close(); process.exit(falhas ? 1 : 0);
})().catch((e) => { console.error('ERRO', e.message, e.stack?.split('\n')[1]); process.exit(2); });
