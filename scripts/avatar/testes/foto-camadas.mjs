// testes/foto-camadas.mjs — lote 981–990 (decisão #100, flag
// as6.foto_camadas): Layer System da foto fase 1 (AS6 §1215/§1217/§1219).
//   A) flag ON (clássico, aba Foto, avatar como fonte + fundo/aura
//      equipados): painel de camadas ganha ▲▼ (ordem da pilha de fundo
//      — persiste em estilo.ordemFundo e muda o SVG), lock §1217
//      (controles da camada desabilitados) e solo §1219 (só a camada
//      escolhida no preview; NADA persiste — sair do solo restaura).
//   B) rollback §651: flag OFF = painel do lote 161–164 byte a byte
//      (sem ▲▼/lock/solo).
// @version 1.0.0  @created 2026-08-09
import { SAIDA, abrir, irParaHarness } from './navegador.mjs';

const falhas = [];
const ok = (cond, msg) => { if (!cond) falhas.push(msg); };

const prepararFotoComCamadas = async (p) => {
  await p.evaluate(() => { [...document.querySelectorAll('.avst-cat')].find((x) => x.textContent.trim() === 'Foto')?.click(); });
  await p.waitForTimeout(600);
  await p.locator('[data-teste="foto-do-avatar"]').click();
  await p.waitForTimeout(900);
  await p.locator('button', { hasText: 'Estilizar' }).click();
  await p.waitForTimeout(700);
  // equipa fundo + aura na foto (chips por categoria §21)
  await p.evaluate(() => {
    for (const nome of ['Fundo', 'Aura']) {
      const g = [...document.querySelectorAll('.avst-ft-grupo')]
        .find((x) => x.querySelector('.avst-ft-rotulo')?.textContent?.trim().startsWith(nome));
      const chip = g && [...g.querySelectorAll('.avst-ft-chips button')]
        .find((b) => b.textContent.trim() !== 'Nenhum' && !b.disabled);
      chip?.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    }
  });
  await p.waitForTimeout(700);
};
const svgPreview = (p) => p.evaluate(() => document.querySelector('.avst-ft-preview')?.innerHTML ?? '');

// ── A) flag ON ──────────────────────────────────────────────────────
{
  const { navegador: b, pagina: p, erros } = await abrir({
    viewport: { width: 1500, height: 940 },
    init: () => { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': false, 'as5.palco3d': false })); },
  });
  try {
    await irParaHarness(p, 'avst-harness.html', 1200);
    await prepararFotoComCamadas(p);
    ok(await p.locator('[data-teste="camadas-foto"]').count() === 1, 'painel de camadas ausente');
    const nCamadas = await p.locator('[data-teste^="cf-olho-"]').count();
    ok(nCamadas >= 2, `esperava ≥2 camadas ativas (veio ${nCamadas})`);
    // §1215: ▲ no fundo sobe na pilha → estilo.ordemFundo + SVG mudam
    ok(await p.locator('[data-teste="cf-sobe-fundo"]').count() === 1, 'controle de ordem ausente (§1215)');
    const svgAntes = await svgPreview(p);
    // banner está vazio — 2 passos cruzam a AURA (mudança visual real)
    await p.locator('[data-teste="cf-sobe-fundo"]').click();
    await p.waitForTimeout(300);
    await p.locator('[data-teste="cf-sobe-fundo"]').click();
    await p.waitForTimeout(500);
    const svgDepois = await svgPreview(p);
    ok(svgAntes !== svgDepois, 'reordenar não mudou o SVG do preview (§1215)');
    // ▼▼ volta ao neutro → campo some (byte-stability) e SVG volta
    await p.locator('[data-teste="cf-desce-fundo"]').click();
    await p.waitForTimeout(300);
    await p.locator('[data-teste="cf-desce-fundo"]').click();
    await p.waitForTimeout(500);
    ok(await svgPreview(p) === svgAntes, 'voltar à ordem neutra não restaurou o SVG byte a byte');
    const semOrdem = await p.evaluate(() => {
      const k = Object.keys(localStorage).find((x) => x.includes('foto.estilo'));
      try { return !(JSON.parse(localStorage.getItem(k) ?? '{}').ordemFundo); } catch { return true; }
    });
    ok(semOrdem, 'ordem neutra deveria OMITIR o campo ordemFundo (byte-stability)');
    // §1217: lock desabilita os controles da camada
    await p.locator('[data-teste="cf-lock-fundo"]').click();
    await p.waitForTimeout(300);
    ok(await p.locator('[data-teste="cf-olho-fundo"]').isDisabled(), 'lock não desabilitou o olho (§1217)');
    ok(await p.locator('[data-teste="cf-op-fundo"]').isDisabled(), 'lock não desabilitou a opacidade (§1217)');
    ok(await p.locator('[data-teste="cf-sobe-fundo"]').isDisabled(), 'lock não desabilitou a ordem (§1217)');
    await p.locator('[data-teste="cf-lock-fundo"]').click();
    await p.waitForTimeout(300);
    ok(!(await p.locator('[data-teste="cf-olho-fundo"]').isDisabled()), 'destravar não reabilitou os controles');
    // §1219: solo — preview muda; sair restaura; nada persiste
    const antesSolo = await svgPreview(p);
    await p.locator('[data-teste="cf-solo-fundo"]').click();
    await p.waitForTimeout(500);
    ok(await svgPreview(p) !== antesSolo, 'solo não mudou o preview (§1219)');
    await p.locator('[data-teste="cf-solo-fundo"]').click();
    await p.waitForTimeout(500);
    ok(await svgPreview(p) === antesSolo, 'sair do solo não restaurou o preview (§1219)');
    await p.screenshot({ path: `${SAIDA}/foto-camadas.png` });
    ok(erros.length === 0, `erros de página (ON): ${erros.join(' | ')}`);
  } catch (e) { falhas.push(`exceção (ON): ${e.message}`); }
  await b.close();
}

// ── B) rollback §651 ────────────────────────────────────────────────
{
  const { navegador: b, pagina: p, erros } = await abrir({
    viewport: { width: 1500, height: 940 },
    init: () => { localStorage.setItem('dshow.avst.flags.v1', JSON.stringify({ 'as5.novo_shell': false, 'as5.palco3d': false, 'as6.foto_camadas': false })); },
  });
  try {
    await irParaHarness(p, 'avst-harness.html', 1200);
    await prepararFotoComCamadas(p);
    ok(await p.locator('[data-teste="camadas-foto"]').count() === 1, 'painel de camadas sumiu com a flag OFF');
    ok(await p.locator('[data-teste^="cf-sobe-"]').count() === 0, 'flag OFF com controles de ordem (§651)');
    ok(await p.locator('[data-teste^="cf-lock-"]').count() === 0, 'flag OFF com lock (§651)');
    ok(await p.locator('[data-teste^="cf-solo-"]').count() === 0, 'flag OFF com solo (§651)');
    ok(erros.length === 0, `erros de página (OFF): ${erros.join(' | ')}`);
  } catch (e) { falhas.push(`exceção (OFF): ${e.message}`); }
  await b.close();
}

if (falhas.length) { console.error('[foto-camadas] FALHAS:\n- ' + falhas.join('\n- ')); process.exit(1); }
console.log('[foto-camadas] FALHAS: nenhuma');
console.log('[foto-camadas] ERROS JS: nenhum');
