// testes/color-studio.mjs — lote 811–820 (AS6 §206–§212, flag
// as6.color_studio): Color Studio.
//   A) MATEMÁTICA (node): hex↔HSL ida-e-volta estável, clamps, harmonias
//      determinísticas (complementar de vermelho = ciano etc.);
//   B) UI (browser): botão HSL por slot abre o estúdio; mexer o matiz
//      MUDA a cor do config; harmonia aplica com 1 clique;
//   C) rollback §651: flag OFF = sem botão/painel — swatches byte a byte.
// @version 1.0.0  @created 2026-08-08
import { execSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { SAIDA, abrir, irParaHarness } from './navegador.mjs';

const RAIZ = resolve(import.meta.dirname, '..', '..', '..');
const PAINEL = join(RAIZ, 'public', 'components', 'panels', 'panel-avatar-studio');
const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };

// ── A) matemática pura ──────────────────────────────────────────────
const tmp = mkdtempSync(join(tmpdir(), 'avst-cs-'));
writeFileSync(join(tmp, 'prova.ts'), `
import { hexParaHsl, hslParaHex, harmoniasDe } from '${PAINEL}/src/engine/cor-hsl';
const falhas: string[] = [];
const ok = (c: boolean, m: string) => { if (!c) falhas.push(m); };
// ida-e-volta: converter e voltar fica a ≤2/255 por canal (arredondamento)
for (const hex of ['#e8b58c', '#3d2b1f', '#2d4a8a', '#7c5cff', '#ff0000', '#00ff00', '#123456']) {
  const volta = hslParaHex(hexParaHsl(hex));
  const dist = (a: string, b: string) => {
    const n = (h: string) => parseInt(h.slice(1), 16);
    const x = n(a), y = n(b);
    return Math.max(Math.abs((x >> 16 & 255) - (y >> 16 & 255)), Math.abs((x >> 8 & 255) - (y >> 8 & 255)), Math.abs((x & 255) - (y & 255)));
  };
  ok(dist(hex, volta) <= 2, 'ida-e-volta desviou em ' + hex + ' → ' + volta);
}
// determinismo + formato
ok(hslParaHex({ h: 0, s: 100, l: 50 }) === '#ff0000', 'vermelho puro errado');
ok(hslParaHex({ h: 480, s: 200, l: -5 }) === hslParaHex({ h: 120, s: 100, l: 0 }), 'clamp/rotação de entrada errados');
ok(/^#[0-9a-f]{6}$/.test(hslParaHex({ h: 33, s: 40, l: 60 })), 'hex fora do formato canônico');
// harmonias
const h = harmoniasDe('#ff0000');
ok(h.length === 5, 'deveriam ser 5 harmonias');
ok(h.find((x) => x.id === 'complementar')?.hex === '#00ffff', 'complementar de vermelho deveria ser ciano');
ok(new Set(h.map((x) => x.hex)).size === 5, 'harmonias repetidas');
ok(JSON.stringify(harmoniasDe('#7c5cff')) === JSON.stringify(harmoniasDe('#7c5cff')), 'harmonias não determinísticas');
if (falhas.length) { console.error(falhas.join(' || ')); process.exit(1); }
console.log('MATH_OK');
`);
const esbuild = [join(PAINEL, 'node_modules', '.bin', 'esbuild'), join(RAIZ, 'node_modules', '.bin', 'esbuild')]
  .find((c) => existsSync(c)) ?? 'esbuild';
try {
  execSync(`"${esbuild}" "${join(tmp, 'prova.ts')}" --bundle --format=esm --platform=neutral --outfile="${join(tmp, 'prova.mjs')}"`, { stdio: 'pipe' });
  const saida = execSync(`node "${join(tmp, 'prova.mjs')}"`, { encoding: 'utf8' });
  ok(saida.includes('MATH_OK'), `matemática falhou: ${saida.slice(0, 200)}`);
} catch (e) {
  falhas.push(`prova de matemática: ${String(e.stdout ?? e.message).slice(0, 240)}`);
} finally {
  rmSync(tmp, { recursive: true, force: true });
}

// ── B) UI (flag ON) ─────────────────────────────────────────────────
{
  const { navegador: b, pagina: p, erros } = await abrir({
    viewport: { width: 1440, height: 900 },
    init: () => { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': true, 'as6.dock_inferior': false })); },
  });
  try {
    await irParaHarness(p, 'avst-harness.html', 1200);
    // Cores vive atrás do toggle "Cores e propriedades" do painel
    await p.locator('[title="Cores e propriedades"]').click();
    await p.waitForTimeout(300);
    ok(await p.locator('[data-teste^="cs-abrir-"]').count() >= 1, 'botão HSL ausente com a flag ON');
    const slot = await p.locator('[data-teste^="cs-abrir-"]').first().getAttribute('data-teste');
    const id = slot.replace('cs-abrir-', '');
    await p.locator(`[data-teste="cs-abrir-${id}"]`).click();
    ok(await p.locator(`[data-teste="cs-painel-${id}"]`).count() === 1, 'painel do estúdio não abriu');
    const antes = await p.evaluate(() => document.querySelector('.avst-swatch-livre input')?.value);
    await p.locator(`[data-teste="cs-h-${id}"]`).evaluate((el) => {
      // React rastreia o value: usar o setter NATIVO para o input contar
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
      setter.call(el, String((Number(el.value) + 120) % 360));
      el.dispatchEvent(new Event('input', { bubbles: true }));
    });
    await p.waitForTimeout(300);
    const depois = await p.evaluate(() => document.querySelector('.avst-swatch-livre input')?.value);
    ok(antes !== depois, `matiz não mudou a cor do config (${antes} → ${depois})`);
    await p.locator(`[data-teste="cs-harmonia-complementar-${id}"]`).click();
    await p.waitForTimeout(300);
    const aposHarmonia = await p.evaluate(() => document.querySelector('.avst-swatch-livre input')?.value);
    ok(aposHarmonia !== depois, 'harmonia não aplicou');
    await p.screenshot({ path: `${SAIDA}/color-studio.png` });
    ok(erros.length === 0, `erros de página (ON): ${erros.join(' | ')}`);
  } catch (e) { falhas.push(`exceção (ON): ${e.message}`); }
  await b.close();
}

// ── C) rollback §651 ────────────────────────────────────────────────
{
  const { navegador: b, pagina: p, erros } = await abrir({
    viewport: { width: 1440, height: 900 },
    init: () => { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': true, 'as6.dock_inferior': false, 'as6.color_studio': false })); },
  });
  try {
    await irParaHarness(p, 'avst-harness.html', 1200);
    await p.locator('[title="Cores e propriedades"]').click();
    await p.waitForTimeout(300);
    ok(await p.locator('[data-teste^="cs-abrir-"]').count() === 0, 'flag OFF mas o botão HSL apareceu (§651)');
    ok(await p.locator('.avst-swatch').count() >= 4, 'swatches anteriores sumiram com a flag OFF');
    ok(erros.length === 0, `erros de página (OFF): ${erros.join(' | ')}`);
  } catch (e) { falhas.push(`exceção (OFF): ${e.message}`); }
  await b.close();
}

if (falhas.length) { console.error('FALHAS color-studio:\n- ' + falhas.join('\n- ')); process.exit(1); }
console.log('color-studio OK');
