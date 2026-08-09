// testes/derivados.mjs — lote 1051–1060 (decisão #107, flag
// as6.derivados): derivados com REFLOW (AS6 Parte 11).
//   A) MOTOR (node puro): posição manual definida no PERFIL reflui p/ a
//      célula de texto do wide (nunca cai na célula do medalhão), com
//      CLAMP na área segura; sem reflowPos = coordenada crua anterior
//      byte a byte; estilo SEM pos = saída idêntica com/sem reflow.
//   B) UI (browser): painel "Derivados (ao vivo)" com os 4 formatos;
//      clicar num derivado troca o formato de trabalho; flag OFF = sem
//      painel (§651).
// @version 1.0.0  @created 2026-08-09
import { execSync } from 'node:child_process';
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { SAIDA, abrir, irParaHarness } from './navegador.mjs';

const RAIZ = resolve(import.meta.dirname, '..', '..', '..');
const PAINEL = join(RAIZ, 'public', 'components', 'panels', 'panel-avatar-studio');
const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };

// ── A) motor ────────────────────────────────────────────────────────
{
  const tmp = mkdtempSync(join(tmpdir(), 'avst-deriv-'));
  writeFileSync(join(tmp, 'prova.ts'), `
import { renderFotoEstilizada } from '${PAINEL}/src/engine/render-foto';
import { itemPorId } from '${PAINEL}/src/services/AvatarCatalog';
const FOTO = 'data:image/png;base64,STUB';
const base = { camadas: {}, cores: { pele: '#f5d0a9', cabelo: '#3d2b1f', roupa: '#2d4a8a', destaque: '#7c5cff' }, legenda: 'Reflow' } as never;
const comPos = { ...base, pos: { legenda: { x: 120, y: 220 } } } as never;
const op = { estatico: true, uid: 'drv', formato: 'header' } as never;
const cru = renderFotoEstilizada(FOTO, comPos, itemPorId, { ...op });
const refluido = renderFotoEstilizada(FOTO, comPos, itemPorId, { ...op, reflowPos: true } as never);
const semPosA = renderFotoEstilizada(FOTO, base, itemPorId, { ...op });
const semPosB = renderFotoEstilizada(FOTO, base, itemPorId, { ...op, reflowPos: true } as never);
const xDe = (svg: string): number => { const m = svg.match(/<text x="([0-9.]+)"/); return m ? Number(m[1]) : -1; };
console.log(JSON.stringify({ xCru: xDe(cru), xReflow: xDe(refluido), semPosIgual: semPosA === semPosB }));
`);
  const esbuild = [join(PAINEL, 'node_modules', '.bin', 'esbuild'), join(RAIZ, 'node_modules', '.bin', 'esbuild')]
    .find((c) => existsSync(c)) ?? 'esbuild';
  execSync(`"${esbuild}" "${join(tmp, 'prova.ts')}" --bundle --format=esm --platform=node --outfile="${join(tmp, 'prova.mjs')}"`, { stdio: ['ignore', 'ignore', 'inherit'] });
  const r = JSON.parse(execSync(`node "${join(tmp, 'prova.mjs')}"`, { encoding: 'utf8' }).trim());
  rmSync(tmp, { recursive: true, force: true });
  // header: caixa 720×240, célula de texto começa em 240
  ok(r.xCru === 120, `sem reflow a coordenada crua deveria valer (120, veio ${r.xCru})`);
  ok(r.xReflow >= 256 && r.xReflow <= 704, `reflow deveria levar a âncora p/ a célula de texto com clamp (veio ${r.xReflow})`);
  ok(r.semPosIgual === true, 'estilo SEM pos deveria render idêntico com/sem reflow (byte-stability)');
}

// ── B) UI ───────────────────────────────────────────────────────────
{
  const { navegador: b, pagina: p, erros } = await abrir({
    viewport: { width: 1500, height: 940 },
    init: () => { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': false, 'as5.palco3d': false })); },
  });
  try {
    await irParaHarness(p, 'avst-harness.html', 1200);
    await p.evaluate(() => { [...document.querySelectorAll('.avst-cat')].find((x) => x.textContent.trim() === 'Foto')?.click(); });
    await p.waitForTimeout(600);
    await p.locator('[data-teste="foto-do-avatar"]').click();
    await p.waitForTimeout(900);
    await p.locator('button', { hasText: 'Estilizar' }).click();
    await p.waitForTimeout(700);
    ok(await p.locator('[data-teste="derivados-foto"]').count() === 1, 'painel de derivados ausente');
    ok(await p.locator('[data-teste^="derivado-"]').count() === 4, 'esperava 4 derivados ao vivo');
    ok(await p.locator('[data-teste="derivado-banner"] svg').count() === 1, 'derivado banner sem preview SVG');
    await p.locator('[data-teste="derivado-header"]').click();
    await p.waitForTimeout(500);
    const abaFormato = await p.evaluate(() => [...document.querySelectorAll('[data-teste="formatos-foto"] [role="radio"]')]
      .find((x) => x.getAttribute('aria-checked') === 'true')?.textContent ?? '');
    ok(abaFormato.includes('Header'), `clicar no derivado deveria trocar o formato (veio "${abaFormato}")`);
    await p.screenshot({ path: `${SAIDA}/derivados.png` });
    ok(erros.length === 0, `erros de página (ON): ${erros.join(' | ')}`);
  } catch (e) { falhas.push(`exceção (ON): ${e.message}`); }
  await b.close();
}
{
  const { navegador: b, pagina: p, erros } = await abrir({
    viewport: { width: 1500, height: 940 },
    init: () => { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': false, 'as5.palco3d': false, 'as6.derivados': false })); },
  });
  try {
    await irParaHarness(p, 'avst-harness.html', 1200);
    await p.evaluate(() => { [...document.querySelectorAll('.avst-cat')].find((x) => x.textContent.trim() === 'Foto')?.click(); });
    await p.waitForTimeout(600);
    await p.locator('[data-teste="foto-do-avatar"]').click();
    await p.waitForTimeout(900);
    await p.locator('button', { hasText: 'Estilizar' }).click();
    await p.waitForTimeout(700);
    ok(await p.locator('[data-teste="derivados-foto"]').count() === 0, 'flag OFF com painel de derivados (§651)');
    ok(erros.length === 0, `erros de página (OFF): ${erros.join(' | ')}`);
  } catch (e) { falhas.push(`exceção (OFF): ${e.message}`); }
  await b.close();
}

if (falhas.length) { console.error('[derivados] FALHAS:\n- ' + falhas.join('\n- ')); process.exit(1); }
console.log('[derivados] FALHAS: nenhuma');
console.log('[derivados] ERROS JS: nenhum');
