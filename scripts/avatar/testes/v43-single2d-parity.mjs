// testes/v43-single2d-parity.mjs — GOLDEN V4.3 TRACK A (§25/§26): PROVA de
// PARIDADE. Com as6.single_2d ON, TODA ferramenta que só existia no clássico
// (Coleções/Conquistas/Criar com IA/Vitrine/Arquétipos/Títulos/Presets/Foto/
// Histórico) abre DENTRO do shell único — sem sair para o clássico. Com a flag
// OFF, essas ferramentas NÃO aparecem no trilho (produção intocada). Board 12.
import { abrir, irParaHarness, SAIDA } from './navegador.mjs';
import { mkdirSync, writeFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import sharp from 'sharp';

const OUTPKG = process.env.OUTPKG || '/tmp/v4/pkg';
mkdirSync(OUTPKG, { recursive: true });
if (!existsSync(SAIDA)) mkdirSync(SAIDA, { recursive: true });

const FLAGS = { 'as5.novo_shell': true, 'as6.classico_premium': true, 'as6.arte_v2': true, 'as6.fit_v2': true, 'as6.hero_2d': true, 'as6.face_v2': true, 'as6.single_2d': true };
// ferramentas absorvidas: [tool data-teste id, título esperado no overlay]
const FERR = [
  ['tax-f-colecoes', 'Coleções'], ['tax-f-conquistas', 'Conquistas'], ['tax-f-ia', 'Criar com IA'],
  ['tax-f-vitrine', 'Vitrine'], ['tax-f-arquetipos', 'Arquétipos'], ['tax-f-titulos', 'Títulos'],
  ['tax-f-presets_prontos', 'Presets prontos'], ['tax-f-foto', 'Foto'], ['tax-f-historico_srv', 'Histórico'],
];

let falhas = 0; const shots = [];
const ok = (c, m) => { console.log(`${c ? '  ✓' : '  ✗ FALHA:'} ${m}`); if (!c) falhas++; };

async function expandirFerramentas(pagina) {
  for (let i = 0; i < 2; i++) {
    const vis = await pagina.evaluate(() => { const b = document.querySelector('[data-teste="tax-f-colecoes"]'); return !!(b && b.offsetParent !== null); });
    if (vis) return;
    await pagina.evaluate(() => document.querySelector('[data-teste="tax-cab-ferramentas"]')?.click());
    await pagina.waitForTimeout(220);
  }
}

// CENÁRIO 1 — single_2d ON: todas as ferramentas abrem no shell
{
  const { navegador, pagina, erros } = await abrir({
    viewport: { width: 1500, height: 1000 },
    init: (f) => { try { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify(f)); } catch {} },
    initArg: FLAGS,
  });
  try {
    await irParaHarness(pagina, 'avst-harness.html', 1100);
    ok(!!(await pagina.$('.avst5-palco')), 'shell presente (.avst5-palco)');
    await expandirFerramentas(pagina);
    for (const [id, titulo] of FERR) {
      const clicou = await pagina.evaluate((tid) => { const b = document.querySelector(`[data-teste="${tid}"]`); if (b) { b.click(); return true; } return false; }, id);
      await pagina.waitForTimeout(650);
      const abriu = await pagina.evaluate(() => {
        const m = document.querySelector('.avst5-ferr-modal');
        const tit = m?.querySelector('.avst5-ferr-titulo')?.textContent?.trim() || '';
        const corpoTem = !!m?.querySelector('.avst5-ferr-corpo *');
        return { presente: !!m, tit, corpoTem };
      });
      const aindaNoShell = !!(await pagina.$('.avst5-palco'));
      ok(clicou && abriu.presente && abriu.corpoTem, `${titulo}: abre DENTRO do shell (overlay + conteúdo)`);
      ok(aindaNoShell, `${titulo}: não saiu do shell`);
      if (abriu.presente && shots.length < 6) {
        const cam = join(SAIDA, `v43_${id}.png`);
        const modal = await pagina.$('.avst5-ferr-modal');
        if (modal) { await modal.screenshot({ path: cam }); shots.push({ titulo, cam }); }
      }
      await pagina.evaluate(() => document.querySelector('.avst5-ferr-fechar')?.click());
      await pagina.waitForTimeout(250);
    }
    // nenhuma troca de modo user-facing (§26)
    const temTroca = await pagina.evaluate(() => [...document.querySelectorAll('button')].some((b) => /^(Modo clássico|Voltar ao modo clássico)$/.test((b.textContent || '').trim())));
    ok(!temTroca, 'nenhuma saída user-facing para o clássico (§26)');
    ok(erros.length === 0, `sem erros JS (${erros.slice(0, 2).join(' | ')})`);
  } catch (e) { console.error('  ✗ EXCEÇÃO on:', e.message.slice(0, 160)); falhas++; } finally { await navegador.close(); }
}

