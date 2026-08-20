// testes/qa-studio.mjs — onda 1410 (MEGA_BRIEFING_01 §2707–§2742; VISUAL-QA
// §7): ROTA DE QA VISUAL no shell (QaStudio, flag as6.qa_route OFF).
//
//   B1) flag OFF: paleta SEM o comando "QA Studio"; window.__avst3d ausente
//       sem as5.hud3d (rollback limpo);
//   B2) flag ON (sem hud3d): comando na paleta abre o QaStudio sobre o
//       Palco 3D; LOD forçado muda o snapshot; look portrait aplica (rim);
//       overlay clay liga e FECHAR restaura (overlay nenhum + lab off);
//       screenshot 1-click baixa PNG; inspector mostra id/rig/licença;
//   B3) as6.material_debug OFF = sem bloco de materiais; ON = lista com
//       MI_* da base UBC (mapas/fatores).
// @version 1.0.0  @created 2026-08-20
import { abrir, irParaHarness, relatorio } from './navegador.mjs';

const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };

async function abrirShell(flags) {
  const sessao = await abrir({
    viewport: { width: 1500, height: 940 }, webgl: true,
    init: ({ f }) => {
      localStorage.setItem('dshow.avst.flags.v1', JSON.stringify(f));
      try { localStorage.setItem('dshow.avst6.qualidade.v1', 'alto'); } catch {}
    },
    initArg: { f: { 'as5.novo_shell': true, 'as6.dock_inferior': false, 'as5.palco3d': true, 'as5.quality3d_v2': false, 'as5.hud3d': false, ...flags } },
  });
  const { pagina } = sessao;
  await pagina.emulateMedia({ reducedMotion: 'reduce' });
  await irParaHarness(pagina, 'avst-harness.html', 1200);
  await pagina.locator('[data-teste="botao-3d"]').click();
  await pagina.waitForSelector('[data-teste="palco-3d"] canvas', { timeout: 45000 });
  await pagina.waitForTimeout(6000);
  return sessao;
}
const abrirPaleta = async (p) => {
  await p.keyboard.press('Control+k');
  await p.waitForSelector('[data-teste="paleta-comandos"]', { timeout: 5000 });
  await p.locator('[data-teste="paleta-comandos"] input').fill('qa studio');
  await p.waitForTimeout(300);
};

let errosTudo = [];
// ── B1) flag OFF ────────────────────────────────────────────────────
{
  const { navegador, pagina, erros } = await abrirShell({ 'as6.qa_route': false });
  try {
    ok(await pagina.evaluate(() => typeof window.__avst3d) === 'undefined', '[B1] sem hud3d/qa_route o handle dev não pode existir');
    await abrirPaleta(pagina);
    ok(await pagina.locator('[data-teste="paleta-comandos"] li button', { hasText: 'QA Studio' }).count() === 0, '[B1] flag OFF: paleta não pode listar o QA Studio');
    await pagina.keyboard.press('Escape');
    ok(erros.length === 0, `[B1] erros JS: ${erros.join(' | ')}`);
  } finally { errosTudo = [...erros]; await navegador.close(); }
}
// ── B2/B3) flag ON ──────────────────────────────────────────────────
{
  const { navegador, pagina, erros } = await abrirShell({ 'as6.qa_route': true, 'as6.material_debug': false });
  try {
    ok(await pagina.evaluate(() => typeof window.__avst3d) === 'object', '[B2] as6.qa_route deveria expor o handle dev');
    await abrirPaleta(pagina);
    await pagina.keyboard.press('Enter');
    await pagina.waitForSelector('[data-teste="qa-studio"]', { timeout: 8000 });
    ok(await pagina.locator('[data-teste="qa-controles"]').count() === 1, '[B2] controles ausentes (Palco 3D aberto)');
    // inspector
    const rig = await pagina.locator('[data-teste="qa-insp-rig"]').textContent();
    ok(/bones/.test(rig ?? ''), `[B2] inspector sem rig/bones: ${rig}`);
    // LOD forçado muda o snapshot (alto → economico = lod2, menos triângulos)
    const triAntes = await pagina.evaluate(() => window.__avst3d.snapshotMetricas().triangulos);
    await pagina.locator('[data-teste="qa-lod-economico"]').click();
    await pagina.waitForTimeout(5000);
    const triDepois = await pagina.evaluate(() => window.__avst3d.snapshotMetricas().triangulos);
    ok(triDepois < triAntes, `[B2] LOD econômico deveria reduzir triângulos (${triAntes} → ${triDepois})`);
    // look portrait = rim extra no rig de luz
    const luzesAntes = await pagina.evaluate(() => window.__avst3d.snapshotMetricas().luzes.length);
    await pagina.locator('[data-teste="qa-look-portrait"]').click();
    await pagina.waitForTimeout(600);
    const snap = await pagina.evaluate(() => window.__avst3d.snapshotMetricas());
    ok(String(snap.look).startsWith('portrait@') && snap.luzes.length >= luzesAntes, `[B2] look portrait não aplicou: ${snap.look} (${luzesAntes}→${snap.luzes.length} luzes)`);
    // overlay + fechar restaura
    await pagina.locator('[data-teste="qa-overlay-clay"]').click();
    await pagina.waitForTimeout(400);
    ok(await pagina.evaluate(() => window.__avst3d.overlayAtivo()) === 'clay', '[B2] overlay clay não ligou');
    // screenshot 1-click
    const download = pagina.waitForEvent('download', { timeout: 15000 });
    await pagina.locator('[data-teste="qa-screenshot"]').click();
    const arquivo = await download;
    ok(/^qa-.+\.png$/.test(arquivo.suggestedFilename()), `[B2] nome do screenshot: ${arquivo.suggestedFilename()}`);
    // material_debug OFF = sem bloco
    ok(await pagina.locator('[data-teste="qa-materiais"]').count() === 0, '[B3] material_debug OFF deveria esconder o bloco de materiais');
    await pagina.locator('[data-teste="qa-fechar"]').click();
    await pagina.waitForTimeout(500);
    const depois = await pagina.evaluate(() => ({ overlay: window.__avst3d.overlayAtivo(), lab: window.__avst3d.laboratorioAtivo() }));
    ok(depois.overlay === 'nenhum' && depois.lab === false, `[B2] fechar deveria restaurar overlay/lab: ${JSON.stringify(depois)}`);
    ok(erros.length === 0, `[B2] erros JS: ${erros.join(' | ')}`);
  } finally { errosTudo.push(...erros); await navegador.close(); }
}
{
  const { navegador, pagina, erros } = await abrirShell({ 'as6.qa_route': true, 'as6.material_debug': true });
  try {
    await abrirPaleta(pagina);
    await pagina.keyboard.press('Enter');
    await pagina.waitForSelector('[data-teste="qa-studio"]', { timeout: 8000 });
    await pagina.waitForTimeout(800);
    ok(await pagina.locator('[data-teste="qa-materiais"]').count() === 1, '[B3] material_debug ON deveria listar materiais');
    const txt = await pagina.locator('[data-teste="qa-materiais"]').textContent();
    ok(/MI_|Material/i.test(txt ?? ''), `[B3] lista de materiais vazia: ${(txt ?? '').slice(0, 80)}`);
    ok(erros.length === 0, `[B3] erros JS: ${erros.join(' | ')}`);
  } finally { errosTudo.push(...erros); await navegador.close(); }
}

relatorio('qa-studio', falhas, errosTudo);
process.exit(falhas.length ? 1 : 0);
