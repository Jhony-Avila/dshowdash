// testes/v43-single2d-flow.mjs — GOLDEN V4.3 §25/§53: SINGLE 2D FLOW PROOF.
// PRODUCT E2E (distinto do COMPAT §19): ENTRY → 2D → Body/Face/Hair/Clothing/
// Footwear → Coleções → Criar com IA → Foto → Conquistas → SAVE, tudo SEM sair
// do shell (§26). Prova que o produto único funciona ponta-a-ponta, com save.
import { abrir, irParaHarness, SAIDA } from './navegador.mjs';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';
const OUTPKG = process.env.OUTPKG || '/tmp/v4/pkg';
mkdirSync(OUTPKG, { recursive: true });
if (!existsSync(SAIDA)) mkdirSync(SAIDA, { recursive: true });
const FLAGS = { 'as5.novo_shell': true, 'as6.classico_premium': true, 'as6.arte_v2': true, 'as6.fit_v2': true, 'as6.hero_2d': true, 'as6.face_v2': true, 'as6.single_2d': true };

let falhas = 0; const shots = [];
const ok = (c, m) => { console.log(`${c ? '  ✓' : '  ✗ FALHA:'} ${m}`); if (!c) falhas++; };
const { navegador, pagina, erros } = await abrir({ viewport: { width: 1440, height: 980 }, init: (f) => { try { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify(f)); } catch {} }, initArg: FLAGS });
const noShell = async () => !!(await pagina.$('.avst5-palco'));
const semTroca = async () => !(await pagina.evaluate(() => [...document.querySelectorAll('button')].some((b) => /^(Modo clássico|Voltar ao modo clássico)$/.test((b.textContent || '').trim()))));
async function categoria(nome) {
  await pagina.evaluate((n) => { const b = [...document.querySelectorAll('button.avst5-cat, button.avst6-navg-cab')].find((x) => (x.textContent || '').trim().startsWith(n)); b?.click(); }, nome);
  await pagina.waitForTimeout(500);
}
async function ferramenta(id) {
  await pagina.evaluate(() => { for (let i = 0; i < 2; i++) { const b = document.querySelector('[data-teste="tax-f-colecoes"]'); if (b && b.offsetParent !== null) return; document.querySelector('[data-teste="tax-cab-ferramentas"]')?.click(); } });
  await pagina.evaluate((t) => document.querySelector(`[data-teste="${t}"]`)?.click(), id);
  await pagina.waitForTimeout(600);
  const abriu = await pagina.evaluate(() => !!document.querySelector('.avst5-ferr-modal .avst5-ferr-corpo *'));
  await pagina.evaluate(() => document.querySelector('.avst5-ferr-fechar')?.click());
  await pagina.waitForTimeout(250);
  return abriu;
}
try {
  await irParaHarness(pagina, 'avst-harness.html', 1100);
  await pagina.evaluate(() => { window.__api = []; const f = window.fetch; window.fetch = (u, o) => { const s = String(u instanceof Request ? u.url : u); if (s.includes('/api/')) window.__api.push(`${(o && o.method) || 'GET'} ${s}`); return f(u, o); }; });
  ok(await noShell(), 'ENTRY → 2D (shell presente)');

  // BODY/FACE/HAIR/CLOTHING/FOOTWEAR
  for (const [cat, rot] of [['Rosto', 'FACE'], ['Cabelo', 'HAIR'], ['Roupa', 'CLOTHING'], ['Calçados', 'FOOTWEAR']]) {
    await categoria(cat);
    if (rot === 'HAIR') { // edita p/ habilitar o salvar
      await pagina.evaluate(() => { const cards = [...document.querySelectorAll('.avst5-painel .avst-card')].filter((c) => !c.className.includes('avst-card-ativo') && !c.className.includes('avst-card-nenhum') && c.dataset.teste !== 'card-adiado'); cards[1]?.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
      await pagina.waitForTimeout(500);
    }
    const alvo = await pagina.$('.avst5-palco');
    if (alvo && shots.length < 4) { const cam = join(SAIDA, `v43_flow_${rot}.png`); await alvo.screenshot({ path: cam }); shots.push({ rot, cam }); }
  }
  ok((await pagina.locator('.avst5-salvar').textContent())?.includes('alteraç'), 'edição habilitou o salvar');

  // TOOLS: Coleções → Criar com IA → Foto → Conquistas
  for (const [id, rot] of [['tax-f-colecoes', 'Coleções'], ['tax-f-ia', 'Criar com IA'], ['tax-f-foto', 'Foto'], ['tax-f-conquistas', 'Conquistas']]) {
    ok(await ferramenta(id), `${rot}: abriu no shell`);
    ok(await noShell(), `${rot}: não saiu do shell`);
  }

  // SAVE
  await pagina.locator('.avst5-salvar button', { hasText: /salvar/i }).first().click();
  await pagina.waitForTimeout(700);
  const chamadas = await pagina.evaluate(() => window.__api);
  ok(chamadas.some((c) => c.startsWith('POST') && c.includes('studio.php')), `SAVE POSTou no studio.php (${chamadas.slice(-2).join(' | ') || 'nenhuma'})`);
  const salvarTxt = (await pagina.locator('.avst5-salvar').textContent())?.toLowerCase() || '';
  ok(salvarTxt.includes('salv'), 'barra confirmou o salvamento');

  ok(await semTroca(), 'nenhuma troca user-facing para o clássico em todo o fluxo (§26)');
  ok(erros.length === 0, `sem erros JS (${erros.slice(0, 2).join(' | ')})`);

  if (shots.length) {
    const cell = 260, pad = 12, head = 56, lab = 24;
    const metas = await Promise.all(shots.map((s) => sharp(s.cam).resize({ width: cell, height: cell, fit: 'contain', background: { r: 20, g: 22, b: 28 } }).png().toBuffer()));
    const cw = cell + pad, BW = shots.length * cw + pad, BH = head + cell + lab + pad;
    const layers = metas.map((b, i) => ({ input: b, left: pad + i * cw, top: head }));
    let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${BW}" height="${BH}">`;
    svg += `<text x="16" y="26" font-family="Segoe UI" font-size="19" font-weight="800" fill="#fff">13 · SINGLE 2D FLOW — entry→edit→tools→SAVE sem sair do shell (§25/§53)</text>`;
    svg += `<text x="16" y="46" font-family="Segoe UI" font-size="12" fill="#9fb0c8">PRODUCT E2E. single_2d ON. Fluxo completo termina em SAVE (POST studio.php + confirmação).</text>`;
    shots.forEach((s, i) => { svg += `<text x="${pad + i * cw + cell / 2}" y="${head + cell + 16}" text-anchor="middle" font-family="Segoe UI" font-size="13" font-weight="700" fill="#9fe6bf">${s.rot}</text>`; });
    svg += `</svg>`;
    layers.push({ input: Buffer.from(svg), left: 0, top: 0 });
    writeFileSync(join(OUTPKG, '13_V43_SINGLE2D_FLOW.png'), await sharp({ create: { width: BW, height: BH, channels: 3, background: { r: 15, g: 16, b: 21 } } }).composite(layers).png().toBuffer());
    console.log('  board → 13_V43_SINGLE2D_FLOW.png');
  }
} catch (e) { console.error('  ✗ EXCEÇÃO:', e.message.slice(0, 160)); falhas++; } finally { await navegador.close(); }
console.log(falhas ? `\n✗ v43-single2d-flow: ${falhas} falha(s)` : '\n✓ v43-single2d-flow verde');
process.exit(falhas ? 1 : 0);
