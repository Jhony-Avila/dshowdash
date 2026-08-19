// scripts/avatar/baseline-visual/capturar-before.mjs — onda 1405
// (MEGA_BRIEFING_01 §64, §2888–§2890, §180.1/.12): BASELINE VISUAL "BEFORE"
// do estado atual — screenshots padronizados do shell 2D (rosto/busto/corpo,
// padrão de flags de produção), do palco 3D (personagens publicados) e da
// dock de cards, + manifesto JSON com sha256/bytes por captura.
//
// Doutrina #158: PNG fica FORA do git (scripts/avatar/testes/saida/ é
// gitignored; cópia para /backup/visual-baselines/<commit>/ no servidor é
// passo manual/opcional do deploy). No git vai só o manifesto
// docs/AVATAR-STUDIO-5/evidencias/baseline-before.json (hashes + métricas
// + viewport + commit) — o diff do JSON é o relatório.
//
// Pré-requisitos: build do painel + harness (gerar-harness.mjs avatar) +
// servidor em public/ (python3 -m http.server 8901) + PW_CHROME.
// Uso (da raiz): node scripts/avatar/baseline-visual/capturar-before.mjs [--sem-3d]
// @version 1.0.0  @created 2026-08-19
import { createHash } from 'node:crypto';
import { execSync } from 'node:child_process';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { abrir, irParaHarness } from '../testes/navegador.mjs';

const RAIZ = resolve(import.meta.dirname, '..', '..', '..');
const SEM_3D = process.argv.includes('--sem-3d');
const commit = (() => { try { return execSync('git rev-parse --short HEAD', { cwd: RAIZ }).toString().trim(); } catch { return 'sem-git'; } })();
const SAIDA = join(RAIZ, 'scripts', 'avatar', 'testes', 'saida', 'baseline-before', commit);
mkdirSync(SAIDA, { recursive: true });
const VIEWPORT = { width: 1440, height: 900 };
const capturas = [];

function registrar(nome, caminho, extra = {}) {
  const buf = readFileSync(caminho);
  capturas.push({ nome, arquivo: caminho.replace(RAIZ + '/', ''), bytes: buf.length, sha256: createHash('sha256').update(buf).digest('hex'), ...extra });
}

// ── 1) Shell 2D (padrão de produção: sem chave de flags no storage) ────
{
  const { navegador, pagina } = await abrir({
    viewport: VIEWPORT,
    init: () => { localStorage.removeItem('dshow.avst.flags.v1'); },
  });
  try {
    await pagina.emulateMedia({ reducedMotion: 'reduce' });
    await irParaHarness(pagina, 'avst-harness.html', 1500);
    const cams = ['rosto', 'busto', 'corpo'];
    for (const cam of cams) {
      const chip = pagina.locator(`[data-teste="cam6-${cam}"]`);
      if (await chip.count()) { await chip.click(); await pagina.waitForTimeout(500); }
      const alvo = pagina.locator('.avst5-viewport').first();
      const caminho = join(SAIDA, `2d_shell_${cam}.png`);
      if (await alvo.count()) await alvo.screenshot({ path: caminho }); else await pagina.screenshot({ path: caminho });
      registrar(`2d_shell_${cam}`, caminho, { renderer: '2d', cam });
    }
    const tela = join(SAIDA, '2d_shell_tela.png');
    await pagina.screenshot({ path: tela, fullPage: false });
    registrar('2d_shell_tela', tela, { renderer: '2d', cam: 'tela-inteira' });
    // dock/grade de cards (thumbs) — distância A
    const dock = pagina.locator('.avst5-dock, .avst-grade').first();
    if (await dock.count()) {
      const caminho = join(SAIDA, '2d_dock_cards.png');
      await dock.screenshot({ path: caminho });
      registrar('2d_dock_cards', caminho, { renderer: '2d', cam: 'thumbs' });
    }
  } finally { await navegador.close(); }
}

// ── 2) Palco 3D (SwiftShader) — personagens publicados × câmera padrão ──
if (!SEM_3D) {
  const { navegador, pagina } = await abrir({
    viewport: { width: 1500, height: 940 }, webgl: true,
    init: () => {
      localStorage.setItem('dshow.avst.flags.v1',
        JSON.stringify({ 'as5.novo_shell': true, 'as6.dock_inferior': false, 'as5.palco3d': true }));
    },
  });
  try {
    await pagina.emulateMedia({ reducedMotion: 'reduce' });
    await irParaHarness(pagina, 'avst-harness.html', 1200);
    if (await pagina.locator('[data-teste="botao-3d"]').count()) {
      await pagina.locator('[data-teste="botao-3d"]').click();
      await pagina.waitForSelector('[data-teste="palco-3d"] canvas', { timeout: 45000 });
      await pagina.waitForTimeout(6000);
      const grupo = pagina.locator('.avst5-p3d-personagens:not(.avst5-p3d-partes)').first();
      const chips = await grupo.locator('.avst5-p3d-chip').allTextContents();
      const personagens = chips.map((t) => t.trim()).filter((t) => t && !/^auto$/i.test(t));
      const camAntes = await pagina.locator('.avst5-p3d-cameras button[title^="Corpo"]');
      if (await camAntes.count()) await camAntes.first().evaluate((el) => el.click());
      for (const nome of personagens) {
        await grupo.locator('.avst5-p3d-chip', { hasText: nome }).first().evaluate((el) => el.click());
        await pagina.waitForTimeout(7000);
        await pagina.evaluate(() => new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))));
        const data = await pagina.evaluate(() => document.querySelector('[data-teste="palco-3d"] canvas')?.toDataURL('image/png'));
        if (!data || data.length < 2000) continue;
        const slug = nome.toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
        const caminho = join(SAIDA, `3d_${slug}_corpo.png`);
        writeFileSync(caminho, Buffer.from(data.split(',')[1], 'base64'));
        registrar(`3d_${slug}_corpo`, caminho, { renderer: '3d', cam: 'corpo', personagem: nome });
      }
      const tela = join(SAIDA, '3d_shell_tela.png');
      await pagina.screenshot({ path: tela });
      registrar('3d_shell_tela', tela, { renderer: '3d', cam: 'tela-inteira' });
    }
  } finally { await navegador.close(); }
}

// ── 3) Manifesto (vai para o git) ───────────────────────────────────────
const manifesto = {
  gerado_por: 'scripts/avatar/baseline-visual/capturar-before.mjs',
  commit, viewport2d: VIEWPORT, viewport3d: { width: 1500, height: 940 }, reducedMotion: true,
  chromium: process.env.PW_CHROME ?? '/opt/pw-browsers/chromium-1194/chrome-linux/chrome',
  pasta: SAIDA.replace(RAIZ + '/', ''),
  capturas: capturas.sort((a, b) => a.nome.localeCompare(b.nome)),
};
const destino = join(RAIZ, 'docs', 'AVATAR-STUDIO-5', 'evidencias');
mkdirSync(destino, { recursive: true });
writeFileSync(join(destino, 'baseline-before.json'), JSON.stringify(manifesto, null, 2) + '\n');
console.log(`[baseline-before] ${capturas.length} capturas em ${manifesto.pasta} · manifesto em docs/AVATAR-STUDIO-5/evidencias/baseline-before.json`);
for (const c of capturas) console.log(`  ${c.nome.padEnd(28)} ${String(c.bytes).padStart(8)} B  ${c.sha256.slice(0, 12)}`);
