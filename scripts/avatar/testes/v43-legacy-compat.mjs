// testes/v43-legacy-compat.mjs — GOLDEN V4.3 §16/§54: LEGACY = COMPATIBILITY.
// Um avatar ANTIGO (IDs clássicos, sem premium) abre no MESMO painel 2D único
// (single_2d ON): o engine reconhece os IDs, renderiza a aparência preservada, a
// interface continua sendo a NOVA (sem "modo clássico"), e o save continua válido.
// COMPATIBILITY E2E (distinto do PRODUCT E2E) — prova compat sem criar 2º produto.
import { abrir, irParaHarness, SAIDA } from './navegador.mjs';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
const OUTPKG = process.env.OUTPKG || '/tmp/v4/pkg';
mkdirSync(OUTPKG, { recursive: true });
if (!existsSync(SAIDA)) mkdirSync(SAIDA, { recursive: true });

// avatar LEGADO: base clássica, SEM acabamento premium (motor clássico byte a byte)
const LEGADO = { formato: 'camadas', versao: 1, base: 'bas_classica', camadas: {}, cores: { pele: '#e0b48a', cabelo: '#3b2a1a', roupa: '#3a5cbf', destaque: '#ffcc00' } };
const FLAGS = { 'as5.novo_shell': true, 'as6.classico_premium': true, 'as6.arte_v2': true, 'as6.fit_v2': true, 'as6.hero_2d': true, 'as6.face_v2': true, 'as6.single_2d': true };

let falhas = 0;
const ok = (c, m) => { console.log(`${c ? '  ✓' : '  ✗ FALHA:'} ${m}`); if (!c) falhas++; };
const { navegador, pagina, erros } = await abrir({
  viewport: { width: 1440, height: 980 },
  init: (arg) => { try { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify(arg.flags)); localStorage.setItem('avst.harness.config', JSON.stringify(arg.legado)); } catch {} },
  initArg: { flags: FLAGS, legado: LEGADO },
});
try {
  await irParaHarness(pagina, 'avst-harness.html', 1200);
  // 1) abre no MESMO painel 2D (o shell único = a interface NOVA), não no App
  //    clássico. .avst5-palco só existe no shell novo — sua presença prova §16
  //    ("interface permanece a nova"). O comportamento single_2d (esconder troca
  //    de modo + ferramentas absorvidas) é provado em v43-single2d-parity.mjs.
  ok(!!(await pagina.$('.avst5-palco')), 'save antigo abre no MESMO painel 2D / interface nova (§16)');
  // 2) engine reconhece os IDs clássicos e RENDERIZA (aparência preservada §54)
  const render = await pagina.evaluate(() => { const s = document.querySelector('.avst5-palco svg, .avst5-palco-premium svg'); return { existe: !!s, nós: s ? s.querySelectorAll('*').length : 0 }; });
  ok(render.existe && render.nós > 5, `aparência preservada: palco renderiza o legado (${render.nós} nós svg)`);
  // 3) save continua válido (edita + salva → POST no backend)
  await pagina.evaluate(() => { window.__api = []; const f = window.fetch; window.fetch = (u, o) => { const s = String(u instanceof Request ? u.url : u); if (s.includes('/api/')) window.__api.push(`${(o && o.method) || 'GET'} ${s}`); return f(u, o); }; });
  await pagina.evaluate(() => { [...document.querySelectorAll('button.avst5-cat, button.avst6-navg-cab')].find((x) => (x.textContent || '').trim().startsWith('Cabelo'))?.click(); });
  await pagina.waitForTimeout(500);
  await pagina.evaluate(() => { const cards = [...document.querySelectorAll('.avst5-painel .avst-card')].filter((c) => !c.className.includes('avst-card-ativo') && !c.className.includes('avst-card-nenhum') && c.dataset.teste !== 'card-adiado'); cards[1]?.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
  await pagina.waitForTimeout(500);
  const btnSalvar = pagina.locator('.avst5-salvar button', { hasText: /salvar/i });
  if (await btnSalvar.count()) {
    await btnSalvar.first().click();
    await pagina.waitForTimeout(700);
    const chamadas = await pagina.evaluate(() => window.__api);
    ok(chamadas.some((c) => c.startsWith('POST') && (c.includes('studio.php') || c.includes('estado.php'))), `save do avatar legado continua válido (POST: ${chamadas.filter((c) => c.startsWith('POST')).slice(-1)[0] || 'nenhum'})`);
  } else { ok(false, 'barra de salvar ausente'); }
  ok(erros.length === 0, `sem erros JS (${erros.slice(0, 2).join(' | ')})`);

  // board
  const palco = await pagina.$('.avst5-palco');
  if (palco) {
    const raw = await palco.screenshot();
    const m = await sharp(raw).metadata(); const W = Math.max(m.width, 560), head = 58;
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${head}">`;
    svg += `<text x="16" y="26" font-family="Segoe UI" font-size="18" font-weight="800" fill="#fff">11b · LEGACY = COMPAT no MESMO 2D (§16/§54)</text>`;
    svg += `<text x="16" y="46" font-family="Segoe UI" font-size="12" fill="#9fb0c8">Avatar antigo (IDs clássicos, sem premium) abre no shell único, renderiza e re-salva. Interface = a nova.</text></svg>`;
    const out = await sharp({ create: { width: W, height: head + m.height, channels: 3, background: { r: 15, g: 16, b: 21 } } }).composite([{ input: raw, top: head, left: 0 }, { input: Buffer.from(svg), top: 0, left: 0 }]).png().toBuffer();
    writeFileSync(join(OUTPKG, '11b_V43_LEGACY_COMPAT.png'), out);
    console.log('  board → 11b_V43_LEGACY_COMPAT.png');
  }
} catch (e) { console.error('  ✗ EXCEÇÃO:', e.message.slice(0, 160)); falhas++; } finally { await navegador.close(); }
console.log(falhas ? `\n✗ v43-legacy-compat: ${falhas} falha(s)` : '\n✓ v43-legacy-compat verde');
process.exit(falhas ? 1 : 0);
