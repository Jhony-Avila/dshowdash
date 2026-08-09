// testes/quality-as6.mjs — lote 1021–1030 (decisão #104, flag
// as6.quality): Quality Manager central (AS6 Parte 9).
//   A) flag ON (shell novo): botão de perfil no header; ciclar até ECO
//      persiste (dshow.avst6.qualidade.v1), põe [data-qualidade="eco"]
//      no shell e o CSS derruba o backdrop-filter (efeito caro);
//      voltar a Alto atualiza atributo e storage ao vivo (evento).
//   B) rollback §651: flag OFF = sem botão e sem [data-qualidade].
// @version 1.0.0  @created 2026-08-09
import { SAIDA, abrir, irParaHarness } from './navegador.mjs';

const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };

// ── A) flag ON ──────────────────────────────────────────────────────
{
  const { navegador: b, pagina: p, erros } = await abrir({
    viewport: { width: 1500, height: 940 },
    init: () => { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': true, 'as5.palco3d': false })); },
  });
  try {
    await irParaHarness(p, 'avst-harness.html', 1200);
    ok(await p.locator('[data-teste="qualidade-perfil"]').count() === 1, 'botão de qualidade ausente (Parte 9)');
    // padrão = Auto → shell carrega com o perfil resolvido presente
    const attr0 = await p.evaluate(() => document.querySelector('.avst5-shell')?.getAttribute('data-qualidade'));
    ok(['eco', 'equilibrado', 'alto'].includes(attr0 ?? ''), `data-qualidade inicial inválido (${attr0})`);
    // cicla Auto→Eco
    await p.locator('[data-teste="qualidade-perfil"]').click();
    await p.waitForTimeout(300);
    const attr1 = await p.evaluate(() => document.querySelector('.avst5-shell')?.getAttribute('data-qualidade'));
    ok(attr1 === 'eco', `1º clique deveria levar a eco (veio ${attr1})`);
    ok(await p.evaluate(() => localStorage.getItem('dshow.avst6.qualidade.v1')) === 'eco', 'perfil não persistiu');
    // eco derruba o blur do header (efeito caro §Parte 9)
    const blurEco = await p.evaluate(() => {
      const alvo = [...document.querySelectorAll('.avst5-shell *')].find((el) => getComputedStyle(el).backdropFilter !== 'none');
      return alvo ? 'ainda tem blur' : 'sem blur';
    });
    ok(blurEco === 'sem blur', `eco deveria matar o backdrop-filter (${blurEco})`);
    // cicla Eco→Equilibrado→Alto — atributo acompanha ao vivo
    await p.locator('[data-teste="qualidade-perfil"]').click();
    await p.waitForTimeout(200);
    await p.locator('[data-teste="qualidade-perfil"]').click();
    await p.waitForTimeout(300);
    const attr3 = await p.evaluate(() => document.querySelector('.avst5-shell')?.getAttribute('data-qualidade'));
    ok(attr3 === 'alto', `dois cliques depois deveria estar em alto (veio ${attr3})`);
    const blurAlto = await p.evaluate(() => {
      const alvo = [...document.querySelectorAll('.avst5-shell *')].find((el) => getComputedStyle(el).backdropFilter !== 'none');
      return alvo ? 'tem blur' : 'sem blur';
    });
    ok(blurAlto === 'tem blur', 'fora do eco o blur deveria voltar');
    await p.screenshot({ path: `${SAIDA}/quality-as6.png` });
    ok(erros.length === 0, `erros de página (ON): ${erros.join(' | ')}`);
  } catch (e) { falhas.push(`exceção (ON): ${e.message}`); }
  await b.close();
}

// ── B) rollback §651 ────────────────────────────────────────────────
{
  const { navegador: b, pagina: p, erros } = await abrir({
    viewport: { width: 1500, height: 940 },
    init: () => { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': true, 'as5.palco3d': false, 'as6.quality': false })); },
  });
  try {
    await irParaHarness(p, 'avst-harness.html', 1200);
    ok(await p.locator('[data-teste="qualidade-perfil"]').count() === 0, 'flag OFF com botão de qualidade (§651)');
    const attr = await p.evaluate(() => document.querySelector('.avst5-shell')?.getAttribute('data-qualidade'));
    ok(attr === null, `flag OFF com data-qualidade (${attr}) (§651)`);
    ok(erros.length === 0, `erros de página (OFF): ${erros.join(' | ')}`);
  } catch (e) { falhas.push(`exceção (OFF): ${e.message}`); }
  await b.close();
}

if (falhas.length) { console.error('[quality-as6] FALHAS:\n- ' + falhas.join('\n- ')); process.exit(1); }
console.log('[quality-as6] FALHAS: nenhuma');
console.log('[quality-as6] ERROS JS: nenhum');
