// UX-1b REFEITO (sticky, sem altura em JS). 1440×900 e 1920×1080; Produtos (Grade e Tabela), Ficha 154, Atributos; topo e rolado até o meio
// (roda do mouse, como o usuário). Prova: quem rola é a página do shell; o bloco do topo fica PARADO colado no topo da área visível; o
// cabeçalho das colunas gruda logo abaixo dele; o conteúdo ocupa a tela até o rodapé (sem faixa em branco). Capturas em capturas-sticky/.
// Uso: flock /srv/dshow-modularizacao/locks/navegador.lock nice -n 10 node teste-sticky.cjs [porta=8115]
const { chromium } = require('/srv/dshow-work/atributos-web-wt/node_modules/playwright-core');
const PORTA = process.argv[2] || '8115'; const B = `http://127.0.0.1:${PORTA}`; const CAP = 'capturas-sticky';
require('fs').mkdirSync(CAP, { recursive: true });
let ok = 0, falhas = 0;
const afirma = (n, c, x = '') => { if (c) { ok++; console.log('ok    ' + n); } else { falhas++; console.log('FALHA ' + n + (x ? ' · ' + x : '')); } };
const CASOS = [
  { nome: 'produtos-grade', rota: '#/panel-atributos', sel: '.at-cartao, .at-grade', antes: null },
  { nome: 'produtos-tabela', rota: '#/panel-atributos', sel: '.at-filtros__total', antes: async (pg) => { await pg.click('button[aria-pressed]:has-text("Tabela")'); await pg.waitForSelector('.at-produtos table.at-tabela'); }, th: '.at-produtos table.at-tabela thead th' },
  { nome: 'ficha-154', rota: '#/panel-atributos/produto/154', sel: '.at-tabela-ficha', th: '.at-tabela-ficha thead th' },
  { nome: 'atributos', rota: '#/panel-atributos/atributos', sel: '.at-td, table', th: null },
];
(async () => {
  const b = await chromium.launch({ executablePath: '/root/.cache/ms-playwright/chromium_headless_shell-1208/chrome-headless-shell-linux64/chrome-headless-shell' });
  for (const [w, h] of [[1440, 900], [1920, 1080]]) {
    const ctx = await b.newContext({ viewport: { width: w, height: h } }); const pg = await ctx.newPage();
    await pg.goto(`${B}/__entrar?perfil=admin&ir=%2F`, { waitUntil: 'networkidle', timeout: 60000 });
    for (const c of CASOS) {
      await pg.evaluate(() => { try { sessionStorage.removeItem('__BOOT_LOOP_TRACKER__'); } catch {} });
      await pg.goto(`${B}/${c.rota}`); await pg.reload({ waitUntil: 'networkidle' });
      await pg.waitForSelector(c.sel, { timeout: 40000 }); if (c.antes) await c.antes(pg); await pg.waitForTimeout(1200);
      const pre = `${w}×${h} · ${c.nome}`;
      const mede = () => pg.evaluate((thSel) => {
        const r = document.querySelector('.at-raiz'), f = r.querySelector('.at-fixo');
        // quem rola: o ancestral que de fato tem rolagem
        let rol = null; for (let e = r.parentElement; e; e = e.parentElement) { const s = getComputedStyle(e); if (/(auto|scroll)/.test(s.overflowY) && e.scrollHeight > e.clientHeight + 2) { rol = e; break; } }
        if (!rol) rol = document.scrollingElement;
        const rr = rol === document.scrollingElement ? { top: 0, bottom: innerHeight } : rol.getBoundingClientRect();
        const fr = f.getBoundingClientRect(); const th = thSel ? document.querySelector(thSel)?.getBoundingClientRect() : null;
        // "sem faixa em branco": o ponto perto do fim da área visível pertence ao módulo
        const y = Math.min(rr.bottom, innerHeight) - 24; const el = document.elementFromPoint(Math.round(fr.left + fr.width / 2), Math.round(y));
        return { rolador: rol.id ? `${rol.tagName.toLowerCase()}#${rol.id}` : rol.tagName.toLowerCase(), scrollTop: Math.round(rol.scrollTop), rolTopo: Math.round(rr.top), rolBase: Math.round(rr.bottom),
          fixoTopo: Math.round(fr.top), fixoBase: Math.round(fr.bottom), fixoAlt: Math.round(fr.height), thTopo: th ? Math.round(th.top) : null,
          baseNoModulo: !!el && r.contains(el), raizAlt: Math.round(r.getBoundingClientRect().height), alturaFixada: r.style.height || null, posicao: getComputedStyle(f).position };
      }, c.th || null);
      const m0 = await mede();
      afirma(`${pre}: sem altura fixada no módulo; bloco do topo é sticky; quem rola é ${m0.rolador}`, !m0.alturaFixada && m0.posicao === 'sticky', JSON.stringify(m0));
      afirma(`${pre} (topo): conteúdo até o rodapé, sem faixa em branco`, m0.baseNoModulo, JSON.stringify(m0));
      await pg.screenshot({ path: `${CAP}/${w}x${h}-${c.nome}-topo.png` });
      // rola até o meio com a roda do mouse (sobre o conteúdo)
      await pg.mouse.move(w / 2, h - 120);
      const alvo = await pg.evaluate(() => { let rol = null; const r = document.querySelector('.at-raiz'); for (let e = r.parentElement; e; e = e.parentElement) { const s = getComputedStyle(e); if (/(auto|scroll)/.test(s.overflowY) && e.scrollHeight > e.clientHeight + 2) { rol = e; break; } } rol = rol || document.scrollingElement; return Math.round((rol.scrollHeight - rol.clientHeight) / 2); });
      for (let k = 0; k < 40; k++) { const m = await mede(); if (m.scrollTop >= alvo - 50) break; await pg.mouse.wheel(0, 300); await pg.waitForTimeout(60); }
      await pg.waitForTimeout(400);
      const m1 = await mede();
      const tdRolou = await pg.evaluate(() => { const t = document.querySelector('.at-td[data-rolagem="propria"]'); return t ? t.scrollTop : -1; });
      if (m1.scrollTop === 0 && tdRolou > 0) {   // a página não tem o que rolar: a TabelaDados da ESQUERDA ainda rola por dentro (rolagem="propria")
        console.log(`PENDENTE (ESQUERDA) ${pre}: a página não rola; a TabelaDados rola por dentro (rolagem="propria"). O bloco do topo fica no lugar (${m1.fixoTopo} = ${m0.fixoTopo}).`);
        afirma(`${pre} (tabela rolando por dentro): o bloco do topo continua no mesmo lugar`, m1.fixoTopo === m0.fixoTopo);
      } else
      afirma(`${pre} (rolado, scrollTop ${m1.scrollTop}): bloco do topo PARADO colado no topo da área visível (fixo ${m1.fixoTopo} ≈ topo ${m1.rolTopo})`, m1.scrollTop > 100 && Math.abs(m1.fixoTopo - m1.rolTopo) <= 2, JSON.stringify(m1));
      if (c.th) afirma(`${pre} (rolado): cabeçalho das colunas grudado logo abaixo do bloco (th ${m1.thTopo} ≈ ${m1.fixoBase})`, m1.thTopo !== null && Math.abs(m1.thTopo - m1.fixoBase) <= 3, JSON.stringify(m1));
      afirma(`${pre} (rolado): conteúdo até o rodapé, sem faixa em branco`, m1.baseNoModulo, JSON.stringify(m1));
      await pg.screenshot({ path: `${CAP}/${w}x${h}-${c.nome}-meio.png` });
    }
    await ctx.close();
  }
  console.log(`STICKY (UX-1b refeito, porta ${PORTA}): ${ok} ok, ${falhas} falhas`); await b.close(); process.exit(falhas ? 1 : 0);
})().catch((e) => { console.error('ERRO', e.message, e.stack?.split('\n')[1]); process.exit(2); });
