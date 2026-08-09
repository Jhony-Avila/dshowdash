// testes/criacao-fina.mjs — lote 561–570 (§102.2/§340–341, flag
// as5.criacao_fina): CRIAÇÃO FINA.
//   A) §102.2: sliders Largura/Altura viram wrapper de scale no palco,
//      MULTIPLICAM o preset §102 e o neutro restaura o SVG byte a byte;
//   B) §340–341: Borda suave troca o clip duro do medalhão por máscara
//      plumada (feGaussianBlur) e 0 volta ao clip legado byte a byte;
//   C) rollback §651 (flag off = sliders somem).
// @version 1.0.0  @created 2026-08-06
import { SAIDA, abrir, irParaHarness } from './navegador.mjs';

const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };

const setRange = (p, sel, valor) => p.evaluate(([s, v]) => {
  const el = document.querySelector(s);
  if (!el) return false;
  const set = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
  set.call(el, String(v));
  el.dispatchEvent(new Event('input', { bubbles: true }));
  el.dispatchEvent(new Event('change', { bubbles: true }));
  return true;
}, [sel, valor]);

// ── A) SHELL: ajuste fino §102.2 ──
{
  const { navegador: b, pagina: p, erros } = await abrir({
    viewport: { width: 1500, height: 940 },
    init: () => { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': true, 'as6.dock_inferior': false, 'as5.palco3d': false })); },
  });
  await irParaHarness(p, 'avst-harness.html', 1000);
  const svgPalco = () => p.evaluate(() => document.querySelector('.avst5-zoom svg')?.outerHTML ?? '');

  await p.evaluate(() => { [...document.querySelectorAll('.avst5-cat')].find((x) => x.textContent.includes('Base'))?.click(); });
  await p.waitForTimeout(500);
  ok(await p.locator('[data-teste="fino-largura"]').count() === 1, 'slider Largura §102.2 ausente (flag as5.criacao_fina?)');
  ok(await p.locator('[data-teste="fino-altura"]').count() === 1, 'slider Altura §102.2 ausente');

  const antes = await svgPalco();
  // QA onda 1111: o modo PALCO (§608, vida lote 1071-1080) tem um
  // scale(1.08) legítimo no plano-fundo — o wrapper FINO é o de DOIS
  // componentes ('scale(1.08 1)'); o match antigo dava falso positivo
  ok(!antes.includes('scale(1.08 1)'), 'palco não deveria ter wrapper fino antes');
  ok(await setRange(p, '[data-teste="fino-largura"]', 1.08), 'slider fino-largura não achado');
  await p.waitForTimeout(400);
  ok((await svgPalco()).includes('scale(1.08 1)'), 'largura 1.08 não entrou como wrapper no SVG (§102.2)');
  ok(await setRange(p, '[data-teste="fino-altura"]', 0.96), 'slider fino-altura não achado');
  await p.waitForTimeout(400);
  ok((await svgPalco()).includes('scale(1.08 0.96)'), 'altura 0.96 não compôs com a largura (§102.2)');

  // §102.2 MULTIPLICA o preset §102 (robusto = 1.1×0.98 → 1.188×0.941)
  await p.evaluate(() => document.querySelector('[data-teste="corpo-robusto"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true })));
  await p.waitForTimeout(400);
  const comPreset = await svgPalco();
  ok(comPreset.includes('scale(1.188 0.941)'), `fino não multiplicou o preset §102 (esperava scale(1.188 0.941))`);

  // neutro restaura byte a byte
  await p.evaluate(() => document.querySelector('[data-teste="corpo-medio"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true })));
  await p.waitForTimeout(300);
  await p.evaluate(() => document.querySelector('[data-teste="fino-neutro"]')?.dispatchEvent(new MouseEvent('click', { bubbles: true })));
  await p.waitForTimeout(400);
  ok(await svgPalco() === antes, 'Restaurar neutro não devolveu o SVG byte a byte (§102.2/byte-stability)');
  await p.screenshot({ path: `${SAIDA}/criacao-fina-shell.png` });
  ok(erros.length === 0, `erros de página (shell): ${erros.join(' | ')}`);
  await b.close();
}

// ── B) FOTO: borda suave §340–341 ──
{
  const { navegador: b, pagina: p, erros } = await abrir({ viewport: { width: 1500, height: 1100 } });
  await irParaHarness(p, 'avst-harness.html', 800);
  await p.evaluate(() => { [...document.querySelectorAll('.avst-cat')].find((x) => x.textContent.trim() === 'Foto')?.click(); });
  await p.waitForTimeout(500);
  await p.evaluate(async () => {
    const c = document.createElement('canvas');
    c.width = 480; c.height = 480;
    const g = c.getContext('2d');
    g.fillStyle = '#4cd9e8'; g.fillRect(0, 0, 480, 480);
    const blob = await new Promise((r) => c.toBlob(r, 'image/png'));
    const dt = new DataTransfer();
    dt.items.add(new File([blob], 'cf.png', { type: 'image/png' }));
    const input = document.querySelector('input[type="file"]');
    input.files = dt.files;
    input.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await p.waitForSelector('.avst-foto-acoes', { timeout: 10000 });
  await p.evaluate(() => { [...document.querySelectorAll('.avst-foto-acoes button')].find((x) => x.textContent.includes('Estilizar'))?.click(); });
  await p.waitForSelector('[data-teste="ajustes-foto"]', { timeout: 10000 });
  const svgFoto = () => p.evaluate(() => document.querySelector('.avst-ft-preview svg')?.outerHTML ?? '');

  ok(await p.locator('[data-teste="ajuste-borda"]').count() === 1, 'slider Borda suave §340-341 ausente');
  const antesFt = await svgFoto();
  ok(!antesFt.includes('fmask'), 'foto não deveria ter máscara plumada antes');
  ok(await setRange(p, '[data-teste="ajuste-borda"]', 0.5), 'slider ajuste-borda não achado');
  await p.waitForTimeout(400);
  const comBorda = await svgFoto();
  ok(comBorda.includes('fmask'), 'borda 0.5 não trocou o clip pela máscara (§340-341)');
  ok(comBorda.includes('stdDeviation="3"'), `pluma esperada stdDeviation=3 (borda 0.5 × 6)`);
  ok(await setRange(p, '[data-teste="ajuste-borda"]', 0), 'slider ajuste-borda (volta) não achado');
  await p.waitForTimeout(400);
  ok(await svgFoto() === antesFt, 'borda 0 não restaurou o SVG byte a byte (clip legado)');
  await p.screenshot({ path: `${SAIDA}/criacao-fina-foto.png` });
  ok(erros.length === 0, `erros de página (foto): ${erros.join(' | ')}`);
  await b.close();
}

// ── C) rollback §651 ──
{
  const { navegador: b, pagina: p, erros } = await abrir({
    viewport: { width: 1500, height: 940 },
    init: () => { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': true, 'as6.dock_inferior': false, 'as5.palco3d': false, 'as5.criacao_fina': false })); },
  });
  await irParaHarness(p, 'avst-harness.html', 1000);
  await p.evaluate(() => { [...document.querySelectorAll('.avst5-cat')].find((x) => x.textContent.includes('Base'))?.click(); });
  await p.waitForTimeout(500);
  ok(await p.locator('[data-teste="criacao-avancada"]').count() === 1, 'flag off não deveria derrubar a criação avançada §102');
  ok(await p.locator('[data-teste="fino-largura"]').count() === 0, 'flag off com slider fino visível (§651)');
  ok(erros.length === 0, `erros de página (rollback): ${erros.join(' | ')}`);
  await b.close();
}

if (falhas.length) { console.error('FALHAS criacao-fina:\n- ' + falhas.join('\n- ')); process.exit(1); }
console.log('criacao-fina OK');