// CENÁRIO 2 — single_2d OFF: ferramentas absorvidas NÃO aparecem (produção intocada)
{
  const { navegador, pagina } = await abrir({
    viewport: { width: 1500, height: 1000 },
    init: (f) => { try { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify(f)); } catch {} },
    initArg: { ...FLAGS, 'as6.single_2d': false },
  });
  try {
    await irParaHarness(pagina, 'avst-harness.html', 1000);
    await expandirFerramentas(pagina);
    const visiveis = await pagina.evaluate((ids) => ids.filter((tid) => !!document.querySelector(`[data-teste="${tid}"]`)), FERR.map(([id]) => id));
    ok(visiveis.length === 0, `flag OFF: ferramentas absorvidas ausentes do trilho (achou: ${visiveis.join(',') || 'nenhuma'})`);
  } catch (e) { console.error('  ✗ EXCEÇÃO off:', e.message.slice(0, 160)); falhas++; } finally { await navegador.close(); }
}

// board 12
if (shots.length) {
  const cell = 300, pad = 12, head = 56, lab = 24;
  const metas = await Promise.all(shots.map((s) => sharp(s.cam).resize({ width: cell, height: cell, fit: 'contain', background: { r: 20, g: 22, b: 28 } }).png().toBuffer()));
  const cols = shots.length, cw = cell + pad;
  const BW = cols * cw + pad, BH = head + cell + lab + pad;
  const layers = metas.map((b, i) => ({ input: b, left: pad + i * cw, top: head }));
  let svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${BW}" height="${BH}">`;
  svg += `<text x="16" y="26" font-family="Segoe UI" font-size="19" font-weight="800" fill="#fff">12 · SINGLE 2D E2E — ferramentas clássicas DENTRO do shell único (§25/§26)</text>`;
  svg += `<text x="16" y="46" font-family="Segoe UI" font-size="12" fill="#9fb0c8">single_2d ON. Cada overlay reusa o componente clássico, mesmo store, sem sair do shell.</text>`;
  shots.forEach((s, i) => { svg += `<text x="${pad + i * cw + cell / 2}" y="${head + cell + 16}" text-anchor="middle" font-family="Segoe UI" font-size="13" font-weight="700" fill="#9fe6bf">${s.titulo}</text>`; });
  svg += `</svg>`;
  layers.push({ input: Buffer.from(svg), left: 0, top: 0 });
  writeFileSync(join(OUTPKG, '12_V43_SINGLE2D_E2E.png'), await sharp({ create: { width: BW, height: BH, channels: 3, background: { r: 15, g: 16, b: 21 } } }).composite(layers).png().toBuffer());
  console.log('  board → 12_V43_SINGLE2D_E2E.png');
}
console.log(falhas ? `\n✗ v43-single2d-parity: ${falhas} falha(s)` : '\n✓ v43-single2d-parity verde');
process.exit(falhas ? 1 : 0);
